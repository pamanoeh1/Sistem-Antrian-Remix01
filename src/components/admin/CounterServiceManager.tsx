import React, { useState } from 'react';
import { Counter, ServiceCategory } from '../../types/queue';
import {
  addCounter,
  updateCounter,
  deleteCounter,
  addServiceCategory,
  updateServiceCategory,
  deleteServiceCategory,
} from '../../utils/counterServiceLogic';
import {
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  AlertCircle,
  Users,
  CreditCard,
  FileText,
  HeartHandshake,
  Award,
  Clock,
  Radio,
  Tag,
  ShieldAlert,
} from 'lucide-react';

interface CounterServiceManagerProps {
  counters: Counter[];
  services: ServiceCategory[];
  onUpdateCounters: (counters: Counter[]) => void;
  onUpdateServices: (services: ServiceCategory[]) => void;
}

export const CounterServiceManager: React.FC<CounterServiceManagerProps> = ({
  counters,
  services,
  onUpdateCounters,
  onUpdateServices,
}) => {
  // Modal states for Counter
  const [isCounterModalOpen, setIsCounterModalOpen] = useState(false);
  const [editingCounter, setEditingCounter] = useState<Counter | null>(null);
  const [counterName, setCounterName] = useState('');
  const [counterOperator, setCounterOperator] = useState('');
  const [counterSupportedServices, setCounterSupportedServices] = useState<string[]>([]);
  const [counterStatus, setCounterStatus] = useState<'open' | 'closed' | 'break'>('open');
  const [counterError, setCounterError] = useState<string | null>(null);

  // Modal states for Service
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceCategory | null>(null);
  const [servicePrefix, setServicePrefix] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [serviceDesc, setServiceDesc] = useState('');
  const [serviceMinutes, setServiceMinutes] = useState(5);
  const [serviceColor, setServiceColor] = useState('blue');
  const [serviceIcon, setServiceIcon] = useState('Users');
  const [serviceActive, setServiceActive] = useState(true);
  const [serviceError, setServiceError] = useState<string | null>(null);

  // Delete confirmations
  const [counterToDelete, setCounterToDelete] = useState<Counter | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<ServiceCategory | null>(null);

  // Counter Handlers
  const handleOpenAddCounter = () => {
    setEditingCounter(null);
    setCounterName(`Loket ${counters.length + 1}`);
    setCounterOperator('Petugas Baru');
    setCounterSupportedServices(services.map((s) => s.id));
    setCounterStatus('open');
    setCounterError(null);
    setIsCounterModalOpen(true);
  };

  const handleOpenEditCounter = (c: Counter) => {
    setEditingCounter(c);
    setCounterName(c.name);
    setCounterOperator(c.operatorName);
    setCounterSupportedServices(c.supportedServiceIds);
    setCounterStatus(c.status);
    setCounterError(null);
    setIsCounterModalOpen(true);
  };

  const handleSaveCounter = (e: React.FormEvent) => {
    e.preventDefault();
    setCounterError(null);

    if (editingCounter) {
      const res = updateCounter(counters, editingCounter.id, {
        name: counterName,
        operatorName: counterOperator,
        supportedServiceIds: counterSupportedServices,
        status: counterStatus,
      });
      if (res.success) {
        onUpdateCounters(res.updatedCounters);
        setIsCounterModalOpen(false);
      } else {
        setCounterError(res.error || 'Gagal memperbarui loket');
      }
    } else {
      const res = addCounter(counters, {
        name: counterName,
        operatorName: counterOperator,
        supportedServiceIds: counterSupportedServices,
        status: counterStatus,
      });
      if (res.success) {
        onUpdateCounters(res.updatedCounters);
        setIsCounterModalOpen(false);
      } else {
        setCounterError(res.error || 'Gagal menambahkan loket');
      }
    }
  };

  const handleConfirmDeleteCounter = () => {
    if (!counterToDelete) return;
    const res = deleteCounter(counters, counterToDelete.id);
    if (res.success) {
      onUpdateCounters(res.updatedCounters);
      setCounterToDelete(null);
    } else {
      alert(res.error);
    }
  };

  // Service Handlers
  const handleOpenAddService = () => {
    setEditingService(null);
    // Find next available prefix letter
    const existingPrefixes = services.map((s) => s.prefix.toUpperCase());
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const nextLetter = alphabet.find((l) => !existingPrefixes.includes(l)) || 'X';

    setServicePrefix(nextLetter);
    setServiceName('');
    setServiceDesc('');
    setServiceMinutes(5);
    setServiceColor('blue');
    setServiceIcon('Users');
    setServiceActive(true);
    setServiceError(null);
    setIsServiceModalOpen(true);
  };

  const handleOpenEditService = (s: ServiceCategory) => {
    setEditingService(s);
    setServicePrefix(s.prefix);
    setServiceName(s.name);
    setServiceDesc(s.description);
    setServiceMinutes(s.estimatedMinutes);
    setServiceColor(s.color);
    setServiceIcon(s.icon);
    setServiceActive(s.active);
    setServiceError(null);
    setIsServiceModalOpen(true);
  };

  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    setServiceError(null);

    if (editingService) {
      const res = updateServiceCategory(services, editingService.id, {
        prefix: servicePrefix,
        name: serviceName,
        description: serviceDesc,
        estimatedMinutes: Number(serviceMinutes),
        color: serviceColor,
        icon: serviceIcon,
        active: serviceActive,
      });
      if (res.success) {
        onUpdateServices(res.updatedServices);
        setIsServiceModalOpen(false);
      } else {
        setServiceError(res.error || 'Gagal memperbarui layanan');
      }
    } else {
      const res = addServiceCategory(services, {
        prefix: servicePrefix,
        name: serviceName,
        description: serviceDesc,
        estimatedMinutes: Number(serviceMinutes),
        color: serviceColor,
        icon: serviceIcon,
        active: serviceActive,
      });
      if (res.success) {
        onUpdateServices(res.updatedServices);
        setIsServiceModalOpen(false);
      } else {
        setServiceError(res.error || 'Gagal menambahkan layanan');
      }
    }
  };

  const handleConfirmDeleteService = () => {
    if (!serviceToDelete) return;
    const res = deleteServiceCategory(services, serviceToDelete.id);
    if (res.success) {
      onUpdateServices(res.updatedServices);
      setServiceToDelete(null);
    } else {
      alert(res.error);
    }
  };

  const getColorClass = (color: string) => {
    switch (color) {
      case 'emerald':
        return 'bg-emerald-500 text-white border-emerald-600';
      case 'blue':
        return 'bg-blue-500 text-white border-blue-600';
      case 'amber':
        return 'bg-amber-500 text-white border-amber-600';
      case 'purple':
        return 'bg-purple-500 text-white border-purple-600';
      case 'rose':
        return 'bg-rose-500 text-white border-rose-600';
      case 'cyan':
        return 'bg-cyan-500 text-white border-cyan-600';
      default:
        return 'bg-slate-700 text-white border-slate-800';
    }
  };

  return (
    <div className="space-y-10">
      {/* SECTION 1: DAFTAR LOKET */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Radio className="w-5 h-5 text-blue-600" />
              <span>Daftar Loket Pelayanan ({counters.length})</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tambah loket baru, sesuaikan nama loket, petugas jaga, dan pilih kategori layanan yang dilayani.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenAddCounter}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Loket Baru</span>
          </button>
        </div>

        {/* Counter Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {counters.map((counter) => (
            <div
              key={counter.id}
              className="bg-slate-50 border border-slate-200 rounded-2xl p-4 transition hover:border-slate-300 hover:shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-slate-900">{counter.name}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        counter.status === 'open'
                          ? 'bg-emerald-100 text-emerald-800'
                          : counter.status === 'break'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {counter.status === 'open'
                        ? 'Buka'
                        : counter.status === 'break'
                        ? 'Istirahat'
                        : 'Tutup'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditCounter(counter)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-white rounded-lg transition cursor-pointer"
                      title="Edit Loket"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    {counters.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setCounterToDelete(counter)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-white rounded-lg transition cursor-pointer"
                        title="Hapus Loket"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="text-xs text-slate-600">
                  <span>Petugas: </span>
                  <strong className="text-slate-900">{counter.operatorName}</strong>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1.5">
                    Layanan yang Dilayani:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {counter.supportedServiceIds.map((srvId) => {
                      const s = services.find((serv) => serv.id === srvId);
                      if (!s) return null;
                      return (
                        <span
                          key={s.id}
                          className="text-[11px] font-semibold bg-white border border-slate-200 text-slate-800 px-2 py-0.5 rounded-md flex items-center gap-1"
                        >
                          <span className="font-bold text-blue-600">{s.prefix}</span>
                          <span>{s.name}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: DAFTAR KATEGORI LAYANAN */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Tag className="w-5 h-5 text-indigo-600" />
              <span>Daftar Kategori Layanan Antrean ({services.length})</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Sesuaikan huruf prefix (A, B, C..), nama layanan, deskripsi, estimasi waktu, dan status aktif.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenAddService}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Kategori Layanan</span>
          </button>
        </div>

        {/* Services Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {services.map((service) => (
            <div
              key={service.id}
              className={`border rounded-2xl p-4 transition flex items-start justify-between gap-3 ${
                service.active
                  ? 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                  : 'bg-slate-50/70 border-slate-200 opacity-60'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-xl shrink-0 shadow-xs ${getColorClass(
                    service.color
                  )}`}
                >
                  {service.prefix}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-slate-900">{service.name}</h4>
                    {!service.active && (
                      <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-bold uppercase">
                        Non-Aktif
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                    {service.description}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-600 mt-2 font-medium">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{service.estimatedMinutes} menit / orang</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleOpenEditService(service)}
                  className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                  title="Edit Layanan"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                {services.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setServiceToDelete(service)}
                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                    title="Hapus Layanan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL: ADD / EDIT COUNTER */}
      {isCounterModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 mb-4">
              <h3 className="font-black text-base text-slate-900">
                {editingCounter ? 'Edit Data Loket' : 'Tambah Loket Pelayanan Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsCounterModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {counterError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{counterError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCounter} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Nama Loket:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Loket 5 (Layanan Cepat)"
                  value={counterName}
                  onChange={(e) => setCounterName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Nama Petugas Operator:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Rian Hidayat"
                  value={counterOperator}
                  onChange={(e) => setCounterOperator(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                  Layanan yang Didukung oleh Loket Ini:
                </label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl">
                  {services.map((srv) => {
                    const isChecked = counterSupportedServices.includes(srv.id);
                    return (
                      <label
                        key={srv.id}
                        className="flex items-center gap-2 text-xs font-medium text-slate-800 p-1.5 hover:bg-white rounded-lg cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCounterSupportedServices([...counterSupportedServices, srv.id]);
                            } else {
                              setCounterSupportedServices(
                                counterSupportedServices.filter((id) => id !== srv.id)
                              );
                            }
                          }}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="font-bold text-blue-600">[{srv.prefix}]</span>
                        <span>{srv.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Status Operasional:
                </label>
                <select
                  value={counterStatus}
                  onChange={(e) => setCounterStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="open">Buka (Siap Melayani)</option>
                  <option value="break">Istirahat Sementara</option>
                  <option value="closed">Tutup</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCounterModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  {editingCounter ? 'Simpan Perubahan' : 'Tambah Loket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT SERVICE */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 mb-4">
              <h3 className="font-black text-base text-slate-900">
                {editingService ? 'Edit Kategori Layanan' : 'Tambah Kategori Layanan Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsServiceModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {serviceError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{serviceError}</span>
              </div>
            )}

            <form onSubmit={handleSaveService} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Prefix:
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={1}
                    placeholder="A"
                    value={servicePrefix}
                    onChange={(e) => setServicePrefix(e.target.value.toUpperCase())}
                    className="w-full text-center px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xl font-black uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Nama Layanan:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Pengurusan KTP"
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Deskripsi Singkat:
                </label>
                <input
                  type="text"
                  placeholder="Keterangan singkat yang muncul di Kios tiket..."
                  value={serviceDesc}
                  onChange={(e) => setServiceDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Estimasi (Menit):
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    required
                    value={serviceMinutes}
                    onChange={(e) => setServiceMinutes(parseInt(e.target.value) || 5)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Warna Tema:
                  </label>
                  <select
                    value={serviceColor}
                    onChange={(e) => setServiceColor(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="blue">Biru (Blue)</option>
                    <option value="emerald">Hijau (Emerald)</option>
                    <option value="amber">Kuning (Amber)</option>
                    <option value="purple">Ungu (Purple)</option>
                    <option value="rose">Merah Muda (Rose)</option>
                    <option value="cyan">Biru Muda (Cyan)</option>
                  </select>
                </div>
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={serviceActive}
                    onChange={(e) => setServiceActive(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <span>Tampilkan di Kios Pengambilan Tiket (Aktif)</span>
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsServiceModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  {editingService ? 'Simpan Perubahan' : 'Tambah Layanan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE COUNTER MODAL */}
      {counterToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-1">
              Hapus {counterToDelete.name}?
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Loket ini akan dihapus dari daftar loket operasional antrean.
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCounterToDelete(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCounter}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Hapus Loket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE SERVICE MODAL */}
      {serviceToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-1">
              Hapus Layanan [{serviceToDelete.prefix}] {serviceToDelete.name}?
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Kategori layanan ini tidak akan lagi tersedia di Kios tiket antrean.
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setServiceToDelete(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteService}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Hapus Layanan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
