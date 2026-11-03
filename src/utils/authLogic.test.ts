import test from 'node:test';
import assert from 'node:assert/strict';
import {
  verifyUserLogin,
  validateAndUpdatePassword,
  DEFAULT_SERVER_CREDENTIALS,
  DEFAULT_PENJAGA_ACCOUNTS,
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

test('validateAndUpdatePassword validates and returns new credentials', () => {
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
});
