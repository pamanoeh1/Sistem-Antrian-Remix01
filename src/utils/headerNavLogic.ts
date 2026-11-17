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
export const TOP_REVEAL_ZONE_PX = 44;

export function shouldAutoHideNav(
  idleTimeMs: number,
  timeoutMs: number = NAV_AUTO_HIDE_DELAY_MS
): boolean {
  return idleTimeMs >= timeoutMs;
}

export function isCursorInTopRevealZone(
  clientY: number,
  thresholdPx: number = TOP_REVEAL_ZONE_PX
): boolean {
  return Number.isFinite(clientY) && clientY >= 0 && clientY <= thresholdPx;
}

export function shouldWakeNavOnMouseMove(
  clientY: number,
  isFullscreenLocked: boolean = false,
  thresholdPx: number = TOP_REVEAL_ZONE_PX
): boolean {
  if (isFullscreenLocked) return false;
  return isCursorInTopRevealZone(clientY, thresholdPx);
}

export function isNavVisible({
  isIdle,
  isHovered,
  isExpanded,
  isFullscreenLocked = false,
}: {
  isIdle: boolean;
  isHovered: boolean;
  isExpanded?: boolean;
  isFullscreenLocked?: boolean;
}): boolean {
  if (isFullscreenLocked) return false;
  if (isHovered) return true;
  void isExpanded;
  return !isIdle;
}
