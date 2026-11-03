import { AudioSettings, VoicePersona } from '../types/queue';
import { formatIndonesianSpeechPhrase } from './queueLogic';

// Audio Context singleton for Web Audio chime synthesis
let audioCtx: AudioContext | null = null;
let currentAudioElement: HTMLAudioElement | null = null;
const ttsAudioCache = new Map<string, string>();

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
 * Sanitizes Speechify API Key in case it was accidentally duplicated
 */
export function cleanSpeechifyKey(rawKey: string): string {
  let key = rawKey.trim();
  if (key.length > 50 && key.indexOf('sk_', 5) > 0) {
    key = key.substring(key.indexOf('sk_', 5));
  }
  return key;
}

/**
 * List of high-quality voice personas featuring Speechify AI, ElevenLabs AI, and local fallback
 */
export const VOICE_PERSONAS: VoicePersona[] = [
  {
    id: 'alicia_speechify',
    name: 'Alicia (Speechify AI)',
    provider: 'Speechify',
    speechifyVoiceId: 'alicia',
    gender: 'female',
    description: 'Suara wanita natural, artikulasi sangat jernih dan ramah dari Speechify API.',
    pitch: 1.0,
    rate: 1.0,
    lang: 'id-ID',
  },
  {
    id: 'alfonso_speechify',
    name: 'Alfonso (Speechify AI)',
    provider: 'Speechify',
    speechifyVoiceId: 'alfonso',
    gender: 'male',
    description: 'Suara pria berwibawa, mantap, dan resmi cocok untuk panggilan loket perbankan.',
    pitch: 1.0,
    rate: 1.0,
    lang: 'id-ID',
  },
  {
    id: 'kristy_speechify',
    name: 'Kristy (Speechify AI)',
    provider: 'Speechify',
    speechifyVoiceId: 'kristy',
    gender: 'female',
    description: 'Suara wanita lembut, elegan, dan tempo membaca tenang dari Speechify API.',
    pitch: 1.0,
    rate: 1.0,
    lang: 'id-ID',
  },
  {
    id: 'bella_elevenlabs',
    name: 'Bella (ElevenLabs AI)',
    provider: 'ElevenLabs',
    elevenLabsVoiceId: 'hpp4J3VqNfWAUOO0d1Us',
    gender: 'female',
    description: 'Suara wanita jernih, profesional, artikulasi sangat jelas untuk pengumuman loket.',
    pitch: 1.0,
    rate: 1.0,
    lang: 'id-ID',
  },
  {
    id: 'daniel_elevenlabs',
    name: 'Daniel (ElevenLabs AI)',
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
    name: 'Alice (ElevenLabs AI)',
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
    name: 'Brian (ElevenLabs AI)',
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
    name: 'Jessica (ElevenLabs AI)',
    provider: 'ElevenLabs',
    elevenLabsVoiceId: 'cgSgspJ2msm6clMCkdW9',
    gender: 'female',
    description: 'Suara wanita ceria, segar, dan bersahabat untuk customer service dinamis.',
    pitch: 1.0,
    rate: 1.0,
    lang: 'id-ID',
  },
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
): Promise<{ success: boolean; message: string; voiceCount?: number }> {
  const cleaned = cleanSpeechifyKey(apiKey || '');
  if (!cleaned) {
    return { success: false, message: 'API Key Speechify tidak boleh kosong.' };
  }

  const endpoints = [
    'https://api.sws.speechify.com/v1/voices',
    '/api/speechify/v1/voices',
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
          message: `Koneksi Speechify Berhasil! Ditemukan ${count} suara aktif.`,
          voiceCount: count,
        };
      } else {
        const errJson = await res.json().catch(() => null);
        const errMsg = errJson?.error?.message || `HTTP ${res.status}: ${res.statusText}`;
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
    'https://api.sws.speechify.com/v1/audio/speech',
    '/api/speechify/v1/audio/speech',
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
        throw new Error(`Speechify error (${res.status}): ${errorText}`);
      }
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError || new Error('Gagal memproses audio dari Speechify');
}

