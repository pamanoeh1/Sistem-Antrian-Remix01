import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_MEDIA,
  DEFAULT_AUDIO,
  DEFAULT_COMPANY,
  DEFAULT_LAN_SETTINGS,
  DEFAULT_SERVICES,
  DEFAULT_COUNTERS,
} from './queueStore';

test('DEFAULT_MEDIA has valid slides array and positive slide durations', () => {
  assert.ok(Array.isArray(DEFAULT_MEDIA.slides));
  assert.ok(DEFAULT_MEDIA.slides.length > 0);
  assert.ok(DEFAULT_MEDIA.slideDurationSec > 0);
  assert.ok(typeof DEFAULT_MEDIA.runningText === 'string');
});

test('DEFAULT_AUDIO has valid volumes between 0 and 1', () => {
  assert.ok(DEFAULT_AUDIO.chimeVolume >= 0 && DEFAULT_AUDIO.chimeVolume <= 1);
  assert.ok(DEFAULT_AUDIO.voiceVolume >= 0 && DEFAULT_AUDIO.voiceVolume <= 1);
  assert.ok(DEFAULT_AUDIO.voiceRate > 0);
  assert.ok(['dingdong', 'chime', 'airport'].includes(DEFAULT_AUDIO.bellType));
});

test('DEFAULT_COMPANY has default timezone and non-empty name', () => {
  assert.ok(DEFAULT_COMPANY.timezone === 'WIB');
  assert.ok(DEFAULT_COMPANY.name.length > 0);
});

test('DEFAULT_LAN_SETTINGS has valid serverPort and sharing defaults', () => {
  assert.equal(DEFAULT_LAN_SETTINGS.serverPort, 3000);
  assert.equal(DEFAULT_LAN_SETTINGS.sharingEnabled, true);
  assert.ok(typeof DEFAULT_LAN_SETTINGS.lanPassword === 'string');
});
