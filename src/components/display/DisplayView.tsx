import React, { useState, useEffect, useRef } from 'react';
import {
  QueueItem,
  Counter,
  ServiceCategory,
  MediaSettings,
  AudioSettings,
  CompanyProfile,
  QueueSyncEvent,
} from '../../types/queue';
import { MediaPlayer } from './MediaPlayer';
import { playQueueCall, playBellSound } from '../../utils/audioVoice';
import {
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Clock,
  Radio,
  Users,
  CheckCircle,
  Building2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import {
  formatContinuousMarqueeContent,
  calculateMarqueeDuration,
} from '../../utils/marqueeLogic';

interface DisplayViewProps {
  queues: QueueItem[];
  counters: Counter[];
  services: ServiceCategory[];
  media: MediaSettings;
  audioSettings: AudioSettings;
  company: CompanyProfile;
  activeTicket: QueueItem | null;
  lastEvent?: QueueSyncEvent | null;
}

export const DisplayView: React.FC<DisplayViewProps> = ({
  queues,
  counters,
  services,
  media,
  audioSettings,
  company,
  activeTicket,
  lastEvent,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [isCallingAnimation, setIsCallingAnimation] = useState(false);

  // Time ticker with timezone support
  useEffect(() => {
    const tz = company.timezone || 'WIB';
    const timeZoneMap: Record<string, string> = {
      WIB: 'Asia/Jakarta',
      WITA: 'Asia/Makassar',
      WIT: 'Asia/Jayapura',
    };
    const ianaTz = timeZoneMap[tz] || 'Asia/Jakarta';

    const updateTime = () => {
      const now = new Date();
      try {
        setCurrentTime(
          now.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZone: ianaTz,
          })
        );
        setCurrentDate(
          now.toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            timeZone: ianaTz,
          })
        );
      } catch {
        setCurrentTime(now.toLocaleTimeString('id-ID'));
        setCurrentDate(now.toLocaleDateString('id-ID'));
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [company.timezone]);

  // Listen to call events to trigger calling animation
  useEffect(() => {
    if (!lastEvent) return;

    if (lastEvent.type === 'TICKET_CALLED' || lastEvent.type === 'TICKET_RECALLED') {
      const ticket = lastEvent.ticket || activeTicket;

      if (ticket) {
        setIsCallingAnimation(true);
        const timer = setTimeout(() => setIsCallingAnimation(false), 9000);
        return () => clearTimeout(timer);
      }
    }
  }, [lastEvent, activeTicket]);

  const [isBellPlaying, setIsBellPlaying] = useState<boolean>(false);

  // Sync fullscreen state with document.fullscreenElement (F11, Escape, button)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement
        .requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(() => {});
    } else {
      document
        .exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(() => {});
    }
  };

  const handleTestAudio = async () => {
    if (isBellPlaying) return;
    setIsBellPlaying(true);
    try {
      await playBellSound(audioSettings.bellType || 'dingdong', audioSettings.chimeVolume);
    } finally {
      setIsBellPlaying(false);
    }
  };

  // Stats calculation
  const totalWaiting = queues.filter((q) => q.status === 'waiting').length;
  const totalCompleted = queues.filter((q) => q.status === 'completed').length;

  // Seamless continuous marquee content (appears immediately, zero empty space, large font)
  const continuousText = formatContinuousMarqueeContent(media.runningText, 140);
  const marqueeDuration = calculateMarqueeDuration(
    continuousText.length,
    media.runningTextSpeedSec || 32
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Display Header - Optimized for Mobile, Tablet & Big Screens */}
      <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-3.5 sm:px-6 pt-11 sm:pt-4 pb-3.5 sm:pb-4 flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4 shrink-0 shadow-lg">
        {/* Left: Organization Identity */}
        <div className="flex items-center gap-3 sm:gap-3.5 w-full md:w-auto">
          {company.logoUrl ? (
            <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-xl bg-white/10 backdrop-blur border border-white/20 p-1 flex items-center justify-center shadow-lg overflow-hidden shrink-0">
              <img
                src={company.logoUrl}
                alt="Logo Instansi"
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg text-white shrink-0">
              <Building2 className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
              <span className="text-[10px] sm:text-[11px] font-bold text-emerald-400 uppercase tracking-widest truncate flex items-center gap-1.5">
                <Radio className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>Jaringan Lokal (LAN) • Real-Time Display</span>
              </span>
            </div>
            <h1 className="text-base sm:text-xl md:text-2xl font-black text-white tracking-tight leading-tight truncate">
              {company.name}
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-400 font-medium truncate">
              {company.tagline}
            </p>
          </div>
        </div>

        {/* Right: Live Clock, Audio Status, Fullscreen */}
        <div className="flex items-center justify-between md:justify-end gap-3 sm:gap-5 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-slate-800/80">
          <div className="text-left md:text-right">
            <div className="text-[10px] sm:text-xs font-semibold text-slate-400 capitalize">{currentDate}</div>
            <div className="text-lg sm:text-2xl md:text-3xl font-black tracking-tight font-mono text-white flex items-center gap-1.5 md:justify-end">
              <span>{currentTime}</span>
              <span className="text-[10px] sm:text-xs text-blue-400 font-sans font-bold uppercase">{company.timezone || 'WIB'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 pl-3 sm:pl-4 border-l border-slate-800 shrink-0">
            {/* Cek / Uji Suara Bel: Menyala hanya ketika berbunyi, setelah habis mati kembali */}
            <button
              type="button"
              onClick={handleTestAudio}
              className={`p-2 sm:p-2.5 rounded-xl border transition-all duration-300 cursor-pointer ${
                isBellPlaying
                  ? 'bg-amber-400 text-slate-950 border-amber-300 ring-4 ring-amber-400/50 shadow-xl shadow-amber-400/40 scale-105 animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-400 hover:text-white'
              }`}
              title={isBellPlaying ? 'Suara Bel Sedang Berbunyi...' : 'Cek / Uji Suara Bel'}
              aria-label={isBellPlaying ? 'Suara Bel Sedang Berbunyi' : 'Cek Suara Bel'}
            >
              <Volume2
                className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 ${
                  isBellPlaying ? 'text-slate-950 scale-110' : 'text-slate-400'
                }`}
              />
            </button>

            {/* Mode Layar Penuh: Menyala ketika aktif dan mati kalau tidak aktif */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className={`p-2 sm:p-2.5 rounded-xl border transition-all duration-300 cursor-pointer ${
                isFullscreen
                  ? 'bg-blue-600 text-white border-blue-400 ring-4 ring-blue-400/50 shadow-xl shadow-blue-500/40 scale-105'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-400 hover:text-white'
              }`}
              title={isFullscreen ? 'Mode Layar Penuh Aktif (Klik untuk keluar)' : 'Aktifkan Mode Layar Penuh (TV)'}
              aria-label={isFullscreen ? 'Keluar Mode Layar Penuh' : 'Aktifkan Mode Layar Penuh'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5 text-white animate-pulse" />
              ) : (
                <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Active Call Hero Card & Counter Cards Grid */}
        <div className="lg:col-span-7 flex flex-col justify-between gap-6">
          {/* Active Calling Focal Spotlight Card */}
          <div
            className={`relative rounded-3xl p-6 sm:p-8 transition-all duration-500 overflow-hidden border shadow-2xl flex flex-col justify-between ${
              isCallingAnimation
                ? 'bg-gradient-to-br from-amber-950/70 via-slate-900 to-slate-950 border-amber-500/80 ring-4 ring-amber-500/30'
                : 'bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border-slate-800'
            }`}
          >
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-72 h-72 rounded-full bg-amber-600/10 blur-3xl pointer-events-none" />

            {/* Top Status Header */}
            <div className="flex items-center justify-between mb-4 z-10">
              <div className="flex items-center gap-2.5">
                <span
                  className={`w-3.5 h-3.5 rounded-full ${
                    isCallingAnimation
                      ? 'bg-amber-400 animate-ping'
                      : 'bg-emerald-400 animate-pulse'
                  }`}
                />
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-300">
                  {isCallingAnimation ? '📢 PANGGILAN SUARA AKTIF' : 'NOMOR ANTREAN DIPANGGIL'}
                </span>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/40">
                {activeTicket?.serviceName || 'Loket Pelayanan'}
              </span>
            </div>

            {/* Main Ticket Callout */}
            <div className="text-center py-3 sm:py-6 z-10">
              <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-slate-400 block mb-1">
                NOMOR ANTREAN
              </span>
              <div
                className={`text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black font-mono tracking-tight my-2 drop-shadow-md transition-transform duration-300 ${
                  isCallingAnimation
                    ? 'text-amber-400 scale-105'
                    : 'text-white'
                }`}
              >
                {activeTicket ? activeTicket.number : '---'}
              </div>

              {/* Destination Counter Badge */}
              <div className="mt-3 sm:mt-4 inline-flex flex-wrap items-center justify-center gap-2 sm:gap-3 bg-slate-800/90 border border-slate-700/80 px-4 sm:px-6 py-2 sm:py-3 rounded-2xl shadow-xl">
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 animate-pulse shrink-0" />
                <span className="text-[11px] sm:text-sm font-semibold text-slate-400">
                  SILAKAN MENUJU KE:
                </span>
                <span className="text-lg sm:text-2xl font-black text-amber-400 uppercase tracking-tight">
                  {activeTicket?.counterName || 'LOKET 1'}
                </span>
              </div>
            </div>

            {/* Status Footer */}
            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 z-10">
              <span>
                Status:{' '}
                <strong className="text-emerald-400">
                  {activeTicket?.status === 'calling' ? 'Sedang Dipanggil' : 'Sedang Dilayani'}
                </strong>
              </span>
              <span>
                Panggilan Ke: <strong className="text-white">{activeTicket?.callCount || 1}</strong>
              </span>
            </div>
          </div>

          {/* Grid of All Counters */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Radio className="w-4 h-4 text-blue-400" />
                <span>Status Semua Loket Pelayanan</span>
              </h2>
              <span className="text-xs text-slate-500">Live Status</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              {counters.map((c) => {
                const isCurrentActive = activeTicket?.counterId === c.id;
                const counterTicket = queues.find((q) => q.id === c.currentTicketId);
                const hasTicket = counterTicket && counterTicket.status !== 'completed';
                const isBreak = c.status === 'break';
                const isClosed = c.status === 'closed';

                return (
                  <div
                    key={c.id}
                    className={`rounded-2xl p-3.5 sm:p-4 border transition-all duration-300 flex flex-col justify-between ${
                      isCurrentActive && isCallingAnimation
                        ? 'bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/40'
                        : isBreak
                        ? 'bg-amber-950/30 border-amber-500/50 shadow-xs'
                        : isClosed
                        ? 'bg-slate-900/40 border-slate-800/80 opacity-70'
                        : hasTicket
                        ? 'bg-slate-900 border-slate-800'
                        : 'bg-slate-900/50 border-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black uppercase text-slate-300 tracking-wide truncate">
                        {c.name}
                      </span>
                      <span
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          isBreak
                            ? 'bg-amber-400 ring-2 ring-amber-400/40'
                            : isClosed
                            ? 'bg-rose-500'
                            : hasTicket
                            ? 'bg-emerald-400 animate-pulse'
                            : 'bg-slate-600'
                        }`}
                      />
                    </div>

                    <div className="my-2 text-center">
                      <div
                        className={`font-black tracking-tight ${
                          isBreak
                            ? 'text-lg sm:text-xl font-sans text-amber-300 tracking-wider uppercase py-1'
                            : isClosed
                            ? 'text-lg sm:text-xl font-sans text-slate-400 tracking-wider uppercase py-1'
                            : 'text-2xl sm:text-3xl font-mono text-white'
                        }`}
                      >
                        {isBreak
                          ? 'ISTIRAHAT'
                          : isClosed
                          ? 'TUTUP'
                          : hasTicket
                          ? counterTicket.number
                          : '---'}
                      </div>
                      <div className="text-[11px] font-semibold text-slate-400 truncate mt-1">
                        {isBreak
                          ? 'Jeda Istirahat'
                          : isClosed
                          ? 'Loket Belum Buka'
                          : hasTicket
                          ? counterTicket.serviceName
                          : 'Siap Melayani'}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400 gap-1">
                      <span className="truncate">{c.operatorName}</span>
                      <span
                        className={`font-bold shrink-0 ${
                          isBreak
                            ? 'text-amber-400'
                            : isClosed
                            ? 'text-rose-400'
                            : hasTicket
                            ? 'text-emerald-400'
                            : 'text-slate-500'
                        }`}
                      >
                        {isBreak
                          ? 'Istirahat'
                          : isClosed
                          ? 'Tutup'
                          : hasTicket
                          ? 'Melayani'
                          : 'Standby'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Multimedia Player & Queue Statistics */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-5">
          {/* Multimedia Player (Video / Slideshow) */}
          <div className="flex-1 min-h-[300px]">
            <MediaPlayer settings={media} />
          </div>

          {/* Quick Statistics Banner */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Total Menunggu
                </span>
                <span className="text-3xl font-black text-white font-mono">{totalWaiting}</span>
                <span className="text-xs text-slate-500 ml-1">orang</span>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Telah Dilayani
                </span>
                <span className="text-3xl font-black text-emerald-400 font-mono">
                  {totalCompleted}
                </span>
                <span className="text-xs text-slate-500 ml-1">tiket</span>
              </div>
            </div>
          </div>

          {/* Category Waiting Breakdown Mini Badges */}
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-3.5">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Antrean Menunggu per Layanan:
            </div>
            <div className="flex flex-wrap gap-2">
              {services.map((s) => {
                const count = queues.filter(
                  (q) => q.status === 'waiting' && q.serviceId === s.id
                ).length;
                return (
                  <div
                    key={s.id}
                    className="flex items-center gap-1.5 px-3 py-1 bg-slate-800/80 border border-slate-700/60 rounded-xl text-xs"
                  >
                    <span className="font-bold text-white bg-slate-700 px-1.5 py-0.5 rounded text-[10px]">
                      {s.prefix}
                    </span>
                    <span className="text-slate-300 font-medium">{s.name}:</span>
                    <strong className="text-amber-400 font-bold">{count}</strong>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Running Text Marquee Bottom Banner (Seamless Continuous, Appears Immediately, Clear at 5m) */}
      <footer className="bg-gradient-to-r from-blue-950 via-slate-950 to-blue-950 border-t-2 border-blue-500/50 text-white overflow-hidden py-2.5 sm:py-3.5 px-3 sm:px-5 flex items-center shadow-2xl z-20 shrink-0">
        <div className="flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-xs sm:text-sm uppercase px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl shrink-0 tracking-wider shadow-lg border border-blue-400/30 mr-3 sm:mr-4">
          <Radio className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300 animate-pulse shrink-0" />
          <span className="font-extrabold tracking-tight">PENGUMUMAN</span>
        </div>

        <div className="overflow-hidden whitespace-nowrap flex-1 relative flex items-center">
          <div
            className="animate-marquee-continuous flex whitespace-nowrap will-change-transform"
            style={{
              animationDuration: `${marqueeDuration}s`,
            }}
          >
            <div className="flex items-center shrink-0 pr-6 sm:pr-8">
              <span className="font-bold text-base sm:text-lg md:text-xl lg:text-2xl text-amber-200 tracking-wider drop-shadow-xs">
                {continuousText}
              </span>
              <span className="mx-4 sm:mx-6 text-amber-400 font-bold text-base sm:text-lg md:text-xl select-none">
                ★
              </span>
            </div>
            <div className="flex items-center shrink-0 pr-6 sm:pr-8" aria-hidden="true">
              <span className="font-bold text-base sm:text-lg md:text-xl lg:text-2xl text-amber-200 tracking-wider drop-shadow-xs">
                {continuousText}
              </span>
              <span className="mx-4 sm:mx-6 text-amber-400 font-bold text-base sm:text-lg md:text-xl select-none">
                ★
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
