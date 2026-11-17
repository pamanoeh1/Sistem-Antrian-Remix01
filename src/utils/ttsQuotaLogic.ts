/**
 * Shared credit/token exhaustion detection and metadata for AI TTS providers.
 */

export type TtsProviderName =
  | 'ElevenLabs'
  | 'Speechify'
  | 'Fish Audio'
  | 'Kokoro TTS'
  | 'Cartesia Sonic'
  | 'OpenAI TTS'
  | 'Web Speech ID';

export interface TtsQuotaAlert {
  provider: TtsProviderName;
  message: string;
  statusCode?: number;
  timestamp: number;
}

const QUOTA_ERROR_PATTERNS = [
  'quota_exceeded',
  'exceeds your quota',
  'insufficient_quota',
  'insufficient quota',
  'insufficient credit',
  'insufficient_credit',
  'insufficient balance',
  'credit balance',
  'credits exhausted',
  'out of credits',
  'no credits',
  'payment required',
  'billing_hard_limit_reached',
  'hard_limit_reached',
  'token limit',
  'rate limit exceeded',
  'kuota kredit',
  'kredit habis',
  'token api habis',
];

export function detectTtsQuotaExhausted(
  provider: TtsProviderName,
  httpStatus: number,
  rawBody: string
): TtsQuotaAlert | null {
  const lowerBody = (rawBody || '').toLowerCase();

  // HTTP 402 Payment Required always indicates exhausted credit/tokens
  if (httpStatus === 402) {
    return {
      provider,
      statusCode: httpStatus,
      timestamp: Date.now(),
      message: `Kredit / token API ${provider} telah habis (HTTP 402). Silakan isi ulang kredit atau pilih penyedia suara gratis lainnya.`,
    };
  }

  // HTTP 429 or JSON body matching quota/credit/token exhaustion
  const hasQuotaKeyword = QUOTA_ERROR_PATTERNS.some((kw) => lowerBody.includes(kw));
  if (httpStatus === 429 || hasQuotaKeyword) {
    const isQuotaOnly =
      hasQuotaKeyword ||
      (httpStatus === 429 &&
        (lowerBody.includes('quota') ||
          lowerBody.includes('credit') ||
          lowerBody.includes('limit') ||
          lowerBody.includes('balance') ||
          lowerBody === ''));

    if (isQuotaOnly) {
      return {
        provider,
        statusCode: httpStatus,
        timestamp: Date.now(),
        message: `Kredit / token API ${provider} habis atau mencapai batas pemakaian (HTTP ${httpStatus}). Harap periksa saldo token atau beralih ke suara lain.`,
      };
    }
  }

  return null;
}

export function cleanGenericBearerKey(rawKey: string): string {
  if (!rawKey) return '';
  let key = rawKey.trim().replace(/^["']|["']$/g, '');
  if (key.toLowerCase().startsWith('bearer ')) {
    key = key.substring(7).trim();
  }
  return key;
}

export function getFreeTierProviderSummary(provider: TtsProviderName): string {
  switch (provider) {
    case 'Fish Audio':
      return 'Tersedia kredit gratis starter di fish.audio untuk suara natural multibahasa.';
    case 'Kokoro TTS':
      return 'Model Open-Source 82M gratis tanpa batas kuota lokal / endpoint Kokoro-FastAPI.';
    case 'Cartesia Sonic':
      return 'Gratis kuota karakter bulanan di cartesia.ai dengan latensi super cepat (<150ms).';
    case 'OpenAI TTS':
      return 'Model gpt-4o-mini-tts / tts-1 dari platform.openai.com dengan pelafalan Bahasa Indonesia alami.';
    case 'Speechify':
      return 'Mendukung aksen Bahasa Indonesia ramah dan jernih via sws.speechify.com.';
    case 'ElevenLabs':
      return 'Model eleven_flash_v2_5 multibahasa dengan kualitas suara studio.';
    default:
      return 'Suara bawaan browser offline tanpa perlu API Key.';
  }
}
