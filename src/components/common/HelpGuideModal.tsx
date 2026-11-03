import React, { useState, useEffect } from 'react';
import {
  Lightbulb,
  X,
  Tv,
  Ticket,
  Sliders,
  UserCheck,
  CheckCircle2,
  ChevronRight,
  Server,
  Wifi,
  Volume2,
  Printer,
  Film,
  Sparkles,
  RotateCcw,
  Clock,
  Layers,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  Building,
  Lock,
  Unlock,
  KeyRound,
  Eye,
  EyeOff,
  Folder,
  Terminal,
  Globe,
  FileCode,
  AlertCircle,
  Copy,
  Check,
  Network,
  Cpu,
} from 'lucide-react';
import { ActivePage } from './HeaderNav';
import { verifyGuidePassword } from '../../utils/helpGuideAuth';

interface HelpGuideModalProps {
  onNavigatePage?: (page: ActivePage) => void;
}

export const HelpGuideModal: React.FC<HelpGuideModalProps> = ({ onNavigatePage }) => {
  // Modal states
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);

  const [activeTab, setActiveTab] = useState<'steps' | 'xampp' | 'roles' | 'features' | 'faq'>('steps');
  const [completedSteps, setCompletedSteps] = useState<number[]>([1]);
  const [copiedHtaccess, setCopiedHtaccess] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isAuthModalOpen) setIsAuthModalOpen(false);
        if (isOpen) setIsOpen(false);
      }
    };
    if (isOpen || isAuthModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isAuthModalOpen]);

  const handleFabClick = () => {
    if (isUnlocked) {
      setIsOpen(true);
    } else {
      setPasswordInput('');
      setPasswordError('');
      setIsAuthModalOpen(true);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyGuidePassword(passwordInput)) {
      setIsUnlocked(true);
      setIsAuthModalOpen(false);
      setPasswordError('');
      setIsOpen(true);
    } else {
      setPasswordError('Kata sandi salah! Periksa kembali kata sandi petunjuk pemakaian.');
    }
  };

  const handleLockGuide = () => {
    setIsUnlocked(false);
    setIsOpen(false);
    setPasswordInput('');
  };

  const handleCopyHtaccess = () => {
    const htaccessContent = `<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /antrean/
  RewriteRule ^index\\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /antrean/index.html [L]
</IfModule>`;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard
        .writeText(htaccessContent)
        .then(() => {
          setCopiedHtaccess(true);
          setTimeout(() => setCopiedHtaccess(false), 2500);
        })
        .catch(() => {
          fallbackCopyText(htaccessContent);
        });
    } else {
      fallbackCopyText(htaccessContent);
    }
  };

  const fallbackCopyText = (text: string) => {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedHtaccess(true);
      setTimeout(() => setCopiedHtaccess(false), 2500);
    } catch {
      // Ignore
    }
  };

  const toggleStep = (stepNumber: number) => {
    setCompletedSteps((prev) =>
      prev.includes(stepNumber) ? prev.filter((s) => s !== stepNumber) : [...prev, stepNumber]
    );
  };

  const stepsData = [
    {
      step: 1,
      title: 'Konfigurasi Jaringan Lokal (LAN) & Server / XAMPP',
      desc: 'Tentukan komputer PC utama sebagai server pusat penyimpanan antrean.',
      icon: Server,
      color: 'blue',
      details: [
        'Buka menu **Server Admin** (default user: `admin`, password: `admin123`).',
        'Buka tab **Pengaturan > Jaringan Server & LAN**.',
        'Klik tombol *"Gunakan Host Saat Ini"* atau isi IP lokal PC Server Anda (misal `192.168.1.100`).',
        'Pastikan saklar *"Aktifkan Bagikan Jaringan Lokal (LAN)"* menyala dan catat **Password Akses LAN** (default: `123` / `lan123`).',
        '💡 *Jika menggunakan XAMPP/Laragon*: Letakkan hasil `npm run build` di folder `htdocs/antrean` (buka tab *"Panduan XAMPP"* di atas untuk langkah lengkap).',
      ],
      quickAction: 'admin',
      actionLabel: 'Buka Pengaturan Server',
    },
    {
      step: 2,
      title: 'Sesuaikan Kategori Layanan & Daftar Loket',
      desc: 'Atur loket fisik yang tersedia dan bidang pelayanan yang disediakan.',
      icon: Layers,
      color: 'indigo',
      details: [
        'Buka tab **Pengaturan > Daftar Loket & Layanan**.',
        'Sesuaikan layanan: misal *A: Pelayanan Umum*, *B: Kasir/Pembayaran*, *C: Pengaduan*, *D: Jalur Prioritas (Lansia/Disabilitas)*.',
        'Tambahkan atau ubah loket pelayanan (Loket 1, Loket 2, dst.) dan tentukan nama petugas loket yang bertugas.',
      ],
      quickAction: 'admin',
      actionLabel: 'Kelola Loket & Layanan',
    },
    {
      step: 3,
      title: 'Pengaturan Profil Instansi, Logo & Struk Thermal',
      desc: 'Lengkapi identitas kantor untuk cetak tiket dan tampilan display.',
      icon: Building,
      color: 'emerald',
      details: [
        'Buka tab **Pengaturan > Profil Instansi & Struk**.',
        'Ketikkan Nama Kantor/Instansi, Alamat Lengkap, Nomor Telepon/WhatsApp, dan Pesan Penutup.',
        'Unggah file foto **Logo Resmi** kantor (PNG/JPG) untuk menggantikan ikon gedung standar.',
        'Pilih **Zona Waktu** operasional instansi Anda (*WIB*, *WITA*, atau *WIT*).',
        'Tiket thermal otomatis terformat rapi (58mm/80mm) hemat kertas tanpa QR/Barcode yang memakan ruang.',
      ],
      quickAction: 'admin',
      actionLabel: 'Atur Profil Instansi',
    },
    {
      step: 4,
      title: 'Pilih Suara Bel & Narator AI Panggilan',
      desc: 'Gunakan suara penyiar berstandar tinggi yang jernih dan ramah.',
      icon: Volume2,
      color: 'amber',
      details: [
        'Buka tab **Pengaturan > Suara Panggilan & Bell**.',
        'Pilih jenis bel: *Ding-Dong 2-Nada*, *Airport 3-Nada*, atau *High Chime*.',
        'Pilih karakter suara AI favorit: Speechify AI (Gita, Alfonso, Kristy), ElevenLabs AI (Bella, Daniel, Alice), atau Web Speech ID bawaan browser.',
        'API Key resmi sudah terkonfigurasi. Klik tombol *"Tes Suara"* untuk mendengarkan contoh suara secara langsung.',
        'Atur volume bel, volume narator, serta kecepatan tempo bacaan sesuai akustik ruang tunggu.',
      ],
      quickAction: 'admin',
      actionLabel: 'Atur Suara Panggilan',
    },
    {
      step: 5,
      title: 'Pasang TV Ruang Tunggu (Layar Display)',
      desc: 'Tampilkan nomor antrean aktif, video promosi / slide galeri, dan running text.',
      icon: Tv,
      color: 'purple',
      details: [
        'Buka **Layar Display** di PC yang terhubung ke TV/Monitor ruang tunggu.',
        'URL Display: `http://[IP-PC-SERVER]:3000/?view=display` atau `http://[IP-PC-SERVER]/antrean/?view=display` jika di XAMPP.',
        'Tekan tombol **F11** di keyboard untuk mode layar penuh (*fullscreen*).',
        'Di Pengaturan Media, Anda dapat memilih mode **Slide Foto Galeri** (unggah foto lokal dari PC) atau **Pemutar Video Edukasi** (file MP4 lokal offline).',
        'Ketik **Teks Berjalan Pengumuman** (*Running Text*) dan atur kecepatannya (detik per siklus putaran).',
        'Layar display akan otomatis memutar suara bel dan suara narator setiap kali petugas loket memanggil antrean!',
      ],
      quickAction: 'display',
      actionLabel: 'Buka Layar Display',
    },
    {
      step: 6,
      title: 'Operasional Harian: Kios Tiket & Meja Penjaga',
      desc: 'Mulai melayani pengunjung dari pengambilan nomor hingga pemanggilan.',
      icon: Ticket,
      color: 'rose',
      details: [
        '**Kios Tiket (`/?view=kiosk`)**: Pengunjung datang, menyentuh tombol layanan yang dituju di layar kios, tiket dicetak otomatis ke printer thermal.',
        '**Meja Petugas Loket (`/?view=penjaga`)**: Petugas login menggunakan IP PC Server dan password LAN, lalu klik tombol *"Panggil Berikutnya"* saat siap melayani.',
        '**Panggil Ulang**: Klik *"Panggil Ulang"* jika pengunjung belum mendengar panggilan.',
        '**Lewati & Panggil Kembali**: Jika pengunjung tidak kunjung datang, klik *"Lewati / Tidak Hadir"*. Antrean akan tersimpan di daftar lewati dan dapat dipanggil kembali kapan saja (*Panggil Kembali*).',
        '**Selesai**: Klik *"Selesai Melayani"* setelah layanan tuntas untuk bersiap memanggil antrean berikutnya.',
      ],
      quickAction: 'kiosk',
      actionLabel: 'Buka Kios Tiket',
    },
  ];

  return (
    <>
      {/* Floating Action Button (FAB) Bottom-Right with Lightbulb */}
      <div className="no-print fixed bottom-5 right-5 z-40 group select-none">
        <button
          type="button"
          onClick={handleFabClick}
          className="relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 text-slate-950 shadow-xl hover:shadow-2xl hover:shadow-amber-500/40 border-2 border-white/90 hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer focus:outline-none focus:ring-4 focus:ring-amber-400/50"
          title="Petunjuk & Panduan Pemakaian"
          aria-label="Petunjuk & Panduan Pemakaian Sistem Antrean"
        >
          {/* Subtle Glow Ripple */}
          <span className="absolute -inset-1 rounded-full bg-amber-400/30 animate-ping pointer-events-none opacity-75" />

          {/* Lightbulb Icon with gentle animation */}
          <Lightbulb className="w-7 h-7 text-slate-950 fill-amber-300 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />

          {/* Mini Badge / Label Indicator */}
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-600 text-[9px] font-black text-white items-center justify-center">
              {isUnlocked ? <Unlock className="w-2.5 h-2.5" /> : '?'}
            </span>
          </span>
        </button>

        {/* Hover Tooltip */}
        <div className="pointer-events-none absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="bg-slate-900/95 backdrop-blur-xs text-white text-xs font-bold py-1.5 px-3 rounded-xl shadow-lg border border-slate-700 whitespace-nowrap flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>Petunjuk Pemakaian</span>
            {!isUnlocked && (
              <span className="text-[10px] bg-amber-500/30 text-amber-300 px-1.5 py-0.2 rounded font-mono">
                Sandi
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Password Authentication Modal */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-modal-title"
          >
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 text-white relative">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-lg shrink-0">
                  <KeyRound className="w-6 h-6 text-slate-950" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-extrabold uppercase tracking-wider">
                      Verifikasi Keamanan
                    </span>
                  </div>
                  <h3
                    id="auth-modal-title"
                    className="text-lg font-black tracking-tight text-white mt-1"
                  >
                    Akses Petunjuk Pemakaian
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Masukkan kata sandi untuk membuka buku petunjuk sistem.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAuthModalOpen(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
                aria-label="Tutup verifikasi sandi"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Kata Sandi Petunjuk:
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      if (passwordError) setPasswordError('');
                    }}
                    placeholder="Masukkan kata sandi..."
                    autoFocus
                    className={`w-full pl-10 pr-10 py-3 rounded-xl border text-sm font-semibold transition focus:outline-none focus:ring-2 ${
                      passwordError
                        ? 'border-rose-400 bg-rose-50/50 text-rose-900 focus:ring-rose-500'
                        : 'border-slate-300 focus:border-amber-500 focus:ring-amber-500/20 text-slate-900'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    title={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {passwordError && (
                  <div className="mt-2 text-xs font-bold text-rose-600 flex items-center gap-1.5 animate-in fade-in duration-150">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(false)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-xl text-xs transition shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Unlock className="w-4 h-4" />
                  <span>Buka Petunjuk</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Guide Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
          <div
            className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="guide-modal-title"
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white flex items-start justify-between relative shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 flex items-center justify-center font-black shadow-lg shrink-0">
                  <Lightbulb className="w-6 h-6 fill-amber-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-extrabold uppercase tracking-wider">
                      Buku Panduan
                    </span>
                    <span className="text-slate-400 text-xs">• Sistem Antrean Cerdas</span>
                  </div>
                  <h2
                    id="guide-modal-title"
                    className="text-lg sm:text-xl font-black tracking-tight text-white mt-0.5"
                  >
                    Petunjuk Pemakaian Mulai Awal Sampai Berfungsi
                  </h2>
                  <p className="text-xs text-slate-300 mt-0.5 hidden sm:block">
                    Panduan lengkap konfigurasi server, XAMPP/web server lokal, layar display TV, kios tiket, dan loket.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Re-lock button */}
                <button
                  type="button"
                  onClick={handleLockGuide}
                  className="px-2.5 py-1.5 text-slate-300 hover:text-amber-300 hover:bg-white/10 rounded-xl transition cursor-pointer text-xs flex items-center gap-1.5 border border-white/10"
                  title="Kunci kembali petunjuk pemakaian"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Kunci</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer shrink-0"
                  aria-label="Tutup petunjuk"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Sub-Nav Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-4 sm:px-6 overflow-x-auto shrink-0 scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveTab('steps')}
                className={`py-3 px-4 font-bold text-xs border-b-2 transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'steps'
                    ? 'border-blue-600 text-blue-600 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Langkah Demi Langkah (1 - 6)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('xampp')}
                className={`py-3 px-4 font-bold text-xs border-b-2 transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'xampp'
                    ? 'border-amber-600 text-amber-700 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Globe className="w-4 h-4 text-amber-600" />
                <span className="font-black text-amber-900">Panduan XAMPP & Web Server</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('roles')}
                className={`py-3 px-4 font-bold text-xs border-b-2 transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'roles'
                    ? 'border-blue-600 text-blue-600 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Layers className="w-4 h-4 text-blue-600" />
                <span>4 Layar Utama Sistem</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('features')}
                className={`py-3 px-4 font-bold text-xs border-b-2 transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'features'
                    ? 'border-blue-600 text-blue-600 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Fitur Unggulan</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('faq')}
                className={`py-3 px-4 font-bold text-xs border-b-2 transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'faq'
                    ? 'border-blue-600 text-blue-600 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <HelpCircle className="w-4 h-4 text-indigo-500" />
                <span>FAQ & Tips LAN</span>
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-700 text-xs sm:text-sm">
              {/* TAB 1: STEPS 1 TO 6 */}
              {activeTab === 'steps' && (
                <div className="space-y-4">
                  <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        INFO
                      </div>
                      <p className="text-xs text-blue-900 font-medium">
                        Ikuti 6 langkah di bawah ini untuk memulai sistem dari awal hingga siap digunakan melayani masyarakat.
                      </p>
                    </div>
                    <span className="text-xs font-black text-blue-700 bg-white px-2.5 py-1 rounded-lg border border-blue-200 shrink-0">
                      {completedSteps.length} / {stepsData.length} Selesai
                    </span>
                  </div>

                  <div className="space-y-3.5">
                    {stepsData.map((item) => {
                      const isDone = completedSteps.includes(item.step);

                      return (
                        <div
                          key={item.step}
                          className={`p-4 rounded-2xl border transition-all ${
                            isDone
                              ? 'bg-slate-50/70 border-slate-200'
                              : 'bg-white border-slate-300 shadow-xs'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <button
                                type="button"
                                onClick={() => toggleStep(item.step)}
                                className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-all cursor-pointer ${
                                  isDone
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-100 hover:bg-blue-100 text-slate-700 border border-slate-300'
                                }`}
                                title={isDone ? 'Tandai belum selesai' : 'Tandai langkah sudah selesai'}
                              >
                                {isDone ? (
                                  <CheckCircle2 className="w-5 h-5" />
                                ) : (
                                  <span>{item.step}</span>
                                )}
                              </button>

                              <div>
                                <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                                  <span>{item.title}</span>
                                  {isDone && (
                                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                                      Siap
                                    </span>
                                  )}
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                                  {item.desc}
                                </p>
                              </div>
                            </div>

                            {item.quickAction && onNavigatePage && (
                              <button
                                type="button"
                                onClick={() => {
                                  onNavigatePage(item.quickAction as ActivePage);
                                  setIsOpen(false);
                                }}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer border border-slate-200"
                              >
                                <span>{item.actionLabel}</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          {/* Details Checklist */}
                          <div className="mt-3.5 pt-3 border-t border-slate-200/80 pl-11">
                            <ul className="space-y-1.5 text-xs text-slate-600">
                              {item.details.map((detail, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                                  <span
                                    dangerouslySetInnerHTML={{
                                      __html: detail.replace(
                                        /\*\*(.*?)\*\*/g,
                                        '<strong class="text-slate-900 font-bold">$1</strong>'
                                      ),
                                    }}
                                  />
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: PANDUAN XAMPP, LARAGON & WEB SERVER */}
              {activeTab === 'xampp' && (
                <div className="space-y-6">
                  {/* Hero Box */}
                  <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white shadow-md space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-black uppercase tracking-wider backdrop-blur-xs">
                        Web Server Lokal
                      </span>
                      <span className="text-amber-100 text-xs">• XAMPP / Laragon / WAMP / Apache</span>
                    </div>
                    <h3 className="text-base sm:text-xl font-black text-white">
                      Panduan Menjalankan Sistem Antrean Menggunakan XAMPP
                    </h3>
                    <p className="text-xs sm:text-sm text-amber-100 leading-relaxed">
                      Dengan XAMPP atau Laragon, PC Server di kantor Anda berfungsi sebagai web server mandiri 100% offline. Semua perangkat (TV Display, HP Android, tablet kios, laptop loket) dapat membuka antrean via browser hanya dengan mengetik IP PC Server di WiFi/LAN yang sama.
                    </p>
                  </div>

                  {/* Step by step XAMPP */}
                  <div className="space-y-4">
                    {/* Langkah 1: Build Proyek */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs shrink-0">
                          1
                        </div>
                        <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                          <Terminal className="w-4 h-4 text-amber-600" />
                          <span>Build / Ekspor File Aplikasi Menjadi File Statis</span>
                        </h4>
                      </div>
                      <p className="text-xs text-slate-600 pl-11">
                        Buka terminal (CMD / PowerShell / Bash) di folder aplikasi sistem antrean, lalu jalankan perintah:
                      </p>
                      <div className="pl-11">
                        <div className="bg-slate-900 text-emerald-400 p-3 rounded-xl font-mono text-xs flex items-center justify-between border border-slate-800">
                          <code>npm run build</code>
                          <span className="text-[10px] text-slate-400 font-sans">Menghasilkan folder dist/</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Folder baru bernama <strong>dist</strong> akan tercipta berisi file <code>index.html</code>, folder <code>assets/</code> (file JS & CSS terkompilasi).
                        </p>
                      </div>
                    </div>

                    {/* Langkah 2: Pindahkan ke htdocs */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs shrink-0">
                          2
                        </div>
                        <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                          <Folder className="w-4 h-4 text-amber-600" />
                          <span>Pindahkan Isi Folder dist ke Folder htdocs (XAMPP) atau www (Laragon)</span>
                        </h4>
                      </div>
                      <div className="pl-11 space-y-2 text-xs text-slate-600">
                        <p>
                          Buat folder baru bernama <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono font-bold text-slate-800">antrean</code> di dalam direktori web server Anda:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                            <span className="font-bold text-slate-900 block mb-0.5">XAMPP Windows:</span>
                            <code className="text-amber-700 font-mono text-[11px]">C:\xampp\htdocs\antrean\</code>
                          </div>
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                            <span className="font-bold text-slate-900 block mb-0.5">Laragon Windows:</span>
                            <code className="text-amber-700 font-mono text-[11px]">C:\laragon\www\antrean\</code>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Salin (copy-paste) seluruh isi dari dalam folder <strong>dist</strong> (yaitu <code>index.html</code> dan folder <code>assets</code>) ke dalam folder <strong>antrean</strong> tersebut.
                        </p>
                      </div>
                    </div>

                    {/* Langkah 3: Konfigurasi .htaccess */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2.5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs shrink-0">
                            3
                          </div>
                          <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                            <FileCode className="w-4 h-4 text-amber-600" />
                            <span>Buat File .htaccess (Penting untuk SPA / Single Page App)</span>
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={handleCopyHtaccess}
                          className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-xl text-xs transition border border-amber-300 flex items-center gap-1.5 cursor-pointer shrink-0"
                          title="Salin isi file .htaccess"
                        >
                          {copiedHtaccess ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700">Tersalin!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Salin Kode</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="pl-11 space-y-2 text-xs text-slate-600">
                        <p>
                          Buat file baru bernama <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono font-bold text-slate-800">.htaccess</code> di dalam folder <code>C:\xampp\htdocs\antrean\</code> agar tidak terjadi error 404 saat pengguna merefresh halaman:
                        </p>
                        <pre className="bg-slate-950 text-slate-200 p-3.5 rounded-xl font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-800">
{`<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /antrean/
  RewriteRule ^index\\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /antrean/index.html [L]
</IfModule>`}
                        </pre>
                        <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900">
                          ℹ️ <strong>Catatan Apache:</strong> Pastikan modul <code>mod_rewrite</code> aktif di file <code>httpd.conf</code> Apache (cari baris <code>LoadModule rewrite_module modules/mod_rewrite.so</code> dan pastikan tidak diawali tanda pagar <code>#</code>).
                        </div>
                      </div>
                    </div>

                    {/* Langkah 4: Jalankan Apache */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs shrink-0">
                          4
                        </div>
                        <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                          <Cpu className="w-4 h-4 text-amber-600" />
                          <span>Start Apache di XAMPP Control Panel</span>
                        </h4>
                      </div>
                      <div className="pl-11 space-y-2 text-xs text-slate-600">
                        <p>
                          Buka aplikasi <strong>XAMPP Control Panel</strong> di PC Server, lalu klik tombol <strong>Start</strong> di baris modul <strong>Apache</strong>. Pastikan statusnya berubah menjadi hijau (Port 80 atau 8080).
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Uji di PC Server dengan membuka browser: <code className="bg-slate-100 px-1 py-0.5 rounded text-amber-800 font-bold">http://localhost/antrean/</code>. Jika tampilan sistem antrean muncul, web server Apache berhasil berjalan normal!
                        </p>
                      </div>
                    </div>

                    {/* Langkah 5: Windows Firewall */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs shrink-0">
                          5
                        </div>
                        <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-amber-600" />
                          <span>Pengaturan Windows Defender Firewall (Penting agar Bisa Diakses Perangkat Lain)</span>
                        </h4>
                      </div>
                      <div className="pl-11 space-y-1.5 text-xs text-slate-600">
                        <p>
                          Agar komputer laptop petugas loket, TV, dan HP di WiFi kantor bisa membuka web server PC Server:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px]">
                          <li>Buka <strong>Windows Defender Firewall with Advanced Security</strong>.</li>
                          <li>Pastikan <strong>Apache HTTP Server</strong> dicentang untuk profil <em>Private (Jaringan Rumah/Kantor)</em>.</li>
                          <li>Atau tambahkan <em>Inbound Rule</em> untuk mengizinkan <strong>TCP Port 80 dan 443</strong> (atau port 8080).</li>
                        </ul>
                      </div>
                    </div>

                    {/* Langkah 6 & 7: URL Akses Klien */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-amber-50/40 border border-amber-200/80 shadow-xs space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs shrink-0">
                          6
                        </div>
                        <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                          <Network className="w-4 h-4 text-amber-600" />
                          <span>Daftar URL Akses Seluruh Perangkat di Jaringan Kantor</span>
                        </h4>
                      </div>
                      <p className="text-xs text-slate-600 pl-11">
                        Ketik <code>ipconfig</code> di CMD PC Server untuk melihat <em>IPv4 Address</em> Anda (misal: <code>192.168.1.100</code>). Gunakan URL berikut pada masing-masing perangkat:
                      </p>

                      <div className="pl-11 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                              <Tv className="w-3.5 h-3.5 text-purple-600" />
                              Layar TV Display
                            </span>
                            <span className="text-[10px] bg-purple-50 text-purple-700 font-bold px-1.5 py-0.2 rounded">
                              TV / Monitor
                            </span>
                          </div>
                          <code className="text-xs font-mono text-purple-800 font-bold block break-all">
                            http://[IP-PC-SERVER]/antrean/?view=display
                          </code>
                          <p className="text-[10px] text-slate-500">Tekan F11 untuk layar penuh di TV.</p>
                        </div>

                        <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                              <UserCheck className="w-3.5 h-3.5 text-amber-600" />
                              Meja Petugas Loket
                            </span>
                            <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-1.5 py-0.2 rounded">
                              Laptop Operator
                            </span>
                          </div>
                          <code className="text-xs font-mono text-amber-800 font-bold block break-all">
                            http://[IP-PC-SERVER]/antrean/?view=penjaga
                          </code>
                          <p className="text-[10px] text-slate-500">Login dengan IP Server dan Password LAN.</p>
                        </div>

                        <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                              <Ticket className="w-3.5 h-3.5 text-emerald-600" />
                              Kios Tiket Mandiri
                            </span>
                            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.2 rounded">
                              Tablet / Kiosk
                            </span>
                          </div>
                          <code className="text-xs font-mono text-emerald-800 font-bold block break-all">
                            http://[IP-PC-SERVER]/antrean/?view=kiosk
                          </code>
                          <p className="text-[10px] text-slate-500">Sentuh layar untuk ambil tiket thermal.</p>
                        </div>

                        <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                              <Sliders className="w-3.5 h-3.5 text-blue-600" />
                              Server Admin (Pusat)
                            </span>
                            <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-1.5 py-0.2 rounded">
                              PC Server Induk
                            </span>
                          </div>
                          <code className="text-xs font-mono text-blue-800 font-bold block break-all">
                            http://[IP-PC-SERVER]/antrean/?view=admin
                          </code>
                          <p className="text-[10px] text-slate-500">User: admin | Sandi: admin123</p>
                        </div>
                      </div>
                    </div>

                    {/* Alternatif Cepat: Vite Host langsung */}
                    <div className="p-4 rounded-2xl bg-slate-100 border border-slate-300 space-y-2">
                      <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                        <Terminal className="w-4 h-4 text-slate-700" />
                        <span>Alternatif Cepat Tanpa XAMPP (Mode Vite Host Langsung):</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Jika Anda belum menginstal XAMPP, Anda bisa langsung menjalankan server antrean via Node.js dengan perintah terminal:
                      </p>
                      <div className="bg-slate-950 text-amber-300 p-2.5 rounded-xl font-mono text-xs border border-slate-800">
                        <code>npm run dev -- --host 0.0.0.0</code>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Aplikasi langsung dapat diakses oleh perangkat lain di port 3000: <code>http://[IP-PC-SERVER]:3000/</code>.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: ROLES & 4 MAIN SCREENS */}
              {activeTab === 'roles' && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-500">
                    Sistem ini dirancang untuk berjalan serentak pada 4 layar / perangkat di satu jaringan lokal (LAN WiFi kantor):
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 1. Layar Display TV */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                          <Tv className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-black text-sm text-slate-900">1. Layar TV Display</h4>
                          <span className="text-[11px] font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                            /?view=display
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Dipasang di TV/Monitor ruang tunggu utama. Menampilkan nomor antrean yang sedang dipanggil di setiap loket, status buka/istirahat/tutup loket, video promosi / slide galeri layanan, jam operasional, dan running text pengumuman.
                      </p>
                      <div className="text-[11px] text-slate-500 bg-white p-2.5 rounded-xl border border-slate-200">
                        💡 <strong>Tips:</strong> Tekan tombol <kbd className="px-1.5 py-0.5 bg-slate-100 border rounded font-mono text-[10px]">F11</kbd> di browser TV untuk tampilan Fullscreen tanpa address bar.
                      </div>
                    </div>

                    {/* 2. Kios Tiket */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                          <Ticket className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-black text-sm text-slate-900">2. Kios Tiket Mandiri</h4>
                          <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            /?view=kiosk
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Ditempatkan di pintu masuk kantor dengan layar sentuh (Touchscreen) dan printer thermal. Pengunjung menekan tombol layanan dan tiket fisik langsung keluar.
                      </p>
                      <div className="text-[11px] text-slate-500 bg-white p-2.5 rounded-xl border border-slate-200">
                        🖨️ <strong>Printer:</strong> Kompatibel dengan semua printer thermal USB/LAN (kertas 58mm atau 80mm).
                      </div>
                    </div>

                    {/* 3. Meja Penjaga Loket */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                          <UserCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-black text-sm text-slate-900">3. Meja Penjaga Loket</h4>
                          <span className="text-[11px] font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            /?view=penjaga
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Dibuka di laptop/PC petugas loket. Login hanya dengan mengisi IP PC Server dan password LAN. Petugas dapat memanggil antrean, mengubah status (Buka / Istirahat / Tutup), panggil ulang, lewati, dan panggil kembali.
                      </p>
                      <div className="text-[11px] text-slate-500 bg-white p-2.5 rounded-xl border border-slate-200">
                        ⚡ <strong>Panggil Kembali:</strong> Nomor yang sempat dilewati dapat dipanggil kembali dengan satu klik.
                      </div>
                    </div>

                    {/* 4. Server Admin */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                          <Sliders className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-black text-sm text-slate-900">4. Server Admin (Pusat)</h4>
                          <span className="text-[11px] font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            /?view=admin
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Pusat kendali antrean, pengaturan server LAN, daftar loket dan operator, konfigurasi narator suara AI, durasi slide & pemutar video, logo instansi, serta reset antrean harian.
                      </p>
                      <div className="text-[11px] text-slate-500 bg-white p-2.5 rounded-xl border border-slate-200">
                        🔐 <strong>Akses:</strong> Login dengan akun server `admin` (kata sandi dapat diganti di tab Keamanan).
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: KEY FEATURES */}
              {activeTab === 'features' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/70 to-blue-50/50 border border-indigo-200 space-y-2">
                      <div className="flex items-center gap-2 text-indigo-900 font-black text-sm">
                        <Volume2 className="w-4 h-4 text-indigo-600" />
                        <span>Narator Suara Panggilan AI (Anti-Overlap)</span>
                      </div>
                      <p className="text-xs text-slate-600">
                        Terintegrasi dengan Speechify AI dan ElevenLabs AI dengan suara manusia yang sangat natural, jernih, dan tidak bertindihan/double.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/70 to-teal-50/50 border border-emerald-200 space-y-2">
                      <div className="flex items-center gap-2 text-emerald-900 font-black text-sm">
                        <Printer className="w-4 h-4 text-emerald-600" />
                        <span>Cetak Tiket Thermal Efisien</span>
                      </div>
                      <p className="text-xs text-slate-600">
                        Format struk thermal bersih tanpa barcode dan QR code yang menghabiskan kertas, lengkap dengan logo resmi kantor, nama instansi, dan waktu antrean.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/70 to-yellow-50/50 border border-amber-200 space-y-2">
                      <div className="flex items-center gap-2 text-amber-900 font-black text-sm">
                        <Film className="w-4 h-4 text-amber-600" />
                        <span>Media Slide Foto & Video Lokal</span>
                      </div>
                      <p className="text-xs text-slate-600">
                        Dapat mengunggah foto slide galeri dan file video promosi langsung dari komputer server secara offline tanpa memerlukan koneksi internet luar.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50/70 to-pink-50/50 border border-purple-200 space-y-2">
                      <div className="flex items-center gap-2 text-purple-900 font-black text-sm">
                        <Clock className="w-4 h-4 text-purple-600" />
                        <span>Zona Waktu Indonesia (WIB/WITA/WIT)</span>
                      </div>
                      <p className="text-xs text-slate-600">
                        Dukungan penuh zona waktu wilayah operasional untuk jam display TV dan stempel waktu tiket pengunjung di seluruh nusantara.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/70 to-cyan-50/50 border border-blue-200 space-y-2">
                      <div className="flex items-center gap-2 text-blue-900 font-black text-sm">
                        <RotateCcw className="w-4 h-4 text-blue-600" />
                        <span>Panggil Kembali Antrean Terlewati</span>
                      </div>
                      <p className="text-xs text-slate-600">
                        Pelanggan yang sempat terlambat tidak kehilangan antrean. Petugas loket dapat memanggil kembali nomor yang dilewati dengan cepat dari meja loket.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-gray-100 border border-slate-300 space-y-2">
                      <div className="flex items-center gap-2 text-slate-900 font-black text-sm">
                        <Wifi className="w-4 h-4 text-slate-700" />
                        <span>Jaringan Lokal (LAN) Offline-Ready</span>
                      </div>
                      <p className="text-xs text-slate-600">
                        Semua perangkat (TV display, tablet kios, laptop loket) saling berkomunikasi langsung di jaringan WiFi/LAN kantor tanpa biaya server bulanan.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: FAQ & LAN TIPS */}
              {activeTab === 'faq' && (
                <div className="space-y-3.5">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <h4 className="font-black text-xs sm:text-sm text-slate-900">
                      Q: Bagaimana cara mengetahui IP PC Server di jaringan lokal?
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Di komputer server Windows, buka <strong>Command Prompt (cmd)</strong>, lalu ketik <code className="bg-white px-1.5 py-0.5 rounded font-mono border">ipconfig</code>. Cari baris <em>IPv4 Address</em> (misalnya: <code>192.168.1.100</code>). Masukkan IP tersebut di Pengaturan Jaringan Server.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <h4 className="font-black text-xs sm:text-sm text-slate-900">
                      Q: Mengapa suara di Layar Display TV belum berbunyi saat pertama kali dibuka?
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Kebijakan keamanan browser modern (Chrome, Edge) melarang pemutaran audio otomatis tanpa interaksi pengguna. Cukup lakukan satu kali klik di mana saja pada layar TV Display saat pertama kali dinyalakan agar izin audio aktif.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <h4 className="font-black text-xs sm:text-sm text-slate-900">
                      Q: Apakah aplikasi memerlukan koneksi internet terus-menerus?
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Tidak! Seluruh antrean, cetak tiket, display TV, dan panggil loket bekerja 100% lokal di jaringan LAN kantor Anda. Koneksi internet hanya digunakan jika Anda memilih layanan suara online Speechify / ElevenLabs (jika offline, sistem otomatis beralih ke suara lokal browser).
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <h4 className="font-black text-xs sm:text-sm text-slate-900">
                      Q: Bagaimana cara mereset nomor antrean ke 001 di awal hari?
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Masuk ke <strong>Server Admin &gt; Meja Loket</strong>, lalu klik tombol *"Reset Antrean Hari Ini"* di pojok kanan atas. Konfirmasi reset untuk memulai urutan nomor dari 001 kembali.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Sistem Antrean Cerdas • Sandi Terbuka</span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 sm:flex-none px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Tutup Panduan
                </button>
                {onNavigatePage && (
                  <button
                    type="button"
                    onClick={() => {
                      onNavigatePage('admin');
                      setIsOpen(false);
                    }}
                    className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <span>Mulai Konfigurasi</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
