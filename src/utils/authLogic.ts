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
  recoveryPhone?: string;
  recoveryEmail?: string;
  lastUpdated?: string;
}

export interface PenjagaAccount {
  username: string;
  name: string;
  passwordHash: string;
  counterId: string;
  phone?: string;
  email?: string;
}

export const DEFAULT_SERVER_CREDENTIALS: AdminCredentials = {
  username: 'admin',
  passwordHash: 'admin123',
  recoveryPhone: '081234567890',
  recoveryEmail: 'admin@instansi.go.id',
};

// Aliases for backwards compatibility
export const DEFAULT_ADMIN_CREDENTIALS = DEFAULT_SERVER_CREDENTIALS;

export const DEFAULT_PENJAGA_ACCOUNTS: PenjagaAccount[] = [
  {
    username: 'penjaga',
    name: 'Petugas Penjaga Umum',
    passwordHash: 'penjaga123',
    counterId: 'loket-1',
    phone: '081200000000',
    email: 'penjaga@instansi.go.id',
  },
  {
    username: 'loket1',
    name: 'Ahmad Fauzi',
    passwordHash: 'loket123',
    counterId: 'loket-1',
    phone: '081200000001',
    email: 'loket1@instansi.go.id',
  },
  {
    username: 'loket2',
    name: 'Dewi Lestari',
    passwordHash: 'loket123',
    counterId: 'loket-2',
    phone: '081200000002',
    email: 'loket2@instansi.go.id',
  },
  {
    username: 'loket3',
    name: 'Budi Santoso',
    passwordHash: 'loket123',
    counterId: 'loket-3',
    phone: '081200000003',
    email: 'loket3@instansi.go.id',
  },
  {
    username: 'loket4',
    name: 'Siti Nurhaliza',
    passwordHash: 'loket123',
    counterId: 'loket-4',
    phone: '081200000004',
    email: 'loket4@instansi.go.id',
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

export interface PenjagaLanLoginParams {
  serverIp?: string;
  password: string;
  counterId: string;
  counters?: Array<{ id: string; name: string; operatorName?: string; operatorUsername?: string }>;
  lanPassword?: string;
  serverPassword?: string;
  penjagaAccounts?: PenjagaAccount[];
}

/**
 * Validates a streamlined LAN login for Petugas Loket.
 */
export function verifyPenjagaLanLogin(
  params: PenjagaLanLoginParams
): { success: boolean; session?: UserSession; error?: string } {
  const pass = (params.password || '').trim();

  if (!pass) {
    return { success: false, error: 'Kata sandi tidak boleh kosong.' };
  }

  const currentCounter =
    (params.counters || []).find((c) => c.id === params.counterId) ||
    params.counters?.[0];

  const accounts = params.penjagaAccounts || [];

  // Find account assigned to this counter (by operatorUsername, counterId, or operatorName)
  const counterAccount = currentCounter
    ? accounts.find(
        (p) =>
          (currentCounter.operatorUsername && p.username === currentCounter.operatorUsername) ||
          p.counterId === currentCounter.id ||
          (currentCounter.operatorName &&
            p.name.trim().toLowerCase() === currentCounter.operatorName.trim().toLowerCase())
      )
    : undefined;

  const accountByPassword = accounts.find((p) => p.passwordHash === pass);

  // Validate passwords against assigned petugas account, LAN password, server password, or any penjaga account
  const validPasswords = [
    params.lanPassword?.trim(),
    !params.lanPassword || params.lanPassword.trim() === '123' ? 'lan123' : undefined,
    !params.lanPassword ? '123' : undefined,
    params.serverPassword?.trim(),
    !params.serverPassword ? 'admin123' : undefined,
    ...accounts.map((p) => p.passwordHash),
  ].filter((p): p is string => Boolean(p && p.length > 0));

  const isMatch = validPasswords.includes(pass);
  if (!isMatch) {
    return {
      success: false,
      error: 'Kata sandi tidak sesuai. Periksa password akun petugas, password LAN, atau password Server Admin.',
    };
  }

  const resolvedName =
    currentCounter?.operatorName ||
    counterAccount?.name ||
    accountByPassword?.name;

  const session: UserSession = {
    username:
      counterAccount?.username ||
      currentCounter?.operatorUsername ||
      `operator-${currentCounter?.id || params.counterId || 'loket-1'}`,
    role: 'penjaga',
    name: resolvedName
      ? `Operator (${resolvedName})`
      : `Penjaga ${currentCounter?.name || 'Loket'}`,
    counterId: currentCounter?.id || params.counterId || 'loket-1',
    counterName: currentCounter?.name || 'Loket',
    loginTime: new Date().toISOString(),
  };

  return { success: true, session };
}

/**
 * Synchronizes counters when a PenjagaAccount is added or updated.
 * Updates operatorName & operatorUsername on the assigned counter.
 */
export function syncCountersWithPetugasUpdate<
  T extends { id: string; operatorName: string; operatorUsername?: string }
>(counters: T[], updatedAccount: PenjagaAccount, previousUsername?: string): T[] {
  const targetUsername = updatedAccount.username.trim();
  const targetName = updatedAccount.name.trim();
  const targetCounterId = (updatedAccount.counterId || '').trim();

  return counters.map((counter) => {
    const isLinkedToAccount =
      (previousUsername && counter.operatorUsername === previousUsername) ||
      counter.operatorUsername === targetUsername;

    if (targetCounterId && counter.id === targetCounterId) {
      return {
        ...counter,
        operatorName: targetName,
        operatorUsername: targetUsername,
      };
    }

    if (isLinkedToAccount && counter.id !== targetCounterId && targetCounterId) {
      // Moved from this counter to another counter -> clear operatorUsername link if reassigned
      return {
        ...counter,
        operatorUsername: undefined,
      };
    }

    if (isLinkedToAccount && counter.id === targetCounterId) {
      return {
        ...counter,
        operatorName: targetName,
        operatorUsername: targetUsername,
      };
    }

    // Also update name if counter still displays same operator even without counterId change
    if (isLinkedToAccount && !targetCounterId) {
      return {
        ...counter,
        operatorName: targetName,
        operatorUsername: targetUsername,
      };
    }

    return counter;
  });
}

/**
 * Synchronizes PenjagaAccount[] when a Counter selects an operator from the dropdown.
 */
export function syncPetugasWithCounterUpdate(
  accounts: PenjagaAccount[],
  counterId: string,
  selectedUsername?: string,
  selectedName?: string
): PenjagaAccount[] {
  if (!counterId) return accounts;

  return accounts.map((acc) => {
    const isMatch = selectedUsername
      ? acc.username === selectedUsername
      : selectedName
      ? acc.name.trim().toLowerCase() === selectedName.trim().toLowerCase()
      : false;

    if (isMatch) {
      return { ...acc, counterId };
    }
    return acc;
  });
}

/**
 * Validates and updates Server Admin password
 */
export function validateAndUpdatePassword(
  currentPasswordInput: string,
  newPasswordInput: string,
  confirmPasswordInput: string,
  stored: AdminCredentials,
  newUsername?: string,
  recoveryContacts?: { recoveryPhone?: string; recoveryEmail?: string }
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
    ...stored,
    username: newUsername && newUsername.trim() ? newUsername.trim() : stored.username,
    passwordHash: newPasswordInput,
    recoveryPhone:
      recoveryContacts?.recoveryPhone !== undefined
        ? recoveryContacts.recoveryPhone.trim()
        : stored.recoveryPhone,
    recoveryEmail:
      recoveryContacts?.recoveryEmail !== undefined
        ? recoveryContacts.recoveryEmail.trim()
        : stored.recoveryEmail,
    lastUpdated: new Date().toISOString(),
  };

  return {
    success: true,
    updatedCredentials: updated,
  };
}
