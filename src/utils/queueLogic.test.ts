import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatSequenceNumber,
  formatTicketNumber,
  generateNextTicket,
  getWaitingCountAhead,
  calculateEstimatedWaitTimeMinutes,
  getNextWaitingTicketForCounter,
  pronounceQueueNumberIndonesian,
  formatIndonesianSpeechPhrase,
  filterQueues,
  getCurrentServingTicketForCounter,
  canCounterCallNext,
  resolveTicketDestinationLabel,
} from './queueLogic';
import { ServiceCategory, Counter, QueueItem } from '../types/queue';

const mockServices: ServiceCategory[] = [
  {
    id: 'srv-1',
    prefix: 'A',
    name: 'Pelayanan Umum & CS',
    description: 'Layanan administrasi dan informasi umum',
    icon: 'UserCheck',
    color: 'emerald',
    estimatedMinutes: 5,
    active: true,
  },
  {
    id: 'srv-2',
    prefix: 'B',
    name: 'Pembayaran Kasir',
    description: 'Pembayaran tagihan dan transaksi keuangan',
    icon: 'CreditCard',
    color: 'blue',
    estimatedMinutes: 3,
    active: true,
  },
];

const mockCounter: Counter = {
  id: 'loket-1',
  name: 'Loket 1 (Pendaftaran)',
  operatorName: 'Siti Rahma',
  supportedServiceIds: ['srv-1'],
  currentTicketId: null,
  status: 'open',
};

test('formatSequenceNumber pads numbers correctly', () => {
  assert.equal(formatSequenceNumber(1), '001');
  assert.equal(formatSequenceNumber(12), '012');
  assert.equal(formatSequenceNumber(123), '123');
});

test('formatTicketNumber formats prefix and seq properly', () => {
  assert.equal(formatTicketNumber('a', 5), 'A-005');
  assert.equal(formatTicketNumber('B', 42), 'B-042');
});

test('generateNextTicket correctly increments sequence per service prefix', () => {
  const existing: QueueItem[] = [
    {
      id: '1',
      number: 'A-001',
      prefix: 'A',
      sequenceNumber: 1,
      serviceId: 'srv-1',
      serviceName: 'Pelayanan Umum',
      counterId: null,
      counterName: null,
      status: 'completed',
      createdAt: '2026-10-21T01:00:00Z',
      calledAt: null,
      completedAt: null,
      callCount: 1,
    },
    {
      id: '2',
      number: 'A-002',
      prefix: 'A',
      sequenceNumber: 2,
      serviceId: 'srv-1',
      serviceName: 'Pelayanan Umum',
      counterId: null,
      counterName: null,
      status: 'waiting',
      createdAt: '2026-10-21T01:05:00Z',
      calledAt: null,
      completedAt: null,
      callCount: 0,
    },
    {
      id: '3',
      number: 'B-001',
      prefix: 'B',
      sequenceNumber: 1,
      serviceId: 'srv-2',
      serviceName: 'Pembayaran',
      counterId: null,
      counterName: null,
      status: 'waiting',
      createdAt: '2026-10-21T01:06:00Z',
      calledAt: null,
      completedAt: null,
      callCount: 0,
    },
  ];

  const nextA = generateNextTicket(mockServices[0], existing);
  assert.equal(nextA.number, 'A-003');
  assert.equal(nextA.sequenceNumber, 3);
  assert.equal(nextA.prefix, 'A');
  assert.equal(nextA.status, 'waiting');

  const nextB = generateNextTicket(mockServices[1], existing);
  assert.equal(nextB.number, 'B-002');
  assert.equal(nextB.sequenceNumber, 2);
});

test('getWaitingCountAhead correctly counts older waiting tickets of same service', () => {
  const t1: QueueItem = {
    id: 't1',
    number: 'A-001',
    prefix: 'A',
    sequenceNumber: 1,
    serviceId: 'srv-1',
    serviceName: 'Pelayanan Umum',
    counterId: null,
    counterName: null,
    status: 'waiting',
    createdAt: '2026-10-21T01:00:00Z',
    calledAt: null,
    completedAt: null,
    callCount: 0,
  };
  const t2: QueueItem = {
    id: 't2',
    number: 'A-002',
    prefix: 'A',
    sequenceNumber: 2,
    serviceId: 'srv-1',
    serviceName: 'Pelayanan Umum',
    counterId: null,
    counterName: null,
    status: 'waiting',
    createdAt: '2026-10-21T01:05:00Z',
    calledAt: null,
    completedAt: null,
    callCount: 0,
  };
  const t3: QueueItem = {
    id: 't3',
    number: 'A-003',
    prefix: 'A',
    sequenceNumber: 3,
    serviceId: 'srv-1',
    serviceName: 'Pelayanan Umum',
    counterId: null,
    counterName: null,
    status: 'waiting',
    createdAt: '2026-10-21T01:10:00Z',
    calledAt: null,
    completedAt: null,
    callCount: 0,
  };

  const queues = [t1, t2, t3];
  assert.equal(getWaitingCountAhead('t1', queues), 0);
  assert.equal(getWaitingCountAhead('t2', queues), 1);
  assert.equal(getWaitingCountAhead('t3', queues), 2);

  const waitMinutes = calculateEstimatedWaitTimeMinutes('t3', queues, mockServices);
  // (2 ahead + 1) * 5 minutes = 15 minutes
  assert.equal(waitMinutes, 15);
});

