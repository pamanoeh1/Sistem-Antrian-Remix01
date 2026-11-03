import React, { useState, useEffect } from 'react';
import {
  ServiceCategory,
  QueueItem,
  CompanyProfile,
  AudioSettings,
} from '../../types/queue';
import {
  generateNextTicket,
  getWaitingCountAhead,
  calculateEstimatedWaitTimeMinutes,
} from '../../utils/queueLogic';
import { ThermalTicket } from './ThermalTicket';
import { playBellSound } from '../../utils/audioVoice';
import {
  Users,
  CreditCard,
  FileText,
  HeartHandshake,
  Ticket,
  Clock,
  Printer,
  X,
  Volume2,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface KioskViewProps {
  services: ServiceCategory[];
  queues: QueueItem[];
  company: CompanyProfile;
  audioSettings: AudioSettings;
  onAddTicket: (ticket: QueueItem) => void;
}

export const KioskView: React.FC<KioskViewProps> = ({
  services,
  queues,
  company,
  audioSettings,
  onAddTicket,
}) => {
  const [selectedTicket, setSelectedTicket] = useState<QueueItem | null>(null);
  const [autoPrintCountdown, setAutoPrintCountdown] = useState<number>(10);
  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>('80mm');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  // Clock ticker
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) + ' ' + (company.timezone || 'WIB')
      );
      setCurrentDate(
        now.toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Modal countdown to auto-close
  useEffect(() => {
    if (!selectedTicket) return;
    setAutoPrintCountdown(10);
    const interval = setInterval(() => {
      setAutoPrintCountdown((prev) => {
        if (prev <= 1) {
          setSelectedTicket(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [selectedTicket]);

  const handleSelectService = (service: ServiceCategory) => {
    const newTicket = generateNextTicket(service, queues);
    onAddTicket(newTicket);
    setSelectedTicket(newTicket);

    // Audio chime feedback
    if (audioSettings.enabled) {
      playBellSound('chime', 0.5);
    }
  };

  const getServiceIcon = (iconName: string) => {
    switch (iconName) {
      case 'Users':
        return <Users className="w-8 h-8" />;
      case 'CreditCard':
        return <CreditCard className="w-8 h-8" />;
      case 'FileText':
        return <FileText className="w-8 h-8" />;
      case 'HeartHandshake':
        return <HeartHandshake className="w-8 h-8" />;
      default:
        return <Ticket className="w-8 h-8" />;
    }
  };

  const getThemeStyles = (color: string) => {
    switch (color) {
      case 'emerald':
        return {
          bg: 'bg-emerald-50 hover:bg-emerald-100/80 border-emerald-300 text-emerald-950',
          badge: 'bg-emerald-600 text-white',
          btn: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200',
          border: 'border-emerald-500',
        };
      case 'blue':
        return {
          bg: 'bg-blue-50 hover:bg-blue-100/80 border-blue-300 text-blue-950',
          badge: 'bg-blue-600 text-white',
          btn: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200',
          border: 'border-blue-500',
        };
      case 'amber':
        return {
          bg: 'bg-amber-50 hover:bg-amber-100/80 border-amber-300 text-amber-950',
          badge: 'bg-amber-600 text-white',
          btn: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-200',
          border: 'border-amber-500',
        };
      case 'purple':
        return {
          bg: 'bg-purple-50 hover:bg-purple-100/80 border-purple-300 text-purple-950',
          badge: 'bg-purple-600 text-white',
          btn: 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-200',
          border: 'border-purple-500',
        };
      default:
        return {
          bg: 'bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-950',
          badge: 'bg-slate-700 text-white',
          btn: 'bg-slate-700 hover:bg-slate-800 text-white shadow-slate-200',
          border: 'border-slate-500',
        };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-slate-200 text-slate-800 flex flex-col justify-between p-3.5 sm:p-6 md:p-8 pt-12 sm:pt-6">
      {/* Kiosk Header */}
      <div className="max-w-6xl mx-auto w-full">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4 sm:p-6 mb-5 sm:mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-center md:text-left">
            {company.logoUrl ? (
              <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-200 p-1 flex items-center justify-center shadow-sm overflow-hidden shrink-0">
                <img
                  src={company.logoUrl}
                  alt="Logo Instansi"
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shrink-0">
                <Ticket className="w-7 h-7" />
              </div>
            )}
            <div>
              <span className="inline-block text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full mb-1">
                Kios Mandiri Antrean
              </span>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                {company.name}
              </h1>
              <p className="text-xs md:text-sm text-slate-500 font-medium">
                {company.tagline}
              </p>
            </div>
          </div>

          <div className="text-center md:text-right border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-6">
            <div className="text-sm font-semibold text-slate-700">{currentDate}</div>
            <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {currentTime}
            </div>
          </div>
        </div>

        {/* Main Instruction Banner */}
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Silakan Pilih Kategori Layanan
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-2xl mx-auto">
            Sentuh salah satu kotak layanan di bawah ini untuk mencetak tiket nomor antrean Anda.
          </p>
        </div>

        {/* Service Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
          {services
            .filter((s) => s.active)
            .map((service) => {
              const theme = getThemeStyles(service.color);
              const waitingCount = queues.filter(
                (q) => q.status === 'waiting' && q.serviceId === service.id
              ).length;
              const estTime = (waitingCount + 1) * service.estimatedMinutes;

              return (
                <div
                  key={service.id}
                  onClick={() => handleSelectService(service)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleSelectService(service);
                    }
                  }}
                  className={`group relative rounded-2xl border-2 p-6 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-1 ${theme.bg} ${theme.border}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-2xl shadow-sm ${theme.badge}`}
                      >
                        {service.prefix}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-900 transition-colors">
                          {service.name}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-600 mt-0.5 line-clamp-2">
                          {service.description}
                        </p>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/80 border border-slate-200/80 text-slate-700 shadow-xs">
                      {getServiceIcon(service.icon)}
                    </div>
                  </div>

                  {/* Queue Stats Bar */}
                  <div className="mt-6 pt-4 border-t border-slate-300/70 flex items-center justify-between text-xs sm:text-sm font-medium text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-slate-500" />
                      <span>
                        Sedang Menunggu:{' '}
                        <strong className="text-slate-900 font-bold">{waitingCount} orang</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-slate-500" />
                      <span>
                        Estimasi:{' '}
                        <strong className="text-slate-900 font-bold">~{estTime} mnt</strong>
                      </span>
                    </div>
                  </div>

                  {/* Touch Action Button */}
                  <div className="mt-4">
                    <button
                      type="button"
                      aria-label={`Ambil tiket untuk ${service.name}`}
                      className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md transition-all ${theme.btn}`}
                    >
                      <Ticket className="w-5 h-5" />
                      <span>Ambil Tiket {service.prefix}</span>
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Kiosk Footer */}
      <div className="max-w-4xl mx-auto w-full text-center mt-10 pt-4 border-t border-slate-300 text-xs text-slate-500">
        <p className="font-semibold text-slate-600">
          Butuh bantuan? Silakan hubungi petugas keamanan atau informasi di dekat pintu masuk.
        </p>
        <p className="mt-1">
          {company.name} • {company.address}
        </p>
      </div>

      {/* Ticket Modal & Thermal Print Dialog */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-4 sm:p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in duration-200 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-bold text-sm">Tiket Berhasil Dibuat!</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-mono">
                  Menutup otomatis: {autoPrintCountdown}s
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                  aria-label="Tutup tiket"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Paper Width Selector */}
            <div className="flex items-center justify-center gap-2 mb-4 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
              <span className="text-slate-500 pl-2">Ukuran Kertas Thermal:</span>
              <button
                type="button"
                onClick={() => setPaperWidth('58mm')}
                className={`px-3 py-1 rounded-lg transition ${
                  paperWidth === '58mm'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'hover:text-slate-900'
                }`}
              >
                58 mm (Struk Mini)
              </button>
              <button
                type="button"
                onClick={() => setPaperWidth('80mm')}
                className={`px-3 py-1 rounded-lg transition ${
                  paperWidth === '80mm'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'hover:text-slate-900'
                }`}
              >
                80 mm (Standar)
              </button>
            </div>

            {/* Thermal Ticket Component */}
            <ThermalTicket
              ticket={selectedTicket}
              company={company}
              paperWidth={paperWidth}
              waitingAhead={getWaitingCountAhead(selectedTicket.id, queues)}
              estimatedMinutes={calculateEstimatedWaitTimeMinutes(
                selectedTicket.id,
                queues,
                services
              )}
              onClose={() => setSelectedTicket(null)}
              showPrintButton={true}
            />
          </div>
        </div>
      )}
    </div>
  );
};
