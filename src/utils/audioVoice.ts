import { AudioSettings, VoicePersona } from '../types/queue';
import { formatIndonesianSpeechPhrase } from './queueLogic';
import {
  TtsQuotaAlert,
  TtsProviderName,
  detectTtsQuotaExhausted,
  cleanGenericBearerKey,
} from './ttsQuotaLogic';

export type { TtsQuotaAlert, TtsProviderName };

// Audio Context singleton for Web Audio chime synthesis
let audioCtx: AudioContext | null = null;
let currentAudioElement: HTMLAudioElement | null = null;
const ttsAudioCache = new Map<string, string>();

// Global credit/token exhaustion alert pub/sub for live UI notifications
let lastTtsQuotaAlert: TtsQuotaAlert | null = null;
const quotaAlertListeners = new Set<(alert: TtsQuotaAlert | null) => void>();

export function notifyTtsQuotaExhausted(alert: TtsQuotaAlert): void {
  lastTtsQuotaAlert = alert;
  quotaAlertListeners.forEach((cb) => {
    try {
      cb(alert);
    } catch {
      // ignore listener errors
    }
  });
}

export function getLastTtsQuotaAlert(): TtsQuotaAlert | null {
  return lastTtsQuotaAlert;
}

export function clearTtsQuotaAlert(): void {
  lastTtsQuotaAlert = null;
  quotaAlertListeners.forEach((cb) => {
    try {
      cb(null);
    } catch {
      // ignore
    }
  });
}