/**
 * Validates ElevenLabs API Key by querying voice list
 */
export async function testElevenLabsApiKey(
  apiKey: string
): Promise<{ success: boolean; message: string; voiceCount?: number }> {
  if (!apiKey || !apiKey.trim()) {
    return { success: false, message: 'API Key ElevenLabs tidak boleh kosong.' };
  }

  const trimmedKey = apiKey.trim();

  const endpoints = [
    'https://api.elevenlabs.io/v1/voices',
    '/api/elevenlabs/v1/voices',
  ];

  let lastError = '';

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'xi-api-key': trimmedKey,
        },
      });

      if (res.ok) {
        const data = await res.json();
        const count = Array.isArray(data.voices) ? data.voices.length : 0;
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
 * Generates ElevenLabs TTS MP3 audio blob URL with in-memory caching
 */
export async function fetchElevenLabsAudio(
  text: string,
  voiceId: string,
  apiKey: string
): Promise<string> {
  const cacheKey = `elevenlabs_${voiceId}_${text}`;
  const cachedUrl = ttsAudioCache.get(cacheKey);
  if (cachedUrl) {
    return cachedUrl;
  }

  const payload = {
    text,
    model_id: 'eleven_multilingual_v2',
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.85,
    },
  };

  const endpoints = [
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    `/api/elevenlabs/v1/text-to-speech/${voiceId}`,
  ];

  let lastError: Error | null = null;

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey.trim(),
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
        throw new Error(`ElevenLabs error (${res.status}): ${errorText}`);
      }
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError || new Error('Gagal memproses audio dari ElevenLabs');
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
  callGen?: number
): Promise<void> {
  const activeGen = callGen ?? currentCallGeneration;
  if (callGen !== undefined && callGen !== currentCallGeneration) return;

  const persona =
    VOICE_PERSONAS.find((p) => p.id === settings.voicePersona) || VOICE_PERSONAS[0];

  // 1. Check if Speechify is selected and key is present
  if (persona.provider === 'Speechify' && persona.speechifyVoiceId && settings.speechifyApiKey) {
    try {
      const audioUrl = await fetchSpeechifyAudio(text, persona.speechifyVoiceId, settings.speechifyApiKey);
      if (activeGen !== currentCallGeneration) return; // Cancelled while fetching!

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
        console.warn('Speechify audio playback failed, falling back to Web Speech:', e);
        if (currentAudioElement === audio) currentAudioElement = null;
        if (activeGen === currentCallGeneration) {
          speakWithSpeechSynthesis(text, settings, persona, onEnd, activeGen);
        }
      };

      if (activeGen !== currentCallGeneration) return;
      await audio.play();
      return;
    } catch (err) {
      console.warn('Speechify fetch failed, falling back to Web Speech synthesis:', err);
      if (activeGen !== currentCallGeneration) return;
    }
  }

  // 2. Check if ElevenLabs is selected and key is present
  if (persona.provider === 'ElevenLabs' && persona.elevenLabsVoiceId && settings.elevenLabsApiKey?.trim()) {
    try {
      const audioUrl = await fetchElevenLabsAudio(text, persona.elevenLabsVoiceId, settings.elevenLabsApiKey);
      if (activeGen !== currentCallGeneration) return; // Cancelled while fetching!

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
        console.warn('ElevenLabs audio playback failed, falling back to Web Speech:', e);
        if (currentAudioElement === audio) currentAudioElement = null;
        if (activeGen === currentCallGeneration) {
          speakWithSpeechSynthesis(text, settings, persona, onEnd, activeGen);
        }
      };

      if (activeGen !== currentCallGeneration) return;
      await audio.play();
      return;
    } catch (err) {
      console.warn('ElevenLabs fetch failed, falling back to Web Speech synthesis:', err);
      if (activeGen !== currentCallGeneration) return;
    }
  }

  // 3. Fallback to browser SpeechSynthesis
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
