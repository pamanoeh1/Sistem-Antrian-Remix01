export type UserRole = 'server' | 'penjaga';

export interface UserSession {
  role: UserRole;
  username: string;
  name: string;
  counterId?: string;
  counterName?: string;
  loginTime: string;
}

export interface AdminCredentials {
  username: string;
  passwordHash: string;
  lastUpdated?: string;
}

export interface PenjagaAccount {
  username: string;
  name: string;
  passwordHash: string;
  counterId: string;
}

export const DEFAULT_SERVER_CREDENTIALS: AdminCredentials = {
  username: 'admin',
  passwordHash: 'admin123',
};

// Aliases for backwards compatibility
export const DEFAULT_ADMIN_CREDENTIALS = DEFAULT_SERVER_CREDENTIALS;

export const DEFAULT_PENJAGA_ACCOUNTS: PenjagaAccount[] = [
  {
    username: 'penjaga',
    name: 'Petugas Penjaga Umum',
    passwordHash: 'penjaga123',
    counterId: 'loket-1',
  },
  {
    username: 'loket1',
    name: 'Penjaga Loket 1 - Ahmad Fauzi',
    passwordHash: 'loket123',
    counterId: 'loket-1',
  },
  {
    username: 'loket2',
    name: 'Penjaga Loket 2 - Dewi Lestari',
    passwordHash: 'loket123',
    counterId: 'loket-2',
  },
  {
    username: 'loket3',
    name: 'Penjaga Loket 3 - Budi Santoso',
    passwordHash: 'loket123',
    counterId: 'loket-3',
  },
  {
    username: 'loket4',
    name: 'Penjaga Loket 4 - Siti Nurhaliza',
    passwordHash: 'loket123',
    counterId: 'loket-4',
  },
];

/**
 * Validates a unified login attempt for either Server Admin or Penjaga Loket.
 */
export function verifyUserLogin(
  inputUsername: string,
  inputPassword: string,
  serverCreds: AdminCredentials = DEFAULT_SERVER_CREDENTIALS,
  penjagaAccounts: PenjagaAccount[] = DEFAULT_PENJAGA_ACCOUNTS
): { success: boolean; session?: UserSession; error?: string } {
  const user = inputUsername.trim().toLowerCase();
  const pass = inputPassword;

  if (!user) {
    return { success: false, error: 'Username tidak boleh kosong' };
  }
  if (!pass) {
    return { success: false, error: 'Password tidak boleh kosong' };
  }

  // 1. Check Server credentials (accepts 'admin' or 'server')
  if (
    (user === serverCreds.username.toLowerCase() || user === 'server' || user === 'admin') &&
    pass === serverCreds.passwordHash
  ) {
    return {
      success: true,
      session: {
        role: 'server',
        username: serverCreds.username,
        name: 'Administrator Server Antrean',
        loginTime: new Date().toISOString(),
      },
    };
  }

  // 2. Check Penjaga accounts
  const matchedPenjaga = penjagaAccounts.find(
    (p) => p.username.toLowerCase() === user && p.passwordHash === pass
  );

  if (matchedPenjaga) {
    return {
      success: true,
      session: {
        role: 'penjaga',
        username: matchedPenjaga.username,
        name: matchedPenjaga.name,
        counterId: matchedPenjaga.counterId,
        loginTime: new Date().toISOString(),
      },
    };
  }

  return {
    success: false,
    error: 'Username atau kata sandi tidak valid. Periksa kembali akun Server atau Penjaga Anda.',
  };
}

/**
 * Backwards compatible verification for admin panel
 */
export function verifyAdminCredentials(
  inputUsername: string,
  inputPassword: string,
  stored: AdminCredentials = DEFAULT_SERVER_CREDENTIALS
): { success: boolean; error?: string } {
  const result = verifyUserLogin(inputUsername, inputPassword, stored);
  if (result.success && result.session?.role === 'server') {
    return { success: true };
  }
  return { success: false, error: result.error || 'Username atau password salah' };
}

/**
 * Validates and updates Server Admin password
 */
export function validateAndUpdatePassword(
  currentPasswordInput: string,
  newPasswordInput: string,
  confirmPasswordInput: string,
  stored: AdminCredentials,
  newUsername?: string
): { success: boolean; error?: string; updatedCredentials?: AdminCredentials } {
  if (!currentPasswordInput) {
    return { success: false, error: 'Password saat ini harus diisi' };
  }
  if (currentPasswordInput !== stored.passwordHash) {
    return { success: false, error: 'Password saat ini tidak sesuai' };
  }
  if (!newPasswordInput || newPasswordInput.length < 5) {
    return { success: false, error: 'Password baru minimal harus 5 karakter' };
  }
  if (newPasswordInput === stored.passwordHash) {
    return {
      success: false,
      error: 'Password baru tidak boleh sama dengan password saat ini',
    };
  }
  if (newPasswordInput !== confirmPasswordInput) {
    return {
      success: false,
      error: 'Konfirmasi password baru tidak cocok',
    };
  }

  const updated: AdminCredentials = {
    username: newUsername && newUsername.trim() ? newUsername.trim() : stored.username,
    passwordHash: newPasswordInput,
    lastUpdated: new Date().toISOString(),
  };

  return {
    success: true,
    updatedCredentials: updated,
  };
}