export function onTtsQuotaAlert(callback: (alert: TtsQuotaAlert | null) => void): () => void {
  quotaAlertListeners.add(callback);
  return () => {
    quotaAlertListeners.delete(callback);
  };
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Sanitizes Speechify API Key in case it was accidentally duplicated or has extra quotes/Bearer prefix
 */
export function cleanSpeechifyKey(rawKey: string): string {
  if (!rawKey) return '';
  let key = rawKey.trim().replace(/^["']|["']$/g, '');
  if (key.toLowerCase().startsWith('bearer ')) {
    key = key.substring(7).trim();
  }
  if (key.length > 50 && key.indexOf('sk_', 5) > 0) {
    key = key.substring(key.indexOf('sk_', 5));
  }
  return key;
}

/**
 * Sanitizes ElevenLabs API Key: strips whitespace, surrounding quotes, and optional 'Bearer ' prefix
 */
export function cleanElevenLabsKey(rawKey: string): string {
  if (!rawKey) return '';
  let key = rawKey.trim().replace(/^["']|["']$/g, '');
  if (key.toLowerCase().startsWith('bearer ')) {
    key = key.substring(7).trim();
  }
  return key;
}

/**
 * List of high-quality voice personas featuring Speechify AI (Indonesian narrators), ElevenLabs AI, and local fallback
 */
export const VOICE_PERSONAS: VoicePersona[] = [
  // --- SPEECHIFY AI PERSONAS (BAHASA INDONESIA) ---
  {
    id: 'gita_speechify',
    name: 'Gita (Speechify AI - Indonesia)',
    provider: 'Speechify',
    speechifyVoiceId: 'alicia',
    gender: 'female',
    description: 'Narator wanita ramah, santun, artikulasi jernih khas customer service Indonesia.',
    pitch: 1.0,
    rate: 1.0,
    lang: 'id-ID',
  },
  {
    id: 'budi_speechify',
    name: 'Budi (Speechify AI - Indonesia)',
    provider: 'Speechify',
    speechifyVoiceId: 'alfonso',
    gender: 'male',
    description: 'Narator pria berwibawa, mantap, dan resmi untuk pelayanan perbankan & instansi publik.',
    pitch: 1.0,
    rate: 1.0,
    lang: 'id-ID',
  },
  {
    id: 'siti_speechify',
    name: 'Siti (Speechify AI - Indonesia)',
    provider: 'Speechify',
    speechifyVoiceId: 'kristy',
    gender: 'female',
    description: 'Narator wanita bersuara lembut, anggun, dan menenangkan untuk ruang tunggu front office.',
    pitch: 1.0,
    rate: 1.0,
    lang: 'id-ID',
  },
  {
    id: 'lestari_speechify',
    name: 'Lestari (Speechify AI - Indonesia)',
    provider: 'Speechify',
    speechifyVoiceId: 'amihan',
    gender: 'female',
    description: 'Narator wanita fonetik Nusantara dengan intonasi pemanggilan loket yang sangat natural dan fasih.',
    pitch: 1.0,
    rate: 1.0,
    lang: 'id-ID',
  },

  // --- ELEVENLABS AI PERSONAS (BAHASA INDONESIA) ---
  {
    id: 'bella_elevenlabs',
    name: 'Bella (ElevenLabs AI - Indonesia)',
    provider: 'ElevenLabs',
    elevenLabsVoiceId: 'hpp4J3VqNfWAUOO0d1Us',
    gender: 'female',
    description: 'Suara wanita jernih, profesional, artikulasi sangat jelas untuk pengumuman loket dalam Bahasa Indonesia.',
    pitch: 1.0,
    rate: 1.0,
    lang: 'id-ID',
  },
  {
    id: 'daniel_elevenlabs',
    name: 'Daniel (ElevenLabs AI - Indonesia)',
    provider: 'ElevenLabs',
    elevenLabsVoiceId: 'onwK4e9ZLuTAKqWW03F9',
    gender: 'male',
    description: 'Suara pria berwibawa, mantap, dan resmi seperti penyiar bandara & instansi perbankan.',
    pitch: 1.0,
    rate: 1.0,
    lang: 'id-ID',
  },
  {
    id: 'alice_elevenlabs',
    name: 'Alice (ElevenLabs AI - Indonesia)',
    provider: 'ElevenLabs',
    elevenLabsVoiceId: 'Xb7hH8MSUJpSbSDYk0k2',
    gender: 'female',
    description: 'Suara wanita elegan, tenang, dan berkarakter ramah untuk front office.',
    pitch: 1.0,
    rate: 1.0,
    lang: 'id-ID',
  },
  {
    id: 'brian_elevenlabs',
    name: 'Brian (ElevenLabs AI - Indonesia)',
    provider: 'ElevenLabs',
    elevenLabsVoiceId: 'nPczCjzI2devNBz1zQrb',
    gender: 'male',
    description: 'Suara bariton berwibawa, teduh, dan ramah untuk ruang tunggu yang tenang.',
    pitch: 1.0,
    rate: 1.0,
    lang: 'id-ID',
  },
  {
    id: 'jessica_elevenlabs',
    name: 'Jessica (ElevenLabs AI - Indonesia)',
    provider: 'ElevenLabs',
    elevenLabsVoiceId: 'cgSgspJ2msm6clMCkdW9',
    gender: 'female',
    description: 'Suara wanita ceria, segar, dan bersahabat untuk customer service dinamis.',
    pitch: 1.0,
    rate: 1.0,
    lang: 'id-ID',
  },

  // --- COMPATIBILITY ALIASES FOR PREVIOUS SELECTIONS ---
  {
    id: 'alicia_speechify',
    name: 'Alicia (Speechify AI - Indonesia)',
    provider: 'Speechify',
    speechifyVoiceId: 'alicia',
    gender: 'female',
    description: 'Narator wanita ramah dan artikulasi jernih dari Speechify API.',
    pitch: 1.0,
    rate: 1.0,
    lang: 'id-ID',
  },
  {
    id: 'alfonso_speechify',
    name: 'Alfonso (Speechify AI - Indonesia)',
    provider: 'Speechify',
    speechifyVoiceId: 'alfonso',
    gender: 'male',
    description: 'Narator pria berwibawa dari Speechify API.',
    pitch: 1.0,
    rate: 1.0,
    lang: 'id-ID',
  },
  {
    id: 'kristy_speechify',
    name: 'Kristy (Speechify AI - Indonesia)',
    provider: 'Speechify',
    speechifyVoiceId: 'kristy',
    gender: 'female',
    description: 'Narator wanita elegan dari Speechify API.',
    pitch: 1.0,
    rate: 1.0,
    lang: 'id-ID',
  },

  // --- FISH AUDIO AI PERSONAS (FREE STARTER CREDITS) ---
  {
    id: 'sari_fishaudio',
    name: 'Sari (Fish Audio AI - Indonesia)',
    provider: 'Fish Audio',
    fishAudioReferenceId: '',
    gender: 'female',
    description: 'Suara wanita hangat dan alami dari Fish Audio Speech-1.6 (tersedia kuota gratis starter).',
    pitch: 1.0,
    rate: 1.0,
    lang: 'id-ID',
  },
  {
    id: 'bagus_fishaudio',
    name: 'Bagus (Fish Audio AI - Indonesia)',
    provider: 'Fish Audio',
    fishAudioReferenceId: '',
    gender: 'male',
    description: 'Suara pria tegas dan informatif dari Fish Audio AI untuk pengumuman loket pelayanan.',
    pitch: 1.0,
    rate: 1.0,
    lang: 'id-ID',
  },

  // --- KOKORO TTS PERSONAS (GRATIS / OPEN-SOURCE) ---
  {
    id: 'bella_kokoro',
    name: 'Bella (Kokoro TTS - Gratis)',
    provider: 'Kokoro TTS',
    kokoroVoiceId: 'af_bella',
    gender: 'female',
    description: 'Model TTS open-source 82M gratis (Kokoro-FastAPI / API publik) jernih & bebas batas.',
    pitch: 1.0,
    rate: 1.0,
    lang: 'id-ID',
  },
  {
    id: 'adam_kokoro',
    name: 'Adam (Kokoro TTS - Gratis)',
    provider: 'Kokoro TTS',
    kokoroVoiceId: 'am_adam',
    gender: 'male',
    description: 'Narator pria open-source Kokoro TTS yang stabil dan ringan untuk antrean harian.',
    pitch: 1.0,
    rate: 1.0,
    lang: 'id-ID',
  },

  // --- CARTESIA SONIC API PERSONAS (FREE TIER) ---
  {
    id: 'maya_cartesia',
    name: 'Maya (Cartesia Sonic - Indonesia)',
    provider: 'Cartesia Sonic',
    cartesiaVoiceId: 'f786b574-daa5-4673-aa0c-cbe3e8534c02',
    gender: 'female',
    description: 'Suara wanita ekspresif super cepat (<150ms) dari Cartesia Sonic-2 multibahasa Indonesia.',
    pitch: 1.0,
    rate: 1.0,
    lang: 'id-ID',
  },
  {
    id: 'reza_cartesia',
    name: 'Reza (Cartesia Sonic - Indonesia)',
    provider: 'Cartesia Sonic',
    cartesiaVoiceId: 'a0e99841-438c-4a64-b679-ae501e7d6091',
    gender: 'male',
    description: 'Narator pria profesional berlatensi rendah dari Cartesia Sonic API.',
    pitch: 1.0,
    rate: 1.0,
    lang: 'id-ID',
  },

  // --- OPENAI TEXT-TO-SPEECH (TTS) PERSONAS ---
  {
    id: 'nova_openai',
    name: 'Nova (OpenAI TTS - Indonesia)',
    provider: 'OpenAI TTS',
    openAiVoiceId: 'nova',
    gender: 'female',
    description: 'Suara wanita cerah & artikulatif dari OpenAI gpt-4o-mini-tts berbahasa Indonesia fasih.',
    pitch: 1.0,
    rate: 1.0,
    lang: 'id-ID',
  },
  {
    id: 'onyx_openai',
    name: 'Onyx (OpenAI TTS - Indonesia)',
    provider: 'OpenAI TTS',
    openAiVoiceId: 'onyx',
    gender: 'male',
    description: 'Suara pria berwibawa dalam dan resmi dari OpenAI Text-to-Speech API.',
    pitch: 1.0,
    rate: 1.0,
    lang: 'id-ID',
  },
  {
    id: 'shimmer_openai',
    name: 'Shimmer (OpenAI TTS - Indonesia)',
    provider: 'OpenAI TTS',
    openAiVoiceId: 'shimmer',
    gender: 'female',
    description: 'Suara wanita lembut & tenang dari OpenAI TTS cocok untuk klinik & kantor layanan.',
    pitch: 1.0,
    rate: 1.0,
    lang: 'id-ID',
  },

  // --- DEFAULT BROWSER OFFLINE FALLBACK ---
  {
    id: 'system_indonesian',
    name: 'Default Sistem Browser (id-ID)',
    provider: 'Web Speech ID',
    gender: 'female',
    description: 'Suara bawaan sistem operasi / browser offline tanpa internet luar.',
    pitch: 1.0,
    rate: 1.0,
    lang: 'id-ID',
  },
];

/**
 * Validates Speechify API Key by querying voice list
 */
export async function testSpeechifyApiKey(
  apiKey: string
): Promise<{ success: boolean; message: string; voiceCount?: number; quotaExceeded?: boolean }> {
  const cleaned = cleanSpeechifyKey(apiKey || '');
  if (!cleaned) {
    return { success: false, message: 'API Key Speechify tidak boleh kosong.' };
  }

  // Prioritize relative proxy path in browser environments to avoid CORS
  const endpoints = [
    '/api/speechify/v1/voices',
    'https://api.sws.speechify.com/v1/voices',
  ];

  let lastError = '';

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${cleaned}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        const count = Array.isArray(data.voices) ? data.voices.length : 0;
        return {
          success: true,
          message: `Koneksi Speechify Berhasil! Narator Bahasa Indonesia siap digunakan (${count} suara terhubung).`,
          voiceCount: count,
        };
      } else {
        const rawErr = await res.text().catch(() => '');
        const quotaAlert = detectTtsQuotaExhausted('Speechify', res.status, rawErr);
        if (quotaAlert) {
          notifyTtsQuotaExhausted(quotaAlert);
          return {
            success: false,
            quotaExceeded: true,
            message: quotaAlert.message,
          };
        }
        let errMsg = `HTTP ${res.status}: ${res.statusText}`;
        try {
          const parsed = JSON.parse(rawErr);
          if (parsed?.error?.message) errMsg = parsed.error.message;
        } catch {
          // ignore
        }
        lastError = errMsg;
      }
    } catch (e: unknown) {
      lastError = e instanceof Error ? e.message : 'Gagal menghubungi server Speechify';
    }
  }

  return {
    success: false,
    message: `Koneksi Speechify Gagal: ${lastError}`,
  };
}

/**
 * Generates Speechify TTS MP3 audio base64 data URL
 */
export async function fetchSpeechifyAudio(
  text: string,
  voiceId: string,
  apiKey: string
): Promise<string> {
  const cleanedKey = cleanSpeechifyKey(apiKey);
  const cacheKey = `speechify_${voiceId}_${text}`;
  const cachedUrl = ttsAudioCache.get(cacheKey);
  if (cachedUrl) {
    return cachedUrl;
  }

  const payload = {
    input: text,
    voice_id: voiceId,
    audio_format: 'mp3',
  };

  const endpoints = [
    '/api/speechify/v1/audio/speech',
    'https://api.sws.speechify.com/v1/audio/speech',
  ];

  let lastError: Error | null = null;

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cleanedKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audio_data) {
          const dataUrl = `data:audio/mp3;base64,${data.audio_data}`;
          ttsAudioCache.set(cacheKey, dataUrl);
          return dataUrl;
        }
      } else {
        const errorText = await res.text();
        const quotaAlert = detectTtsQuotaExhausted('Speechify', res.status, errorText);
        if (quotaAlert) {
          notifyTtsQuotaExhausted(quotaAlert);
          throw new Error(quotaAlert.message);
        }
        throw new Error(`Speechify error (${res.status}): ${errorText}`);
      }
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError || new Error('Gagal memproses audio dari Speechify');
}

