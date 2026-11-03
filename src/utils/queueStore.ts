import {
  QueueItem,
  ServiceCategory,
  Counter,
  MediaSettings,
  AudioSettings,
  CompanyProfile,
  LanSettings,
  QueueSyncEvent,
} from '../types/queue';

const STORAGE_KEYS = {
  QUEUES: 'antrean_queues_v1',
  SERVICES: 'antrean_services_v1',
  COUNTERS: 'antrean_counters_v1',
  MEDIA: 'antrean_media_v1',
  AUDIO: 'antrean_audio_v1',
  COMPANY: 'antrean_company_v1',
  LAN: 'antrean_lan_settings_v1',
  ACTIVE_TICKET: 'antrean_active_call_v1',
};

export const DEFAULT_SERVICES: ServiceCategory[] = [
  {
    id: 'srv-a',
    prefix: 'A',
    name: 'Pelayanan Umum & CS',
    description: 'Pendaftaran berkas, konsultasi, dan informasi umum',
    icon: 'Users',
    color: 'emerald',
    estimatedMinutes: 5,
    active: true,
  },
  {
    id: 'srv-b',
    prefix: 'B',
    name: 'Kasir & Pembayaran',
    description: 'Pembayaran tagihan, retribusi, dan administrasi kasir',
    icon: 'CreditCard',
    color: 'blue',
    estimatedMinutes: 3,
    active: true,
  },
  {
    id: 'srv-c',
    prefix: 'C',
    name: 'Pengaduan & Bantuan',
    description: 'Penyampaian keluhan, klarifikasi data, dan penanganan kendala',
    icon: 'FileText',
    color: 'amber',
    estimatedMinutes: 8,
    active: true,
  },
  {
    id: 'srv-d',
    prefix: 'D',
    name: 'Layanan Prioritas',
    description: 'Khusus lansia (>60 th), ibu hamil, dan penyandang disabilitas',
    icon: 'HeartHandshake',
    color: 'purple',
    estimatedMinutes: 4,
    active: true,
  },
];

export const DEFAULT_COUNTERS: Counter[] = [
  {
    id: 'loket-1',
    name: 'Loket 1',
    operatorName: 'Ahmad Fauzi',
    supportedServiceIds: ['srv-a', 'srv-c'],
    currentTicketId: null,
    status: 'open',
  },
  {
    id: 'loket-2',
    name: 'Loket 2',
    operatorName: 'Dewi Lestari',
    supportedServiceIds: ['srv-b'],
    currentTicketId: null,
    status: 'open',
  },
  {
    id: 'loket-3',
    name: 'Loket 3',
    operatorName: 'Budi Santoso',
    supportedServiceIds: ['srv-a', 'srv-b'],
    currentTicketId: null,
    status: 'open',
  },
  {
    id: 'loket-4',
    name: 'Loket 4 (Prioritas)',
    operatorName: 'Siti Nurhaliza',
    supportedServiceIds: ['srv-d', 'srv-a'],
    currentTicketId: null,
    status: 'open',
  },
];

export const DEFAULT_MEDIA: MediaSettings = {
  type: 'slideshow',
  videoSource: 'preset',
  videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  slideDurationSec: 6,
  runningTextSpeedSec: 32,
  runningText:
    'SELAMAT DATANG DI KANTOR PELAYANAN PUBLIK TERPADU • BUDAYAKAN MENGANTRE SECARA TERTIB DAN NYAMAN • PASTIKAN DOKUMEN IDENTITAS KTP/KK ASLI SUDAH DISIAPKAN • LAYANAN BUKA SENIN - JUMAT PUKUL 08:00 - 15:30 WIB • INFORMASI & PENGADUAN: (021) 555-8900 • KAMI SIAP MELAYANI DENGAN SEPENUH HATI TANPA PUNGLI',
  slides: [
    {
      id: 'slide-1',
      title: 'Selamat Datang di Pelayanan Terpadu',
      url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
      caption: 'Pelayanan cepat, transparan, dan profesional untuk seluruh lapisan masyarakat.',
    },
    {
      id: 'slide-2',
      title: 'Jalur Khusus Lansia & Prioritas',
      url: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=1200&q=80',
      caption: 'Tersedia Loket 4 ramah lansia, ibu hamil, dan penyandang disabilitas dengan pelayanan istimewa.',
    },
    {
      id: 'slide-3',
      title: 'Pembayaran Non-Tunai QRIS & Debit',
      url: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=1200&q=80',
      caption: 'Kemudahan transaksi pembayaran administrasi secara praktis melalui QRIS dan Bank.',
    },
    {
      id: 'slide-4',
      title: 'Pemberitahuan Waktu Layanan',
      url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
      caption: 'Hari kerja Senin s.d. Jumat (08:00 - 15:30 WIB). Istirahat siang 12:00 - 13:00 WIB.',
    },
  ],
};

