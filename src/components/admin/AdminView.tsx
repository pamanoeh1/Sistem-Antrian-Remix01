import React, { useState } from 'react';
import {
  QueueItem,
  Counter,
  ServiceCategory,
  MediaSettings,
  AudioSettings,
  CompanyProfile,
  QueueStatus,
  LanSettings,
  SlideItem,
  TimezoneCode,
} from '../../types/queue';
import {
  getNextWaitingTicketForCounter,
  filterQueues,
} from '../../utils/queueLogic';
import { ThermalTicket } from '../kiosk/ThermalTicket';
import { ChangePasswordSection } from './ChangePasswordSection';
import { CounterServiceManager } from './CounterServiceManager';
import {
  VOICE_PERSONAS,
  playQueueCall,
  playBellSound,
  speakAnnouncement,
  testElevenLabsApiKey,
  testSpeechifyApiKey,
  stopCurrentSpeech,
} from '../../utils/audioVoice';
import {
  getStoredLanSettings,
  setStoredLanSettings,
} from '../../utils/queueStore';
import {
  formatContinuousMarqueeContent,
  calculateMarqueeDuration,
} from '../../utils/marqueeLogic';
import {
  Megaphone,
  RotateCcw,
  CheckCircle2,
  SkipForward,
  PhoneCall,
  Users,
  Settings,
  Sliders,
  Tv,
  Building,
  RefreshCw,
  Search,
  Filter,
  Printer,
  Plus,
  Trash2,
  Volume2,
  Check,
  AlertTriangle,
  LogOut,
  KeyRound,
  Gauge,
  Sparkles,
  Radio,
  Eye,
  EyeOff,
  Loader2,
  Globe,
  Upload,
  Film,
  Image as ImageIcon,
  Copy,
  Clock,
  Wifi,
  Server,
} from 'lucide-react';

