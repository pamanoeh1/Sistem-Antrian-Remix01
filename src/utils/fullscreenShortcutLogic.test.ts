import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeShortcutKey,
  isCtrlCBExitChord,
  applyKeyDownToPressedSet,
  applyKeyUpToPressedSet,
  shouldInterceptEscapeInFullscreen,
} from './fullscreenShortcutLogic';

test('normalizeShortcutKey extracts letter keys reliably from e.code or e.key', () => {
  assert.equal(normalizeShortcutKey('c', 'KeyC'), 'c');
  assert.equal(normalizeShortcutKey('\u0003', 'KeyC'), 'c'); // Ctrl+C control char fallback
  assert.equal(normalizeShortcutKey('B', 'KeyB'), 'b');
  assert.equal(normalizeShortcutKey('Escape', 'Escape'), 'escape');
});

test('isCtrlCBExitChord triggers ONLY when Ctrl + C + B are held simultaneously', () => {
  const pressed = new Set<string>();

  // Pressing only Ctrl+C must NOT trigger exit
  applyKeyDownToPressedSet(pressed, 'c', 'KeyC');
  assert.equal(isCtrlCBExitChord(pressed, true), false);

  // Adding B while Ctrl+C held MUST trigger exit
  applyKeyDownToPressedSet(pressed, 'b', 'KeyB');
  assert.equal(isCtrlCBExitChord(pressed, true), true);

  // Without Ctrl key held, C+B must NOT trigger exit
  assert.equal(isCtrlCBExitChord(pressed, false), false);

  // Releasing C stops the chord
  applyKeyUpToPressedSet(pressed, 'c', 'KeyC', true);
  assert.equal(isCtrlCBExitChord(pressed, true), false);
});

test('shouldInterceptEscapeInFullscreen blocks Escape unless explicit exit is allowed', () => {
  assert.equal(shouldInterceptEscapeInFullscreen(false, false), false);
  assert.equal(shouldInterceptEscapeInFullscreen(true, false), true);
  assert.equal(shouldInterceptEscapeInFullscreen(true, true), false);
});
