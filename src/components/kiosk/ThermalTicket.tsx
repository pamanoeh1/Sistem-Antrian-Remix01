import React from 'react';
import { QueueItem, CompanyProfile, Counter } from '../../types/queue';
import { triggerPrint } from '../../utils/thermalPrinter';
import { resolveTicketDestinationLabel } from '../../utils/queueLogic';
import { Printer, CheckCircle2 } from 'lucide-react';

interface ThermalTicketProps {
  ticket: QueueItem;
  company: CompanyProfile;
  counters?: Counter[];
  waitingAhead?: number;
  estimatedMinutes?: number;
  paperWidth?: '58mm' | '80mm';
  onClose?: () => void;
  showPrintButton?: boolean;
}

export const ThermalTicket: React.FC<ThermalTicketProps> = ({
  ticket,
  company,
  counters = [],
  paperWidth = '58mm',
  onClose,
  showPrintButton = true,
}) => {
  const created = new Date(ticket.createdAt);
  const formattedDate = created.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const formattedTime = created.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const timezoneLabel = company.timezone || 'WIB';
  const destinationLabel = resolveTicketDestinationLabel(ticket, counters);
  const is58 = paperWidth === '58mm';

  return (
    <div className="flex flex-col items-center">
      {/* Compact Thermal Receipt: Only Date/Time, Queue Number, and Destination Counter */}
      <div
        className={`printable-ticket-section relative bg-white text-slate-900 border border-slate-300 shadow-lg rounded-sm p-3 print:p-1 print:border-0 print:shadow-none font-mono-receipt select-none h-auto min-h-0 ${
          is58 ? 'ticket-58mm w-[240px] text-xs' : 'w-[300px] text-sm'
        }`}
      >
        {/* Tanggal & Waktu */}
        <div className="flex items-center justify-between text-[11px] text-slate-700 border-b border-dashed border-slate-400 pb-1.5 mb-2">
          <span>{formattedDate}</span>
          <span className="font-bold">
            {formattedTime} {timezoneLabel}
          </span>
        </div>

        {/* Nomor Antrean */}
        <div className="text-center py-1.5">
          <span className="text-[10px] uppercase tracking-wider font-bold text-slate-600 block">
            Nomor Antrean
          </span>
          <div className="text-4xl font-black tracking-tight text-slate-950 my-0.5 font-mono-receipt leading-none">
            {ticket.number}
          </div>
        </div>

        {/* Tujuan Loket */}
        <div className="border-t border-dashed border-slate-400 pt-1.5 mt-2 text-center">
          <span className="text-[10px] uppercase tracking-wider text-slate-600 block">
            Tujuan Loket
          </span>
          <div className="font-bold text-xs text-slate-950 mt-0.5">
            {destinationLabel}
          </div>
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
            <span>Cetak Tiket (Thermal)</span>
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
