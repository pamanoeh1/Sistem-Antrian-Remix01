import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyGuidePassword } from './helpGuideAuth';

test('verifyGuidePassword accepts correct password "12345"', () => {
  assert.equal(verifyGuidePassword('12345'), true);
  assert.equal(verifyGuidePassword('  12345  '), true);
});

test('verifyGuidePassword rejects incorrect password', () => {
  assert.equal(verifyGuidePassword(''), false);
  assert.equal(verifyGuidePassword('1234'), false);
  assert.equal(verifyGuidePassword('admin'), false);
  assert.equal(verifyGuidePassword('123456'), false);
});
