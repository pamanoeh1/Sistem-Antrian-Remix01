/**
 * Layout helpers for the DisplayView counter cards grid & sliding carousel.
 * Adapts card width automatically to screen width, capped at 5 counters per row/page.
 */

export const MAX_COUNTERS_PER_ROW = 5;
export const COUNTER_CAROUSEL_INTERVAL_MS = 30000;

export function getCounterGridColumnsCount(counterCount: number): number {
  if (!Number.isFinite(counterCount) || counterCount <= 1) return 1;
  return Math.min(Math.floor(counterCount), MAX_COUNTERS_PER_ROW);
}

/**
 * Splits counters into pages of at most 5 counters each so the Display view
 * strictly shows 1 horizontal row at a time with horizontal slide transitions.
 */
export function paginateCounters<T>(
  counters: readonly T[],
  pageSize: number = MAX_COUNTERS_PER_ROW
): T[][] {
  if (!Array.isArray(counters) || counters.length === 0) return [];
  const size = Math.max(1, Math.floor(pageSize));
  const pages: T[][] = [];
  for (let i = 0; i < counters.length; i += size) {
    pages.push(counters.slice(i, i + size));
  }
  return pages;
}

/**
 * Finds the zero-based carousel page index containing a specific counter ID.
 * Returns -1 if the counter ID is not found.
 */
export function findCounterPageIndex<T extends { id: string }>(
  counters: readonly T[],
  counterId?: string | null,
  pageSize: number = MAX_COUNTERS_PER_ROW
): number {
  if (!counterId || !Array.isArray(counters) || counters.length === 0) return -1;
  const idx = counters.findIndex((c) => c.id === counterId);
  if (idx === -1) return -1;
  const size = Math.max(1, Math.floor(pageSize));
  return Math.floor(idx / size);
}

/**
 * Returns the next carousel page index, wrapping back to 0 cleanly.
 */
export function getNextCarouselPageIndex(
  currentPage: number,
  totalPages: number
): number {
  if (totalPages <= 1) return 0;
  return (currentPage + 1) % totalPages;
}

/**
 * Returns static Tailwind grid classes matching the exact counter count (1..5 max per row)
 * so cards stretch to fill full available width when fewer counters exist,
 * and stay 1 horizontal row on medium/large display screens.
 */
export function getCounterGridClassName(counterCount: number): string {
  const cols = getCounterGridColumnsCount(counterCount);
  switch (cols) {
    case 1:
      return 'grid grid-cols-1 gap-3.5';
    case 2:
      return 'grid grid-cols-1 sm:grid-cols-2 gap-3.5';
    case 3:
      return 'grid grid-cols-1 sm:grid-cols-3 gap-3.5';
    case 4:
      return 'grid grid-cols-2 sm:grid-cols-4 gap-3.5';
    case 5:
    default:
      return 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3';
  }
}
