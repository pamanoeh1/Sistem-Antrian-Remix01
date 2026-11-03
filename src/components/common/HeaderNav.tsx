import React, { useState } from 'react';
import {
  Tv,
  Ticket,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  UserCheck,
  Server,
  Wifi,
  LogIn,
  LogOut,
  User,
} from 'lucide-react';
import { UserSession } from '../../utils/authLogic';
import {
  ActivePage,
  getHeaderNavTitle,
  getNavAuthLabel,
  NAV_AUTO_HIDE_DELAY_MS,
  isNavVisible,
} from '../../utils/headerNavLogic';

export type { ActivePage };

interface HeaderNavProps {
  activePage: ActivePage;
  onSelectPage: (page: ActivePage) => void;
  waitingCount: number;
  userSession?: UserSession | null;
  onLogout?: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  activePage,
  onSelectPage,
  waitingCount,
  userSession,
  onLogout,
}) => {
  // Diciutkan secara bawaan (collapsed by default)
  const [isCollapsed, setIsCollapsed] = useState<boolean>(true);
  const [isIdle, setIsIdle] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  // Auto-hide after 5 seconds of inactivity
  React.useEffect(() => {
    let timerId: ReturnType<typeof setTimeout> | null = null;

    const resetIdleTimer = () => {
      setIsIdle(false);
      if (timerId) clearTimeout(timerId);
      timerId = setTimeout(() => {
        setIsIdle(true);
        setIsCollapsed(true);
      }, NAV_AUTO_HIDE_DELAY_MS);
    };

    // Start initial 5-second countdown
    timerId = setTimeout(() => {
      setIsIdle(true);
    }, NAV_AUTO_HIDE_DELAY_MS);

    const handleMouseMove = (e: MouseEvent) => {
      resetIdleTimer();
      // If cursor moves near the top edge, wake up the nav
      if (e.clientY <= 36) {
        setIsIdle(false);
      }
    };

    const userActivityEvents = [
      'mousedown',
      'keydown',
      'touchstart',
      'scroll',
      'wheel',
    ];

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    userActivityEvents.forEach((ev) =>
      window.addEventListener(ev, resetIdleTimer, { passive: true })
    );

    return () => {
      if (timerId) clearTimeout(timerId);
      window.removeEventListener('mousemove', handleMouseMove);
      userActivityEvents.forEach((ev) =>
        window.removeEventListener(ev, resetIdleTimer)
      );
    };
  }, []);

  // Close floating menu on Escape key
  React.useEffect(() => {
    if (isCollapsed) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsCollapsed(true);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCollapsed]);

  const openInNewWindow = (page: ActivePage) => {
    const url = new URL(window.location.href);
    url.searchParams.set('view', page);
    window.open(url.toString(), '_blank');
  };

  const navAuth = getNavAuthLabel(userSession);
  const currentTitle = getHeaderNavTitle(activePage, userSession);
  const isVisible = isNavVisible({
    isIdle,
    isHovered,
    isExpanded: !isCollapsed,
  });

  // Tampilan saat menu diciutkan: Tombol melayang elegan dengan auto-hide 5 detik di manapun
  if (isCollapsed) {
    return (
      <div
        className={`no-print fixed top-2 left-1/2 -translate-x-1/2 z-[100] max-w-[95vw] transition-all duration-500 ease-in-out ${
          isVisible
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 -translate-y-12 pointer-events-none'
        }`}
        onMouseEnter={() => {
          setIsHovered(true);
          setIsIdle(false);
        }}
        onMouseLeave={() => {
          setIsHovered(false);
          setIsIdle(false);
        }}
      >
        <button
          type="button"
          onClick={() => {
            setIsCollapsed(false);
            setIsIdle(false);
          }}
          className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/95 hover:bg-slate-900 text-slate-200 hover:text-white border border-slate-700 shadow-2xl backdrop-blur-md text-xs font-bold transition-all duration-200 hover:scale-105 cursor-pointer group"
          title="Luaskan Menu Navigasi Jaringan Lokal"
          aria-label="Luaskan Menu Navigasi Jaringan Lokal"
        >
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </div>
          <span className="text-[11px] font-bold tracking-tight text-white flex items-center gap-1">
            <span>ANTREAN CERDAS</span>
            <span className="text-[10px] bg-slate-800 text-emerald-400 px-1.5 py-0.2 rounded font-mono">LAN</span>
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-[11px] font-medium text-slate-300">
            {currentTitle}
          </span>
          {waitingCount > 0 && activePage !== 'kiosk' && (
            <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-1.5 rounded-full">
              {waitingCount}
            </span>
          )}
          <div className="flex items-center gap-1 pl-1 text-blue-400 group-hover:text-blue-300">
            <span className="text-[10px] font-semibold hidden sm:inline">Luaskan</span>
            <ChevronDown className="w-3.5 h-3.5 transition-transform group-hover:translate-y-0.5" />
          </div>
        </button>
      </div>
    );
  }

  // Tampilan saat menu diluaskan: Melayang elegan dengan auto-hide 5 detik di manapun
  return (
    <div
      className={`no-print fixed top-2 left-1/2 -translate-x-1/2 z-[100] w-[96vw] max-w-5xl transition-all duration-500 ease-in-out ${
        isVisible
          ? 'opacity-100 translate-y-0 pointer-events-auto animate-in fade-in zoom-in-95 duration-200'
          : 'opacity-0 -translate-y-12 pointer-events-none'
      }`}
      onMouseEnter={() => {
        setIsHovered(true);
        setIsIdle(false);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsIdle(false);
      }}
    >
      <nav className="bg-slate-900/95 border border-slate-700/80 text-slate-200 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-wrap items-center justify-between gap-3">
        {/* Brand & LAN indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="font-black text-sm text-white tracking-tight">
              ANTREAN CERDAS
            </span>
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-950/80 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-800 font-semibold">
            <Wifi className="w-3 h-3 text-emerald-400" />
            <span>Jaringan Lokal (LAN)</span>
          </span>
        </div>

      {/* Main Page Switcher (Display, Kios, dan Login / Meja Penjaga / Server Admin) */}
      <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-[11px] sm:text-xs font-bold w-full sm:w-auto justify-between sm:justify-start gap-1">
        {/* 1. Layar Display TV */}
        <button
          type="button"
          onClick={() => onSelectPage('display')}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg transition cursor-pointer flex-1 sm:flex-initial justify-center ${
            activePage === 'display'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-white'
          }`}
          aria-label="Buka Layar Display TV"
        >
          <Tv className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span className="truncate">Layar Display</span>
        </button>

        {/* 2. Kios Tiket */}
        <button
          type="button"
          onClick={() => onSelectPage('kiosk')}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg transition cursor-pointer flex-1 sm:flex-initial justify-center ${
            activePage === 'kiosk'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-white'
          }`}
          aria-label="Buka Kios Pengambilan Tiket"
        >
          <Ticket className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span className="truncate">Kios Tiket</span>
          {waitingCount > 0 && (
            <span className="bg-amber-500 text-slate-950 font-black text-[9px] sm:text-[10px] px-1.5 rounded-full ml-0.5">
              {waitingCount}
            </span>
          )}
        </button>

        {/* 3. Tombol Login / Meja Penjaga / Server Admin Dinamis */}
        {!userSession ? (
          /* Saat BELUM login: Ditampilkan hanya 1 tombol yakni "Login" */
          <button
            type="button"
            onClick={() => onSelectPage('login')}
            className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg transition cursor-pointer flex-1 sm:flex-initial justify-center ${
              activePage === 'login' || activePage === 'penjaga' || activePage === 'admin'
                ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
            aria-label="Login Petugas Loket atau Server Admin"
          >
            <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="truncate">Login</span>
          </button>
        ) : userSession.role === 'server' ? (
          /* Saat SUDAH login sebagai SERVER ADMIN */
          <button
            type="button"
            onClick={() => onSelectPage('admin')}
            className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg transition cursor-pointer flex-1 sm:flex-initial justify-center ${
              activePage === 'admin'
                ? 'bg-blue-600 text-white shadow-xs font-black'
                : 'text-slate-400 hover:text-white'
            }`}
            aria-label="Buka Panel Server Admin"
          >
            <Server className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="truncate">Server Admin</span>
          </button>
        ) : (
          /* Saat SUDAH login sebagai MEJA PENJAGA LOKET */
          <button
            type="button"
            onClick={() => onSelectPage('penjaga')}
            className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg transition cursor-pointer flex-1 sm:flex-initial justify-center ${
              activePage === 'penjaga'
                ? 'bg-emerald-600 text-white shadow-xs font-black'
                : 'text-slate-400 hover:text-white'
            }`}
            aria-label="Buka Meja Operator Penjaga Loket"
          >
            <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="truncate">Meja Penjaga</span>
          </button>
        )}
      </div>

      {/* User Session Info & Action buttons */}
      <div className="flex items-center gap-2 text-xs">
        {userSession && (
          <div className="flex items-center gap-2 bg-slate-950/60 border border-slate-800 rounded-xl px-2.5 py-1">
            <div className="w-6 h-6 rounded-lg bg-slate-800 text-emerald-400 flex items-center justify-center font-bold shrink-0">
              <User className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col text-left pr-1">
              <span className="text-[11px] font-bold text-slate-200 leading-tight truncate max-w-[120px]">
                {userSession.name || (userSession.role === 'server' ? 'Server Admin' : 'Petugas Loket')}
              </span>
              <span className="text-[9px] text-slate-400">
                {userSession.role === 'server' ? 'Server Pusat' : userSession.counterName || 'Loket'}
              </span>
            </div>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition cursor-pointer ml-1"
                title="Keluar / Logout"
                aria-label="Keluar / Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={() => openInNewWindow(activePage)}
          className="hidden sm:flex px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition items-center gap-1 cursor-pointer font-medium"
          title="Buka halaman ini di tab / jendela terpisah"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Tab Baru</span>
        </button>

        {/* Tombol ciutkan kembali */}
        <button
          type="button"
          onClick={() => setIsCollapsed(true)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition font-medium cursor-pointer"
          title="Ciutkan Menu"
          aria-label="Ciutkan Menu Navigasi"
        >
          <span>Ciutkan</span>
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
      </div>
    </nav>
  </div>
  );
};