export const DEFAULT_AUDIO: AudioSettings = {
  enabled: true,
  chimeVolume: 0.9,
  voiceVolume: 1.0,
  voiceRate: 0.95,
  voicePitch: 1.0,
  repeatTimes: 1,
  bellType: 'dingdong',
  voicePersona: 'gita_speechify',
  elevenLabsApiKey: 'sk_bd23076ca47adaf494a29402f21a6d956bc6881b04a446f1',
  speechifyApiKey: 'sk_22veab8bb226z29yejppkr1bj8864xtm17tjj0g97xmsk_22veab8bb226z29yejppkr1bj8864xtm17tjj0g97xm',
};

export const DEFAULT_COMPANY: CompanyProfile = {
  name: 'KANTOR PELAYANAN PUBLIK TERPADU',
  tagline: 'Melayani Cepat, Transparan, dan Sepenuh Hati',
  address: 'Jl. Merdeka Pemuda No. 88, Pusat Pemerintahan',
  phone: 'Telp: (021) 555-8900 | WhatsApp: 0812-3456-7890',
  footerNote: 'Simpan tiket ini dengan baik hingga nomor Anda dipanggil oleh petugas loket.',
  logoUrl: '',
  timezone: 'WIB',
};

export const DEFAULT_LAN_SETTINGS: LanSettings = {
  serverIp: typeof window !== 'undefined' ? window.location.hostname || '192.168.1.100' : '192.168.1.100',
  serverPort: 3000,
  sharingEnabled: true,
  lanPassword: '123',
};

export const INITIAL_QUEUES: QueueItem[] = [
  {
    id: 'tkt-init-1',
    number: 'A-001',
    prefix: 'A',
    sequenceNumber: 1,
    serviceId: 'srv-a',
    serviceName: 'Pelayanan Umum & CS',
    counterId: 'loket-1',
    counterName: 'Loket 1',
    status: 'completed',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    calledAt: new Date(Date.now() - 3300000).toISOString(),
    completedAt: new Date(Date.now() - 2800000).toISOString(),
    callCount: 1,
  },
  {
    id: 'tkt-init-2',
    number: 'B-001',
    prefix: 'B',
    sequenceNumber: 1,
    serviceId: 'srv-b',
    serviceName: 'Kasir & Pembayaran',
    counterId: 'loket-2',
    counterName: 'Loket 2',
    status: 'completed',
    createdAt: new Date(Date.now() - 3000000).toISOString(),
    calledAt: new Date(Date.now() - 2700000).toISOString(),
    completedAt: new Date(Date.now() - 2400000).toISOString(),
    callCount: 1,
  },
  {
    id: 'tkt-init-3',
    number: 'A-002',
    prefix: 'A',
    sequenceNumber: 2,
    serviceId: 'srv-a',
    serviceName: 'Pelayanan Umum & CS',
    counterId: 'loket-1',
    counterName: 'Loket 1',
    status: 'serving',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    calledAt: new Date(Date.now() - 600000).toISOString(),
    completedAt: null,
    callCount: 1,
  },
  {
    id: 'tkt-init-4',
    number: 'B-002',
    prefix: 'B',
    sequenceNumber: 2,
    serviceId: 'srv-b',
    serviceName: 'Kasir & Pembayaran',
    counterId: 'loket-2',
    counterName: 'Loket 2',
    status: 'calling',
    createdAt: new Date(Date.now() - 1500000).toISOString(),
    calledAt: new Date(Date.now() - 60000).toISOString(),
    completedAt: null,
    callCount: 1,
  },
  {
    id: 'tkt-init-5',
    number: 'A-003',
    prefix: 'A',
    sequenceNumber: 3,
    serviceId: 'srv-a',
    serviceName: 'Pelayanan Umum & CS',
    counterId: null,
    counterName: null,
    status: 'waiting',
    createdAt: new Date(Date.now() - 900000).toISOString(),
    calledAt: null,
    completedAt: null,
    callCount: 0,
  },
  {
    id: 'tkt-init-6',
    number: 'C-001',
    prefix: 'C',
    sequenceNumber: 1,
    serviceId: 'srv-c',
    serviceName: 'Pengaduan & Bantuan',
    counterId: null,
    counterName: null,
    status: 'waiting',
    createdAt: new Date(Date.now() - 600000).toISOString(),
    calledAt: null,
    completedAt: null,
    callCount: 0,
  },
  {
    id: 'tkt-init-7',
    number: 'D-001',
    prefix: 'D',
    sequenceNumber: 1,
    serviceId: 'srv-d',
    serviceName: 'Layanan Prioritas',
    counterId: null,
    counterName: null,
    status: 'waiting',
    createdAt: new Date(Date.now() - 300000).toISOString(),
    calledAt: null,
    completedAt: null,
    callCount: 0,
  },
];

