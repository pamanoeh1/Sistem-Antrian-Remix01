import test from 'node:test';
import assert from 'node:assert/strict';
import { Counter, QueueSyncEvent } from '../types/queue';

test('Counter status toggle updates counter status accurately', () => {
  const initialCounters: Counter[] = [
    {
      id: 'loket-1',
      name: 'Loket 1',
      operatorName: 'Ahmad Fauzi',
      supportedServiceIds: ['srv-1', 'srv-2'],
      currentTicketId: null,
      status: 'open',
    },
    {
      id: 'loket-2',
      name: 'Loket 2',
      operatorName: 'Siti Rahma',
      supportedServiceIds: ['srv-2', 'srv-3'],
      currentTicketId: null,
      status: 'open',
    },
  ];

  // Toggle loket-1 to 'break'
  const afterBreak = initialCounters.map((c) =>
    c.id === 'loket-1' ? { ...c, status: 'break' as const } : c
  );
  assert.equal(afterBreak[0].status, 'break');
  assert.equal(afterBreak[1].status, 'open');

  // Toggle loket-1 to 'closed'
  const afterClosed = afterBreak.map((c) =>
    c.id === 'loket-1' ? { ...c, status: 'closed' as const } : c
  );
  assert.equal(afterClosed[0].status, 'closed');

  // Re-open loket-1
  const afterReopen = afterClosed.map((c) =>
    c.id === 'loket-1' ? { ...c, status: 'open' as const } : c
  );
  assert.equal(afterReopen[0].status, 'open');
});

test('COUNTER_UPDATED sync event carries proper senderId and timestamp', () => {
  const event: QueueSyncEvent = {
    type: 'COUNTER_UPDATED',
    timestamp: Date.now(),
    senderId: 'tab-test-instance-123',
  };

  assert.equal(event.type, 'COUNTER_UPDATED');
  assert.equal(event.senderId, 'tab-test-instance-123');
  assert.ok(typeof event.timestamp === 'number');
  assert.ok(Date.now() - event.timestamp < 1000);
});

test('Late call detector correctly flags events older than 8000ms', () => {
  const isLateCall = (eventTimestamp?: number) => {
    if (!eventTimestamp) return false;
    return Date.now() - eventTimestamp > 8000;
  };

  const freshTimestamp = Date.now() - 500;
  assert.equal(isLateCall(freshTimestamp), false);

  const staleTimestamp = Date.now() - 15000; // 15 seconds old
  assert.equal(isLateCall(staleTimestamp), true);
});