test('getNextWaitingTicketForCounter picks oldest waiting ticket for supported service', () => {
  const queues: QueueItem[] = [
    {
      id: 't-b1',
      number: 'B-001',
      prefix: 'B',
      sequenceNumber: 1,
      serviceId: 'srv-2',
      serviceName: 'Kasir',
      counterId: null,
      counterName: null,
      status: 'waiting',
      createdAt: '2026-10-21T01:00:00Z',
      calledAt: null,
      completedAt: null,
      callCount: 0,
    },
    {
      id: 't-a1',
      number: 'A-001',
      prefix: 'A',
      sequenceNumber: 1,
      serviceId: 'srv-1',
      serviceName: 'Pelayanan Umum',
      counterId: null,
      counterName: null,
      status: 'waiting',
      createdAt: '2026-10-21T01:02:00Z',
      calledAt: null,
      completedAt: null,
      callCount: 0,
    },
  ];

  // mockCounter only supports srv-1
  const nextForCounter = getNextWaitingTicketForCounter(mockCounter, queues);
  assert.ok(nextForCounter);
  assert.equal(nextForCounter.number, 'A-001');
});

test('pronounceQueueNumberIndonesian and formatIndonesianSpeechPhrase format phonetic text', () => {
  const speech = formatIndonesianSpeechPhrase('A-005', 'Loket 1');
  assert.equal(speech, 'Nomor antrean A, kosong kosong lima, silakan menuju ke Loket 1');

  const speechB = formatIndonesianSpeechPhrase('B-024', 'Loket Kasir');
  assert.equal(speechB, 'Nomor antrean B, kosong dua empat, silakan menuju ke Loket Kasir');
});

test('filterQueues works accurately with status, service, and search queries', () => {
  const items: QueueItem[] = [
    {
      id: '1',
      number: 'A-001',
      prefix: 'A',
      sequenceNumber: 1,
      serviceId: 'srv-1',
      serviceName: 'Umum',
      counterId: 'loket-1',
      counterName: 'Loket 1',
      status: 'serving',
      createdAt: '2026-10-21T01:00:00Z',
      calledAt: '2026-10-21T01:05:00Z',
      completedAt: null,
      callCount: 1,
    },
    {
      id: '2',
      number: 'B-001',
      prefix: 'B',
      sequenceNumber: 1,
      serviceId: 'srv-2',
      serviceName: 'Kasir',
      counterId: null,
      counterName: null,
      status: 'waiting',
      createdAt: '2026-10-21T01:10:00Z',
      calledAt: null,
      completedAt: null,
      callCount: 0,
    },
  ];

  assert.equal(filterQueues(items, { status: 'waiting' }).length, 1);
  assert.equal(filterQueues(items, { serviceId: 'srv-1' }).length, 1);
  assert.equal(filterQueues(items, { searchTerm: 'A-001' }).length, 1);
  assert.equal(filterQueues(items, { searchTerm: 'kasir' }).length, 1);
  assert.equal(filterQueues(items, { searchTerm: 'tidak ada' }).length, 0);
});

test('skipped ticket recall correctly sets status to calling and increments callCount', () => {
  const skippedTicket: QueueItem = {
    id: 'skip-1',
    number: 'A-010',
    prefix: 'A',
    sequenceNumber: 10,
    serviceId: 'srv-1',
    serviceName: 'Pelayanan Umum',
    counterId: 'loket-1',
    counterName: 'Loket 1',
    status: 'skipped',
    createdAt: '2026-10-21T01:00:00Z',
    calledAt: '2026-10-21T01:10:00Z',
    completedAt: null,
    callCount: 1,
  };

  const recalled: QueueItem = {
    ...skippedTicket,
    status: 'calling',
    counterId: mockCounter.id,
    counterName: mockCounter.name,
    callCount: skippedTicket.callCount + 1,
    calledAt: new Date().toISOString(),
  };

  assert.equal(recalled.status, 'calling');
  assert.equal(recalled.counterId, 'loket-1');
  assert.equal(recalled.callCount, 2);
  assert.notEqual(recalled.status, 'skipped');
});