// Broadcast Channel for cross-tab communication
let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel('antrean_sync_channel');
  } catch {
    broadcastChannel = null;
  }
}

export function broadcastSyncEvent(event: QueueSyncEvent) {
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(event);
    } catch (e) {
      console.warn('Broadcast error:', e);
    }
  }
}

export function subscribeSyncEvents(callback: (event: QueueSyncEvent) => void): () => void {
  if (!broadcastChannel) {
    // Fallback using storage event
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'antrean_last_event_v1' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          callback(parsed);
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }

  const handler = (e: MessageEvent) => {
    if (e.data && e.data.type) {
      callback(e.data as QueueSyncEvent);
    }
  };

  broadcastChannel.addEventListener('message', handler);
  return () => {
    broadcastChannel?.removeEventListener('message', handler);
  };
}

// Storage helpers
export function getStoredQueues(): QueueItem[] {
  if (typeof window === 'undefined') return INITIAL_QUEUES;
  const raw = localStorage.getItem(STORAGE_KEYS.QUEUES);
  if (!raw) {
    localStorage.setItem(STORAGE_KEYS.QUEUES, JSON.stringify(INITIAL_QUEUES));
    return INITIAL_QUEUES;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return INITIAL_QUEUES;
  }
}

export function setStoredQueues(queues: QueueItem[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.QUEUES, JSON.stringify(queues));
}

export function getStoredServices(): ServiceCategory[] {
  if (typeof window === 'undefined') return DEFAULT_SERVICES;
  const raw = localStorage.getItem(STORAGE_KEYS.SERVICES);
  if (!raw) {
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(DEFAULT_SERVICES));
    return DEFAULT_SERVICES;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return DEFAULT_SERVICES;
  }
}

