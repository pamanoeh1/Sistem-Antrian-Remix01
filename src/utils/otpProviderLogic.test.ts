import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizePhoneForOtpApi,
  buildVerifyNowSendUrl,
  buildVerifyNowValidateUrl,
  validateOtpGatewayConfig,
  DEFAULT_OTP_GATEWAY,
} from './otpProviderLogic';

test('normalizePhoneForOtpApi converts Indonesian 08xx, +628xx, and 628xx consistently', () => {
  assert.deepEqual(normalizePhoneForOtpApi('081234567890'), {
    countryCode: '62',
    mobileNumber: '81234567890',
    e164Digits: '6281234567890',
  });
  assert.deepEqual(normalizePhoneForOtpApi('+62 812-3456-7890'), {
    countryCode: '62',
    mobileNumber: '81234567890',
    e164Digits: '6281234567890',
  });
  assert.deepEqual(normalizePhoneForOtpApi('6281234567890'), {
    countryCode: '62',
    mobileNumber: '81234567890',
    e164Digits: '6281234567890',
  });
});

test('buildVerifyNowSendUrl and buildVerifyNowValidateUrl construct MessageCentral v3 URLs', () => {
  const sendUrl = buildVerifyNowSendUrl({
    countryCode: '62',
    customerId: 'CUST-99',
    flowType: 'WHATSAPP',
    mobileNumber: '81234567890',
  });
  assert.ok(sendUrl.startsWith('https://cpaas.messagecentral.com/verification/v3/send?'));
  assert.ok(sendUrl.includes('flowType=WHATSAPP'));
  assert.ok(sendUrl.includes('customerId=CUST-99'));
  assert.ok(sendUrl.includes('mobileNumber=81234567890'));

  const valUrl = buildVerifyNowValidateUrl({
    countryCode: '62',
    customerId: 'CUST-99',
    verificationId: 'VER-12345',
    code: '654321',
  });
  assert.ok(valUrl.includes('verificationId=VER-12345'));
  assert.ok(valUrl.includes('code=654321'));
});

test('validateOtpGatewayConfig checks credentials for VerifyNow and Fonnte', () => {
  assert.equal(validateOtpGatewayConfig(DEFAULT_OTP_GATEWAY).ready, true);

  const incompleteVerifyNow = validateOtpGatewayConfig({
    provider: 'verifynow',
    verifyNowCustomerId: 'CUST-1',
    verifyNowAuthToken: '',
  });
  assert.equal(incompleteVerifyNow.ready, false);

  const validVerifyNow = validateOtpGatewayConfig({
    provider: 'verifynow',
    verifyNowCustomerId: 'CUST-1',
    verifyNowAuthToken: 'token-abc',
  });
  assert.equal(validVerifyNow.ready, true);
});