/**
 * Validates ElevenLabs API Key by querying voice list and testing quota
 */
export async function testElevenLabsApiKey(
  apiKey: string
): Promise<{ success: boolean; message: string; voiceCount?: number; quotaExceeded?: boolean }> {
  const cleaned = cleanElevenLabsKey(apiKey || '');
  if (!cleaned) {
    return { success: false, message: 'API Key ElevenLabs tidak boleh kosong.' };
  }

  const endpoints = [
    '/api/elevenlabs/v1/voices',
    'https://api.elevenlabs.io/v1/voices',
  ];

  let lastError = '';

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'xi-api-key': cleaned,
        },
      });

      if (res.ok) {
        const data = await res.json();
        const count = Array.isArray(data.voices) ? data.voices.length : 0;

        // Perform a micro test call to verify remaining credit quota!
        const ttsEndpoints = [
          '/api/elevenlabs/v1/text-to-speech/hpp4J3VqNfWAUOO0d1Us',
          'https://api.elevenlabs.io/v1/text-to-speech/hpp4J3VqNfWAUOO0d1Us',
        ];

        for (const ttsUrl of ttsEndpoints) {
          try {
            const ttsRes = await fetch(ttsUrl, {
              method: 'POST',
              headers: {
                'xi-api-key': cleaned,
                'Content-Type': 'application/json',
                Accept: 'audio/mpeg',
              },
              body: JSON.stringify({
                text: 'A',
                model_id: 'eleven_flash_v2_5',
              }),
            });

            if (ttsRes.ok) {
              return {
                success: true,
                message: `Koneksi ElevenLabs Berhasil! API Key aktif dan kuota tersedia (${count} suara terhubung).`,
                voiceCount: count,
              };
            } else {
              const errBody = await ttsRes.text().catch(() => '');
              const quotaAlert = detectTtsQuotaExhausted('ElevenLabs', ttsRes.status, errBody);
              if (quotaAlert) {
                notifyTtsQuotaExhausted(quotaAlert);
                return {
                  success: false,
                  quotaExceeded: true,
                  message: `Koneksi ElevenLabs terhubung (${count} suara), namun kuota kredit akun ElevenLabs Anda habis. Harap top up kuota kredit Anda di elevenlabs.io.`,
                  voiceCount: count,
                };
              }
            }
          } catch {
            // ignore network error in micro test
          }
        }

        return {
          success: true,
          message: `Koneksi ElevenLabs Berhasil! Ditemukan ${count} suara aktif.`,
          voiceCount: count,
        };
      } else {
        const errJson = await res.json().catch(() => null);
        const errMsg = errJson?.detail?.message || `HTTP ${res.status}: ${res.statusText}`;
        lastError = errMsg;
      }
    } catch (e: unknown) {
      lastError = e instanceof Error ? e.message : 'Gagal menghubungi server ElevenLabs';
    }
  }

  return {
    success: false,
    message: `Koneksi ElevenLabs Gagal: ${lastError}`,
  };
}

