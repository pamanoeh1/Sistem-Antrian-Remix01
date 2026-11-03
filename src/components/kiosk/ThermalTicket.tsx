import React from 'react';
import { QueueItem, CompanyProfile } from '../../types/queue';
import { triggerPrint } from '../../utils/thermalPrinter';
import { Printer, CheckCircle2 } from 'lucide-react';

interface ThermalTicketProps {
  ticket: QueueItem;
  company: CompanyProfile;
  waitingAhead?: number;
  estimatedMinutes?: number;
  paperWidth?: '58mm' | '80mm';
  onClose?: () => void;
  showPrintButton?: boolean;
}

export const ThermalTicket: React.FC<ThermalTicketProps> = ({
  ticket,
  company,
  waitingAhead,
  estimatedMinutes,
  paperWidth = '80mm',
  onClose,
  showPrintButton = true,
}) => {
  const formattedDate = new Date(ticket.createdAt).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const formattedTime = new Date(ticket.createdAt).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const timezoneLabel = company.timezone || 'WIB';
  const is58 = paperWidth === '58mm';

  return (
    <div className="flex flex-col items-center">
      {/* On-screen card representation with authentic thermal paper styling */}
      <div
        className={`printable-ticket-section relative bg-white text-slate-900 border border-slate-300 shadow-xl rounded-sm p-4 font-mono-receipt select-none ${
          is58 ? 'w-[280px] text-xs' : 'w-[320px] text-sm'
        }`}
      >
        {/* Top Paper Tear Decoration for screen */}
        <div className="no-print absolute -top-2 left-0 right-0 h-2 bg-transparent overflow-hidden">
          <div
            className="w-full h-full"
            style={{
              backgroundImage: 'radial-gradient(circle, #f8fafc 4px, transparent 5px)',
              backgroundSize: '10px 10px',
              backgroundPosition: '0 -4px',
            }}
          />
        </div>

        {/* Header: Logo & Company Info */}
        <div className="text-center border-b border-dashed border-slate-400 pb-3 mb-3">
          {company.logoUrl && (
            <img
              src={company.logoUrl}
              alt="Logo Instansi"
              className="w-12 h-12 object-contain mx-auto mb-2"
            />
          )}
          <h2 className="font-bold text-slate-950 uppercase tracking-tight text-base leading-tight">
            {company.name}
          </h2>
          <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">{company.tagline}</p>
          <p className="text-[10px] text-slate-500 mt-1 leading-snug">{company.address}</p>
          <p className="text-[10px] text-slate-500 leading-snug">{company.phone}</p>
        </div>

        {/* Timestamp & Timezone */}
        <div className="flex justify-between text-[11px] text-slate-600 border-b border-dashed border-slate-300 pb-2 mb-3">
          <span>{formattedDate}</span>
          <span className="font-semibold">{formattedTime} {timezoneLabel}</span>
        </div>

        {/* Big Queue Number */}
        <div className="text-center my-3 bg-slate-50 py-3 rounded border border-slate-200">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 block mb-0.5">
            Nomor Antrean Anda
          </span>
          <div className="text-5xl font-black tracking-tight text-slate-950 my-1 font-mono-receipt">
            {ticket.number}
          </div>
          <span className="inline-block bg-slate-900 text-white font-bold text-xs px-2.5 py-0.5 rounded-full uppercase mt-1">
            {ticket.serviceName}
          </span>
        </div>

        {/* Destination & Wait Stats */}
        <div className="space-y-1.5 text-xs border-y border-dashed border-slate-400 py-2.5 my-3">
          <div className="flex justify-between">
            <span className="text-slate-600">Tujuan Loket:</span>
            <span className="font-bold text-slate-900">
              {ticket.counterName || 'Loket Pelayanan'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Antrean Di Depan:</span>
            <span className="font-bold text-slate-900">{waitingAhead} Orang</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Estimasi Waktu Tunggu:</span>
            <span className="font-bold text-emerald-700">~{estimatedMinutes} Menit</span>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center text-[10px] text-slate-600 border-t border-dashed border-slate-400 pt-2.5 mt-2 space-y-1">
          <p className="font-semibold leading-tight">{company.footerNote}</p>
          <p className="text-[9px] text-slate-400">Harap tertib & perhatikan layar panggilan suara</p>
          <p className="text-[8px] text-slate-400 tracking-wider">ID: {ticket.id}</p>
        </div>

        {/* Bottom Paper Tear Decoration */}
        <div className="no-print absolute -bottom-2 left-0 right-0 h-2 bg-transparent overflow-hidden">
          <div
            className="w-full h-full"
            style={{
              backgroundImage: 'radial-gradient(circle, #f8fafc 4px, transparent 5px)',
              backgroundSize: '10px 10px',
            }}
          />
        </div>
      </div>

      {/* Action Buttons for screen mode */}
      {showPrintButton && (
        <div className="no-print flex items-center gap-3 mt-4">
          <button
            type="button"
            onClick={triggerPrint}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition cursor-pointer"
          >
            <Printer className="w-5 h-5" />
            <span>Cetak Tiket (Thermal 58/80mm)</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded-lg transition cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Selesai</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
