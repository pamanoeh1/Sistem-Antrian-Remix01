import type { PenjagaAccount, AdminCredentials } from '../utils/authLogic';
import type { OtpGatewaySettings } from '../utils/otpProviderLogic';

export type QueueStatus = 'waiting' | 'calling' | 'serving' | 'completed' | 'skipped';

export interface QueueItem {
  id: string;
  number: string;
  prefix: string;
  sequenceNumber: number;
  serviceId: string;
  serviceName: string;
  counterId: string | null;
  counterName: string | null;
  status: QueueStatus;
  createdAt: string;
  calledAt: string | null;
  completedAt: string | null;
  callCount: number;
  customerNotes?: string;
}

export interface ServiceCategory {
  id: string;
  prefix: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  estimatedMinutes: number;
  active: boolean;
}

export interface Counter {
  id: string;
  name: string;
  operatorName: string;
  operatorUsername?: string;
  supportedServiceIds: string[];
  currentTicketId: string | null;
  status: 'open' | 'closed' | 'break';
}

export interface SlideItem {
  id: string;
  title: string;
  url: string; // URL or Data URL (base64) from local file
  caption: string;
  fileName?: string;
}

export interface MediaSettings {
  type: 'video' | 'slideshow';
  videoSource: 'preset' | 'url' | 'local';
  videoUrl: string; // URL or local video Data URL / Blob URL
  videoFileName?: string;
  slides: SlideItem[];
  slideDurationSec: number;
  runningText: string;
  runningTextSpeedSec?: number; // Kecepatan teks berjalan dalam detik per siklus
}

export interface VoicePersona {
  id: string;
  name: string;
  provider:
    | 'ElevenLabs'
    | 'Speechify'
    | 'Fish Audio'
    | 'Kokoro TTS'
    | 'Cartesia Sonic'
    | 'OpenAI TTS'
    | 'Web Speech ID';
  elevenLabsVoiceId?: string;
  speechifyVoiceId?: string;
  fishAudioReferenceId?: string;
  kokoroVoiceId?: string;
  cartesiaVoiceId?: string;
  openAiVoiceId?: string;
  gender: 'female' | 'male';
  description: string;
  pitch: number;
  rate: number;
  lang: string;
}

export interface AudioSettings {
  enabled: boolean;
  chimeVolume: number;
  voiceVolume: number;
  voiceRate: number;
  voicePitch: number;
  repeatTimes: number;
  bellType: 'dingdong' | 'chime' | 'airport';
  voicePersona: string;
  elevenLabsApiKey?: string;
  elevenLabsVoiceId?: string;
  speechifyApiKey?: string;
  fishAudioApiKey?: string;
  fishAudioReferenceId?: string;
  kokoroApiKey?: string;
  kokoroBaseUrl?: string;
  cartesiaApiKey?: string;
  openAiApiKey?: string;
}

export type TimezoneCode = 'WIB' | 'WITA' | 'WIT';

export interface CompanyProfile {
  name: string;
  tagline: string;
  address: string;
  phone: string;
  footerNote: string;
  logoUrl?: string; // Optional custom logo image URL or base64
  timezone: TimezoneCode; // WIB (UTC+7), WITA (UTC+8), WIT (UTC+9)
}

export type SyncMode = 'auto' | 'socket' | 'php';

export interface LanSettings {
  serverIp: string;
  serverPort: number;
  sharingEnabled: boolean;
  lanPassword: string;
  port?: number;
  shareActive?: boolean;
  syncMode?: SyncMode;
  customServerUrl?: string;
  phpSyncUrl?: string;
  otpGateway?: OtpGatewaySettings;
}

export interface QueueSyncEvent {
  type:
    | 'TICKET_CREATED'
    | 'TICKET_CALLED'
    | 'TICKET_RECALLED'
    | 'TICKET_COMPLETED'
    | 'TICKET_SKIPPED'
    | 'STATE_RESET'
    | 'COUNTER_UPDATED'
    | 'AUDIO_UPDATED'
    | 'MEDIA_UPDATED'
    | 'COMPANY_UPDATED'
    | 'SERVICES_UPDATED'
    | 'ACCOUNTS_UPDATED'
    | 'ADMIN_CREDENTIALS_UPDATED'
    | 'LAN_SETTINGS_UPDATED'
    | 'SETTINGS_SYNC';
  ticket?: QueueItem;
  counter?: Counter;
  audioSettings?: AudioSettings;
  mediaSettings?: MediaSettings;
  company?: CompanyProfile;
  services?: ServiceCategory[];
  counters?: Counter[];
  queues?: QueueItem[];
  penjagaAccounts?: PenjagaAccount[];
  adminCredentials?: AdminCredentials;
  lanSettings?: LanSettings;
  timestamp: number;
  senderId?: string;
}
