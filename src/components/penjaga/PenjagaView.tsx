import React, { useState } from 'react';
import {
  QueueItem,
  Counter,
  ServiceCategory,
  AudioSettings,
  CompanyProfile,
  QueueStatus,
} from '../../types/queue';
import {
  getNextWaitingTicketForCounter,
  filterQueues,
} from '../../utils/queueLogic';
import { ThermalTicket } from '../kiosk/ThermalTicket';
import {
  Megaphone,
  RotateCcw,
  CheckCircle2,
  SkipForward,
  PhoneCall,
  Users,
  Wifi,
  Printer,
  Volume2,
  LogOut,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Search,
  AlertTriangle,
} from 'lucide-react';

interface PenjagaViewProps {
  queues: QueueItem[];
  counters: Counter[];
  services: ServiceCategory[];
  audioSettings: AudioSettings;
  company: CompanyProfile;
  activeTicket: QueueItem | null;
  currentCounterId?: string;
  penjagaName?: string;
  onCallTicket: (ticket: QueueItem, counter: Counter) => void;
  onRecallTicket: (ticket: QueueItem, counter: Counter) => void;
  onCompleteTicket: (ticket: QueueItem) => void;
  onSkipTicket: (ticket: QueueItem) => void;
  onManualCall: (ticketNumber: string, counter: Counter) => void;
  onUpdateCounters: (counters: Counter[]) => void;
  onLogout: () => void;
  onNavigateDisplay: () => void;
}