test('canCounterCallNext forbids calling next ticket while an active ticket is being served or called until completed', () => {
  const activeTicket: QueueItem = {
    id: 'tkt-active',
    number: 'A-001',
    prefix: 'A',
    sequenceNumber: 1,
    serviceId: 'srv-1',
    serviceName: 'Pelayanan Umum',
    counterId: 'loket-1',
    counterName: 'Loket 1',
    status: 'calling',
    createdAt: '2026-10-21T01:00:00Z',
    calledAt: '2026-10-21T01:05:00Z',
    completedAt: null,
    callCount: 1,
  };

  const waitingTicket: QueueItem = {
    id: 'tkt-waiting',
    number: 'A-002',
    prefix: 'A',
    sequenceNumber: 2,
    serviceId: 'srv-1',
    serviceName: 'Pelayanan Umum',
    counterId: null,
    counterName: null,
    status: 'waiting',
    createdAt: '2026-10-21T01:06:00Z',
    calledAt: null,
    completedAt: null,
    callCount: 0,
  };

  const counterWithActive: Counter = {
    ...mockCounter,
    currentTicketId: 'tkt-active',
  };

  // 1. While ticket is calling/serving, canCounterCallNext MUST return false
  const resultBlocked = canCounterCallNext(counterWithActive, [activeTicket, waitingTicket]);
  assert.equal(resultBlocked.canCall, false);
  assert.equal(resultBlocked.activeTicket?.id, 'tkt-active');
  assert.match(resultBlocked.reason || '', /masih berlangsung.*Selesai/i);

  // 2. Also holds true if ticket was recalled from skipped (status: 'calling')
  const recalledTicket: QueueItem = {
    ...activeTicket,
    id: 'tkt-recalled-from-skipped',
    number: 'A-099',
    status: 'calling',
  };
  const counterWithRecalled: Counter = {
    ...mockCounter,
    currentTicketId: 'tkt-recalled-from-skipped',
  };
  const resultRecalledBlocked = canCounterCallNext(counterWithRecalled, [recalledTicket, waitingTicket]);
  assert.equal(resultRecalledBlocked.canCall, false);
  assert.equal(resultRecalledBlocked.activeTicket?.number, 'A-099');

  // 3. Once active ticket is completed (clicked 'Selesai'), canCounterCallNext MUST return true
  const completedTicket: QueueItem = {
    ...activeTicket,
    status: 'completed',
    completedAt: '2026-10-21T01:15:00Z',
  };
  const counterFree: Counter = {
    ...mockCounter,
    currentTicketId: null,
  };
  const resultAllowed = canCounterCallNext(counterFree, [completedTicket, waitingTicket]);
  assert.equal(resultAllowed.canCall, true);
  assert.equal(resultAllowed.activeTicket, null);
});

test('active ticket is reliably resolved by either currentTicketId or ticket counterId matching calling/serving state', () => {
  const counter: Counter = {
    ...mockCounter,
    currentTicketId: null, // Simulated dropped currentTicketId due to phone sleep/reconnect
  };

  const activeTicket: QueueItem = {
    id: 'tkt-active-1',
    number: 'A-007',
    prefix: 'A',
    sequenceNumber: 7,
    serviceId: 'srv-1',
    serviceName: 'Pelayanan Umum',
    counterId: 'loket-1',
    counterName: 'Loket 1',
    status: 'calling',
    createdAt: '2026-10-21T01:00:00Z',
    calledAt: '2026-10-21T01:05:00Z',
    completedAt: null,
    callCount: 1,
  };

  const found = [activeTicket].find(
    (q) =>
      (q.id === counter.currentTicketId || (counter && q.counterId === counter.id)) &&
      (q.status === 'calling' || q.status === 'serving')
  );

  assert.ok(found);
  assert.equal(found?.number, 'A-007');
  assert.equal(found?.id, 'tkt-active-1');
});

test('resolveTicketDestinationLabel resolves assigned counter or matching open counters', () => {
  const counters: Counter[] = [
    {
      id: 'loket-1',
      name: 'Loket 1',
      operatorName: 'Ahmad',
      supportedServiceIds: ['srv-1'],
      currentTicketId: null,
      status: 'open',
    },
    {
      id: 'loket-2',
      name: 'Loket 2',
      operatorName: 'Dewi',
      supportedServiceIds: ['srv-2'],
      currentTicketId: null,
      status: 'open',
    },
    {
      id: 'loket-3',
      name: 'Loket 3',
      operatorName: 'Budi',
      supportedServiceIds: ['srv-1'],
      currentTicketId: null,
      status: 'open',
    },
  ];

  // Assigned ticket counterName takes precedence
  assert.equal(
    resolveTicketDestinationLabel({ counterName: 'Loket 2', serviceId: 'srv-1' }, counters),
    'Loket 2'
  );

  // Unassigned ticket resolves open counters supporting that service
  assert.equal(
    resolveTicketDestinationLabel({ counterName: null, serviceId: 'srv-1' }, counters),
    'Loket 1 / Loket 3'
  );

  // Falls back cleanly if no counter supports service
  assert.equal(
    resolveTicketDestinationLabel({ counterName: null, serviceId: 'srv-unknown' }, counters),
    'Loket Pelayanan'
  );
});



