/**
 * Utilities for seamless, zero-gap continuous running text marquee
 */

/**
 * Formats running text to ensure it is sufficiently long to seamlessly
 * loop without blank gaps across any screen size (phones, tablets, and 4K TVs).
 * Starts immediately with no leading delay.
 */
export function formatContinuousMarqueeContent(rawText: string, minLength: number = 100): string {
  const clean = (rawText || '').trim();
  if (!clean) {
    return 'Selamat Datang di Sistem Antrean Cerdas Pelayanan Publik';
  }

  // If text is short, repeat it so a single span comfortably covers wide displays
  let repeated = clean;
  const separator = '   ★   ';

  while (repeated.length < minLength) {
    repeated += separator + clean;
  }

  return repeated;
}

/**
 * Calculates responsive animation duration based on text length and user speed setting.
 * Guarantees steady, comfortable reading speed regardless of display width.
 */
export function calculateMarqueeDuration(
  contentLength: number,
  speedSecSetting: number = 32
): number {
  const baseSpeed = Math.max(10, Math.min(80, speedSecSetting));
  // If content is very long, scale duration slightly so it doesn't move too fast to read
  if (contentLength > 200) {
    const scale = Math.min(2.0, contentLength / 200);
    return Math.round(baseSpeed * scale);
  }
  return baseSpeed;
}
