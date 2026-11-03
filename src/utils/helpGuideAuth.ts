export const GUIDE_PASSWORD = '12345';

export function verifyGuidePassword(input: string): boolean {
  if (!input) return false;
  return input.trim() === GUIDE_PASSWORD;
}
