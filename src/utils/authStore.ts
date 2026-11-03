import {
  AdminCredentials,
  DEFAULT_SERVER_CREDENTIALS,
  UserSession,
  PenjagaAccount,
  DEFAULT_PENJAGA_ACCOUNTS,
} from './authLogic';

const STORAGE_KEYS = {
  CREDENTIALS: 'antrean_admin_credentials_v1',
  PENJAGA_ACCOUNTS: 'antrean_penjaga_accounts_v1',
  SESSION: 'antrean_admin_session_v1',
  ACTIVE_USER: 'antrean_active_user_v1',
};

/**
 * Retrieves the stored server admin credentials or defaults to admin/admin123
 */
export function getStoredAdminCredentials(): AdminCredentials {
  if (typeof window === 'undefined') return DEFAULT_SERVER_CREDENTIALS;
  const raw = localStorage.getItem(STORAGE_KEYS.CREDENTIALS);
  if (!raw) {
    localStorage.setItem(
      STORAGE_KEYS.CREDENTIALS,
      JSON.stringify(DEFAULT_SERVER_CREDENTIALS)
    );
    return DEFAULT_SERVER_CREDENTIALS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return DEFAULT_SERVER_CREDENTIALS;
  }
}

/**
 * Saves updated server admin credentials to localStorage
 */
export function setStoredAdminCredentials(creds: AdminCredentials): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(creds));
}

/**
 * Retrieves stored Penjaga accounts
 */
export function getStoredPenjagaAccounts(): PenjagaAccount[] {
  if (typeof window === 'undefined') return DEFAULT_PENJAGA_ACCOUNTS;
  const raw = localStorage.getItem(STORAGE_KEYS.PENJAGA_ACCOUNTS);
  if (!raw) {
    localStorage.setItem(
      STORAGE_KEYS.PENJAGA_ACCOUNTS,
      JSON.stringify(DEFAULT_PENJAGA_ACCOUNTS)
    );
    return DEFAULT_PENJAGA_ACCOUNTS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return DEFAULT_PENJAGA_ACCOUNTS;
  }
}

/**
 * Saves updated Penjaga accounts to localStorage
 */
export function setStoredPenjagaAccounts(accounts: PenjagaAccount[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.PENJAGA_ACCOUNTS, JSON.stringify(accounts));
}

/**
 * Gets the current active user session (Server or Penjaga)
 */
export function getActiveUserSession(): UserSession | null {
  if (typeof window === 'undefined') return null;

  const sessionRaw =
    sessionStorage.getItem(STORAGE_KEYS.ACTIVE_USER) ||
    localStorage.getItem(STORAGE_KEYS.ACTIVE_USER);

  if (sessionRaw) {
    try {
      return JSON.parse(sessionRaw);
    } catch {
      // ignore
    }
  }

  // Legacy fallback: if old admin session was true, treat as server
  const legacySession =
    sessionStorage.getItem(STORAGE_KEYS.SESSION) === 'true' ||
    localStorage.getItem(STORAGE_KEYS.SESSION) === 'true';

  if (legacySession) {
    return {
      role: 'server',
      username: 'admin',
      name: 'Administrator Server Antrean',
      loginTime: new Date().toISOString(),
    };
  }

  return null;
}

/**
 * Saves logged in user session (either server or penjaga)
 */
export function loginUserSession(session: UserSession, remember = true): void {
  if (typeof window === 'undefined') return;
  const serialized = JSON.stringify(session);
  if (remember) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, serialized);
    localStorage.setItem(STORAGE_KEYS.SESSION, 'true');
  } else {
    sessionStorage.setItem(STORAGE_KEYS.ACTIVE_USER, serialized);
    sessionStorage.setItem(STORAGE_KEYS.SESSION, 'true');
  }
}

/**
 * Logs out active user session
 */
export function logoutUserSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.ACTIVE_USER);
  sessionStorage.removeItem(STORAGE_KEYS.ACTIVE_USER);
  localStorage.removeItem(STORAGE_KEYS.SESSION);
  sessionStorage.removeItem(STORAGE_KEYS.SESSION);
}

/**
 * Checks if a Server Administrator is logged in
 */
export function isServerAuthenticated(): boolean {
  const session = getActiveUserSession();
  return session?.role === 'server';
}

/**
 * Checks if a Penjaga Loket is logged in
 */
export function isPenjagaAuthenticated(): boolean {
  const session = getActiveUserSession();
  return session?.role === 'penjaga' || session?.role === 'server';
}

/**
 * Backwards compatibility helper
 */
export function isAdminAuthenticated(): boolean {
  return isServerAuthenticated();
}

/**
 * Backwards compatibility helper
 */
export function loginAdminSession(remember = true): void {
  loginUserSession(
    {
      role: 'server',
      username: 'admin',
      name: 'Administrator Server Antrean',
      loginTime: new Date().toISOString(),
    },
    remember
  );
}

/**
 * Backwards compatibility helper
 */
export function logoutAdminSession(): void {
  logoutUserSession();
}

/**
 * Resets admin credentials to default (admin / admin123)
 */
export function resetAdminCredentialsToDefault(): AdminCredentials {
  if (typeof window !== 'undefined') {
    localStorage.setItem(
      STORAGE_KEYS.CREDENTIALS,
      JSON.stringify(DEFAULT_SERVER_CREDENTIALS)
    );
  }
  return DEFAULT_SERVER_CREDENTIALS;
}
