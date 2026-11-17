import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detectTtsQuotaExhausted,
  cleanGenericBearerKey,
  getFreeTierProviderSummary,
} from './ttsQuotaLogic';

test('detectTtsQuotaExhausted detects HTTP 402 Payment Required across providers', () => {
  const alert = detectTtsQuotaExhausted('Fish Audio', 402, 'Payment Required');
  assert.ok(alert);
  assert.equal(alert.provider, 'Fish Audio');
  assert.equal(alert.statusCode, 402);
  assert.match(alert.message, /habis/i);
});

test('detectTtsQuotaExhausted detects ElevenLabs & OpenAI & Cartesia quota/credit exhaustion', () => {
  const eleven = detectTtsQuotaExhausted(
    'ElevenLabs',
    400,
    JSON.stringify({ detail: { status: 'quota_exceeded', message: 'This request exceeds your quota' } })
  );
  assert.ok(eleven);
  assert.equal(eleven.provider, 'ElevenLabs');

  const openai = detectTtsQuotaExhausted(
    'OpenAI TTS',
    429,
    JSON.stringify({ error: { code: 'insufficient_quota', message: 'You exceeded your current quota' } })
  );
  assert.ok(openai);
  assert.equal(openai.provider, 'OpenAI TTS');

  const cartesia = detectTtsQuotaExhausted(
    'Cartesia Sonic',
    429,
    'Credit balance exhausted for workspace'
  );
  assert.ok(cartesia);
  assert.equal(cartesia.provider, 'Cartesia Sonic');
});

test('detectTtsQuotaExhausted returns null for normal auth errors like HTTP 401 Invalid Key', () => {
  const authErr = detectTtsQuotaExhausted('OpenAI TTS', 401, 'Incorrect API key provided');
  assert.equal(authErr, null);
});

test('cleanGenericBearerKey strips quotes and Bearer prefix', () => {
  assert.equal(cleanGenericBearerKey('  "Bearer sk-proj-abc123"  '), 'sk-proj-abc123');
  assert.equal(cleanGenericBearerKey("  'fish_live_999' "), 'fish_live_999');
});

test('getFreeTierProviderSummary returns non-empty descriptions for new providers', () => {
  assert.ok(getFreeTierProviderSummary('Fish Audio').length > 10);
  assert.ok(getFreeTierProviderSummary('Kokoro TTS').length > 10);
  assert.ok(getFreeTierProviderSummary('Cartesia Sonic').length > 10);
  assert.ok(getFreeTierProviderSummary('OpenAI TTS').length > 10);
});
