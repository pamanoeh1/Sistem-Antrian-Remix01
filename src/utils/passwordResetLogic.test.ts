import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizePhoneNumber,
  normalizeEmail,
  maskContactInfo,
  generateNumericOtpCode,
  findMatchingContactForReset,
  validatePasswordResetSubmission,
  PendingResetChallenge,
} from './passwordResetLogic';
import { DEFAULT_SERVER_CREDENTIALS, DEFAULT_PENJAGA_ACCOUNTS } from './authLogic';

test('normalizePhoneNumber handles 08xx, +628xx, and dashes/spaces consistently', () => {
  assert.equal(normalizePhoneNumber('0812-3456-7890'), '081234567890');
  assert.equal(normalizePhoneNumber('+62 812 3456 7890'), '081234567890');
  assert.equal(normalizePhoneNumber('6281234567890'), '081234567890');
});

test('normalizeEmail trims whitespace and lowercases', () => {
  assert.equal(normalizeEmail('  Admin@Instansi.GO.ID '), 'admin@instansi.go.id');
});

test('maskContactInfo masks email and phone without exposing full address', () => {
  assert.equal(maskContactInfo('admin@instansi.go.id', 'email'), 'ad***@instansi.go.id');
  assert.equal(maskContactInfo('081234567890', 'phone'), '0812****890');
});

test('generateNumericOtpCode returns a 6-digit numeric string', () => {
  for (let i = 0; i < 20; i++) {
    const code = generateNumericOtpCode();
    assert.match(code, /^\d{6}$/);
  }
});

test('findMatchingContactForReset verifies Server Admin and Penjaga contacts strictly', () => {
  // Server phone match (including +62 format)
  const serverPhoneOk = findMatchingContactForReset({
    targetRole: 'server',
    channel: 'phone',
    contactInput: '+6281234567890',
    adminCredentials: DEFAULT_SERVER_CREDENTIALS,
    penjagaAccounts: DEFAULT_PENJAGA_ACCOUNTS,
  });
  assert.equal(serverPhoneOk.valid, true);
  assert.equal(serverPhoneOk.matchedUsername, 'admin');

  // Server email match (case-insensitive)
  const serverEmailOk = findMatchingContactForReset({
    targetRole: 'server',
    channel: 'email',
    contactInput: 'ADMIN@INSTANSI.GO.ID',
    adminCredentials: DEFAULT_SERVER_CREDENTIALS,
    penjagaAccounts: DEFAULT_PENJAGA_ACCOUNTS,
  });
  assert.equal(serverEmailOk.valid, true);

  // Wrong email rejected
  const serverEmailBad = findMatchingContactForReset({
    targetRole: 'server',
    channel: 'email',
    contactInput: 'salah@instansi.go.id',
    adminCredentials: DEFAULT_SERVER_CREDENTIALS,
    penjagaAccounts: DEFAULT_PENJAGA_ACCOUNTS,
  });
  assert.equal(serverEmailBad.valid, false);
  assert.match(serverEmailBad.error || '', /tidak cocok/i);

  // Penjaga contact match
  const penjagaPhoneOk = findMatchingContactForReset({
    targetRole: 'penjaga',
    targetUsername: 'loket1',
    channel: 'phone',
    contactInput: '081200000001',
    adminCredentials: DEFAULT_SERVER_CREDENTIALS,
    penjagaAccounts: DEFAULT_PENJAGA_ACCOUNTS,
  });
  assert.equal(penjagaPhoneOk.valid, true);
  assert.equal(penjagaPhoneOk.matchedUsername, 'loket1');

  // Penjaga missing contact fails explicitly
  const penjagaNoEmail = findMatchingContactForReset({
    targetRole: 'penjaga',
    targetUsername: 'baru',
    channel: 'email',
    contactInput: 'baru@instansi.go.id',
    adminCredentials: DEFAULT_SERVER_CREDENTIALS,
    penjagaAccounts: [
      { username: 'baru', name: 'Baru', passwordHash: 'baru123', counterId: 'loket-1' },
    ],
  });
  assert.equal(penjagaNoEmail.valid, false);
  assert.match(penjagaNoEmail.error || '', /belum didaftarkan/i);
});

test('validatePasswordResetSubmission enforces 6-digit OTP match, expiry, and password rules', () => {
  const challenge: PendingResetChallenge = {
    targetRole: 'server',
    targetUsername: 'admin',
    channel: 'email',
    destination: 'admin@instansi.go.id',
    code: '482910',
    expiresAt: 1_000_000,
  };

  assert.equal(
    validatePasswordResetSubmission({
      challenge,
      otpInput: '123456',
      newPassword: 'newpass123',
      confirmPassword: 'newpass123',
      nowMs: 500_000,
    }).valid,
    false
  );

  assert.equal(
    validatePasswordResetSubmission({
      challenge,
      otpInput: '482910',
      newPassword: 'newpass123',
      confirmPassword: 'newpass123',
      nowMs: 1_000_001, // expired
    }).valid,
    false
  );

  assert.equal(
    validatePasswordResetSubmission({
      challenge,
      otpInput: '482910',
      newPassword: 'newpass123',
      confirmPassword: 'mismatch',
      nowMs: 500_000,
    }).valid,
    false
  );

  assert.equal(
    validatePasswordResetSubmission({
      challenge,
      otpInput: '482910',
      newPassword: 'newpass123',
      confirmPassword: 'newpass123',
      nowMs: 500_000,
    }).valid,
    true
  );
});