/**
 * Generates ElevenLabs TTS MP3 audio blob URL with in-memory caching and multi-model support
 */
export async function fetchElevenLabsAudio(
  text: string,
  voiceId: string,
  apiKey: string
): Promise<string> {
  const cleanedKey = cleanElevenLabsKey(apiKey);
  if (!cleanedKey) {
    throw new Error('API Key ElevenLabs tidak ditemukan');
  }

  const cacheKey = `elevenlabs_${voiceId}_${text}`;
  const cachedUrl = ttsAudioCache.get(cacheKey);
  if (cachedUrl) {
    return cachedUrl;
  }

  // Use fast multilingual eleven_flash_v2_5 first (supports 32 languages including Indonesian, low latency)
  // then fallback to eleven_multilingual_v2
  const modelsToTry = ['eleven_flash_v2_5', 'eleven_multilingual_v2'];
  const endpoints = [
    `/api/elevenlabs/v1/text-to-speech/${voiceId}`,
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
  ];

  let lastError: Error | null = null;

  for (const modelId of modelsToTry) {
    const payload = {
      text,
      model_id: modelId,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.85,
      },
    };

    for (const url of endpoints) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'xi-api-key': cleanedKey,
            'Content-Type': 'application/json',
            Accept: 'audio/mpeg',
          },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const blob = await res.blob();
          const objectUrl = URL.createObjectURL(blob);
          ttsAudioCache.set(cacheKey, objectUrl);
          return objectUrl;
        } else {
          const errorText = await res.text();
          let parsedMsg = errorText;
          try {
            const errObj = JSON.parse(errorText);
            if (errObj?.detail?.message) {
              parsedMsg = errObj.detail.message;
            }
          } catch {
            // keep errorText
          }

          const quotaAlert = detectTtsQuotaExhausted('ElevenLabs', res.status, errorText);
          if (quotaAlert) {
            notifyTtsQuotaExhausted(quotaAlert);
            throw new Error('Kuota kredit ElevenLabs Anda telah habis. Harap top up kuota di akun ElevenLabs Anda.');
          }
          lastError = new Error(`ElevenLabs error (${res.status}): ${parsedMsg}`);
        }
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (lastError.message.includes('Kuota kredit ElevenLabs')) {
          throw lastError;
        }
      }
    }
  }

  throw lastError || new Error('Gagal memproses audio dari ElevenLabs');
}

/**
 * Validates Fish Audio API Key and checks remaining wallet credit
 */
export async function testFishAudioApiKey(
  apiKey: string
): Promise<{ success: boolean; message: string; quotaExceeded?: boolean }> {
  const cleaned = cleanGenericBearerKey(apiKey || '');
  if (!cleaned) {
    return { success: false, message: 'API Key Fish Audio tidak boleh kosong.' };
  }

  const walletEndpoints = [
    '/api/fishaudio/wallet/self/api-credit',
    'https://api.fish.audio/wallet/self/api-credit',
  ];

  let lastError = '';
  for (const url of walletEndpoints) {
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${cleaned}` },
      });
      if (res.ok) {
        const data = (await res.json().catch(() => null)) as { credit?: number } | null;
        if (typeof data?.credit === 'number' && data.credit <= 0) {
          const alert = {
            provider: 'Fish Audio' as const,
            statusCode: 402,
            timestamp: Date.now(),
            message: 'Kredit API Fish Audio Anda habis (saldo 0). Silakan isi ulang di fish.audio atau pilih Kokoro TTS gratis.',
          };
          notifyTtsQuotaExhausted(alert);
          return { success: false, quotaExceeded: true, message: alert.message };
        }
        return {
          success: true,
          message:
            typeof data?.credit === 'number'
              ? `Koneksi Fish Audio Berhasil! Sisa kredit API: $${Number(data.credit).toFixed(2)}.`
              : 'Koneksi Fish Audio Berhasil! Narator Bahasa Indonesia siap digunakan.',
        };
      }
      const errText = await res.text().catch(() => '');
      const quotaAlert = detectTtsQuotaExhausted('Fish Audio', res.status, errText);
      if (quotaAlert) {
        notifyTtsQuotaExhausted(quotaAlert);
        return { success: false, quotaExceeded: true, message: quotaAlert.message };
      }
      lastError = `HTTP ${res.status}: ${errText || res.statusText}`;
    } catch (e: unknown) {
      lastError = e instanceof Error ? e.message : 'Gagal menghubungi Fish Audio';
    }
  }

  return { success: false, message: `Koneksi Fish Audio Gagal: ${lastError}` };
}

export async function fetchFishAudio(
  text: string,
  referenceId: string,
  apiKey: string
): Promise<string> {
  const cleanedKey = cleanGenericBearerKey(apiKey);
  if (!cleanedKey) throw new Error('API Key Fish Audio tidak ditemukan');

  const cacheKey = `fish_${referenceId}_${text}`;
  const cached = ttsAudioCache.get(cacheKey);
  if (cached) return cached;

  const payload: Record<string, unknown> = {
    text,
    format: 'mp3',
  };
  if (referenceId?.trim()) {
    payload.reference_id = referenceId.trim();
  }

  const endpoints = ['/api/fishaudio/v1/tts', 'https://api.fish.audio/v1/tts'];
  let lastError: Error | null = null;

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cleanedKey}`,
          'Content-Type': 'application/json',
          model: 'speech-1.6',
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        ttsAudioCache.set(cacheKey, objectUrl);
        return objectUrl;
      }
      const errText = await res.text().catch(() => '');
      const quotaAlert = detectTtsQuotaExhausted('Fish Audio', res.status, errText);
      if (quotaAlert) {
        notifyTtsQuotaExhausted(quotaAlert);
        throw new Error(quotaAlert.message);
      }
      lastError = new Error(`Fish Audio error (${res.status}): ${errText}`);
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError || new Error('Gagal memproses audio dari Fish Audio');
}

/**
 * Kokoro TTS (Open-Source Gratis via Kokoro-FastAPI atau Cloud Kokoro API)
 */
