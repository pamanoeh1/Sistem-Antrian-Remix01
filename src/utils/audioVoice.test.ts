import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cleanSpeechifyKey,
  cleanElevenLabsKey,
  VOICE_PERSONAS,
} from './audioVoice';
import { DEFAULT_AUDIO } from './queueStore';

test('cleanSpeechifyKey sanitizes keys properly', () => {
  assert.equal(cleanSpeechifyKey('   sk_12345   '), 'sk_12345');
  assert.equal(cleanSpeechifyKey('"sk_quoted_key"'), 'sk_quoted_key');
  assert.equal(cleanSpeechifyKey("'sk_single_quoted'"), 'sk_single_quoted');
  assert.equal(cleanSpeechifyKey('Bearer sk_bearer_token'), 'sk_bearer_token');
  assert.equal(
    cleanSpeechifyKey('sk_22veab8bb226z29yejppkr1bj8864xtm17tjj0g97xmsk_22veab8bb226z29yejppkr1bj8864xtm17tjj0g97xm'),
    'sk_22veab8bb226z29yejppkr1bj8864xtm17tjj0g97xm'
  );
});

test('cleanElevenLabsKey sanitizes keys properly', () => {
  assert.equal(cleanElevenLabsKey('   sk_eleven123   '), 'sk_eleven123');
  assert.equal(cleanElevenLabsKey('"sk_quoted_eleven"'), 'sk_quoted_eleven');
  assert.equal(cleanElevenLabsKey('Bearer sk_eleven_token'), 'sk_eleven_token');
  assert.equal(cleanElevenLabsKey(''), '');
});

test('VOICE_PERSONAS contains Indonesian Speechify personas', () => {
  const gita = VOICE_PERSONAS.find((p) => p.id === 'gita_speechify');
  assert.ok(gita, 'gita_speechify must exist');
  assert.equal(gita.provider, 'Speechify');
  assert.equal(gita.lang, 'id-ID');
  assert.ok(gita.name.includes('Indonesia'));

  const budi = VOICE_PERSONAS.find((p) => p.id === 'budi_speechify');
  assert.ok(budi, 'budi_speechify must exist');
  assert.equal(budi.provider, 'Speechify');
  assert.equal(budi.gender, 'male');

  const siti = VOICE_PERSONAS.find((p) => p.id === 'siti_speechify');
  assert.ok(siti, 'siti_speechify must exist');
  assert.equal(siti.gender, 'female');

  const lestari = VOICE_PERSONAS.find((p) => p.id === 'lestari_speechify');
  assert.ok(lestari, 'lestari_speechify must exist');
});

test('VOICE_PERSONAS contains ElevenLabs Indonesian personas with valid voice IDs', () => {
  const bella = VOICE_PERSONAS.find((p) => p.id === 'bella_elevenlabs');
  assert.ok(bella, 'bella_elevenlabs must exist');
  assert.equal(bella.provider, 'ElevenLabs');
  assert.equal(bella.elevenLabsVoiceId, 'hpp4J3VqNfWAUOO0d1Us');

  const daniel = VOICE_PERSONAS.find((p) => p.id === 'daniel_elevenlabs');
  assert.ok(daniel, 'daniel_elevenlabs must exist');
  assert.equal(daniel.provider, 'ElevenLabs');
  assert.equal(daniel.elevenLabsVoiceId, 'onwK4e9ZLuTAKqWW03F9');
});

test('DEFAULT_AUDIO voicePersona matches a registered persona in VOICE_PERSONAS', () => {
  const persona = VOICE_PERSONAS.find((p) => p.id === DEFAULT_AUDIO.voicePersona);
  assert.ok(persona, `DEFAULT_AUDIO voicePersona "${DEFAULT_AUDIO.voicePersona}" must exist in VOICE_PERSONAS`);
});

test('VOICE_PERSONAS registers Fish Audio, Kokoro TTS, Cartesia Sonic, and OpenAI TTS Indonesian personas', () => {
  const fish = VOICE_PERSONAS.find((p) => p.provider === 'Fish Audio');
  const kokoro = VOICE_PERSONAS.find((p) => p.provider === 'Kokoro TTS');
  const cartesia = VOICE_PERSONAS.find((p) => p.provider === 'Cartesia Sonic');
  const openai = VOICE_PERSONAS.find((p) => p.provider === 'OpenAI TTS');

  assert.ok(fish, 'Fish Audio persona must exist');
  assert.ok(kokoro, 'Kokoro TTS persona must exist');
  assert.ok(cartesia, 'Cartesia Sonic persona must exist');
  assert.ok(openai, 'OpenAI TTS persona must exist');
  assert.equal(fish.lang, 'id-ID');
  assert.equal(kokoro.lang, 'id-ID');
  assert.equal(cartesia.lang, 'id-ID');
  assert.equal(openai.lang, 'id-ID');
});
