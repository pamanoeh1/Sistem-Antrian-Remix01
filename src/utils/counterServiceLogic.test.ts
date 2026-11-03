import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateServicePrefix,
  addCounter,
  updateCounter,
  deleteCounter,
  addServiceCategory,
  updateServiceCategory,
  deleteServiceCategory,
} from './counterServiceLogic';
import { Counter, ServiceCategory } from '../types/queue';

const initialServices: ServiceCategory[] = [
  {
    id: 's-1',
    prefix: 'A',
    name: 'Umum',
    description: 'Umum',
    icon: 'Users',
    color: 'emerald',
    estimatedMinutes: 5,
    active: true,
  },
  {
    id: 's-2',
    prefix: 'B',
    name: 'Kasir',
    description: 'Kasir',
    icon: 'CreditCard',
    color: 'blue',
    estimatedMinutes: 3,
    active: true,
  },
];

const initialCounters: Counter[] = [
  {
    id: 'c-1',
    name: 'Loket 1',
    operatorName: 'Ahmad',
    supportedServiceIds: ['s-1'],
    currentTicketId: null,
    status: 'open',
  },
  {
    id: 'c-2',
    name: 'Loket 2',
    operatorName: 'Dewi',
    supportedServiceIds: ['s-2'],
    currentTicketId: null,
    status: 'open',
  },
];

test('validateServicePrefix validates single A-Z letter and catches duplicates', () => {
  assert.equal(validateServicePrefix('C', initialServices).valid, true);
  assert.equal(validateServicePrefix('a', initialServices).valid, false); // duplicate of 'A'
  assert.equal(validateServicePrefix('AB', initialServices).valid, false); // multiple letters
  assert.equal(validateServicePrefix('1', initialServices).valid, false); // number
  assert.equal(validateServicePrefix('A', initialServices, 's-1').valid, true); // updating same service is valid
});

test('addCounter successfully adds counter and validates required fields', () => {
  const resultFail = addCounter(initialCounters, {
    name: '',
    operatorName: 'Test',
    supportedServiceIds: ['s-1'],
  });
  assert.equal(resultFail.success, false);

  const resultOk = addCounter(initialCounters, {
    name: 'Loket 3',
    operatorName: 'Siti Rahma',
    supportedServiceIds: ['s-1', 's-2'],
  });
  assert.equal(resultOk.success, true);
  assert.equal(resultOk.updatedCounters.length, 3);
  assert.equal(resultOk.newCounter?.name, 'Loket 3');
});

test('updateCounter updates fields correctly', () => {
  const updateRes = updateCounter(initialCounters, 'c-1', {
    name: 'Loket 1 - VIP',
    operatorName: 'Ahmad Fauzi S.Kom',
  });
  assert.equal(updateRes.success, true);
  const updated = updateRes.updatedCounters.find((c) => c.id === 'c-1');
  assert.equal(updated?.name, 'Loket 1 - VIP');
  assert.equal(updated?.operatorName, 'Ahmad Fauzi S.Kom');
});

test('deleteCounter removes counter but preserves minimum 1 counter guard', () => {
  const delRes = deleteCounter(initialCounters, 'c-2');
  assert.equal(delRes.success, true);
  assert.equal(delRes.updatedCounters.length, 1);

  // Try deleting the last one
  const delLast = deleteCounter(delRes.updatedCounters, 'c-1');
  assert.equal(delLast.success, false);
  assert.match(delLast.error || '', /terakhir/i);
});

test('addServiceCategory adds new service with prefix formatting', () => {
  const res = addServiceCategory(initialServices, {
    prefix: 'c',
    name: 'Pengaduan Cepat',
    description: 'Layanan keluhan pelanggan',
    estimatedMinutes: 10,
    color: 'amber',
  });
  assert.equal(res.success, true);
  assert.equal(res.updatedServices.length, 3);
  assert.equal(res.newService?.prefix, 'C');
  assert.equal(res.newService?.estimatedMinutes, 10);
});

test('updateServiceCategory updates service and validates duplicate prefix', () => {
  // Attempt to change s-2 prefix to 'A' (already used by s-1)
  const failDuplicate = updateServiceCategory(initialServices, 's-2', { prefix: 'A' });
  assert.equal(failDuplicate.success, false);

  // Valid change
  const okUpdate = updateServiceCategory(initialServices, 's-2', {
    prefix: 'K',
    name: 'Kasir Khusus',
  });
  assert.equal(okUpdate.success, true);
  const target = okUpdate.updatedServices.find((s) => s.id === 's-2');
  assert.equal(target?.prefix, 'K');
  assert.equal(target?.name, 'Kasir Khusus');
});

test('deleteServiceCategory protects minimum service limit', () => {
  const res = deleteServiceCategory(initialServices, 's-2');
  assert.equal(res.success, true);
  assert.equal(res.updatedServices.length, 1);

  const failLast = deleteServiceCategory(res.updatedServices, 's-1');
  assert.equal(failLast.success, false);
});