function buildKokoroEndpoints(customBaseUrl?: string): string[] {
  const trimmed = (customBaseUrl || '').trim().replace(/\/+$/, '');
  const list: string[] = [];
  if (trimmed && !trimmed.includes('api.kokorotts.com')) {
    list.push(`${trimmed}/v1/audio/speech`);
  }
  list.push('/api/kokoro/v1/audio/speech', 'https://api.kokorotts.com/v1/audio/speech');
  return list;
}

export async function testKokoroApiKey(
  apiKey?: string,
  baseUrl?: string
): Promise<{ success: boolean; message: string; quotaExceeded?: boolean }> {
  const cleaned = cleanGenericBearerKey(apiKey || '');
  const endpoints = buildKokoroEndpoints(baseUrl);
  let lastError = '';

  for (const url of endpoints) {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (cleaned) headers.Authorization = `Bearer ${cleaned}`;
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: 'kokoro',
          input: 'Tes suara antrean',
          voice: 'af_bella',
          response_format: 'mp3',
        }),
      });
      if (res.ok) {
        return {
          success: true,
          message: 'Koneksi Kokoro TTS Berhasil! Narator open-source gratis siap memanggil antrean.',
        };
      }
      const errText = await res.text().catch(() => '');
      const quotaAlert = detectTtsQuotaExhausted('Kokoro TTS', res.status, errText);
      if (quotaAlert) {
        notifyTtsQuotaExhausted(quotaAlert);
        return { success: false, quotaExceeded: true, message: quotaAlert.message };
      }
      lastError = `HTTP ${res.status}: ${errText || res.statusText}`;
    } catch (e: unknown) {
      lastError = e instanceof Error ? e.message : 'Gagal menghubungi server Kokoro TTS';
    }
  }

  return { success: false, message: `Koneksi Kokoro TTS Gagal: ${lastError}` };
}

