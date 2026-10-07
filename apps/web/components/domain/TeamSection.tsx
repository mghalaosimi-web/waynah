'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserPlus,
  Mail,
  Crown,
  ShieldCheck,
  User,
  Trash2,
  Clock,
  AlertCircle,
  CheckCircle2,
  X,
  Loader2,
  RefreshCw,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@waynah/ui';
import {
  apiClient,
  type BusinessMemberItem,
  type BusinessInvitationItem,
} from '../../lib/api/api-client';
import { can } from '../../lib/permissions/permission-helper';
import { PERMISSIONS } from '@waynah/shared';
import type { Actor } from '@waynah/shared';

// ─── Types ────────────────────────────────────────────────────────────────────

type BusinessRole = 'OWNER' | 'MANAGER' | 'MEMBER';

interface TeamSectionProps {
  businessId: string;
  currentMembershipRole: BusinessRole;
  actor: Actor;
}

// ─── Role badge helper ─────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: BusinessRole }) {
  const map: Record<BusinessRole, { label: string; className: string; icon: React.ReactNode }> = {
    OWNER: {
      label: 'مالك',
      className:
        'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-500/30',
      icon: <Crown className="w-3 h-3" />,
    },
    MANAGER: {
      label: 'مدير',
      className:
        'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30',
      icon: <ShieldCheck className="w-3 h-3" />,
    },
    MEMBER: {
      label: 'عضو',
      className:
        'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300/40 dark:border-slate-700',
      icon: <User className="w-3 h-3" />,
    },
  };
  const config = map[role] ?? map.MEMBER;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${config.className}`}
    >
      {config.icon}
      {config.label}
    </span>
  );
}

// ─── Invite Modal ──────────────────────────────────────────────────────────────

interface InviteModalProps {
  businessId: string;
  currentMembershipRole: BusinessRole;
  onClose: () => void;
  onSuccess: () => void;
}

function InviteModal({ businessId, currentMembershipRole, onClose, onSuccess }: InviteModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'MANAGER' | 'MEMBER'>('MEMBER');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Roles the current actor is allowed to invite
  const assignableRoles: Array<{ value: 'MANAGER' | 'MEMBER'; label: string }> =
    currentMembershipRole === 'OWNER'
      ? [
          { value: 'MEMBER', label: 'عضو (MEMBER)' },
          { value: 'MANAGER', label: 'مدير (MANAGER)' },
        ]
      : [{ value: 'MEMBER', label: 'عضو (MEMBER)' }]; // MANAGER can only invite MEMBER

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setError('يرجى إدخال بريد إلكتروني صحيح');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiClient.inviteBusinessMember(businessId, {
        email: trimmedEmail,
        role,
      });

      if (res.success) {
        setSuccessMsg(`تم إرسال الدعوة إلى ${trimmedEmail} بنجاح`);
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } else {
        const errMsg =
          typeof res.error === 'object' && res.error?.message
            ? res.error.message
            : typeof res.error === 'string'
            ? res.error
            : 'فشل إرسال الدعوة';
        setError(errMsg);
      }
    } catch {
      setError('حدث خطأ أثناء التواصل مع الخادم');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Modal Card */}
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="invite-modal-title"
                className="text-base font-extrabold text-slate-900 dark:text-white"
              >
                دعوة عضو جديد
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                سيتلقى المدعو بريداً إلكترونياً بالدعوة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="إغلاق نافذة الدعوة"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Success */}
          {successMsg && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!successMsg && (
            <form onSubmit={handleSubmit} className="space-y-4" id="invite-form" noValidate>
              {/* Email */}
              <div>
                <label
                  htmlFor="invite-email"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2"
                >
                  البريد الإلكتروني للمدعو{' '}
                  <span className="text-rose-500" aria-hidden="true">
                    *
                  </span>
                </label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    id="invite-email"
                    type="email"
                    required
                    autoFocus
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError(null);
                    }}
                    disabled={isSubmitting}
                    placeholder="example@domain.com"
                    dir="ltr"
                    className="w-full pr-10 pl-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Role */}
              <div>
                <label
                  htmlFor="invite-role"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2"
                >
                  الدور المخصص
                </label>
                <div className="relative">
                  <select
                    id="invite-role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'MANAGER' | 'MEMBER')}
                    disabled={isSubmitting || assignableRoles.length === 1}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all appearance-none disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {assignableRoles.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
                {currentMembershipRole === 'MANAGER' && (
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
                    المدير يمكنه دعوة أعضاء فقط. إدارة المديرين مقتصرة على المالك.
                  </p>
                )}
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        {!successMsg && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl text-xs font-bold"
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              form="invite-form"
              variant="primary"
              size="sm"
              disabled={isSubmitting || !email.trim()}
              className="rounded-xl text-xs font-extrabold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>جاري الإرسال...</span>
                </>
              ) : (
                <>
                  <Mail className="w-3.5 h-3.5" />
                  <span>إرسال الدعوة</span>
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Confirm Dialog ────────────────────────────────────────────────────────────

interface ConfirmDialogProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  confirmLabel?: string;
  confirmVariant?: 'danger' | 'default';
}

function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
  isLoading,
  confirmLabel = 'تأكيد',
  confirmVariant = 'default',
}: ConfirmDialogProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-msg"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-5">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-rose-500/10 text-rose-600 rounded-xl shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <p
            id="confirm-dialog-msg"
            className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed"
          >
            {message}
          </p>
        </div>
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-xl text-xs font-bold"
          >
            إلغاء
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onConfirm}
            disabled={isLoading}
            className={`rounded-xl text-xs font-extrabold gap-2 ${
              confirmVariant === 'danger'
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20'
            } disabled:opacity-60`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>جاري التنفيذ...</span>
              </>
            ) : (
              <span>{confirmLabel}</span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main TeamSection ──────────────────────────────────────────────────────────

export function TeamSection({ businessId, currentMembershipRole, actor }: TeamSectionProps) {
  const [members, setMembers] = useState<BusinessMemberItem[]>([]);
  const [invitations, setInvitations] = useState<BusinessInvitationItem[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [invitationsLoading, setInvitationsLoading] = useState(true);
  const [invitationsError, setInvitationsError] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'cancel_invitation' | 'remove_member';
    id: string;
    label: string;
  } | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const canManage = can(actor, PERMISSIONS.BUSINESS_MANAGE);
  const isOwner = currentMembershipRole === 'OWNER';
  const isManager = currentMembershipRole === 'MANAGER';

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchMembers = useCallback(async () => {
    setMembersLoading(true);
    setMembersError(null);
    try {
      const res = await apiClient.getBusinessMembers(businessId);
      if (res.success && res.data) {
        setMembers(res.data);
      } else {
        const msg =
          typeof res.error === 'object' && res.error?.message
            ? res.error.message
            : typeof res.error === 'string'
            ? res.error
            : 'فشل جلب الأعضاء';
        setMembersError(msg);
      }
    } catch {
      setMembersError('حدث خطأ أثناء تحميل بيانات الأعضاء');
    } finally {
      setMembersLoading(false);
    }
  }, [businessId]);

  const fetchInvitations = useCallback(async () => {
    setInvitationsLoading(true);
    setInvitationsError(null);
    try {
      const res = await apiClient.getBusinessInvitations(businessId);
      if (res.success && res.data) {
        setInvitations(res.data);
      } else {
        const msg =
          typeof res.error === 'object' && res.error?.message
            ? res.error.message
            : typeof res.error === 'string'
            ? res.error
            : 'فشل جلب الدعوات';
        setInvitationsError(msg);
      }
    } catch {
      setInvitationsError('حدث خطأ أثناء تحميل الدعوات');
    } finally {
      setInvitationsLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchMembers();
    fetchInvitations();
  }, [fetchMembers, fetchInvitations]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    setConfirmLoading(true);
    setActionError(null);

    try {
      if (confirmAction.type === 'cancel_invitation') {
        const res = await apiClient.cancelBusinessInvitation(businessId, confirmAction.id);
        if (res.success) {
          setInvitations((prev) => prev.filter((inv) => inv.id !== confirmAction.id));
        } else {
          const msg =
            typeof res.error === 'object' && res.error?.message
              ? res.error.message
              : typeof res.error === 'string'
              ? res.error
              : 'فشل إلغاء الدعوة';
          setActionError(msg);
        }
      } else if (confirmAction.type === 'remove_member') {
        const res = await apiClient.removeBusinessMember(businessId, confirmAction.id);
        if (res.success) {
          setMembers((prev) => prev.filter((m) => m.id !== confirmAction.id));
        } else {
          const msg =
            typeof res.error === 'object' && res.error?.message
              ? res.error.message
              : typeof res.error === 'string'
              ? res.error
              : 'فشل إزالة العضو';
          setActionError(msg);
        }
      }
    } catch {
      setActionError('حدث خطأ أثناء تنفيذ الإجراء');
    } finally {
      setConfirmLoading(false);
      if (!actionError) {
        setConfirmAction(null);
      }
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Action Error */}
      {actionError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button
            onClick={() => setActionError(null)}
            className="text-rose-500 hover:text-rose-700 shrink-0"
            aria-label="إغلاق رسالة الخطأ"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ─── Members Card ─────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-850 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                أعضاء الفريق
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {membersLoading ? 'جاري التحميل...' : `${members.length} عضو في الفريق`}
              </p>
            </div>
          </div>

          {/* Invite Button — shown only for OWNER or MANAGER */}
          {canManage && (isOwner || isManager) && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowInviteModal(true)}
              className="gap-2 text-xs font-extrabold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>دعوة عضو جديد</span>
            </Button>
          )}
        </div>

        {/* Members Content */}
        <div className="p-6">
          {membersLoading ? (
            /* Loading Skeleton */
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse"
                />
              ))}
            </div>
          ) : membersError ? (
            /* Error State */
            <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
              <p className="text-sm font-medium text-rose-700 dark:text-rose-300">{membersError}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchMembers}
                className="gap-2 text-xs rounded-xl"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>إعادة المحاولة</span>
              </Button>
            </div>
          ) : members.length === 0 ? (
            /* Empty State */
            <div className="py-8 text-center space-y-2">
              <Users className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                لا يوجد أعضاء في الفريق بعد
              </p>
            </div>
          ) : (
            /* Members List */
            <div className="space-y-2">
              {members.map((member) => {
                const isSelf = member.userId === actor.id;
                const isOwnerMember = member.role === 'OWNER';
                // Can remove: OWNER can remove any non-sole-owner; MANAGER can remove MEMBERs only
                const canRemoveMember =
                  canManage &&
                  !isSelf &&
                  !isOwnerMember &&
                  (isOwner || (isManager && member.role === 'MEMBER'));

                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50 group hover:border-slate-300/80 dark:hover:border-slate-600 transition-colors"
                  >
                    {/* Avatar + Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white text-sm font-black shrink-0">
                        {member.user?.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {member.user?.name || 'مستخدم غير معروف'}
                          </p>
                          {isSelf && (
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                              (أنت)
                            </span>
                          )}
                          <RoleBadge role={member.role as BusinessRole} />
                        </div>
                        {member.user?.email && (
                          <p
                            dir="ltr"
                            className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5"
                          >
                            {member.user.email}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Remove Button */}
                    {canRemoveMember && (
                      <button
                        onClick={() =>
                          setConfirmAction({
                            type: 'remove_member',
                            id: member.id,
                            label: member.user?.name || 'العضو',
                          })
                        }
                        aria-label={`إزالة ${member.user?.name || 'العضو'} من الفريق`}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ─── Pending Invitations Card ─────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-850 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Card Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                الدعوات المعلقة
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {invitationsLoading
                  ? 'جاري التحميل...'
                  : `${invitations.length} دعوة معلقة`}
              </p>
            </div>
          </div>
          <button
            onClick={fetchInvitations}
            disabled={invitationsLoading}
            aria-label="تحديث قائمة الدعوات"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${invitationsLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Invitations Content */}
        <div className="p-6">
          {invitationsLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse"
                />
              ))}
            </div>
          ) : invitationsError ? (
            <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
              <p className="text-sm font-medium text-rose-700 dark:text-rose-300">
                {invitationsError}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchInvitations}
                className="gap-2 text-xs rounded-xl"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>إعادة المحاولة</span>
              </Button>
            </div>
          ) : invitations.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <Mail className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                لا توجد دعوات معلقة حالياً
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {invitations.map((inv) => {
                // OWNER can cancel any; MANAGER can cancel MEMBER invitations only
                const canCancel =
                  canManage &&
                  (isOwner || (isManager && inv.role === 'MEMBER'));

                const expiresDate = new Date(inv.expiresAt).toLocaleDateString('ar-SA');

                return (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-700/30 group hover:border-amber-300/80 dark:hover:border-amber-600/50 transition-colors"
                  >
                    {/* Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p
                            dir="ltr"
                            className="text-sm font-bold text-slate-900 dark:text-white truncate"
                          >
                            {inv.email}
                          </p>
                          <RoleBadge role={inv.role as BusinessRole} />
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                            <Clock className="w-2.5 h-2.5" />
                            معلقة
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          تنتهي في: {expiresDate}
                          {inv.inviter && (
                            <span className="mr-2">
                              · دعاها: {inv.inviter.name}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Cancel Button */}
                    {canCancel && (
                      <button
                        onClick={() =>
                          setConfirmAction({
                            type: 'cancel_invitation',
                            id: inv.id,
                            label: inv.email,
                          })
                        }
                        aria-label={`إلغاء دعوة ${inv.email}`}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ─── Modals ────────────────────────────────────────────────────────── */}

      {showInviteModal && (
        <InviteModal
          businessId={businessId}
          currentMembershipRole={currentMembershipRole}
          onClose={() => setShowInviteModal(false)}
          onSuccess={() => {
            setShowInviteModal(false);
            fetchInvitations();
          }}
        />
      )}

      {confirmAction && (
        <ConfirmDialog
          message={
            confirmAction.type === 'cancel_invitation'
              ? `هل تريد إلغاء الدعوة المرسلة إلى "${confirmAction.label}"؟ لا يمكن التراجع عن هذا الإجراء.`
              : `هل تريد إزالة "${confirmAction.label}" من فريق العمل؟ لا يمكن التراجع عن هذا الإجراء.`
          }
          confirmLabel={confirmAction.type === 'cancel_invitation' ? 'إلغاء الدعوة' : 'إزالة العضو'}
          confirmVariant="danger"
          isLoading={confirmLoading}
          onConfirm={handleConfirmAction}
          onCancel={() => {
            setConfirmAction(null);
            setActionError(null);
          }}
        />
      )}
    </div>
  );
}