export const PenjagaView: React.FC<PenjagaViewProps> = ({
  queues,
  counters,
  services,
  audioSettings,
  company,
  activeTicket,
  currentCounterId,
  penjagaName,
  onCallTicket,
  onRecallTicket,
  onCompleteTicket,
  onSkipTicket,
  onManualCall,
  onUpdateCounters,
  onLogout,
  onNavigateDisplay,
}) => {
  const [selectedCounterId, setSelectedCounterId] = useState<string>(
    currentCounterId || counters[0]?.id || 'loket-1'
  );
  const [ticketToPrint, setTicketToPrint] = useState<QueueItem | null>(null);
  const [showManualModal, setShowManualModal] = useState<boolean>(false);
  const [manualCallInput, setManualCallInput] = useState<string>('');
  const [queueSearchTerm, setQueueSearchTerm] = useState<string>('');

  const [activeQueueTab, setActiveQueueTab] = useState<'waiting' | 'skipped'>('waiting');

  const currentCounter =
    counters.find((c) => c.id === selectedCounterId) || counters[0];

  const currentServingTicket = queues.find(
    (q) =>
      q.id === currentCounter?.currentTicketId &&
      (q.status === 'calling' || q.status === 'serving')
  );

  const nextWaitingForThisCounter = currentCounter
    ? getNextWaitingTicketForCounter(currentCounter, queues)
    : null;

  // Waiting queues matching this counter's supported services
  const waitingTicketsForCounter = queues.filter(
    (q) =>
      q.status === 'waiting' &&
      currentCounter?.supportedServiceIds.includes(q.serviceId) &&
      (queueSearchTerm
        ? q.number.toLowerCase().includes(queueSearchTerm.toLowerCase()) ||
          q.serviceName.toLowerCase().includes(queueSearchTerm.toLowerCase())
        : true)
  );

  // Skipped queues matching this counter's supported services
  const skippedTicketsForCounter = queues.filter(
    (q) =>
      q.status === 'skipped' &&
      currentCounter?.supportedServiceIds.includes(q.serviceId) &&
      (queueSearchTerm
        ? q.number.toLowerCase().includes(queueSearchTerm.toLowerCase()) ||
          q.serviceName.toLowerCase().includes(queueSearchTerm.toLowerCase())
        : true)
  );

  const completedTicketsToday = queues.filter(
    (q) => q.counterId === currentCounter?.id && q.status === 'completed'
  );

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
      alert(`Tidak ada antrean yang sedang menunggu untuk ${currentCounter.name}`);
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

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCallInput.trim() || !currentCounter) return;
    onManualCall(manualCallInput.trim().toUpperCase(), currentCounter);
    setManualCallInput('');
    setShowManualModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 pb-16">
      {/* Header bar khusus Penjaga Loket */}
      <div className="bg-white border-b border-slate-200 shadow-xs px-4 sm:px-8 py-3.5 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                  Meja Operator Penjaga Loket
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Wifi className="w-2.5 h-2.5 text-emerald-600 animate-pulse" />
                  Jaringan Lokal (LAN)
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {company.name} • {penjagaName || currentCounter?.operatorName || 'Petugas Loket'}
              </p>
            </div>
          </div>

          {/* Quick Counter Selector & Status */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-xl p-1.5 px-3">
              <span className="text-xs font-bold text-slate-600 uppercase shrink-0">Loket:</span>
              <select
                value={selectedCounterId}
                onChange={(e) => setSelectedCounterId(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                {counters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.operatorName}
                  </option>
                ))}
              </select>
            </div>

            {/* Counter Status Buttons */}
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

            {/* Logout Penjaga */}
            <button
              type="button"
              onClick={onLogout}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-300 transition text-xs font-bold flex items-center gap-1.5 cursor-pointer ml-auto sm:ml-0"
              title="Keluar dari Meja Penjaga"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-6 space-y-6">
        {/* Status banner */}
        <div className={`rounded-3xl p-6 text-white shadow-md relative overflow-hidden transition-all duration-300 ${
          currentCounter?.status === 'break'
            ? 'bg-gradient-to-r from-amber-600 via-amber-700 to-orange-800'
            : currentCounter?.status === 'closed'
            ? 'bg-gradient-to-r from-slate-800 via-slate-900 to-rose-950'
            : 'bg-gradient-to-r from-emerald-600 to-teal-700'
        }`}>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full backdrop-blur-md ${
                currentCounter?.status === 'break'
                  ? 'bg-amber-950/60 text-amber-200 border border-amber-400/40'
                  : currentCounter?.status === 'closed'
                  ? 'bg-rose-950/60 text-rose-200 border border-rose-400/40'
                  : 'bg-white/20 text-emerald-100'
              }`}>
                {currentCounter?.status === 'break'
                  ? '🟡 Loket Sedang Istirahat'
                  : currentCounter?.status === 'closed'
                  ? '🔴 Loket Sedang Tutup'
                  : '🟢 Meja Kerja Aktif'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight">
                {currentCounter?.name} — {currentCounter?.operatorName}
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-white/90 font-medium">
                <span>Layanan yang Dilayani:</span>
                {currentCounter?.supportedServiceIds.map((srvId) => {
                  const s = services.find((serv) => serv.id === srvId);
                  return s ? (
                    <span
                      key={s.id}
                      className="bg-white/25 px-2 py-0.5 rounded-md font-bold text-white text-[11px]"
                    >
                      [{s.prefix}] {s.name}
                    </span>
                  ) : null;
                })}
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/20 self-start md:self-auto">
              <button
                type="button"
                onClick={() => setActiveQueueTab('waiting')}
                className="text-center px-2 hover:bg-white/10 rounded-lg transition cursor-pointer"
              >
                <span className="text-[10px] uppercase font-bold text-emerald-200 block">
                  Menunggu
                </span>
                <span className="text-2xl font-black font-mono">
                  {waitingTicketsForCounter.length}
                </span>
              </button>
              <div className="w-px h-8 bg-white/20" />
              <button
                type="button"
                onClick={() => setActiveQueueTab('skipped')}
                className="text-center px-2 hover:bg-white/10 rounded-lg transition cursor-pointer"
              >
                <span className="text-[10px] uppercase font-bold text-amber-200 block">
                  Dilewati
                </span>
                <span className={`text-2xl font-black font-mono ${skippedTicketsForCounter.length > 0 ? 'text-amber-300 font-extrabold' : 'text-white'}`}>
                  {skippedTicketsForCounter.length}
                </span>
              </button>
              <div className="w-px h-8 bg-white/20" />
              <div className="text-center px-2">
                <span className="text-[10px] uppercase font-bold text-emerald-200 block">
                  Selesai
                </span>
                <span className="text-2xl font-black font-mono">
                  {completedTicketsToday.length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Status Warning Banners */}
        {currentCounter?.status === 'break' && (
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900 shadow-xs">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-600 shrink-0" />
              <p className="text-xs sm:text-sm font-medium">
                <span className="font-bold">Loket sedang ISTIRAHAT.</span> Layar TV display sedang menampilkan status "ISTIRAHAT" kepada pengunjung. Klik "Buka" atau tombol "Panggil Berikutnya" untuk kembali melayani.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggleCounterStatus('open')}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold cursor-pointer shrink-0"
            >
              Buka Loket Sekarang
            </button>
          </div>
        )}

        {currentCounter?.status === 'closed' && (
          <div className="bg-rose-50 border border-rose-300 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-rose-900 shadow-xs">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <p className="text-xs sm:text-sm font-medium">
                <span className="font-bold">Loket berstatus TUTUP.</span> Layar TV display menampilkan status "TUTUP". Tekan "Buka" saat Anda siap menerima antrean.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggleCounterStatus('open')}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer shrink-0"
            >
              Buka Loket Sekarang
            </button>
          </div>
        )}

        {/* HERO CALL STATION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Active Call Card */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                <span className="text-xs font-extrabold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                  <Megaphone className="w-4 h-4 text-emerald-600" />
                  Status Antrean yang Sedang Dilayani
                </span>

                <span
                  className={`text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider ${
                    currentServingTicket?.status === 'calling'
                      ? 'bg-rose-100 text-rose-800 animate-pulse'
                      : currentServingTicket?.status === 'serving'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {currentServingTicket?.status === 'calling'
                    ? 'Sedang Dipanggil'
                    : currentServingTicket?.status === 'serving'
                    ? 'Sedang Dilayani'
                    : 'Kosong / Menunggu Panggilan'}
                </span>
              </div>

              {currentServingTicket ? (
                <div className="text-center py-4">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">
                    Nomor Antrean
                  </span>
                  <div className="text-6xl sm:text-7xl font-black text-slate-900 font-mono tracking-tight my-2 text-emerald-600">
                    {currentServingTicket.number}
                  </div>
                  <div className="inline-block bg-slate-100 border border-slate-200 px-4 py-1.5 rounded-xl text-xs font-bold text-slate-700">
                    {currentServingTicket.serviceName}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-2">
                    Dipanggil sebanyak {currentServingTicket.callCount || 1} kali • Mulai:{' '}
                    {currentServingTicket.calledAt
                      ? new Date(currentServingTicket.calledAt).toLocaleTimeString('id-ID')
                      : '-'}
                  </div>
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                    <Users className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800">
                    Belum Ada Antrean yang Dipanggil
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    Klik tombol &ldquo;Panggil Antrean Berikutnya&rdquo; di bawah untuk memanggil nomor antrean terdepan.
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-8 pt-6 border-t border-slate-100 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Panggil Berikutnya */}
                <button
                  type="button"
                  onClick={handleCallNext}
                  className="py-4 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-sm transition shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Megaphone className="w-5 h-5 animate-pulse" />
                  <span>Panggil Antrean Berikutnya</span>
                </button>

                {/* Panggil Ulang */}
                <button
                  type="button"
                  onClick={handleRecall}
                  disabled={!currentServingTicket}
                  className="py-4 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-2xl font-bold text-sm transition shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed active:scale-95"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Panggil Ulang (Recall)</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2.5 pt-1">
                {/* Selesai */}
                <button
                  type="button"
                  onClick={handleComplete}
                  disabled={!currentServingTicket}
                  className="py-3 px-3 bg-slate-900 hover:bg-black disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Selesai</span>
                </button>

                {/* Lewati */}
                <button
                  type="button"
                  onClick={handleSkip}
                  disabled={!currentServingTicket}
                  className="py-3 px-3 bg-rose-50 hover:bg-rose-100 disabled:bg-slate-100 text-rose-700 disabled:text-slate-400 border border-rose-200 disabled:border-transparent rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                >
                  <SkipForward className="w-4 h-4" />
                  <span>Lewati</span>
                </button>

                {/* Panggil Manual */}
                <button
                  type="button"
                  onClick={() => setShowManualModal(true)}
                  className="py-3 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <PhoneCall className="w-4 h-4 text-blue-600" />
                  <span>Panggil Manual</span>
                </button>
              </div>
            </div>
          </div>

          {/* Antrean Menunggu & Dilewati untuk Loket Ini */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
            <div>
              {/* Header with Search and Tab Switcher */}
              <div className="pb-3 border-b border-slate-100 mb-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setActiveQueueTab('waiting')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        activeQueueTab === 'waiting'
                          ? 'bg-white text-emerald-800 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Menunggu ({waitingTicketsForCounter.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveQueueTab('skipped')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        activeQueueTab === 'skipped'
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <SkipForward className="w-3.5 h-3.5" />
                      <span>Dilewati ({skippedTicketsForCounter.length})</span>
                    </button>
                  </div>

                  <div className="relative w-28 sm:w-36">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Cari..."
                      value={queueSearchTerm}
                      onChange={(e) => setQueueSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <p className="text-[11px] text-slate-500">
                  {activeQueueTab === 'waiting'
                    ? `Antrean menunggu giliran layanan di ${currentCounter?.name}`
                    : `Antrean yang sebelumnya dilewati karena tidak hadir di ${currentCounter?.name}`}
                </p>
              </div>

              {/* Waiting Tab Content */}
              {activeQueueTab === 'waiting' && (
                <>
                  {waitingTicketsForCounter.length === 0 ? (
                    <div className="py-12 text-center text-slate-400">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-xs font-semibold">Tidak ada antrean menunggu</p>
                      <p className="text-[10px] mt-0.5">Semua pengunjung di kategori ini sudah dilayani.</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                      {waitingTicketsForCounter.map((tkt, idx) => {
                        const isNext = idx === 0;
                        return (
                          <div
                            key={tkt.id}
                            className={`p-3 rounded-2xl border transition flex items-center justify-between ${
                              isNext
                                ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-500/20'
                                : 'bg-slate-50/80 border-slate-200 hover:bg-slate-100/70'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-slate-900 text-white font-mono font-black text-base flex items-center justify-center shrink-0">
                                {tkt.number}
                              </div>
                              <div>
                                <span className="font-bold text-xs text-slate-900 block">
                                  {tkt.serviceName}
                                </span>
                                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  Diambil: {new Date(tkt.createdAt).toLocaleTimeString('id-ID')}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => onCallTicket(tkt, currentCounter)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-xs"
                              >
                                Panggil
                              </button>
                              <button
                                type="button"
                                onClick={() => setTicketToPrint(tkt)}
                                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                                title="Cetak Ulang Tiket"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {/* Skipped Tab Content (Panggil Kembali Antrean Dilewati) */}
              {activeQueueTab === 'skipped' && (
                <>
                  {skippedTicketsForCounter.length === 0 ? (
                    <div className="py-12 text-center text-slate-400">
                      <SkipForward className="w-8 h-8 mx-auto mb-2 opacity-50 text-amber-500" />
                      <p className="text-xs font-semibold text-slate-700">Tidak ada antrean yang dilewati</p>
                      <p className="text-[10px] mt-0.5">Semua antrean hadir atau belum ada nomor yang dilewati.</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                      <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px] font-medium flex items-center gap-2 mb-2">
                        <RotateCcw className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Pengunjung yang terlewat dapat dipanggil kembali ke meja loket Anda.</span>
                      </div>
                      {skippedTicketsForCounter.map((tkt) => {
                        return (
                          <div
                            key={tkt.id}
                            className="p-3 rounded-2xl border border-amber-200 bg-amber-50/50 hover:bg-amber-100/60 transition flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-amber-600 text-white font-mono font-black text-base flex items-center justify-center shrink-0 shadow-xs">
                                {tkt.number}
                              </div>
                              <div>
                                <span className="font-bold text-xs text-slate-900 block">
                                  {tkt.serviceName}
                                </span>
                                <span className="text-[10px] text-amber-700 font-medium block">
                                  Pernah dipanggil {tkt.callCount || 1}x lalu dilewati
                                </span>
                                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  Diambil: {new Date(tkt.createdAt).toLocaleTimeString('id-ID')}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => onRecallTicket(tkt, currentCounter)}
                                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-xs flex items-center gap-1"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Panggil Kembali</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setTicketToPrint(tkt)}
                                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                                title="Cetak Ulang Tiket"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Bottom info link */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="text-[11px]">Sistem Sinkron Otomatis (LAN)</span>
              <button
                type="button"
                onClick={onNavigateDisplay}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Lihat Layar Display TV</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Call Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <h3 className="font-black text-base text-slate-900 mb-1">
              Panggil Nomor Manual
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Panggil nomor tertentu langsung ke {currentCounter?.name} (contoh: A-015, B-008).
            </p>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <input
                type="text"
                autoFocus
                required
                placeholder="Contoh: A-005"
                value={manualCallInput}
                onChange={(e) => setManualCallInput(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-center text-2xl font-mono font-black uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
              />

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  Panggil Sekarang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Thermal Print Modal */}
      {ticketToPrint && (
        <ThermalTicket
          ticket={ticketToPrint}
          company={company}
          waitingAhead={0}
          estimatedMinutes={5}
          onClose={() => setTicketToPrint(null)}
        />
      )}
    </div>
  );
};