export async function fetchKokoroAudio(
  text: string,
  voiceId: string,
  apiKey?: string,
  baseUrl?: string
): Promise<string> {
  const cleanedKey = cleanGenericBearerKey(apiKey || '');
  const cacheKey = `kokoro_${voiceId}_${text}`;
  const cached = ttsAudioCache.get(cacheKey);
  if (cached) return cached;

  const endpoints = buildKokoroEndpoints(baseUrl);
  let lastError: Error | null = null;

  for (const url of endpoints) {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (cleanedKey) headers.Authorization = `Bearer ${cleanedKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: 'kokoro',
          input: text,
          voice: voiceId || 'af_bella',
          response_format: 'mp3',
        }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        ttsAudioCache.set(cacheKey, objectUrl);
        return objectUrl;
      }
      const errText = await res.text().catch(() => '');
      const quotaAlert = detectTtsQuotaExhausted('Kokoro TTS', res.status, errText);
      if (quotaAlert) {
        notifyTtsQuotaExhausted(quotaAlert);
        throw new Error(quotaAlert.message);
      }
      lastError = new Error(`Kokoro TTS error (${res.status}): ${errText}`);
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError || new Error('Gagal memproses audio dari Kokoro TTS');
}

/**
 * Cartesia Sonic API (Ultra-low latency multilingual Indonesian TTS)
 */
export async function testCartesiaApiKey(
  apiKey: string
): Promise<{ success: boolean; message: string; voiceCount?: number; quotaExceeded?: boolean }> {
  const cleaned = cleanGenericBearerKey(apiKey || '');
  if (!cleaned) {
    return { success: false, message: 'API Key Cartesia Sonic tidak boleh kosong.' };
  }

  const ttsEndpoints = ['/api/cartesia/tts/bytes', 'https://api.cartesia.ai/tts/bytes'];
  let lastError = '';

  for (const url of ttsEndpoints) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'X-API-Key': cleaned,
          'Cartesia-Version': '2024-06-10',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model_id: 'sonic-2',
          transcript: 'Tes',
          voice: { mode: 'id', id: 'f786b574-daa5-4673-aa0c-cbe3e8534c02' },
          output_format: { container: 'mp3', encoding: 'mp3', sample_rate: 44100 },
          language: 'id',
        }),
      });
      if (res.ok) {
        return {
          success: true,
          message: 'Koneksi Cartesia Sonic API Berhasil! Kredit tersedia dan siap digunakan.',
        };
      }
      const errText = await res.text().catch(() => '');
      const quotaAlert = detectTtsQuotaExhausted('Cartesia Sonic', res.status, errText);
      if (quotaAlert) {
        notifyTtsQuotaExhausted(quotaAlert);
        return { success: false, quotaExceeded: true, message: quotaAlert.message };
      }
      lastError = `HTTP ${res.status}: ${errText || res.statusText}`;
    } catch (e: unknown) {
      lastError = e instanceof Error ? e.message : 'Gagal menghubungi Cartesia Sonic';
    }
  }

  return { success: false, message: `Koneksi Cartesia Sonic Gagal: ${lastError}` };
}

export async function fetchCartesiaAudio(
  text: string,
  voiceId: string,
  apiKey: string
): Promise<string> {
  const cleanedKey = cleanGenericBearerKey(apiKey);
  if (!cleanedKey) throw new Error('API Key Cartesia Sonic tidak ditemukan');

  const cacheKey = `cartesia_${voiceId}_${text}`;
  const cached = ttsAudioCache.get(cacheKey);
  if (cached) return cached;

  const endpoints = ['/api/cartesia/tts/bytes', 'https://api.cartesia.ai/tts/bytes'];
  let lastError: Error | null = null;

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'X-API-Key': cleanedKey,
          'Cartesia-Version': '2024-06-10',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model_id: 'sonic-2',
          transcript: text,
          voice: { mode: 'id', id: voiceId },
          output_format: { container: 'mp3', encoding: 'mp3', sample_rate: 44100 },
          language: 'id',
        }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        ttsAudioCache.set(cacheKey, objectUrl);
        return objectUrl;
      }
      const errText = await res.text().catch(() => '');
      const quotaAlert = detectTtsQuotaExhausted('Cartesia Sonic', res.status, errText);
      if (quotaAlert) {
        notifyTtsQuotaExhausted(quotaAlert);
        throw new Error(quotaAlert.message);
      }
      lastError = new Error(`Cartesia error (${res.status}): ${errText}`);
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError || new Error('Gagal memproses audio dari Cartesia Sonic');
}

/**
 * OpenAI Text-to-Speech (TTS) API
 */
export async function testOpenAiTtsApiKey(
  apiKey: string
): Promise<{ success: boolean; message: string; quotaExceeded?: boolean }> {
  const cleaned = cleanGenericBearerKey(apiKey || '');
  if (!cleaned) {
    return { success: false, message: 'API Key OpenAI TTS tidak boleh kosong.' };
  }

  const endpoints = ['/api/openai/v1/audio/speech', 'https://api.openai.com/v1/audio/speech'];
  let lastError = '';

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cleaned}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: 'Tes suara',
          voice: 'nova',
          response_format: 'mp3',
        }),
      });
      if (res.ok) {
        return {
          success: true,
          message: 'Koneksi OpenAI Text-to-Speech (TTS) Berhasil! Kredit token tersedia.',
        };
      }
      const errText = await res.text().catch(() => '');
      const quotaAlert = detectTtsQuotaExhausted('OpenAI TTS', res.status, errText);
      if (quotaAlert) {
        notifyTtsQuotaExhausted(quotaAlert);
        return { success: false, quotaExceeded: true, message: quotaAlert.message };
      }
      lastError = `HTTP ${res.status}: ${errText || res.statusText}`;
    } catch (e: unknown) {
      lastError = e instanceof Error ? e.message : 'Gagal menghubungi OpenAI API';
    }
  }

  return { success: false, message: `Koneksi OpenAI TTS Gagal: ${lastError}` };
}

export async function fetchOpenAiTtsAudio(
  text: string,
  voiceId: string,
  apiKey: string
): Promise<string> {
  const cleanedKey = cleanGenericBearerKey(apiKey);
  if (!cleanedKey) throw new Error('API Key OpenAI TTS tidak ditemukan');

  const cacheKey = `openai_${voiceId}_${text}`;
  const cached = ttsAudioCache.get(cacheKey);
  if (cached) return cached;

  const models = ['gpt-4o-mini-tts', 'tts-1'];
  const endpoints = ['/api/openai/v1/audio/speech', 'https://api.openai.com/v1/audio/speech'];
  let lastError: Error | null = null;

  for (const model of models) {
    for (const url of endpoints) {
      try {
        const payload: Record<string, unknown> = {
          model,
          input: text,
          voice: voiceId || 'nova',
          response_format: 'mp3',
        };
        if (model === 'gpt-4o-mini-tts') {
          payload.instructions =
            'Speak clearly and politely in natural fluent Indonesian as a queue service announcer.';
        }
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${cleanedKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const blob = await res.blob();
          const objectUrl = URL.createObjectURL(blob);
          ttsAudioCache.set(cacheKey, objectUrl);
          return objectUrl;
        }
        const errText = await res.text().catch(() => '');
        const quotaAlert = detectTtsQuotaExhausted('OpenAI TTS', res.status, errText);
        if (quotaAlert) {
          notifyTtsQuotaExhausted(quotaAlert);
          throw new Error(quotaAlert.message);
        }
        lastError = new Error(`OpenAI TTS error (${res.status}): ${errText}`);
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (lastError.message.includes('Kredit / token API')) throw lastError;
      }
    }
  }

  throw lastError || new Error('Gagal memproses audio dari OpenAI TTS');
}

// Global sequencing, deduplication, and preemption controllers
let currentCallGeneration = 0;
let lastCallKey = '';
let lastCallTimestamp = 0;
const activeGainNodes: GainNode[] = [];

/**
 * Stops any ongoing audio playback, bell oscillators, or speech synthesis immediately
 */
export function stopCurrentSpeech(): void {
  currentCallGeneration++;

  // 1. Abort HTML Audio element
  if (currentAudioElement) {
    try {
      currentAudioElement.pause();
      currentAudioElement.currentTime = 0;
      currentAudioElement.src = '';
    } catch {
      // ignore
    }
    currentAudioElement = null;
  }

  // 2. Abort Web Speech API
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }

  // 3. Silence any currently resonating Web Audio chime nodes
  while (activeGainNodes.length > 0) {
    const gainNode = activeGainNodes.pop();
    if (gainNode) {
      try {
        gainNode.gain.cancelScheduledValues(0);
        gainNode.gain.setValueAtTime(0, 0);
        gainNode.disconnect();
      } catch {
        // ignore
      }
    }
  }
}

/**
 * Synthesizes a realistic Ding-Dong chime using Web Audio API oscillators.
 */
export async function playBellSound(
  bellType: 'dingdong' | 'chime' | 'airport' = 'dingdong',
  volume = 0.8
): Promise<void> {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(Math.max(0.01, Math.min(1, volume)), ctx.currentTime);
    masterGain.connect(ctx.destination);
    activeGainNodes.push(masterGain);

    const playTone = (freq: number, startTime: number, duration: number, peak = 0.5) => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      const overtone = ctx.createOscillator();
      const overGain = ctx.createGain();
      overtone.type = 'triangle';
      overtone.frequency.setValueAtTime(freq * 2.76, startTime);

      oscGain.gain.setValueAtTime(0.001, startTime);
      oscGain.gain.exponentialRampToValueAtTime(peak, startTime + 0.04);
      oscGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      overGain.gain.setValueAtTime(0.001, startTime);
      overGain.gain.exponentialRampToValueAtTime(peak * 0.25, startTime + 0.02);
      overGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration * 0.4);

      osc.connect(oscGain);
      overtone.connect(overGain);
      oscGain.connect(masterGain);
      overGain.connect(masterGain);

      osc.start(startTime);
      overtone.start(startTime);
      osc.stop(startTime + duration);
      overtone.stop(startTime + duration);
    };

    const now = ctx.currentTime + 0.05;

    if (bellType === 'airport') {
      playTone(349.23, now, 0.5, 0.4);
      playTone(440.0, now + 0.35, 0.5, 0.45);
      playTone(523.25, now + 0.7, 0.9, 0.5);
    } else if (bellType === 'chime') {
      playTone(659.25, now, 0.6, 0.45);
      playTone(880.0, now + 0.25, 0.9, 0.5);
    } else {
      playTone(392.0, now, 0.75, 0.5);
      playTone(523.25, now + 0.45, 1.1, 0.55);
    }

    const soundDurationMs =
      bellType === 'airport' ? 1700 : bellType === 'chime' ? 1200 : 1600;

    setTimeout(() => {
      const idx = activeGainNodes.indexOf(masterGain);
      if (idx !== -1) activeGainNodes.splice(idx, 1);
    }, soundDurationMs + 400);

    // Resolve when the bell sound finishes
    await new Promise((resolve) => setTimeout(resolve, soundDurationMs));
  } catch (err) {
    console.warn('Audio playback error:', err);
  }
}

/**
 * Fallback: SpeechSynthesis in Indonesian using Web Speech API
 */
function speakWithSpeechSynthesis(
  text: string,
  settings: AudioSettings,
  persona: VoicePersona,
  onEnd?: () => void,
  callGen?: number
): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onEnd?.();
    return;
  }

  if (callGen !== undefined && callGen !== currentCallGeneration) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.volume = Math.max(0, Math.min(1, settings.voiceVolume));

  utterance.rate = Math.max(0.6, Math.min(1.4, (settings.voiceRate || 1.0) * persona.rate));
  utterance.pitch = Math.max(0.7, Math.min(1.4, (settings.voicePitch || 1.0) * persona.pitch));

  const voices = window.speechSynthesis.getVoices();
  const indonesianVoices = voices.filter(
    (v) =>
      v.lang.toLowerCase().startsWith('id') ||
      v.name.toLowerCase().includes('indonesia') ||
      v.name.toLowerCase().includes('bahasa')
  );

  let selectedVoice = null;

  if (indonesianVoices.length > 0) {
    if (persona.gender === 'male') {
      selectedVoice =
        indonesianVoices.find(
          (v) =>
            v.name.toLowerCase().includes('male') ||
            v.name.toLowerCase().includes('pria') ||
            v.name.toLowerCase().includes('budi')
        ) || indonesianVoices[0];
    } else {
      selectedVoice =
        indonesianVoices.find(
          (v) =>
            v.name.toLowerCase().includes('female') ||
            v.name.toLowerCase().includes('wanita') ||
            v.name.toLowerCase().includes('gadis') ||
            v.name.toLowerCase().includes('siti')
        ) || indonesianVoices[0];
    }
  }

  if (selectedVoice) {
    utterance.voice = selectedVoice;
    utterance.lang = selectedVoice.lang;
  } else {
    utterance.lang = 'id-ID';
  }

  utterance.onend = () => {
    if (callGen !== undefined && callGen !== currentCallGeneration) return;
    onEnd?.();
  };

  utterance.onerror = (e) => {
    console.warn('Speech synthesis error:', e);
    onEnd?.();
  };

  window.speechSynthesis.speak(utterance);
}

/**
 * Text-to-speech announcement.
 * Tries Speechify first if selected, then ElevenLabs if selected,
 * otherwise falls back smoothly to browser SpeechSynthesis.
 */
export async function speakAnnouncement(
  text: string,
  settings: AudioSettings,
  onEnd?: () => void,
  callGen?: number,
  onError?: (err: Error) => void
): Promise<void> {
  const activeGen = callGen ?? currentCallGeneration;
  if (callGen !== undefined && callGen !== currentCallGeneration) return;

  const persona =
    VOICE_PERSONAS.find((p) => p.id === settings.voicePersona) || VOICE_PERSONAS[0];

  // Shared helper to play fetched audio URL with Web Speech fallback
  const playRemoteAudioUrl = async (audioUrl: string, providerLabel: string): Promise<void> => {
    if (activeGen !== currentCallGeneration) return;
    const audio = new Audio(audioUrl);
    currentAudioElement = audio;
    audio.volume = Math.max(0, Math.min(1, settings.voiceVolume));

    audio.onended = () => {
      if (currentAudioElement === audio) currentAudioElement = null;
      if (activeGen === currentCallGeneration) {
        onEnd?.();
      }
    };

    audio.onerror = (e) => {
      console.warn(`${providerLabel} audio playback failed, falling back to Web Speech:`, e);
      if (currentAudioElement === audio) currentAudioElement = null;
      if (activeGen === currentCallGeneration) {
        onError?.(new Error(`Pemutaran audio ${providerLabel} gagal. Mengalihkan ke suara cadangan.`));
        speakWithSpeechSynthesis(text, settings, persona, onEnd, activeGen);
      }
    };

    if (activeGen !== currentCallGeneration) return;
    await audio.play();
  };

  // 1. Speechify
  if (persona.provider === 'Speechify' && persona.speechifyVoiceId && settings.speechifyApiKey?.trim()) {
    try {
      const audioUrl = await fetchSpeechifyAudio(text, persona.speechifyVoiceId, settings.speechifyApiKey);
      await playRemoteAudioUrl(audioUrl, 'Speechify');
      return;
    } catch (err) {
      onError?.(err instanceof Error ? err : new Error(String(err)));
      if (activeGen !== currentCallGeneration) return;
    }
  }

  // 2. ElevenLabs
  if (persona.provider === 'ElevenLabs' && persona.elevenLabsVoiceId && settings.elevenLabsApiKey?.trim()) {
    try {
      const audioUrl = await fetchElevenLabsAudio(text, persona.elevenLabsVoiceId, settings.elevenLabsApiKey);
      await playRemoteAudioUrl(audioUrl, 'ElevenLabs');
      return;
    } catch (err) {
      onError?.(err instanceof Error ? err : new Error(String(err)));
      if (activeGen !== currentCallGeneration) return;
    }
  }

  // 3. Fish Audio
  if (persona.provider === 'Fish Audio' && settings.fishAudioApiKey?.trim()) {
    try {
      const refId = settings.fishAudioReferenceId?.trim() || persona.fishAudioReferenceId || '';
      const audioUrl = await fetchFishAudio(text, refId, settings.fishAudioApiKey);
      await playRemoteAudioUrl(audioUrl, 'Fish Audio');
      return;
    } catch (err) {
      onError?.(err instanceof Error ? err : new Error(String(err)));
      if (activeGen !== currentCallGeneration) return;
    }
  }

  // 4. Kokoro TTS (Free/Open-Source, key optional for local Kokoro-FastAPI)
  if (persona.provider === 'Kokoro TTS' && (settings.kokoroBaseUrl?.trim() || settings.kokoroApiKey?.trim())) {
    try {
      const audioUrl = await fetchKokoroAudio(
        text,
        persona.kokoroVoiceId || 'af_bella',
        settings.kokoroApiKey,
        settings.kokoroBaseUrl
      );
      await playRemoteAudioUrl(audioUrl, 'Kokoro TTS');
      return;
    } catch (err) {
      onError?.(err instanceof Error ? err : new Error(String(err)));
      if (activeGen !== currentCallGeneration) return;
    }
  }

  // 5. Cartesia Sonic
  if (persona.provider === 'Cartesia Sonic' && persona.cartesiaVoiceId && settings.cartesiaApiKey?.trim()) {
    try {
      const audioUrl = await fetchCartesiaAudio(text, persona.cartesiaVoiceId, settings.cartesiaApiKey);
      await playRemoteAudioUrl(audioUrl, 'Cartesia Sonic');
      return;
    } catch (err) {
      onError?.(err instanceof Error ? err : new Error(String(err)));
      if (activeGen !== currentCallGeneration) return;
    }
  }

  // 6. OpenAI TTS
  if (persona.provider === 'OpenAI TTS' && persona.openAiVoiceId && settings.openAiApiKey?.trim()) {
    try {
      const audioUrl = await fetchOpenAiTtsAudio(text, persona.openAiVoiceId, settings.openAiApiKey);
      await playRemoteAudioUrl(audioUrl, 'OpenAI TTS');
      return;
    } catch (err) {
      onError?.(err instanceof Error ? err : new Error(String(err)));
      if (activeGen !== currentCallGeneration) return;
    }
  }

  // 7. Fallback to browser SpeechSynthesis
  if (activeGen === currentCallGeneration) {
    speakWithSpeechSynthesis(text, settings, persona, onEnd, activeGen);
  }
}

/**
 * Sequence: Ring Ding-Dong bell first -> then speak announcement phrase!
 * Includes late-call cancellation, double-play deduplication, and preemption.
 */
export async function playQueueCall(
  ticketNumber: string,
  counterName: string,
  settings: AudioSettings,
  eventTimestamp?: number
): Promise<void> {
  if (!settings.enabled) return;

  // 1. Batalkan panggilan yang terlambat (> 8 detik dari saat tombol dipencet)
  if (eventTimestamp && typeof eventTimestamp === 'number') {
    const ageMs = Date.now() - eventTimestamp;
    if (ageMs > 8000) {
      console.warn(
        `[Audio] Panggilan suara dibatalkan karena terlambat (${Math.round(ageMs / 1000)}s lalu): ${ticketNumber} ke ${counterName}`
      );
      return;
    }
  }

  // 2. Cegah suara bertindihan atau double play dari event duplikat dalam kurun 3.5 detik
  const callKey = `${ticketNumber.trim().toUpperCase()}__${counterName.trim().toUpperCase()}`;
  const now = Date.now();
  if (callKey === lastCallKey && now - lastCallTimestamp < 3500) {
    console.info(`[Audio] Mengabaikan pemanggilan duplikat untuk ${callKey}`);
    return;
  }
  lastCallKey = callKey;
  lastCallTimestamp = now;

  // 3. Hentikan suara yang sedang aktif saat ini sebelum memulai panggilan baru
  stopCurrentSpeech();
  const myGeneration = currentCallGeneration;

  // 4. Putar bel nada panggilan
  await playBellSound(settings.bellType, settings.chimeVolume);
  if (myGeneration !== currentCallGeneration) return; // Dibatalkan oleh panggilan lebih baru

  // 5. Tunggu 1.1 detik resonansi bel sebelum narator berbicara
  await new Promise((resolve) => setTimeout(resolve, 1100));
  if (myGeneration !== currentCallGeneration) return; // Dibatalkan oleh panggilan lebih baru

  const phrase = formatIndonesianSpeechPhrase(ticketNumber, counterName);

  speakAnnouncement(
    phrase,
    settings,
    async () => {
      if (myGeneration !== currentCallGeneration) return;
      if (settings.repeatTimes >= 2) {
        await new Promise((resolve) => setTimeout(resolve, 900));
        if (myGeneration !== currentCallGeneration) return;
        speakAnnouncement(phrase, settings, undefined, myGeneration);
      }
    },
    myGeneration
  );
}

/**
 * Dedicated function for "Cek Suara" testing that guarantees immediate audio output:
 * - Resumes AudioContext on user action
 * - Resets throttles/deduplication keys
 * - Enforces enabled: true and positive volume so test audio is always heard
 * - Plays bell chime and speaks test announcement phrase
 */
export async function testAudioCall(
  ticketNumber = 'A-001',
  counterName = 'Loket 1',
  settings?: AudioSettings
): Promise<void> {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    await ctx.resume().catch(() => {});
  }

  // Clear throttle
  lastCallKey = '';
  lastCallTimestamp = 0;

  const testSettings: AudioSettings = {
    enabled: true,
    chimeVolume: settings?.chimeVolume && settings.chimeVolume > 0 ? settings.chimeVolume : 0.9,
    voiceVolume: settings?.voiceVolume && settings.voiceVolume > 0 ? settings.voiceVolume : 1.0,
    voiceRate: settings?.voiceRate || 1.0,
    voicePitch: settings?.voicePitch || 1.0,
    repeatTimes: 1,
    bellType: settings?.bellType || 'dingdong',
    voicePersona: settings?.voicePersona || 'bella_elevenlabs',
    elevenLabsApiKey: settings?.elevenLabsApiKey,
    speechifyApiKey: settings?.speechifyApiKey,
    fishAudioApiKey: settings?.fishAudioApiKey,
    fishAudioReferenceId: settings?.fishAudioReferenceId,
    kokoroApiKey: settings?.kokoroApiKey,
    kokoroBaseUrl: settings?.kokoroBaseUrl,
    cartesiaApiKey: settings?.cartesiaApiKey,
    openAiApiKey: settings?.openAiApiKey,
  };

  return playQueueCall(ticketNumber, counterName, testSettings);
}

