/**
 * WAYNAH — Production Admin Bootstrap Utility
 *
 * Secure CLI script for bootstrapping the initial SUPER_ADMIN account
 * in a fresh production or staging database deployment.
 *
 * Requirements & Constraints:
 * - Does NOT modify public registration or RBAC definitions.
 * - Reads credentials from environment variables (BOOTSTRAP_ADMIN_EMAIL, BOOTSTRAP_ADMIN_PASSWORD, BOOTSTRAP_ADMIN_NAME).
 * - Enforces strong password criteria (>= 12 characters, uppercase, lowercase, number, symbol).
 * - Prevents duplicate admin creation unless --force flag is explicitly passed.
 * - Uses existing PasswordSecurity scrypt hashing utility.
 * - Writes immutable audit log entry upon success.
 * - Never prints or persists plaintext passwords.
 */

import 'dotenv/config';
import { prisma } from '@waynah/database';
import { PasswordSecurity } from '../apps/api/src/utils/password.js';
import { AuditLogger } from '../apps/api/src/utils/audit-logger.js';

async function bootstrapAdmin() {
  console.log('===============================================================');
  console.log('       WAYNAH — PRODUCTION SUPER_ADMIN BOOTSTRAP UTILITY        ');
  console.log('===============================================================');

  const name = process.env.BOOTSTRAP_ADMIN_NAME || 'Super Admin';
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL;
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  const isForce = process.argv.includes('--force');

  if (!email || !password) {
    console.error('\n[ERROR] Missing required bootstrap credentials!');
    console.error('Please provide BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD in environment variables.');
    console.error('Example:');
    console.error('  BOOTSTRAP_ADMIN_EMAIL="admin@waynah.app" BOOTSTRAP_ADMIN_PASSWORD="StrongP@ssw0rd123!" pnpm bootstrap:admin\n');
    process.exit(1);
  }

  // 1. Validate Email format
  const normalizedEmail = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    console.error(`\n[ERROR] Invalid email format: "${email}"`);
    process.exit(1);
  }

  // 2. Validate Password Strength (Min 12 chars, uppercase, lowercase, number, symbol)
  if (password.length < 12) {
    console.error('\n[ERROR] Password does not meet security strength criteria!');
    console.error('  - Must be at least 12 characters long.');
    process.exit(1);
  }

  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  if (!hasUpper || !hasLower || !hasNumber || !hasSymbol) {
    console.error('\n[ERROR] Password does not meet complexity criteria!');
    console.error('  - Must contain at least one uppercase letter, one lowercase letter, one number, and one symbol.');
    process.exit(1);
  }

  // 3. Admin existence check
  AuditLogger.setPrismaClient(prisma);

  const existingAdmin = await prisma.user.findFirst({
    where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
  });

  if (existingAdmin && !isForce) {
    console.error(`\n[ABORTED] An existing ADMIN/SUPER_ADMIN account was found (${existingAdmin.email}).`);
    console.error('Bootstrap aborted to prevent unauthorized admin creation.');
    console.error('If you explicitly intend to add another admin, re-run with the --force flag.\n');
    process.exit(1);
  }

  // 4. Duplicate email check
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    console.error(`\n[ERROR] A user with email "${normalizedEmail}" already exists!`);
    process.exit(1);
  }

  // 5. Hash password using existing scrypt utility
  console.log('\nHashing credentials using scrypt-16MB/64B key...');
  const passwordHash = PasswordSecurity.hashPassword(password);

  // 6. Create SUPER_ADMIN user atomically
  console.log(`Creating SUPER_ADMIN account for "${normalizedEmail}"...`);
  const now = new Date();
  const newAdmin = await prisma.user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: 'SUPER_ADMIN',
      emailVerified: true,
      emailVerifiedAt: now,
    },
  });

  // 7. Write Audit Log Entry
  try {
    await AuditLogger.logAuthSuccess(
      'CLI',
      'scripts/bootstrap-admin.ts',
      newAdmin.id,
      'SUPER_ADMIN',
      '127.0.0.1'
    );
  } catch (auditErr) {
    console.warn('Warning: Could not record audit log entry:', auditErr);
  }

  console.log('\n===============================================================');
  console.log('       SUPER_ADMIN BOOTSTRAP COMPLETED SUCCESSFULLY             ');
  console.log('===============================================================');
  console.log(`  - User ID:        ${newAdmin.id}`);
  console.log(`  - Name:           ${newAdmin.name}`);
  console.log(`  - Email:          ${newAdmin.email}`);
  console.log(`  - Role:           ${newAdmin.role}`);
  console.log(`  - Email Verified: ${newAdmin.emailVerified}`);
  console.log('===============================================================');
  console.log('IMPORTANT: Ensure temporary environment variables are unset immediately!\n');
}

bootstrapAdmin()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n[CRITICAL FAILURE] Admin bootstrap failed:', err);
    process.exit(1);
  });
