import test from 'node:test';
import assert from 'node:assert/strict';
import {
  verifyUserLogin,
  verifyPenjagaLanLogin,
  validateAndUpdatePassword,
  syncCountersWithPetugasUpdate,
  syncPetugasWithCounterUpdate,
  DEFAULT_SERVER_CREDENTIALS,
  DEFAULT_PENJAGA_ACCOUNTS,
  PenjagaAccount,
} from './authLogic';

test('verifyUserLogin accepts Server credentials for admin and server', () => {
  const resAdmin = verifyUserLogin('admin', 'admin123');
  assert.equal(resAdmin.success, true);
  assert.equal(resAdmin.session?.role, 'server');

  const resServer = verifyUserLogin('server', 'admin123');
  assert.equal(resServer.success, true);
  assert.equal(resServer.session?.role, 'server');
});

test('verifyUserLogin accepts Penjaga credentials', () => {
  const resPenjaga = verifyUserLogin('penjaga', 'penjaga123');
  assert.equal(resPenjaga.success, true);
  assert.equal(resPenjaga.session?.role, 'penjaga');

  const resLoket1 = verifyUserLogin('loket1', 'loket123');
  assert.equal(resLoket1.success, true);
  assert.equal(resLoket1.session?.role, 'penjaga');
  assert.equal(resLoket1.session?.counterId, 'loket-1');
});

test('verifyUserLogin rejects invalid password or unknown user', () => {
  const badPass = verifyUserLogin('admin', 'wrongpass');
  assert.equal(badPass.success, false);

  const unknown = verifyUserLogin('unknownuser', 'pass123');
  assert.equal(unknown.success, false);
});

test('validateAndUpdatePassword validates and returns new credentials while preserving recovery contacts', () => {
  const res = validateAndUpdatePassword(
    'admin123',
    'newpassword123',
    'newpassword123',
    DEFAULT_SERVER_CREDENTIALS,
    'superadmin'
  );

  assert.equal(res.success, true);
  assert.equal(res.updatedCredentials?.username, 'superadmin');
  assert.equal(res.updatedCredentials?.passwordHash, 'newpassword123');
  assert.equal(res.updatedCredentials?.recoveryPhone, DEFAULT_SERVER_CREDENTIALS.recoveryPhone);
  assert.equal(res.updatedCredentials?.recoveryEmail, DEFAULT_SERVER_CREDENTIALS.recoveryEmail);
});

test('verifyPenjagaLanLogin accepts valid LAN, server, or petugas account password and assigns counter', () => {
  const dummyCounters = [
    { id: 'loket-1', name: 'Loket 1', operatorName: 'Ahmad', operatorUsername: 'ahmad' },
    { id: 'loket-2', name: 'Loket 2', operatorName: 'Dewi', operatorUsername: 'dewi' },
  ];

  const customAccounts: PenjagaAccount[] = [
    { username: 'ahmad', name: 'Ahmad', passwordHash: 'rahasia-ahmad', counterId: 'loket-1' },
    { username: 'dewi', name: 'Dewi', passwordHash: 'rahasia-dewi', counterId: 'loket-2' },
  ];

  const res1 = verifyPenjagaLanLogin({
    password: 'lan123',
    counterId: 'loket-2',
    counters: dummyCounters,
  });
  assert.equal(res1.success, true);
  assert.equal(res1.session?.role, 'penjaga');
  assert.equal(res1.session?.counterId, 'loket-2');
  assert.equal(res1.session?.name, 'Operator (Dewi)');

  // Accepts registered petugas account password and resolves linked username
  const resAccountPass = verifyPenjagaLanLogin({
    password: 'rahasia-ahmad',
    counterId: 'loket-1',
    counters: dummyCounters,
    penjagaAccounts: customAccounts,
  });
  assert.equal(resAccountPass.success, true);
  assert.equal(resAccountPass.session?.username, 'ahmad');
  assert.equal(resAccountPass.session?.name, 'Operator (Ahmad)');

  // Rejects invalid password
  const resBad = verifyPenjagaLanLogin({
    password: 'wrong',
    counterId: 'loket-1',
    counters: dummyCounters,
    penjagaAccounts: customAccounts,
  });
  assert.equal(resBad.success, false);
});

test('syncCountersWithPetugasUpdate syncs operatorName and operatorUsername onto assigned counter', () => {
  const counters = [
    { id: 'loket-1', name: 'Loket 1', operatorName: 'Ahmad Fauzi', operatorUsername: 'loket1' },
    { id: 'loket-2', name: 'Loket 2', operatorName: 'Dewi Lestari', operatorUsername: 'loket2' },
  ];

  // Assign new petugas account to loket-2
  const updatedAccount: PenjagaAccount = {
    username: 'rina',
    name: 'Rina Marlina',
    passwordHash: 'rina123',
    counterId: 'loket-2',
  };
  const synced = syncCountersWithPetugasUpdate(counters, updatedAccount);
  assert.equal(synced[1].operatorName, 'Rina Marlina');
  assert.equal(synced[1].operatorUsername, 'rina');
  assert.equal(synced[0].operatorName, 'Ahmad Fauzi');

  // Updating name on account already linked to loket-1 without counterId still updates counter name
  const renamedAccount: PenjagaAccount = {
    username: 'loket1',
    name: 'Ahmad Fauzi, S.Kom',
    passwordHash: 'loket123',
    counterId: '',
  };
  const syncedRename = syncCountersWithPetugasUpdate(synced, renamedAccount, 'loket1');
  assert.equal(syncedRename[0].operatorName, 'Ahmad Fauzi, S.Kom');
});

test('syncPetugasWithCounterUpdate links selected petugas account to counterId', () => {
  const accounts: PenjagaAccount[] = [
    ...DEFAULT_PENJAGA_ACCOUNTS,
    { username: 'rina', name: 'Rina Marlina', passwordHash: 'rina123', counterId: '' },
  ];

  const synced = syncPetugasWithCounterUpdate(accounts, 'loket-3', 'rina', 'Rina Marlina');
  const rina = synced.find((a) => a.username === 'rina');
  assert.equal(rina?.counterId, 'loket-3');
});
