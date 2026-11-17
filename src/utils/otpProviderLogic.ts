/**
 * Pure helpers & validation for SMS & WhatsApp OTP API providers
 * (VerifyNow / MessageCentral, Fonnte WhatsApp, Custom Webhook, and Local Fallback).
 */

export type OtpProviderType =
  | 'local_preview'
  | 'verifynow'
  | 'fonnte_whatsapp'
  | 'custom_webhook';

export type OtpDeliveryChannel = 'SMS' | 'WHATSAPP';

export interface OtpGatewaySettings {
  provider: OtpProviderType;
  verifyNowCustomerId?: string;
  verifyNowAuthToken?: string;
  verifyNowCountryCode?: string;
  verifyNowChannel?: OtpDeliveryChannel;
  fonnteToken?: string;
  customWebhookUrl?: string;
  customWebhookBearer?: string;
}

export const DEFAULT_OTP_GATEWAY: OtpGatewaySettings = {
  provider: 'local_preview',
  verifyNowCustomerId: '',
  verifyNowAuthToken: '',
  verifyNowCountryCode: '62',
  verifyNowChannel: 'WHATSAPP',
  fonnteToken: '',
  customWebhookUrl: '',
  customWebhookBearer: '',
};

/**
 * Normalizes a local or international phone number into countryCode + nationalNumber.
 * Defaults to Indonesia ('62').
 */
export function normalizePhoneForOtpApi(
  phone: string,
  defaultCountryCode = '62'
): {
  countryCode: string;
  mobileNumber: string;
  e164Digits: string;
} {
  const cc = (defaultCountryCode || '62').replace(/\D/g, '') || '62';
  const digits = (phone || '').replace(/\D/g, '');
  if (!digits) {
    return { countryCode: cc, mobileNumber: '', e164Digits: '' };
  }

  let mobileNumber = digits;
  if (digits.startsWith('0')) {
    mobileNumber = digits.slice(1);
  } else if (digits.startsWith(cc) && digits.length > cc.length + 6) {
    mobileNumber = digits.slice(cc.length);
  }

  return {
    countryCode: cc,
    mobileNumber,
    e164Digits: `${cc}${mobileNumber}`,
  };
}

/**
 * Builds the VerifyNow (MessageCentral) v3 OTP send URL.
 */
export function buildVerifyNowSendUrl(params: {
  countryCode: string;
  customerId: string;
  flowType: OtpDeliveryChannel;
  mobileNumber: string;
}): string {
  const query = new URLSearchParams({
    countryCode: params.countryCode.replace(/\D/g, '') || '62',
    customerId: params.customerId.trim(),
    flowType: params.flowType === 'WHATSAPP' ? 'WHATSAPP' : 'SMS',
    mobileNumber: params.mobileNumber.replace(/\D/g, ''),
  });
  return `https://cpaas.messagecentral.com/verification/v3/send?${query.toString()}`;
}

/**
 * Builds the VerifyNow (MessageCentral) v3 OTP verification URL.
 */
export function buildVerifyNowValidateUrl(params: {
  countryCode: string;
  customerId: string;
  verificationId: string;
  code: string;
}): string {
  const query = new URLSearchParams({
    countryCode: params.countryCode.replace(/\D/g, '') || '62',
    customerId: params.customerId.trim(),
    verificationId: params.verificationId.trim(),
    code: params.code.replace(/\D/g, ''),
  });
  return `https://cpaas.messagecentral.com/verification/v3/validateOtp?${query.toString()}`;
}

export function getOtpProviderLabel(provider?: OtpProviderType): string {
  switch (provider) {
    case 'verifynow':
      return 'VerifyNow (SMS & WhatsApp OTP API)';
    case 'fonnte_whatsapp':
      return 'Fonnte WhatsApp Gateway API';
    case 'custom_webhook':
      return 'Custom SMS / WhatsApp Webhook API';
    case 'local_preview':
    default:
      return 'Simulasi Lokal / Layar Offline';
  }
}

export function validateOtpGatewayConfig(settings?: OtpGatewaySettings): {
  ready: boolean;
  label: string;
  issue?: string;
} {
  const effective = settings || DEFAULT_OTP_GATEWAY;
  const label = getOtpProviderLabel(effective.provider);

  if (effective.provider === 'verifynow') {
    if (!effective.verifyNowCustomerId?.trim() || !effective.verifyNowAuthToken?.trim()) {
      return {
        ready: false,
        label,
        issue: 'Customer ID dan Auth Token VerifyNow wajib diisi.',
      };
    }
    return { ready: true, label };
  }

  if (effective.provider === 'fonnte_whatsapp') {
    if (!effective.fonnteToken?.trim()) {
      return {
        ready: false,
        label,
        issue: 'API Token Fonnte WhatsApp wajib diisi.',
      };
    }
    return { ready: true, label };
  }

  if (effective.provider === 'custom_webhook') {
    if (!effective.customWebhookUrl?.trim()) {
      return {
        ready: false,
        label,
        issue: 'URL Webhook SMS/WhatsApp wajib diisi.',
      };
    }
    return { ready: true, label };
  }

  return { ready: true, label };
}