interface AdminViewProps {
  queues: QueueItem[];
  counters: Counter[];
  services: ServiceCategory[];
  media: MediaSettings;
  audioSettings: AudioSettings;
  company: CompanyProfile;
  activeTicket: QueueItem | null;
  onCallTicket: (ticket: QueueItem, counter: Counter) => void;
  onRecallTicket: (ticket: QueueItem, counter: Counter) => void;
  onCompleteTicket: (ticket: QueueItem) => void;
  onSkipTicket: (ticket: QueueItem) => void;
  onUpdateCounters: (counters: Counter[]) => void;
  onUpdateServices: (services: ServiceCategory[]) => void;
  onUpdateMedia: (media: MediaSettings) => void;
  onUpdateAudio: (audio: AudioSettings) => void;
  onUpdateCompany: (company: CompanyProfile) => void;
  onResetQueues: () => void;
  onManualCall: (ticketNumber: string, counter: Counter) => void;
  onAddManualTicket: (serviceId: string) => void;
  onLogout?: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  queues,
  counters,
  services,
  media,
  audioSettings,
  company,
  activeTicket,
  onCallTicket,
  onRecallTicket,
  onCompleteTicket,
  onSkipTicket,
  onUpdateCounters,
  onUpdateServices,
  onUpdateMedia,
  onUpdateAudio,
  onUpdateCompany,
  onResetQueues,
  onManualCall,
  onAddManualTicket,
  onLogout,
}) => {
  const [selectedCounterId, setSelectedCounterId] = useState<string>(
    counters[0]?.id || 'loket-1'
  );
  const [activeTab, setActiveTab] = useState<'counter' | 'queues' | 'settings'>('counter');
  const [queueFilterStatus, setQueueFilterStatus] = useState<QueueStatus | 'all'>('all');
  const [queueFilterService, setQueueFilterService] = useState<string>('all');
  const [queueSearchTerm, setQueueSearchTerm] = useState<string>('');

  // Settings subtabs
  const [settingsTab, setSettingsTab] = useState<
    'audio' | 'media' | 'counters' | 'company' | 'security' | 'lan'
  >('audio');

  // Reprints modal
  const [ticketToPrint, setTicketToPrint] = useState<QueueItem | null>(null);

  // Manual call input modal
  const [manualCallInput, setManualCallInput] = useState<string>('');
  const [showManualModal, setShowManualModal] = useState<boolean>(false);

  // Reset confirmation
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // ElevenLabs testing state
  const [testingVoiceId, setTestingVoiceId] = useState<string | null>(null);
  const [checkingApiKey, setCheckingApiKey] = useState<boolean>(false);
  const [showApiKeyText, setShowApiKeyText] = useState<boolean>(false);
  const [apiKeyFeedback, setApiKeyFeedback] = useState<{
    success: boolean;
    message: string;
    voiceCount?: number;
  } | null>(null);

  // Speechify testing state
  const [checkingSpeechifyKey, setCheckingSpeechifyKey] = useState<boolean>(false);
  const [showSpeechifyKeyText, setShowSpeechifyKeyText] = useState<boolean>(false);
  const [speechifyFeedback, setSpeechifyFeedback] = useState<{
    success: boolean;
    message: string;
    voiceCount?: number;
  } | null>(null);

  // LAN Settings state
  const [lanSettings, setLanSettings] = useState<LanSettings>(() => getStoredLanSettings());
  const [lanSavedMsg, setLanSavedMsg] = useState<string | null>(null);
  const [showLanPassword, setShowLanPassword] = useState(false);

  const currentCounter = counters.find((c) => c.id === selectedCounterId) || counters[0];
  const currentServingTicket = queues.find(
    (q) => q.id === currentCounter?.currentTicketId && (q.status === 'calling' || q.status === 'serving')
  );

  const nextWaitingForThisCounter = currentCounter
    ? getNextWaitingTicketForCounter(currentCounter, queues)
    : null;

  const handleToggleCounterStatus = (status: 'open' | 'break' | 'closed') => {
    if (!currentCounter) return;
    const updated = counters.map((c) =>
      c.id === currentCounter.id ? { ...c, status } : c
    );
    onUpdateCounters(updated);
  };

  const handleCallNext = () => {
    if (!currentCounter) return;
    if (currentCounter.status !== 'open') {
      handleToggleCounterStatus('open');
    }
    if (nextWaitingForThisCounter) {
      onCallTicket(nextWaitingForThisCounter, currentCounter);
    } else {
      alert(`Tidak ada antrean menunggu untuk ${currentCounter.name}`);
    }
  };

  const handleRecall = () => {
    if (currentServingTicket && currentCounter) {
      onRecallTicket(currentServingTicket, currentCounter);
    }
  };

  const handleComplete = () => {
    if (currentServingTicket) {
      onCompleteTicket(currentServingTicket);
    }
  };

  const handleSkip = () => {
    if (currentServingTicket) {
      onSkipTicket(currentServingTicket);
    }
  };

  const handleTestAudio = () => {
    playQueueCall('A-001', currentCounter?.name || 'Loket 1', audioSettings);
  };

  const handlePlayVoiceSample = async (persona: (typeof VOICE_PERSONAS)[0]) => {
    setTestingVoiceId(persona.id);
    onUpdateAudio({ ...audioSettings, voicePersona: persona.id });
    const sampleText = `Nomor antrean A, kosong kosong satu, silakan menuju ke ${currentCounter?.name || 'Loket satu Pelayanan Terpadu'}.`;
    try {
      await speakAnnouncement(sampleText, {
        ...audioSettings,
        voicePersona: persona.id,
      });
    } finally {
      setTestingVoiceId(null);
    }
  };

  const handleVerifyApiKey = async () => {
    setCheckingApiKey(true);
    setApiKeyFeedback(null);
    try {
      const res = await testElevenLabsApiKey(audioSettings.elevenLabsApiKey || '');
      setApiKeyFeedback(res);
    } finally {
      setCheckingApiKey(false);
    }
  };

  const handleVerifySpeechifyKey = async () => {
    setCheckingSpeechifyKey(true);
    setSpeechifyFeedback(null);
    try {
      const res = await testSpeechifyApiKey(audioSettings.speechifyApiKey || '');
      setSpeechifyFeedback(res);
    } finally {
      setCheckingSpeechifyKey(false);
    }
  };

  const handleUploadSlidePhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          const newSlide: SlideItem = {
            id: `slide-local-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            title: file.name.replace(/\.[^/.]+$/, ''),
            url: dataUrl,
            fileName: file.name,
            caption: 'Foto galeri lokal dari komputer server antrean.',
          };
          onUpdateMedia({
            ...media,
            slides: [...(Array.isArray(media?.slides) ? media.slides : []), newSlide],
          });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDeleteSlide = (slideId: string) => {
    onUpdateMedia({
      ...media,
      slides: (Array.isArray(media?.slides) ? media.slides : []).filter((s) => s.id !== slideId),
    });
  };

  const handleUploadLocalVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        onUpdateMedia({
          ...media,
          type: 'video',
          videoUrl: dataUrl,
          videoSource: 'local',
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUploadLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        onUpdateCompany({
          ...company,
          logoUrl: dataUrl,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    onUpdateCompany({
      ...company,
      logoUrl: undefined,
    });
  };

  const handleSaveLanSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setStoredLanSettings(lanSettings);
    setLanSavedMsg('Pengaturan server dan jaringan LAN berhasil disimpan!');
    setTimeout(() => setLanSavedMsg(null), 4000);
  };

  const filteredQueuesList = filterQueues(queues, {
    status: queueFilterStatus,
    serviceId: queueFilterService,
    searchTerm: queueSearchTerm,
  });

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 pb-16">
      {/* Admin Subheader / Quick Bar */}
      <div className="bg-white border-b border-slate-200 shadow-xs px-4 sm:px-8 py-3.5 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shrink-0">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                Panel Pengendali Antrean & Petugas Loket
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Panggilan loket, antrean pengunjung, pengumuman, dan cetak tiket thermal.
              </p>
            </div>
          </div>

          {/* Controls: Counter Selection & Subtabs */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl p-1.5 px-3 w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-600 uppercase shrink-0">Loket:</span>
              <select
                value={selectedCounterId}
                onChange={(e) => setSelectedCounterId(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-800 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {counters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.operatorName}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick tab switcher */}
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold w-full sm:w-auto justify-between sm:justify-start">
              <button
                type="button"
                onClick={() => setActiveTab('counter')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex-1 sm:flex-initial text-center ${
                  activeTab === 'counter'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Meja Loket
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('queues')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex-1 sm:flex-initial text-center ${
                  activeTab === 'queues'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Daftar ({queues.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex-1 sm:flex-initial text-center ${
                  activeTab === 'settings'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pengaturan
              </button>
            </div>

            {/* Logout button */}
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-300 transition text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                title="Kunci / Keluar dari Panel Admin"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* TAB 1: MEJA PANGGILAN LOKET (COUNTER WORKSTATION) */}
        {activeTab === 'counter' && (
          <div className="space-y-6">
            {/* Operator Hero Station */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                      {currentCounter?.name}
                    </span>
                    <span
                      className={`text-xs font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                        currentCounter?.status === 'break'
                          ? 'bg-amber-50 text-amber-700 border-amber-300'
                          : currentCounter?.status === 'closed'
                          ? 'bg-rose-50 text-rose-700 border-rose-300'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      }`}
                    >
                      {currentCounter?.status === 'break'
                        ? '🟡 Istirahat'
                        : currentCounter?.status === 'closed'
                        ? '🔴 Tutup'
                        : '🟢 Buka (Melayani)'}
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 mt-2">
                    Petugas: {currentCounter?.operatorName}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Layanan yang dilayani loket ini:{' '}
                    {currentCounter?.supportedServiceIds
                      .map((id) => services.find((s) => s.id === id)?.name)
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Status toggle group */}
                  <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold border border-slate-200">
                    <button
                      type="button"
                      onClick={() => handleToggleCounterStatus('open')}
                      className={`px-3 py-1.5 rounded-lg transition cursor-pointer text-xs font-bold flex items-center gap-1.5 ${
                        (currentCounter?.status || 'open') === 'open'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                      }`}
                      title="Buka Loket untuk Pelayanan"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Buka</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleCounterStatus('break')}
                      className={`px-3 py-1.5 rounded-lg transition cursor-pointer text-xs font-bold flex items-center gap-1.5 ${
                        currentCounter?.status === 'break'
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                      }`}
                      title="Istirahat / Jeda Singkat"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Istirahat</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleCounterStatus('closed')}
                      className={`px-3 py-1.5 rounded-lg transition cursor-pointer text-xs font-bold flex items-center gap-1.5 ${
                        currentCounter?.status === 'closed'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                      }`}
                      title="Tutup Loket"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Tutup</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowManualModal(true)}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-slate-200"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-slate-600" />
                    <span>Panggil Manual...</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleTestAudio}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-slate-200"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Cek Suara</span>
                  </button>
                </div>
              </div>

              {/* Status Alert Banners */}
              {currentCounter?.status === 'break' && (
                <div className="mt-4 bg-amber-50 border border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                    <p className="text-xs sm:text-sm font-medium">
                      <span className="font-bold">Loket sedang ISTIRAHAT.</span> Layar TV display menampilkan status "ISTIRAHAT" kepada pengunjung. Tekan "Buka" atau "Panggil Berikutnya" untuk kembali melayani.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleCounterStatus('open')}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold cursor-pointer shrink-0"
                  >
                    Buka Loket Sekarang
                  </button>
                </div>
              )}

              {currentCounter?.status === 'closed' && (
                <div className="mt-4 bg-rose-50 border border-rose-300 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-rose-900">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                    <p className="text-xs sm:text-sm font-medium">
                      <span className="font-bold">Loket berstatus TUTUP.</span> Layar TV display menampilkan status "TUTUP". Tekan "Buka" saat loket siap melayani antrean.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleCounterStatus('open')}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer shrink-0"
                  >
                    Buka Loket Sekarang
                  </button>
                </div>
              )}

              {/* Central Spotlight on Current Called Ticket */}
              <div className="my-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-7 bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl p-6 sm:p-8 text-center relative overflow-hidden shadow-lg">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">
                    Sedang Dilayani di {currentCounter?.name}
                  </span>
                  <div className="text-6xl sm:text-7xl font-black font-mono tracking-tight text-amber-400 my-2">
                    {currentServingTicket ? currentServingTicket.number : 'KOSONG'}
                  </div>
                  <div className="text-sm font-semibold text-slate-300">
                    {currentServingTicket ? currentServingTicket.serviceName : 'Belum ada antrean yang dipanggil'}
                  </div>

                  {currentServingTicket && (
                    <div className="mt-4 flex items-center justify-center gap-4 text-xs text-slate-400 border-t border-slate-800 pt-3">
                      <span>Dipanggil: {currentServingTicket.callCount}x</span>
                      <span>•</span>
                      <span>
                        Waktu Panggil:{' '}
                        {currentServingTicket.calledAt
                          ? new Date(currentServingTicket.calledAt).toLocaleTimeString('id-ID')
                          : '-'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Next In Line Preview */}
                <div className="md:col-span-5 bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col justify-between h-full">
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                      Antrean Berikutnya Siap Dipanggil:
                    </span>
                    {nextWaitingForThisCounter ? (
                      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-black font-mono text-blue-600">
                            {nextWaitingForThisCounter.number}
                          </span>
                          <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                            {nextWaitingForThisCounter.serviceName}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                          Waktu ambil:{' '}
                          {new Date(nextWaitingForThisCounter.createdAt).toLocaleTimeString('id-ID')}
                        </p>
                      </div>
                    ) : (
                      <div className="bg-white border border-slate-200 rounded-xl p-4 text-center text-slate-400 text-xs py-6">
                        Tidak ada antrean yang menunggu untuk loket ini.
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200 text-xs text-slate-600 flex justify-between">
                    <span>Sisa Menunggu di Loket Ini:</span>
                    <strong className="font-bold text-slate-900">
                      {
                        queues.filter(
                          (q) =>
                            q.status === 'waiting' &&
                            currentCounter?.supportedServiceIds.includes(q.serviceId)
                        ).length
                      }{' '}
                      orang
                    </strong>
                  </div>
                </div>
              </div>

              {/* Main Action Buttons Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {/* 1. Call Next */}
                <button
                  type="button"
                  onClick={handleCallNext}
                  disabled={!nextWaitingForThisCounter}
                  className="p-5 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white shadow-md hover:shadow-lg transition-all flex flex-col items-center justify-center gap-2 text-center cursor-pointer"
                >
                  <Megaphone className="w-7 h-7" />
                  <span className="font-black text-sm uppercase tracking-wide">
                    Panggil Berikutnya
                  </span>
                  <span className="text-[11px] opacity-90">
                    {nextWaitingForThisCounter
                      ? `Nomor ${nextWaitingForThisCounter.number}`
                      : 'Habis'}
                  </span>
                </button>

                {/* 2. Recall */}
                <button
                  type="button"
                  onClick={handleRecall}
                  disabled={!currentServingTicket}
                  className="p-5 rounded-2xl bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white shadow-md hover:shadow-lg transition-all flex flex-col items-center justify-center gap-2 text-center cursor-pointer"
                >
                  <RotateCcw className="w-7 h-7" />
                  <span className="font-black text-sm uppercase tracking-wide">
                    Panggil Ulang
                  </span>
                  <span className="text-[11px] opacity-90">Ulangi suara notifikasi</span>
                </button>

                {/* 3. Complete */}
                <button
                  type="button"
                  onClick={handleComplete}
                  disabled={!currentServingTicket}
                  className="p-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white shadow-md hover:shadow-lg transition-all flex flex-col items-center justify-center gap-2 text-center cursor-pointer"
                >
                  <CheckCircle2 className="w-7 h-7" />
                  <span className="font-black text-sm uppercase tracking-wide">
                    Selesai Melayani
                  </span>
                  <span className="text-[11px] opacity-90">Tandai transaksi rampung</span>
                </button>

                {/* 4. Skip */}
                <button
                  type="button"
                  onClick={handleSkip}
                  disabled={!currentServingTicket}
                  className="p-5 rounded-2xl bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white shadow-md hover:shadow-lg transition-all flex flex-col items-center justify-center gap-2 text-center cursor-pointer"
                >
                  <SkipForward className="w-7 h-7" />
                  <span className="font-black text-sm uppercase tracking-wide">
                    Lewati / Tidak Hadir
                  </span>
                  <span className="text-[11px] opacity-90">Pending ke daftar lewati</span>
                </button>
              </div>
            </div>

            {/* Quick overview of all lokets */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">
                Monitor Semua Loket Layanan
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {counters.map((c) => {
                  const t = queues.find((q) => q.id === c.currentTicketId);
                  const isSelected = c.id === selectedCounterId;
                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedCounterId(c.id)}
                      className={`p-4 rounded-xl border transition cursor-pointer ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">{c.name}</span>
                        <span className="text-[10px] text-slate-500">{c.operatorName}</span>
                      </div>
                      <div className="my-2">
                        <span className={`font-black tracking-tight ${
                          c.status === 'break'
                            ? 'text-amber-600 font-sans text-sm font-extrabold uppercase'
                            : c.status === 'closed'
                            ? 'text-slate-400 font-sans text-sm font-extrabold uppercase'
                            : 'text-2xl font-mono text-slate-900'
                        }`}>
                          {c.status === 'break'
                            ? 'ISTIRAHAT'
                            : c.status === 'closed'
                            ? 'TUTUP'
                            : t && t.status !== 'completed'
                            ? t.number
                            : '---'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex justify-between items-center pt-1 border-t border-slate-100">
                        <span>Status:</span>
                        <span
                          className={`font-bold text-[11px] ${
                            c.status === 'break'
                              ? 'text-amber-600'
                              : c.status === 'closed'
                              ? 'text-rose-600'
                              : t && t.status !== 'completed'
                              ? 'text-emerald-600'
                              : 'text-slate-500'
                          }`}
                        >
                          {c.status === 'break'
                            ? '🟡 Istirahat'
                            : c.status === 'closed'
                            ? '🔴 Tutup'
                            : t && t.status !== 'completed'
                            ? '🟢 Melayani'
                            : '⚪ Standby'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DAFTAR ANTREAN (QUEUE TABLE & ACTIONS) */}
        {activeTab === 'queues' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  Daftar Seluruh Nomor Antrean
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Monitor seluruh tiket, cari nomor, panggil langsung, atau cetak ulang tiket thermal.
                </p>
              </div>

              {/* Add manual ticket buttons */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-semibold">Buat Tiket Cepat:</span>
                {services.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => onAddManualTicket(s.id)}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 transition cursor-pointer"
                  >
                    + {s.prefix}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-5 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Cari nomor antrean (misal: A-002)..."
                  value={queueSearchTerm}
                  onChange={(e) => setQueueSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="sm:col-span-4 flex items-center gap-2">
                <select
                  value={queueFilterStatus}
                  onChange={(e) => setQueueFilterStatus(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Semua Status</option>
                  <option value="waiting">Menunggu</option>
                  <option value="calling">Sedang Dipanggil</option>
                  <option value="serving">Sedang Dilayani</option>
                  <option value="completed">Selesai</option>
                  <option value="skipped">Dilewati</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <select
                  value={queueFilterService}
                  onChange={(e) => setQueueFilterService(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Semua Layanan</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.prefix} - {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Queue Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-xs uppercase font-extrabold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">No. Tiket</th>
                    <th className="px-4 py-3">Layanan</th>
                    <th className="px-4 py-3">Loket Tujuan</th>
                    <th className="px-4 py-3">Waktu Ambil</th>
                    <th className="px-4 py-3">Panggilan</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredQueuesList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-400 text-xs">
                        Tidak ada antrean yang sesuai dengan kriteria filter.
                      </td>
                    </tr>
                  ) : (
                    filteredQueuesList.map((ticket) => {
                      const isWaiting = ticket.status === 'waiting';
                      const isCalling = ticket.status === 'calling';
                      const isServing = ticket.status === 'serving';

                      return (
                        <tr key={ticket.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3 font-mono font-black text-slate-900 text-base">
                            {ticket.number}
                          </td>
                          <td className="px-4 py-3 text-xs font-semibold">{ticket.serviceName}</td>
                          <td className="px-4 py-3 text-xs">
                            {ticket.counterName || (
                              <span className="text-slate-400 italic">Belum ditentukan</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500">
                            {new Date(ticket.createdAt).toLocaleTimeString('id-ID')}
                          </td>
                          <td className="px-4 py-3 text-xs font-bold text-center">
                            {ticket.callCount}x
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                                ticket.status === 'completed'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : ticket.status === 'calling'
                                  ? 'bg-amber-100 text-amber-800 animate-pulse'
                                  : ticket.status === 'serving'
                                  ? 'bg-blue-100 text-blue-800'
                                  : ticket.status === 'skipped'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {ticket.status === 'waiting'
                                ? 'Menunggu'
                                : ticket.status === 'calling'
                                ? 'Dipanggil'
                                : ticket.status === 'serving'
                                ? 'Dilayani'
                                : ticket.status === 'completed'
                                ? 'Selesai'
                                : 'Dilewati'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Direct call button */}
                              {isWaiting && currentCounter && (
                                <button
                                  type="button"
                                  onClick={() => onCallTicket(ticket, currentCounter)}
                                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                                  title="Panggil Sekarang di Loket Ini"
                                >
                                  Panggil
                                </button>
                              )}

                              {/* Print Ticket */}
                              <button
                                type="button"
                                onClick={() => setTicketToPrint(ticket)}
                                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                                title="Cetak Ulang Struk Thermal"
                              >
                                <Printer className="w-4 h-4" />
                              </button>

                              {/* Complete */}
                              {(isCalling || isServing) && (
                                <button
                                  type="button"
                                  onClick={() => onCompleteTicket(ticket)}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                                  title="Selesaikan Tiket"
                                >
                                  Selesai
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: PENGATURAN SISTEM (SETTINGS) */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  Pengaturan Sistem Antrean
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Konfigurasi suara notifikasi panggilan, media display & running text, data loket, dan profil kantor.
                </p>
              </div>

              {/* Reset Queues Button */}
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 text-rose-600" />
                <span>Reset Antrean Harian</span>
              </button>
            </div>

            {/* Sub-nav (Touch-friendly and smoothly scrollable on mobile/tablet) */}
            <div className="flex border-b border-slate-200 text-xs font-bold overflow-x-auto scrollbar-none whitespace-nowrap gap-1 pb-0.5">
              <button
                type="button"
                onClick={() => setSettingsTab('audio')}
                className={`pb-2.5 px-4 border-b-2 transition cursor-pointer ${
                  settingsTab === 'audio'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Suara Panggilan & Bell
              </button>
              <button
                type="button"
                onClick={() => setSettingsTab('media')}
                className={`pb-2.5 px-4 border-b-2 transition cursor-pointer ${
                  settingsTab === 'media'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Media TV & Running Text
              </button>
              <button
                type="button"
                onClick={() => setSettingsTab('counters')}
                className={`pb-2.5 px-4 border-b-2 transition cursor-pointer ${
                  settingsTab === 'counters'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Daftar Loket & Layanan
              </button>
              <button
                type="button"
                onClick={() => setSettingsTab('company')}
                className={`pb-2.5 px-4 border-b-2 transition cursor-pointer ${
                  settingsTab === 'company'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Profil Instansi & Struk
              </button>
              <button
                type="button"
                onClick={() => setSettingsTab('security')}
                className={`pb-2.5 px-4 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                  settingsTab === 'security'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Keamanan & Password</span>
              </button>
              <button
                type="button"
                onClick={() => setSettingsTab('lan')}
                className={`pb-2.5 px-4 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                  settingsTab === 'lan'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Server className="w-3.5 h-3.5" />
                <span>Jaringan Server & LAN</span>
              </button>
            </div>

            {/* 1. AUDIO SETTINGS */}
            {settingsTab === 'audio' && (
              <div className="space-y-6 max-w-3xl">
                <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Aktifkan Suara Panggilan</h4>
                    <p className="text-xs text-slate-500">
                      Memutar nada dering bel dan suara panggilan otomatis saat memanggil nomor antrean.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={audioSettings.enabled}
                    onChange={(e) => onUpdateAudio({ ...audioSettings, enabled: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded cursor-pointer"
                  />
                </div>

                {/* Speechify AI TTS Integration Card */}
                <div className="p-4 sm:p-5 bg-gradient-to-br from-emerald-50/80 to-teal-50/50 border border-emerald-200/80 rounded-2xl space-y-3 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-black text-sm text-slate-900">
                          Integrasi Speechify AI TTS
                        </span>
                        <span className="ml-2 text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                          Narasi Cepat & Jernih
                        </span>
                      </div>
                    </div>

                    {audioSettings.speechifyApiKey?.trim() && (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/90 border border-emerald-300 px-2.5 py-1 rounded-full flex items-center gap-1.5 self-start sm:self-auto">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>API Key Speechify Aktif</span>
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Sistem menggunakan suara narator AI Speechify berkualitas tinggi dengan latensi rendah (<code className="font-mono bg-white px-1 py-0.5 rounded text-[11px] text-emerald-700">Gita, Alfonso, Kristy</code>).
                  </p>

                  <div className="space-y-2 pt-1">
                    <label className="block text-xs font-bold uppercase text-slate-700 tracking-wider">
                      Speechify API Key:
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1">
                        <input
                          type={showSpeechifyKeyText ? 'text' : 'password'}
                          placeholder="sk_..."
                          value={audioSettings.speechifyApiKey || ''}
                          onChange={(e) => {
                            onUpdateAudio({ ...audioSettings, speechifyApiKey: e.target.value });
                            setSpeechifyFeedback(null);
                          }}
                          className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-10 shadow-2xs"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSpeechifyKeyText(!showSpeechifyKeyText)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                          title={showSpeechifyKeyText ? 'Sembunyikan' : 'Tampilkan'}
                        >
                          {showSpeechifyKeyText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={handleVerifySpeechifyKey}
                        disabled={checkingSpeechifyKey || !audioSettings.speechifyApiKey?.trim()}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
                      >
                        {checkingSpeechifyKey ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Memverifikasi...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Tes & Verifikasi Speechify</span>
                          </>
                        )}
                      </button>
                    </div>

                    {speechifyFeedback && (
                      <div
                        className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                          speechifyFeedback.success
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                            : 'bg-rose-50 text-rose-800 border border-rose-300'
                        }`}
                      >
                        {speechifyFeedback.success ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        )}
                        <span>{speechifyFeedback.message}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* ElevenLabs API Key Setup & Live Verification */}
                <div className="p-4 sm:p-5 bg-gradient-to-br from-indigo-50/80 to-blue-50/50 border border-indigo-200/80 rounded-2xl space-y-3 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-black text-sm text-slate-900">
                          Integrasi ElevenLabs AI TTS
                        </span>
                        <span className="ml-2 text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full border border-indigo-200">
                          Suara Alami AI
                        </span>
                      </div>
                    </div>

                    {audioSettings.elevenLabsApiKey?.trim() && (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/90 border border-emerald-300 px-2.5 py-1 rounded-full flex items-center gap-1.5 self-start sm:self-auto">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>API Key Aktif</span>
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Sistem menggunakan suara manusia realistis dari layanan ElevenLabs dengan model multi-bahasa Indonesia (<code className="font-mono bg-white px-1 py-0.5 rounded text-[11px] text-indigo-600">eleven_multilingual_v2</code>).
                  </p>

                  <div className="space-y-2 pt-1">
                    <label className="block text-xs font-bold uppercase text-slate-700 tracking-wider">
                      ElevenLabs API Key:
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1">
                        <input
                          type={showApiKeyText ? 'text' : 'password'}
                          placeholder="sk_..."
                          value={audioSettings.elevenLabsApiKey || ''}
                          onChange={(e) => {
                            onUpdateAudio({ ...audioSettings, elevenLabsApiKey: e.target.value });
                            setApiKeyFeedback(null);
                          }}
                          className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10 shadow-2xs"
                        />
                        <button
                          type="button"
                          onClick={() => setShowApiKeyText(!showApiKeyText)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                          title={showApiKeyText ? 'Sembunyikan' : 'Tampilkan'}
                        >
                          {showApiKeyText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={handleVerifyApiKey}
                        disabled={checkingApiKey || !audioSettings.elevenLabsApiKey?.trim()}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
                      >
                        {checkingApiKey ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Memverifikasi...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Tes & Verifikasi API Key</span>
                          </>
                        )}
                      </button>
                    </div>

                    {apiKeyFeedback && (
                      <div
                        className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                          apiKeyFeedback.success
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                            : 'bg-rose-50 text-rose-800 border border-rose-300'
                        }`}
                      >
                        {apiKeyFeedback.success ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        )}
                        <span>{apiKeyFeedback.message}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Multiple Narrator Persona Choices */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-700 tracking-wider">
                        Pilihan Suara Narator Panggilan
                      </label>
                      <p className="text-xs text-slate-500">
                        Pilih karakter suara penyiar AI favorit. Klik tombol &ldquo;Tes Suara&rdquo; untuk mendengarkan langsung.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                    {VOICE_PERSONAS.map((persona) => {
                      const isSelected = (audioSettings.voicePersona || 'bella_elevenlabs') === persona.id;
                      const isTesting = testingVoiceId === persona.id;

                      return (
                        <div
                          key={persona.id}
                          onClick={() => onUpdateAudio({ ...audioSettings, voicePersona: persona.id })}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'bg-blue-50/70 border-blue-600 ring-2 ring-blue-500/20 shadow-xs'
                              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="font-black text-sm text-slate-900 flex items-center gap-1.5">
                                {persona.name}
                                {isSelected && (
                                  <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
                                )}
                              </span>
                              <span
                                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                                  persona.provider.includes('ElevenLabs')
                                    ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                    : persona.provider.includes('Speechify')
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {persona.provider.includes('ElevenLabs') && (
                                  <Sparkles className="w-2.5 h-2.5 text-indigo-600" />
                                )}
                                {persona.provider}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 line-clamp-2">
                              {persona.description}
                            </p>
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-slate-500 capitalize">
                              Tipe: {persona.gender === 'female' ? 'Wanita' : 'Pria'}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePlayVoiceSample(persona);
                              }}
                              disabled={isTesting}
                              className={`px-3 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                                isTesting
                                  ? 'bg-blue-600 text-white animate-pulse'
                                  : isSelected
                                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                  : 'bg-white border border-slate-300 hover:border-blue-500 hover:text-blue-600 text-slate-700'
                              }`}
                              title="Dengarkan Contoh Suara Ini"
                            >
                              <Volume2 className={`w-3.5 h-3.5 ${isTesting ? 'animate-bounce' : ''}`} />
                              <span>{isTesting ? 'Memutar...' : 'Tes Suara'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bell Type Selector */}
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                    Pilihan Tipe Nada Dering Bel (Chime)
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['dingdong', 'airport', 'chime'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          onUpdateAudio({ ...audioSettings, bellType: type });
                          playBellSound(type, audioSettings.chimeVolume);
                        }}
                        className={`p-3 rounded-xl border text-center font-bold text-xs capitalize transition cursor-pointer ${
                          audioSettings.bellType === type
                            ? 'bg-blue-50 border-blue-600 text-blue-700 ring-2 ring-blue-500/20'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {type === 'dingdong'
                          ? 'Ding-Dong 2-Nada'
                          : type === 'airport'
                          ? 'Airport 3-Nada'
                          : 'High Chime'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sliders for Volume & Speed */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                      Volume Bel: {Math.round((typeof audioSettings?.chimeVolume === 'number' ? audioSettings.chimeVolume : 0.9) * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.05"
                      value={typeof audioSettings?.chimeVolume === 'number' ? audioSettings.chimeVolume : 0.9}
                      onChange={(e) =>
                        onUpdateAudio({ ...audioSettings, chimeVolume: parseFloat(e.target.value) })
                      }
                      className="w-full cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                      Volume Narator: {Math.round((typeof audioSettings?.voiceVolume === 'number' ? audioSettings.voiceVolume : 1.0) * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.05"
                      value={typeof audioSettings?.voiceVolume === 'number' ? audioSettings.voiceVolume : 1.0}
                      onChange={(e) =>
                        onUpdateAudio({ ...audioSettings, voiceVolume: parseFloat(e.target.value) })
                      }
                      className="w-full cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                      Kecepatan Narator: {Math.round((typeof audioSettings?.voiceRate === 'number' ? audioSettings.voiceRate : 0.95) * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0.7"
                      max="1.3"
                      step="0.05"
                      value={typeof audioSettings?.voiceRate === 'number' ? audioSettings.voiceRate : 0.95}
                      onChange={(e) =>
                        onUpdateAudio({ ...audioSettings, voiceRate: parseFloat(e.target.value) })
                      }
                      className="w-full cursor-pointer"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleTestAudio}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>Uji Panggilan Penuh (Bel + Narator Pilihan)</span>
                  </button>
                </div>
              </div>
            )}

            {/* 2. MEDIA & RUNNING TEXT SETTINGS */}
            {settingsTab === 'media' && (
              <div className="space-y-6 max-w-3xl">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                    Mode Pemutar di Layar TV Display
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="mediaType"
                        value="slideshow"
                        checked={media.type === 'slideshow'}
                        onChange={() => onUpdateMedia({ ...media, type: 'slideshow' })}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span>Slide Foto Galeri / Pengumuman Layanan</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="mediaType"
                        value="video"
                        checked={media.type === 'video'}
                        onChange={() => onUpdateMedia({ ...media, type: 'video' })}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span>Pemutar Video Promosi / Edukasi</span>
                    </label>
                  </div>
                </div>

                {/* Slideshow Manager with Local Upload */}
                {media.type === 'slideshow' && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                          <ImageIcon className="w-4 h-4 text-blue-600" />
                          <span>Daftar Slide Foto Galeri ({(Array.isArray(media?.slides) ? media.slides : []).length})</span>
                        </h4>
                        <p className="text-xs text-slate-500">
                          Unggah foto lokal dari komputer server atau gunakan foto yang sudah ada.
                        </p>
                      </div>

                      <label className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs self-start sm:self-auto">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Unggah Foto Lokal dari PC</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleUploadSlidePhotos}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                      {(Array.isArray(media?.slides) ? media.slides : []).map((slide) => (
                        <div
                          key={slide.id}
                          className="p-3 bg-white border border-slate-200 rounded-xl flex items-center gap-3 relative group"
                        >
                          <img
                            src={slide.url}
                            alt={slide.title}
                            className="w-16 h-12 object-cover rounded-lg bg-slate-100 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <span className="font-bold text-xs text-slate-800 truncate block">
                              {slide.title}
                            </span>
                            <span className="text-[10px] text-slate-400 truncate block">
                              {slide.fileName ? `📁 ${slide.fileName}` : slide.caption}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteSlide(slide.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Hapus Slide Ini"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-slate-200">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold uppercase text-slate-600">
                          Durasi Tiap Slide Foto:
                        </span>
                        <span className="font-bold text-blue-600">
                          {media.slideDurationSec || 6} Detik
                        </span>
                      </div>
                      <input
                        type="range"
                        min="3"
                        max="20"
                        step="1"
                        value={media.slideDurationSec || 6}
                        onChange={(e) =>
                          onUpdateMedia({
                            ...media,
                            slideDurationSec: parseInt(e.target.value, 10),
                          })
                        }
                        className="w-full cursor-pointer mt-1"
                      />
                    </div>
                  </div>
                )}

                {/* Video Player Manager with Local & Online Choice */}
                {media.type === 'video' && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                        <Film className="w-4 h-4 text-blue-600" />
                        <span>Sumber Video Promosi / Edukasi</span>
                      </h4>
                      <p className="text-xs text-slate-500">
                        Pilih apakah video dimuat dari file lokal PC Server atau dari link URL online.
                      </p>
                    </div>

                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name="videoSource"
                          value="local"
                          checked={media.videoSource === 'local'}
                          onChange={() => onUpdateMedia({ ...media, videoSource: 'local' })}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span>File Video Lokal dari PC Server (Offline)</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name="videoSource"
                          value="preset"
                          checked={media.videoSource !== 'local'}
                          onChange={() => onUpdateMedia({ ...media, videoSource: 'preset' })}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span>Link URL Video (Online MP4)</span>
                      </label>
                    </div>

                    {media.videoSource === 'local' ? (
                      <div className="space-y-3 pt-2">
                        <label className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-2 cursor-pointer shadow-xs">
                          <Upload className="w-4 h-4" />
                          <span>Pilih File Video MP4/WebM dari Komputer</span>
                          <input
                            type="file"
                            accept="video/mp4,video/webm"
                            onChange={handleUploadLocalVideo}
                            className="hidden"
                          />
                        </label>
                        <p className="text-[11px] text-slate-400">
                          Video akan dimuat langsung dari storage komputer lokal server dan diputar tanpa koneksi internet.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1 pt-1">
                        <label className="block text-xs font-bold uppercase text-slate-600">
                          URL Video (MP4 / WebM):
                        </label>
                        <input
                          type="text"
                          value={media.videoUrl}
                          onChange={(e) => onUpdateMedia({ ...media, videoUrl: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}

                    {media.videoUrl && (
                      <div className="mt-2 pt-2 border-t border-slate-200">
                        <span className="text-xs font-bold text-slate-700 block mb-1">
                          Pratinjau Video Aktif:
                        </span>
                        <video
                          src={media.videoUrl}
                          controls
                          className="w-full max-h-48 rounded-xl bg-black"
                        />
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Teks Berjalan Pengumuman (Running Text Marquee):
                  </label>
                  <textarea
                    rows={3}
                    value={media.runningText}
                    onChange={(e) => onUpdateMedia({ ...media, runningText: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Teks ini akan berjalan di bagian bawah layar display TV secara terus-menerus.
                  </p>
                </div>

                {/* FITUR PENGATUR KECEPATAN TEKS BERJALAN PENGUMUMAN */}
                <div className="p-4 sm:p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                        <Gauge className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">
                          Pengatur Kecepatan Teks Berjalan Pengumuman
                        </h4>
                        <p className="text-xs text-slate-500">
                          Atur seberapa cepat atau santai teks pengumuman bergerak di layar TV Display.
                        </p>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 bg-blue-100 text-blue-800 text-xs font-mono font-bold rounded-lg border border-blue-200">
                      {media.runningTextSpeedSec || 32} detik / putaran
                    </span>
                  </div>

                  {/* Preset Speed Buttons */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 mb-2">
                      Pilihan Cepat Kecepatan:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {[
                        { label: 'Sangat Cepat', sec: 15, desc: '15 dtk' },
                        { label: 'Cepat', sec: 22, desc: '22 dtk' },
                        { label: 'Normal / Sedang', sec: 32, desc: '32 dtk' },
                        { label: 'Lambat', sec: 45, desc: '45 dtk' },
                        { label: 'Sangat Lambat', sec: 60, desc: '60 dtk' },
                      ].map((preset) => {
                        const isCurrent = (media.runningTextSpeedSec || 32) === preset.sec;
                        return (
                          <button
                            key={preset.sec}
                            type="button"
                            onClick={() => onUpdateMedia({ ...media, runningTextSpeedSec: preset.sec })}
                            className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center ${
                              isCurrent
                                ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                                : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span className="font-bold text-xs">{preset.label}</span>
                            <span className={`text-[10px] ${isCurrent ? 'text-blue-100' : 'text-slate-400'}`}>
                              ({preset.desc})
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Range Slider for Granular Speed */}
                  <div className="pt-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[11px] font-bold uppercase text-slate-500">
                        Penyesuaian Halus (10 - 80 detik):
                      </span>
                      <span className="text-xs font-semibold text-slate-600">
                        {media.runningTextSpeedSec || 32}s (makin kecil = makin cepat)
                      </span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="80"
                      step="2"
                      value={media.runningTextSpeedSec || 32}
                      onChange={(e) =>
                        onUpdateMedia({
                          ...media,
                          runningTextSpeedSec: parseInt(e.target.value, 10),
                        })
                      }
                      className="w-full cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-medium mt-1">
                      <span>⚡ 10 detik (Sangat Kencang)</span>
                      <span>32 detik (Ideal)</span>
                      <span>🐢 80 detik (Sangat Lambat)</span>
                    </div>
                  </div>

                  {/* Real-Time Live Preview Marquee */}
                  <div className="pt-2">
                    <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1.5">
                      Pratinjau Kecepatan & Format Teks Berjalan:
                    </label>
                    <div className="bg-gradient-to-r from-blue-950 via-slate-950 to-blue-950 text-white rounded-xl py-2.5 px-3 flex items-center overflow-hidden border border-blue-800 shadow-inner">
                      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-lg mr-3 shrink-0 flex items-center gap-1 shadow-sm">
                        <Radio className="w-3 h-3 text-amber-300 animate-pulse" />
                        <span>LIVE TV</span>
                      </div>
                      <div className="overflow-hidden whitespace-nowrap flex-1 relative flex items-center">
                        <div
                          className="animate-marquee-continuous flex whitespace-nowrap will-change-transform"
                          style={{
                            animationDuration: `${calculateMarqueeDuration(
                              formatContinuousMarqueeContent(media.runningText, 80).length,
                              media.runningTextSpeedSec || 32
                            )}s`,
                          }}
                        >
                          <div className="flex items-center shrink-0 pr-6">
                            <span className="font-extrabold text-sm sm:text-base text-amber-200 tracking-wide">
                              {formatContinuousMarqueeContent(media.runningText, 80)}
                            </span>
                            <span className="mx-4 text-amber-400 font-bold select-none">★</span>
                          </div>
                          <div className="flex items-center shrink-0 pr-6" aria-hidden="true">
                            <span className="font-extrabold text-sm sm:text-base text-amber-200 tracking-wide">
                              {formatContinuousMarqueeContent(media.runningText, 80)}
                            </span>
                            <span className="mx-4 text-amber-400 font-bold select-none">★</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. COUNTERS & SERVICES SETTINGS */}
            {settingsTab === 'counters' && (
              <CounterServiceManager
                counters={counters}
                services={services}
                onUpdateCounters={onUpdateCounters}
                onUpdateServices={onUpdateServices}
              />
            )}

            {/* 4. COMPANY PROFILE & PRINTER */}
            {settingsTab === 'company' && (
              <div className="space-y-4 max-w-xl">
                {/* Logo Instansi Setting */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 tracking-wider">
                      Logo Instansi & Struk Antrean:
                    </label>
                    <p className="text-xs text-slate-500">
                      Ganti ikon gedung standar dengan logo resmi instansi Anda. Logo akan ditampilkan di Layar Display TV dan dicetak pada tiket thermal.
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    {company.logoUrl ? (
                      <div className="w-16 h-16 rounded-xl bg-white border border-slate-300 p-1 flex items-center justify-center shadow-xs overflow-hidden shrink-0">
                        <img
                          src={company.logoUrl}
                          alt="Logo"
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-xs shrink-0">
                        <Building className="w-8 h-8" />
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer shadow-xs">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Pilih File Logo (PNG / JPG)</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleUploadLogo}
                          className="hidden"
                        />
                      </label>

                      {company.logoUrl && (
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="block text-xs font-bold text-rose-600 hover:text-rose-800 transition cursor-pointer"
                        >
                          Hapus Logo (Gunakan Ikon Bawaan)
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Zona Waktu (Timezone) Selection */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <label className="block text-xs font-bold uppercase text-slate-700 tracking-wider">
                    Zona Waktu Wilayah Operasional:
                  </label>
                  <p className="text-xs text-slate-500">
                    Menyesuaikan jam operasional pada Layar Display TV dan stempel waktu cetak tiket.
                  </p>
                  <select
                    value={company.timezone || 'WIB'}
                    onChange={(e) =>
                      onUpdateCompany({ ...company, timezone: e.target.value as TimezoneCode })
                    }
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="WIB">WIB — Waktu Indonesia Barat (UTC+7, Jakarta, Jawa, Sumatera)</option>
                    <option value="WITA">WITA — Waktu Indonesia Tengah (UTC+8, Bali, Makassar, Kalimantan, NTB, NTT)</option>
                    <option value="WIT">WIT — Waktu Indonesia Timur (UTC+9, Maluku, Jayapura, Papua)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Nama Kantor / Instansi:
                  </label>
                  <input
                    type="text"
                    value={company?.name || ''}
                    onChange={(e) => onUpdateCompany({ ...company, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Slogan / Tagline:
                  </label>
                  <input
                    type="text"
                    value={company?.tagline || ''}
                    onChange={(e) => onUpdateCompany({ ...company, tagline: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Alamat Lengkap (Kop Struk Thermal):
                  </label>
                  <input
                    type="text"
                    value={company?.address || ''}
                    onChange={(e) => onUpdateCompany({ ...company, address: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Kontak / Telepon:
                  </label>
                  <input
                    type="text"
                    value={company?.phone || ''}
                    onChange={(e) => onUpdateCompany({ ...company, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Pesan Penutup Struk:
                  </label>
                  <input
                    type="text"
                    value={company?.footerNote || ''}
                    onChange={(e) => onUpdateCompany({ ...company, footerNote: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {/* 5. SECURITY & CHANGE PASSWORD */}
            {settingsTab === 'security' && <ChangePasswordSection />}

            {/* 6. LAN & SERVER SETTINGS */}
            {settingsTab === 'lan' && (
              <form onSubmit={handleSaveLanSettings} className="space-y-6 max-w-2xl">
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Pengaturan Server & Jaringan Lokal (LAN)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Konfigurasi IP PC Server, kata sandi akses LAN, dan status berbagi untuk Kios Tiket, Meja Penjaga, dan Layar TV Display.
                  </p>
                </div>

                {lanSavedMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{lanSavedMsg}</span>
                  </div>
                )}

                {/* Sharing Toggle */}
                <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <Wifi className="w-4 h-4 text-emerald-600" />
                      <span>Aktifkan Bagikan Jaringan Lokal (LAN)</span>
                    </h4>
                    <p className="text-xs text-slate-500">
                      Mengizinkan perangkat lain di jaringan WiFi/LAN yang sama mengakses antrean.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={lanSettings.shareActive}
                    onChange={(e) =>
                      setLanSettings({ ...lanSettings, shareActive: e.target.checked })
                    }
                    className="w-5 h-5 text-blue-600 rounded cursor-pointer"
                  />
                </div>

                {/* IP PC Server */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold uppercase text-slate-700 tracking-wider">
                      Alamat IP PC Server:
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const host = typeof window !== 'undefined' ? window.location.hostname : '192.168.1.100';
                        setLanSettings({ ...lanSettings, serverIp: host });
                      }}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                    >
                      Gunakan Host Saat Ini
                    </button>
                  </div>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      value={lanSettings.serverIp}
                      onChange={(e) =>
                        setLanSettings({ ...lanSettings, serverIp: e.target.value })
                      }
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="192.168.1.100"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Alamat IPv4 komputer ini di jaringan lokal (dilihat lewat cmd: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">ipconfig</code>).
                  </span>
                </div>

                {/* Port */}
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 tracking-wider mb-1">
                    Port Server:
                  </label>
                  <input
                    type="number"
                    value={lanSettings.port || 3000}
                    onChange={(e) =>
                      setLanSettings({ ...lanSettings, port: parseInt(e.target.value, 10) || 3000 })
                    }
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* LAN Password */}
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 tracking-wider mb-1">
                    Password Akses LAN (Koneksi Penjaga & Display):
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type={showLanPassword ? 'text' : 'password'}
                      required
                      value={lanSettings.lanPassword}
                      onChange={(e) =>
                        setLanSettings({ ...lanSettings, lanPassword: e.target.value })
                      }
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="lan123"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLanPassword(!showLanPassword)}
                      className="p-1 text-slate-400 hover:text-slate-600 absolute right-3 top-2.5 cursor-pointer"
                    >
                      {showLanPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Password ini digunakan penjaga loket dan display saat menghubungkan perangkat client ke server ini.
                  </span>
                </div>

                {/* Quick Connection Links for Clients */}
                <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-2">
                  <span className="font-bold text-xs text-blue-900 block">
                    Tautan Akses untuk Perangkat Lain di Jaringan:
                  </span>
                  <div className="space-y-1.5 font-mono text-[11px]">
                    <div className="p-2 bg-white rounded-lg border border-blue-200 flex items-center justify-between">
                      <span className="text-slate-600">
                        📺 Display TV: <strong className="text-blue-700">http://{lanSettings.serverIp || 'localhost'}:{lanSettings.port || 3000}/?view=display</strong>
                      </span>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-blue-200 flex items-center justify-between">
                      <span className="text-slate-600">
                        🎫 Kios Tiket: <strong className="text-emerald-700">http://{lanSettings.serverIp || 'localhost'}:{lanSettings.port || 3000}/?view=kiosk</strong>
                      </span>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-blue-200 flex items-center justify-between">
                      <span className="text-slate-600">
                        🧑‍💼 Meja Penjaga: <strong className="text-amber-700">http://{lanSettings.serverIp || 'localhost'}:{lanSettings.port || 3000}/?view=penjaga</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-sm flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Pengaturan Jaringan LAN</span>
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Manual Call Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-black text-slate-900 mb-1">Panggil Nomor Manual</h3>
            <p className="text-xs text-slate-500 mb-4">
              Ketikkan nomor tiket yang ingin dipanggil langsung ke {currentCounter?.name}.
            </p>

            <input
              type="text"
              placeholder="Contoh: A-005"
              value={manualCallInput}
              onChange={(e) => setManualCallInput(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xl font-bold uppercase tracking-wider text-center focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (manualCallInput.trim() && currentCounter) {
                    onManualCall(manualCallInput.trim(), currentCounter);
                    setShowManualModal(false);
                    setManualCallInput('');
                  }
                }}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Panggil Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Thermal Ticket Reprint Modal */}
      {ticketToPrint && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-200">
              <h3 className="font-bold text-sm text-slate-900">Cetak Ulang Tiket Thermal</h3>
              <button
                type="button"
                onClick={() => setTicketToPrint(null)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                Tutup
              </button>
            </div>

            <ThermalTicket
              ticket={ticketToPrint}
              company={company}
              waitingAhead={0}
              estimatedMinutes={5}
              onClose={() => setTicketToPrint(null)}
              showPrintButton={true}
            />
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-1">Reset Antrean Hari Ini?</h3>
            <p className="text-xs text-slate-500 mb-6">
              Tindakan ini akan mengosongkan nomor antrean yang sedang aktif dan memulai nomor dari awal kembali (001).
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onResetQueues();
                  setShowResetConfirm(false);
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Ya, Reset Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
