import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_COUNTERS_PER_ROW,
  COUNTER_CAROUSEL_INTERVAL_MS,
  getCounterGridColumnsCount,
  getCounterGridClassName,
  paginateCounters,
  findCounterPageIndex,
  getNextCarouselPageIndex,
} from './displayLayoutLogic';

test('getCounterGridColumnsCount adapts to counter count and caps at 5 per row', () => {
  assert.equal(MAX_COUNTERS_PER_ROW, 5);
  assert.equal(COUNTER_CAROUSEL_INTERVAL_MS, 30000);
  assert.equal(getCounterGridColumnsCount(0), 1);
  assert.equal(getCounterGridColumnsCount(1), 1);
  assert.equal(getCounterGridColumnsCount(2), 2);
  assert.equal(getCounterGridColumnsCount(3), 3);
  assert.equal(getCounterGridColumnsCount(4), 4);
  assert.equal(getCounterGridColumnsCount(5), 5);
  assert.equal(getCounterGridColumnsCount(6), 5);
  assert.equal(getCounterGridColumnsCount(8), 5);
});

test('getCounterGridClassName returns static Tailwind grid classes matching 1..5 max columns', () => {
  assert.equal(getCounterGridClassName(1), 'grid grid-cols-1 gap-3.5');
  assert.equal(getCounterGridClassName(2), 'grid grid-cols-1 sm:grid-cols-2 gap-3.5');
  assert.equal(getCounterGridClassName(3), 'grid grid-cols-1 sm:grid-cols-3 gap-3.5');
  assert.equal(getCounterGridClassName(4), 'grid grid-cols-2 sm:grid-cols-4 gap-3.5');
  assert.equal(getCounterGridClassName(5), 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3');
  assert.equal(getCounterGridClassName(7), 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3');
});

test('paginateCounters splits counters into single-row pages of maximum 5', () => {
  const sevenCounters = Array.from({ length: 7 }, (_, i) => ({ id: `loket-${i + 1}` }));
  const pages = paginateCounters(sevenCounters);
  assert.equal(pages.length, 2);
  assert.equal(pages[0].length, 5);
  assert.equal(pages[1].length, 2);
  assert.equal(pages[1][0].id, 'loket-6');
  assert.equal(pages[1][1].id, 'loket-7');
});

test('findCounterPageIndex resolves the page containing a called counter', () => {
  const sevenCounters = Array.from({ length: 7 }, (_, i) => ({ id: `loket-${i + 1}` }));
  assert.equal(findCounterPageIndex(sevenCounters, 'loket-1'), 0);
  assert.equal(findCounterPageIndex(sevenCounters, 'loket-5'), 0);
  assert.equal(findCounterPageIndex(sevenCounters, 'loket-6'), 1);
  assert.equal(findCounterPageIndex(sevenCounters, 'loket-7'), 1);
  assert.equal(findCounterPageIndex(sevenCounters, 'missing'), -1);
});

test('getNextCarouselPageIndex cycles cleanly across pages', () => {
  assert.equal(getNextCarouselPageIndex(0, 1), 0);
  assert.equal(getNextCarouselPageIndex(0, 2), 1);
  assert.equal(getNextCarouselPageIndex(1, 2), 0);
});
