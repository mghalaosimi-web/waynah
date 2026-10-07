import {
  prisma as defaultPrisma,
  type PrismaClient,
  BusinessRole,
  BusinessInvitationStatus,
} from '@waynah/database';
import { AuthService } from '../../services/auth.service.js';
import { EmailService } from '../../services/email.service.js';
import { AuditLogger } from '../../utils/audit-logger.js';

const PENDING = (BusinessInvitationStatus?.PENDING || 'PENDING') as BusinessInvitationStatus;
const ACCEPTED = (BusinessInvitationStatus?.ACCEPTED || 'ACCEPTED') as BusinessInvitationStatus;
const DECLINED = (BusinessInvitationStatus?.DECLINED || 'DECLINED') as BusinessInvitationStatus;
const CANCELLED = (BusinessInvitationStatus?.CANCELLED || 'CANCELLED') as BusinessInvitationStatus;

export interface InviteMemberInput {
  email: string;
  role?: BusinessRole;
}

export class BusinessTeamService {
  private readonly prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = defaultPrisma) {
    this.prisma = prismaClient;
  }

  /**
   * Lists all members of a business.
   * Requires active membership or admin privileges.
   */
  public async listMembers(actorUserId: string, businessId: string, isAdmin = false) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw new Error('BUSINESS_NOT_FOUND');
    }

    if (!isAdmin) {
      const membership = await this.prisma.businessMember.findUnique({
        where: {
          businessId_userId: {
            businessId,
            userId: actorUserId,
          },
        },
      });

      if (!membership) {
        throw new Error('NOT_BUSINESS_MEMBER');
      }
    }

    const members = await this.prisma.businessMember.findMany({
      where: { businessId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return members.map((m) => ({
      id: m.id,
      businessId: m.businessId,
      userId: m.userId,
      role: m.role,
      user: m.user,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    }));
  }

  /**
   * Invites a new team member by email.
   * Employs PostgreSQL advisory locking on (businessId, canonicalEmail) for concurrency protection.
   */
  public async inviteMember(
    inviterUserId: string,
    businessId: string,
    input: InviteMemberInput,
    isAdmin = false,
    ip = '127.0.0.1'
  ) {
    const requestedRole = input.role || BusinessRole.MEMBER;

    if (requestedRole === BusinessRole.OWNER) {
      throw new Error('INVALID_INVITATION_ROLE');
    }

    if (requestedRole !== BusinessRole.MEMBER && requestedRole !== BusinessRole.MANAGER) {
      throw new Error('INVALID_INVITATION_ROLE');
    }

    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw new Error('BUSINESS_NOT_FOUND');
    }

    let inviterMemberRole: BusinessRole = BusinessRole.OWNER;
    let inviterName = 'إدارة النشاط';

    if (!isAdmin) {
      const membership = await this.prisma.businessMember.findUnique({
        where: {
          businessId_userId: {
            businessId,
            userId: inviterUserId,
          },
        },
        include: { user: { select: { name: true } } },
      });

      if (!membership) {
        throw new Error('NOT_BUSINESS_MEMBER');
      }

      inviterMemberRole = membership.role;
      inviterName = membership.user.name;

      if (inviterMemberRole === BusinessRole.MEMBER) {
        throw new Error('INSUFFICIENT_BUSINESS_PERMISSIONS');
      }

      if (inviterMemberRole === BusinessRole.MANAGER && requestedRole !== BusinessRole.MEMBER) {
        throw new Error('INSUFFICIENT_BUSINESS_PERMISSIONS');
      }
    } else {
      const inviterUser = await this.prisma.user.findUnique({
        where: { id: inviterUserId },
        select: { name: true },
      });
      if (inviterUser) inviterName = inviterUser.name;
    }

    if (!input.email || !input.email.trim() || !input.email.includes('@')) {
      throw new Error('INVALID_EMAIL');
    }

    const canonicalEmail = input.email.trim().toLowerCase();
    const rawToken = AuthService.generateRawToken();
    const tokenHash = AuthService.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await this.prisma.$transaction(async (tx) => {
      // 1. Transaction-level advisory lock on (businessId, canonicalEmail)
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${businessId}), hashtext(${canonicalEmail}))`;

      // 2. Check if user with this email is ALREADY a member
      const targetUser = await tx.user.findUnique({ where: { email: canonicalEmail } });
      if (targetUser) {
        const existingMembership = await tx.businessMember.findUnique({
          where: {
            businessId_userId: {
              businessId,
              userId: targetUser.id,
            },
          },
        });
        if (existingMembership) {
          throw new Error('USER_ALREADY_BUSINESS_MEMBER');
        }
      }

      // 3. Check if an active PENDING invitation already exists
      const existingPending = await tx.businessInvitation.findFirst({
        where: {
          businessId,
          email: canonicalEmail,
          status: PENDING,
          expiresAt: { gt: new Date() },
        },
      });

      if (existingPending) {
        throw new Error('DUPLICATE_ACTIVE_INVITATION');
      }

      // 4. Create new invitation
      return await tx.businessInvitation.create({
        data: {
          businessId,
          email: canonicalEmail,
          role: requestedRole,
          inviterId: inviterUserId,
          tokenHash,
          status: PENDING,
          expiresAt,
        },
        include: {
          business: { select: { name: true } },
          inviter: { select: { name: true } },
        },
      });
    });

    // Send invitation email
    await EmailService.getProvider().sendBusinessInvitationEmail(
      canonicalEmail,
      rawToken,
      invitation.business.name,
      invitation.role,
      invitation.inviter.name || inviterName
    );

    // Structured audit logging (raw token excluded)
    await AuditLogger.logBusinessMemberInvited(
      invitation.id,
      businessId,
      canonicalEmail,
      invitation.role,
      inviterUserId,
      ip
    );

    return {
      invitation,
      rawToken,
    };
  }

  /**
   * Retrieves public preview of an invitation via raw token.
   */
  public async getPublicInvitationPreview(rawToken: string) {
    if (!rawToken || typeof rawToken !== 'string' || !rawToken.trim()) {
      throw new Error('INVALID_OR_EXPIRED_INVITATION');
    }

    const tokenHash = AuthService.hashToken(rawToken);

    const invitation = await this.prisma.businessInvitation.findUnique({
      where: { tokenHash },
      include: {
        business: { select: { id: true, name: true, slug: true } },
        inviter: { select: { name: true } },
      },
    });

    if (
      !invitation ||
      invitation.status !== PENDING ||
      invitation.expiresAt < new Date()
    ) {
      throw new Error('INVALID_OR_EXPIRED_INVITATION');
    }

    return {
      businessName: invitation.business.name,
      inviterName: invitation.inviter.name,
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expiresAt.toISOString(),
    };
  }

  /**
   * Accepts a pending invitation for an existing authenticated user.
   */
  public async acceptInvitation(userId: string, rawToken: string, ip = '127.0.0.1') {
    if (!rawToken || typeof rawToken !== 'string' || !rawToken.trim()) {
      throw new Error('INVALID_OR_EXPIRED_INVITATION');
    }

    const tokenHash = AuthService.hashToken(rawToken);

    const result = await this.prisma.$transaction(async (tx) => {
      const invitation = await tx.businessInvitation.findUnique({
        where: { tokenHash },
        include: { business: true },
      });

      if (
        !invitation ||
        invitation.status !== PENDING ||
        invitation.expiresAt < new Date()
      ) {
        throw new Error('INVALID_OR_EXPIRED_INVITATION');
      }

      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new Error('USER_NOT_FOUND');
      }

      const canonicalUserEmail = user.email.trim().toLowerCase();
      const canonicalInvEmail = invitation.email.trim().toLowerCase();

      if (canonicalUserEmail !== canonicalInvEmail) {
        throw new Error('INVITATION_EMAIL_MISMATCH');
      }

      const existingMember = await tx.businessMember.findUnique({
        where: {
          businessId_userId: {
            businessId: invitation.businessId,
            userId,
          },
        },
      });

      if (existingMember) {
        throw new Error('USER_ALREADY_BUSINESS_MEMBER');
      }

      const member = await tx.businessMember.create({
        data: {
          businessId: invitation.businessId,
          userId,
          role: invitation.role,
        },
      });

      const updatedInvitation = await tx.businessInvitation.update({
        where: { id: invitation.id },
        data: {
          status: ACCEPTED,
          acceptedAt: new Date(),
        },
      });

      return {
        member,
        invitation: updatedInvitation,
        userEmail: canonicalUserEmail,
      };
    });

    await AuditLogger.logBusinessInvitationAccepted(
      result.invitation.id,
      result.invitation.businessId,
      userId,
      result.userEmail,
      result.invitation.role,
      ip
    );

    return {
      success: true,
      businessId: result.invitation.businessId,
      role: result.invitation.role,
    };
  }

  /**
   * Declines a pending invitation for an authenticated user with matching email.
   */
  public async declineInvitation(userId: string, rawToken: string, ip = '127.0.0.1') {
    if (!rawToken || typeof rawToken !== 'string' || !rawToken.trim()) {
      throw new Error('INVALID_OR_EXPIRED_INVITATION');
    }

    const tokenHash = AuthService.hashToken(rawToken);

    const result = await this.prisma.$transaction(async (tx) => {
      const invitation = await tx.businessInvitation.findUnique({
        where: { tokenHash },
      });

      if (
        !invitation ||
        invitation.status !== PENDING ||
        invitation.expiresAt < new Date()
      ) {
        throw new Error('INVALID_OR_EXPIRED_INVITATION');
      }

      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new Error('USER_NOT_FOUND');
      }

      const canonicalUserEmail = user.email.trim().toLowerCase();
      const canonicalInvEmail = invitation.email.trim().toLowerCase();

      if (canonicalUserEmail !== canonicalInvEmail) {
        throw new Error('INVITATION_EMAIL_MISMATCH');
      }

      const updatedInvitation = await tx.businessInvitation.update({
        where: { id: invitation.id },
        data: {
          status: DECLINED,
          declinedAt: new Date(),
        },
      });

      return {
        invitation: updatedInvitation,
        userEmail: canonicalUserEmail,
      };
    });

    await AuditLogger.logBusinessInvitationDeclined(
      result.invitation.id,
      result.invitation.businessId,
      userId,
      result.userEmail,
      ip
    );

    return { success: true };
  }

  /**
   * Lists pending (non-expired) invitations for a business.
   * Requires active membership or admin privileges.
   */
  public async listPendingInvitations(actorUserId: string, businessId: string, isAdmin = false) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw new Error('BUSINESS_NOT_FOUND');
    }

    if (!isAdmin) {
      const membership = await this.prisma.businessMember.findUnique({
        where: {
          businessId_userId: {
            businessId,
            userId: actorUserId,
          },
        },
      });

      if (!membership) {
        throw new Error('NOT_BUSINESS_MEMBER');
      }
    }

    const invitations = await this.prisma.businessInvitation.findMany({
      where: {
        businessId,
        status: PENDING,
        expiresAt: { gt: new Date() },
      },
      include: {
        inviter: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return invitations.map((inv) => ({
      id: inv.id,
      businessId: inv.businessId,
      email: inv.email,
      role: inv.role,
      status: inv.status,
      expiresAt: inv.expiresAt,
      createdAt: inv.createdAt,
      inviter: inv.inviter,
    }));
  }

  /**
   * Cancels a pending invitation by an authorized team member.
   */
  public async cancelInvitation(
    actorUserId: string,
    businessId: string,
    invitationId: string,
    isAdmin = false,
    ip = '127.0.0.1'
  ) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw new Error('BUSINESS_NOT_FOUND');
    }

    let actorRole: BusinessRole = BusinessRole.OWNER;
    if (!isAdmin) {
      const membership = await this.prisma.businessMember.findUnique({
        where: {
          businessId_userId: {
            businessId,
            userId: actorUserId,
          },
        },
      });

      if (!membership) {
        throw new Error('NOT_BUSINESS_MEMBER');
      }

      actorRole = membership.role;
      if (actorRole === BusinessRole.MEMBER) {
        throw new Error('INSUFFICIENT_BUSINESS_PERMISSIONS');
      }
    }

    const invitation = await this.prisma.businessInvitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation || invitation.businessId !== businessId) {
      throw new Error('INVITATION_NOT_FOUND');
    }

    if (invitation.status !== PENDING) {
      throw new Error('CANNOT_CANCEL_TERMINAL_INVITATION');
    }

    if (!isAdmin && actorRole === BusinessRole.MANAGER && invitation.role !== BusinessRole.MEMBER) {
      throw new Error('INSUFFICIENT_BUSINESS_PERMISSIONS');
    }

    const cancelledInvitation = await this.prisma.businessInvitation.update({
      where: { id: invitationId },
      data: {
        status: CANCELLED,
        cancelledAt: new Date(),
      },
    });

    await AuditLogger.logBusinessInvitationCancelled(invitationId, businessId, actorUserId, ip);

    return cancelledInvitation;
  }

  /**
   * Updates a member's role (OWNER only).
   * Enforces Sole Owner Invariant via FOR UPDATE row lock on Business.
   */
  public async changeMemberRole(
    actorUserId: string,
    businessId: string,
    memberId: string,
    newRole: BusinessRole,
    isAdmin = false,
    ip = '127.0.0.1'
  ) {
    if (newRole !== BusinessRole.OWNER && newRole !== BusinessRole.MANAGER && newRole !== BusinessRole.MEMBER) {
      throw new Error('INVALID_ROLE');
    }

    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw new Error('BUSINESS_NOT_FOUND');
    }

    if (!isAdmin) {
      const actorMembership = await this.prisma.businessMember.findUnique({
        where: {
          businessId_userId: {
            businessId,
            userId: actorUserId,
          },
        },
      });

      if (!actorMembership) {
        throw new Error('NOT_BUSINESS_MEMBER');
      }

      if (actorMembership.role !== BusinessRole.OWNER) {
        throw new Error('INSUFFICIENT_BUSINESS_PERMISSIONS');
      }
    }

    const updatedMember = await this.prisma.$transaction(async (tx) => {
      // Step A: Lock Business row FOR UPDATE
      await tx.$queryRaw`SELECT "id" FROM "businesses" WHERE "id" = ${businessId} FOR UPDATE`;

      const targetMember = await tx.businessMember.findUnique({
        where: { id: memberId },
      });

      if (!targetMember || targetMember.businessId !== businessId) {
        throw new Error('MEMBER_NOT_FOUND');
      }

      const previousRole = targetMember.role;
      if (previousRole === newRole) {
        return targetMember;
      }

      // Step B: Sole owner invariant check if demoting an OWNER
      if (previousRole === BusinessRole.OWNER && newRole !== BusinessRole.OWNER) {
        const ownerCount = await tx.businessMember.count({
          where: {
            businessId,
            role: BusinessRole.OWNER,
          },
        });

        if (ownerCount <= 1) {
          throw new Error('CANNOT_REMOVE_SOLE_OWNER');
        }
      }

      // Step C: Update role
      return await tx.businessMember.update({
        where: { id: memberId },
        data: { role: newRole },
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
      });
    });

    await AuditLogger.logBusinessMemberRoleChanged(
      businessId,
      memberId,
      updatedMember.userId,
      updatedMember.role, // Note: handled inside transaction
      newRole,
      actorUserId,
      ip
    );

    return updatedMember;
  }

  /**
   * Removes a member from a business.
   * Enforces Sole Owner Invariant via FOR UPDATE row lock on Business.
   */
  public async removeMember(
    actorUserId: string,
    businessId: string,
    memberId: string,
    isAdmin = false,
    ip = '127.0.0.1'
  ) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw new Error('BUSINESS_NOT_FOUND');
    }

    let actorRole: BusinessRole = BusinessRole.OWNER;
    if (!isAdmin) {
      const actorMembership = await this.prisma.businessMember.findUnique({
        where: {
          businessId_userId: {
            businessId,
            userId: actorUserId,
          },
        },
      });

      if (!actorMembership) {
        throw new Error('NOT_BUSINESS_MEMBER');
      }

      actorRole = actorMembership.role;
      if (actorRole === BusinessRole.MEMBER) {
        throw new Error('INSUFFICIENT_BUSINESS_PERMISSIONS');
      }
    }

    const removedMember = await this.prisma.$transaction(async (tx) => {
      // Step A: Lock Business row FOR UPDATE
      await tx.$queryRaw`SELECT "id" FROM "businesses" WHERE "id" = ${businessId} FOR UPDATE`;

      const targetMember = await tx.businessMember.findUnique({
        where: { id: memberId },
      });

      if (!targetMember || targetMember.businessId !== businessId) {
        throw new Error('MEMBER_NOT_FOUND');
      }

      if (!isAdmin) {
        if (actorRole === BusinessRole.MANAGER && targetMember.role !== BusinessRole.MEMBER) {
          throw new Error('INSUFFICIENT_BUSINESS_PERMISSIONS');
        }
      }

      // Step B: Sole owner invariant check if removing an OWNER
      if (targetMember.role === BusinessRole.OWNER) {
        const ownerCount = await tx.businessMember.count({
          where: {
            businessId,
            role: BusinessRole.OWNER,
          },
        });

        if (ownerCount <= 1) {
          throw new Error('CANNOT_REMOVE_SOLE_OWNER');
        }
      }

      // Step C: Delete member
      return await tx.businessMember.delete({
        where: { id: memberId },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      });
    });

    await AuditLogger.logBusinessMemberRemoved(
      businessId,
      memberId,
      removedMember.userId,
      removedMember.role,
      actorUserId,
      ip
    );

    return removedMember;
  }
}
