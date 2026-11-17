/**
 * Pure logic for handling the Display Fullscreen exit keyboard chord (Ctrl + C + B simultaneously)
 * and top-level fullscreen lock state.
 */

export function normalizeShortcutKey(key: string, code?: string): string {
  if (code) {
    const match = /^Key([A-Z])$/i.exec(code);
    if (match) {
      return match[1].toLowerCase();
    }
  }
  return (key || '').trim().toLowerCase();
}

export function isCtrlCBExitChord(
  pressedKeys: ReadonlySet<string>,
  ctrlKey: boolean
): boolean {
  if (!ctrlKey) return false;
  return pressedKeys.has('c') && pressedKeys.has('b');
}

export function applyKeyDownToPressedSet(
  pressedKeys: Set<string>,
  key: string,
  code?: string
): Set<string> {
  const normalized = normalizeShortcutKey(key, code);
  if (normalized) {
    pressedKeys.add(normalized);
  }
  return pressedKeys;
}

export function applyKeyUpToPressedSet(
  pressedKeys: Set<string>,
  key: string,
  code?: string,
  ctrlKeyRemaining = true
): Set<string> {
  const normalized = normalizeShortcutKey(key, code);
  if (normalized) {
    pressedKeys.delete(normalized);
  }
  if (!ctrlKeyRemaining) {
    pressedKeys.delete('control');
    pressedKeys.delete('ctrl');
  }
  return pressedKeys;
}

export function shouldInterceptEscapeInFullscreen(
  isFullscreenActive: boolean,
  explicitExitAllowed: boolean
): boolean {
  return isFullscreenActive && !explicitExitAllowed;
}
