import { AdminCredentials, PenjagaAccount } from './authLogic';

export type ResetTargetRole = 'server' | 'penjaga';
export type ResetChannel = 'phone' | 'email';

export interface PendingResetChallenge {
  targetRole: ResetTargetRole;
  targetUsername: string;
  channel: ResetChannel;
  destination: string;
  code: string;
  expiresAt: number;
  verificationId?: string;
  deliveredViaApi?: boolean;
  providerLabel?: string;
}

/**
 * Normalizes phone number digits for comparison (handles 08xx vs +628xx vs 628xx).
 */
export function normalizePhoneNumber(phone: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('62')) return `0${digits.slice(2)}`;
  return digits;
}

/**
 * Normalizes email for comparison.
 */
export function normalizeEmail(email: string): string {
  return (email || '').trim().toLowerCase();
}

/**
 * Masks phone or email for UI hint without revealing the full contact.
 */
export function maskContactInfo(value: string, channel: ResetChannel): string {
  const trimmed = (value || '').trim();
  if (!trimmed) return '';
  if (channel === 'email') {
    const [local, domain] = trimmed.split('@');
    if (!domain) return trimmed;
    const prefix = local.slice(0, Math.min(2, local.length));
    return `${prefix}***@${domain}`;
  }
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length <= 4) return '****';
  return `${digits.slice(0, 4)}****${digits.slice(-3)}`;
}

/**
 * Generates a 6-digit numeric verification code string.
 */
export function generateNumericOtpCode(): string {
  const num = Math.floor(100000 + Math.random() * 900000);
  return String(num);
}

/**
 * Verifies whether the user-provided phone or email matches the registered contact
 * for the selected account (Server Admin or Penjaga Loket).
 */
export function findMatchingContactForReset(params: {
  targetRole: ResetTargetRole;
  targetUsername?: string;
  channel: ResetChannel;
  contactInput: string;
  adminCredentials: AdminCredentials;
  penjagaAccounts: PenjagaAccount[];
}): {
  valid: boolean;
  error?: string;
  matchedUsername?: string;
  matchedDestination?: string;
} {
  const { targetRole, targetUsername, channel, contactInput, adminCredentials, penjagaAccounts } =
    params;

  const trimmedInput = (contactInput || '').trim();
  if (!trimmedInput) {
    return {
      valid: false,
      error:
        channel === 'phone'
          ? 'Masukkan nomor HP terdaftar terlebih dahulu.'
          : 'Masukkan alamat email terdaftar terlebih dahulu.',
    };
  }

  if (targetRole === 'server') {
    const registered =
      channel === 'phone' ? adminCredentials.recoveryPhone || '' : adminCredentials.recoveryEmail || '';
    if (!registered.trim()) {
      return {
        valid: false,
        error:
          channel === 'phone'
            ? 'Nomor HP pemulihan belum didaftarkan di pengaturan Keamanan & Password Admin.'
            : 'Email pemulihan belum didaftarkan di pengaturan Keamanan & Password Admin.',
      };
    }

    const isMatch =
      channel === 'phone'
        ? normalizePhoneNumber(trimmedInput) === normalizePhoneNumber(registered)
        : normalizeEmail(trimmedInput) === normalizeEmail(registered);

    if (!isMatch) {
      return {
        valid: false,
        error:
          channel === 'phone'
            ? 'Nomor HP tidak cocok dengan nomor HP Admin yang terdaftar.'
            : 'Email tidak cocok dengan email Admin yang terdaftar.',
      };
    }

    return {
      valid: true,
      matchedUsername: adminCredentials.username,
      matchedDestination: registered.trim(),
    };
  }

  // Penjaga Loket target
  const account = penjagaAccounts.find(
    (p) => p.username.toLowerCase() === (targetUsername || '').trim().toLowerCase()
  );
  if (!account) {
    return { valid: false, error: 'Akun petugas loket tidak ditemukan.' };
  }

  const registered = channel === 'phone' ? account.phone || '' : account.email || '';
  if (!registered.trim()) {
    return {
      valid: false,
      error:
        channel === 'phone'
          ? `Nomor HP belum didaftarkan untuk petugas ${account.name}. Hubungi Admin untuk melengkapinya.`
          : `Email belum didaftarkan untuk petugas ${account.name}. Hubungi Admin untuk melengkapinya.`,
    };
  }

  const isMatch =
    channel === 'phone'
      ? normalizePhoneNumber(trimmedInput) === normalizePhoneNumber(registered)
      : normalizeEmail(trimmedInput) === normalizeEmail(registered);

  if (!isMatch) {
    return {
      valid: false,
      error:
        channel === 'phone'
          ? 'Nomor HP tidak cocok dengan nomor HP petugas yang terdaftar.'
          : 'Email tidak cocok dengan email petugas yang terdaftar.',
    };
  }

  return {
    valid: true,
    matchedUsername: account.username,
    matchedDestination: registered.trim(),
  };
}

/**
 * Validates the numeric OTP code and new password fields for completing a password reset.
 */
export function validatePasswordResetSubmission(params: {
  challenge: PendingResetChallenge | null;
  otpInput: string;
  newPassword: string;
  confirmPassword: string;
  nowMs?: number;
}): { valid: boolean; error?: string } {
  const { challenge, otpInput, newPassword, confirmPassword, nowMs = Date.now() } = params;

  if (!challenge) {
    return { valid: false, error: 'Belum ada kode verifikasi yang aktif. Kirim ulang kode.' };
  }

  if (nowMs > challenge.expiresAt) {
    return { valid: false, error: 'Kode verifikasi sudah kedaluwarsa. Silakan minta kode baru.' };
  }

  const cleanOtp = (otpInput || '').replace(/\D/g, '');
  if (cleanOtp.length < 4 || cleanOtp.length > 6) {
    return { valid: false, error: 'Kode verifikasi harus berupa 4–6 digit angka.' };
  }

  if (!challenge.deliveredViaApi && cleanOtp !== challenge.code) {
    return { valid: false, error: 'Kode verifikasi angka tidak sesuai.' };
  }

  if (!newPassword || newPassword.length < 5) {
    return { valid: false, error: 'Kata sandi baru minimal harus 5 karakter.' };
  }

  if (newPassword !== confirmPassword) {
    return { valid: false, error: 'Konfirmasi kata sandi baru tidak cocok.' };
  }

  return { valid: true };
}