export function setStoredServices(services: ServiceCategory[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
}

export function getStoredCounters(): Counter[] {
  if (typeof window === 'undefined') return DEFAULT_COUNTERS;
  const raw = localStorage.getItem(STORAGE_KEYS.COUNTERS);
  if (!raw) {
    // Initialize current ticket ids for loket 1 and 2
    const initialCounters = DEFAULT_COUNTERS.map((c) => {
      if (c.id === 'loket-1') return { ...c, currentTicketId: 'tkt-init-3' };
      if (c.id === 'loket-2') return { ...c, currentTicketId: 'tkt-init-4' };
      return c;
    });
    localStorage.setItem(STORAGE_KEYS.COUNTERS, JSON.stringify(initialCounters));
    return initialCounters;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return DEFAULT_COUNTERS;
  }
}

export function setStoredCounters(counters: Counter[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.COUNTERS, JSON.stringify(counters));
}

export function getStoredMedia(): MediaSettings {
  if (typeof window === 'undefined') return DEFAULT_MEDIA;
  const raw = localStorage.getItem(STORAGE_KEYS.MEDIA);
  if (!raw) {
    localStorage.setItem(STORAGE_KEYS.MEDIA, JSON.stringify(DEFAULT_MEDIA));
    return DEFAULT_MEDIA;
  }
  try {
    const parsed = JSON.parse(raw);
    const slides = Array.isArray(parsed?.slides) && parsed.slides.length > 0
      ? parsed.slides
      : DEFAULT_MEDIA.slides;

    return {
      ...DEFAULT_MEDIA,
      ...parsed,
      slides,
      type: parsed?.type === 'video' ? 'video' : 'slideshow',
      videoSource: parsed?.videoSource || DEFAULT_MEDIA.videoSource,
      videoUrl: parsed?.videoUrl || DEFAULT_MEDIA.videoUrl,
      slideDurationSec:
        typeof parsed?.slideDurationSec === 'number' && !isNaN(parsed.slideDurationSec)
          ? parsed.slideDurationSec
          : DEFAULT_MEDIA.slideDurationSec,
      runningTextSpeedSec:
        typeof parsed?.runningTextSpeedSec === 'number' && !isNaN(parsed.runningTextSpeedSec)
          ? parsed.runningTextSpeedSec
          : DEFAULT_MEDIA.runningTextSpeedSec || 32,
      runningText:
        typeof parsed?.runningText === 'string' && parsed.runningText.trim() !== ''
          ? parsed.runningText
          : DEFAULT_MEDIA.runningText,
    };
  } catch {
    return DEFAULT_MEDIA;
  }
}

export function setStoredMedia(media: MediaSettings) {
  if (typeof window === 'undefined') return;
  const safeMedia: MediaSettings = {
    ...DEFAULT_MEDIA,
    ...media,
    slides: Array.isArray(media?.slides) && media.slides.length > 0 ? media.slides : DEFAULT_MEDIA.slides,
  };
  localStorage.setItem(STORAGE_KEYS.MEDIA, JSON.stringify(safeMedia));
}

export function getStoredAudio(): AudioSettings {
  if (typeof window === 'undefined') return DEFAULT_AUDIO;
  const raw = localStorage.getItem(STORAGE_KEYS.AUDIO);
  if (!raw) {
    localStorage.setItem(STORAGE_KEYS.AUDIO, JSON.stringify(DEFAULT_AUDIO));
    return DEFAULT_AUDIO;
  }
  try {
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_AUDIO,
      ...parsed,
      enabled: typeof parsed?.enabled === 'boolean' ? parsed.enabled : DEFAULT_AUDIO.enabled,
      chimeVolume:
        typeof parsed?.chimeVolume === 'number' && !isNaN(parsed.chimeVolume)
          ? parsed.chimeVolume
          : DEFAULT_AUDIO.chimeVolume,
      voiceVolume:
        typeof parsed?.voiceVolume === 'number' && !isNaN(parsed.voiceVolume)
          ? parsed.voiceVolume
          : DEFAULT_AUDIO.voiceVolume,
      voiceRate:
        typeof parsed?.voiceRate === 'number' && !isNaN(parsed.voiceRate)
          ? parsed.voiceRate
          : DEFAULT_AUDIO.voiceRate,
      voicePitch:
        typeof parsed?.voicePitch === 'number' && !isNaN(parsed.voicePitch)
          ? parsed.voicePitch
          : DEFAULT_AUDIO.voicePitch,
      bellType: parsed?.bellType || DEFAULT_AUDIO.bellType,
      voicePersona:
        parsed?.voicePersona === 'sarah_elevenlabs' || !parsed?.voicePersona
          ? 'gita_speechify'
          : parsed.voicePersona,
      elevenLabsApiKey:
        parsed?.elevenLabsApiKey && typeof parsed.elevenLabsApiKey === 'string' && parsed.elevenLabsApiKey.trim() !== ''
          ? parsed.elevenLabsApiKey.trim()
          : DEFAULT_AUDIO.elevenLabsApiKey,
      speechifyApiKey:
        parsed?.speechifyApiKey && typeof parsed.speechifyApiKey === 'string' && parsed.speechifyApiKey.trim() !== ''
          ? parsed.speechifyApiKey.trim()
          : DEFAULT_AUDIO.speechifyApiKey,
    };
  } catch {
    return DEFAULT_AUDIO;
  }
}

