import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatContinuousMarqueeContent,
  calculateMarqueeDuration,
} from './marqueeLogic';

test('formatContinuousMarqueeContent provides fallback on empty text', () => {
  const result = formatContinuousMarqueeContent('');
  assert.ok(result.length > 0);
  assert.match(result, /Sistem Antrean Cerdas/);
});

test('formatContinuousMarqueeContent repeats short text to exceed minLength with separator', () => {
  const shortText = 'Halo Pengunjung';
  const result = formatContinuousMarqueeContent(shortText, 80);
  assert.ok(result.length >= 80);
  assert.ok(result.includes('★'));
  assert.ok(result.startsWith('Halo Pengunjung'));
});

test('formatContinuousMarqueeContent preserves long text without unnecessary repeats', () => {
  const longText = 'A'.repeat(150);
  const result = formatContinuousMarqueeContent(longText, 100);
  assert.equal(result, longText);
});

test('calculateMarqueeDuration respects speed settings within bounds', () => {
  assert.equal(calculateMarqueeDuration(100, 32), 32);
  assert.equal(calculateMarqueeDuration(100, 5), 10); // clamped minimum
  assert.equal(calculateMarqueeDuration(100, 99), 80); // clamped maximum
});

test('calculateMarqueeDuration scales smoothly for very long content', () => {
  const duration = calculateMarqueeDuration(400, 30);
  assert.ok(duration > 30);
  assert.ok(duration <= 60);
});
