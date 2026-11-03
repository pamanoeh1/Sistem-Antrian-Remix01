import { UserSession } from './authLogic';

export type ActivePage = 'display' | 'kiosk' | 'penjaga' | 'admin' | 'login';

export function getHeaderNavTitle(
  page: ActivePage,
  userSession?: UserSession | null
): string {
  switch (page) {
    case 'display':
      return 'Layar Display';
    case 'kiosk':
      return 'Kios Tiket';
    case 'login':
      return 'Login';
    case 'penjaga':
      return userSession ? 'Meja Penjaga' : 'Login';
    case 'admin':
      return userSession?.role === 'server' ? 'Server Admin' : 'Login';
    default:
      return 'Layar Display';
  }
}

export function getNavAuthLabel(userSession?: UserSession | null): {
  label: string;
  targetPage: ActivePage;
  isLoggedIn: boolean;
  role?: 'server' | 'penjaga';
} {
  if (!userSession) {
    return {
      label: 'Login',
      targetPage: 'login',
      isLoggedIn: false,
    };
  }

  if (userSession.role === 'server') {
    return {
      label: 'Server Admin',
      targetPage: 'admin',
      isLoggedIn: true,
      role: 'server',
    };
  }

  return {
    label: 'Meja Penjaga',
    targetPage: 'penjaga',
    isLoggedIn: true,
    role: 'penjaga',
  };
}

export const NAV_AUTO_HIDE_DELAY_MS = 5000;

export function shouldAutoHideNav(
  idleTimeMs: number,
  timeoutMs: number = NAV_AUTO_HIDE_DELAY_MS
): boolean {
  return idleTimeMs >= timeoutMs;
}

export function isNavVisible({
  isIdle,
  isHovered,
  isExpanded,
}: {
  isIdle: boolean;
  isHovered: boolean;
  isExpanded?: boolean;
}): boolean {
  if (isHovered) return true;
  return !isIdle;
}