export function setStoredAudio(audio: AudioSettings) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.AUDIO, JSON.stringify(audio));
}

export function getStoredCompany(): CompanyProfile {
  if (typeof window === 'undefined') return DEFAULT_COMPANY;
  const raw = localStorage.getItem(STORAGE_KEYS.COMPANY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEYS.COMPANY, JSON.stringify(DEFAULT_COMPANY));
    return DEFAULT_COMPANY;
  }
  try {
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_COMPANY,
      ...parsed,
      name: parsed?.name || DEFAULT_COMPANY.name,
      tagline: parsed?.tagline || DEFAULT_COMPANY.tagline,
      address: parsed?.address || DEFAULT_COMPANY.address,
      phone: parsed?.phone || DEFAULT_COMPANY.phone,
      footerNote: parsed?.footerNote || DEFAULT_COMPANY.footerNote,
      timezone: parsed?.timezone || 'WIB',
      logoUrl: parsed?.logoUrl || '',
    };
  } catch {
    return DEFAULT_COMPANY;
  }
}

export function setStoredCompany(company: CompanyProfile) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.COMPANY, JSON.stringify(company));
}

export function getStoredLanSettings(): LanSettings {
  if (typeof window === 'undefined') return DEFAULT_LAN_SETTINGS;
  const raw = localStorage.getItem(STORAGE_KEYS.LAN);
  if (!raw) {
    localStorage.setItem(STORAGE_KEYS.LAN, JSON.stringify(DEFAULT_LAN_SETTINGS));
    return DEFAULT_LAN_SETTINGS;
  }
  try {
    const parsed = JSON.parse(raw);
    const serverPort =
      typeof parsed?.serverPort === 'number'
        ? parsed.serverPort
        : typeof parsed?.port === 'number'
        ? parsed.port
        : DEFAULT_LAN_SETTINGS.serverPort;

    const sharingEnabled =
      typeof parsed?.sharingEnabled === 'boolean'
        ? parsed.sharingEnabled
        : typeof parsed?.shareActive === 'boolean'
        ? parsed.shareActive
        : DEFAULT_LAN_SETTINGS.sharingEnabled;

    return {
      ...DEFAULT_LAN_SETTINGS,
      ...parsed,
      serverIp: parsed?.serverIp || DEFAULT_LAN_SETTINGS.serverIp,
      serverPort,
      port: serverPort,
      sharingEnabled,
      shareActive: sharingEnabled,
      lanPassword:
        parsed?.lanPassword !== undefined ? String(parsed.lanPassword) : DEFAULT_LAN_SETTINGS.lanPassword,
    };
  } catch {
    return DEFAULT_LAN_SETTINGS;
  }
}

export function setStoredLanSettings(settings: LanSettings) {
  if (typeof window === 'undefined') return;
  const serverPort = settings.serverPort || settings.port || 3000;
  const sharingEnabled =
    typeof settings.sharingEnabled === 'boolean'
      ? settings.sharingEnabled
      : typeof settings.shareActive === 'boolean'
      ? settings.shareActive
      : true;

  const normalized: LanSettings = {
    ...settings,
    serverPort,
    port: serverPort,
    sharingEnabled,
    shareActive: sharingEnabled,
  };
  localStorage.setItem(STORAGE_KEYS.LAN, JSON.stringify(normalized));
}

export function getStoredActiveTicket(): QueueItem | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_TICKET);
  if (!raw) {
    // Default to the ticket being called
    const queues = getStoredQueues();
    return queues.find((q) => q.status === 'calling') || queues.find((q) => q.status === 'serving') || null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredActiveTicket(ticket: QueueItem | null) {
  if (typeof window === 'undefined') return;
  if (ticket) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_TICKET, JSON.stringify(ticket));
  } else {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_TICKET);
  }
}
