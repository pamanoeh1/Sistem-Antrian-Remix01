import {
  OtpGatewaySettings,
  OtpDeliveryChannel,
  normalizePhoneForOtpApi,
  buildVerifyNowSendUrl,
  buildVerifyNowValidateUrl,
} from '../utils/otpProviderLogic';

interface StoredOtpSession {
  code: string;
  destination: string;
  username?: string;
  expiresAt: number;
}

const serverOtpStore = new Map<string, StoredOtpSession>();

function pruneExpiredOtpSessions() {
  const now = Date.now();
  serverOtpStore.forEach((val, key) => {
    if (now > val.expiresAt) serverOtpStore.delete(key);
  });
}

export interface SendResetCodeRequest {
  channel: 'phone' | 'email';
  destination: string;
  username?: string;
  waChannel?: OtpDeliveryChannel;
  otpSettings?: OtpGatewaySettings;
}

export interface SendResetCodeResponse {
  httpStatus: number;
  body: {
    status: 'ok' | 'error';
    deliveredViaWebhook: boolean;
    provider: string;
    verificationId?: string;
    channelType?: OtpDeliveryChannel;
    code?: string;
    message?: string;
  };
}

export async function processSendResetCode(
  reqBody: SendResetCodeRequest
): Promise<SendResetCodeResponse> {
  const { channel, destination, username, waChannel, otpSettings } = reqBody || {};
  if (!channel || !destination) {
    return {
      httpStatus: 400,
      body: {
        status: 'error',
        deliveredViaWebhook: false,
        provider: 'none',
        message: 'Channel dan tujuan wajib diisi.',
      },
    };
  }

  pruneExpiredOtpSessions();
  const generatedCode = String(Math.floor(100000 + Math.random() * 900000));
  const messageText = `Kode verifikasi reset kata sandi (${username || 'Akun Antrean'}): ${generatedCode}. Berlaku 10 menit.`;

  // Email delivery
  if (channel === 'email') {
    const emailWebhook =
      process.env.SMTP_WEBHOOK_URL ||
      (otpSettings?.provider === 'custom_webhook' ? otpSettings.customWebhookUrl?.trim() : '');

    if (emailWebhook) {
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (otpSettings?.customWebhookBearer?.trim()) {
          headers.Authorization = `Bearer ${otpSettings.customWebhookBearer.trim()}`;
        }
        const resp = await fetch(emailWebhook, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            channel: 'email',
            to: destination,
            username,
            code: generatedCode,
            message: messageText,
          }),
        });
        if (resp.ok) {
          const verificationId = `otp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
          serverOtpStore.set(verificationId, {
            code: generatedCode,
            destination,
            username,
            expiresAt: Date.now() + 10 * 60 * 1000,
          });
          return {
            httpStatus: 200,
            body: {
              status: 'ok',
              deliveredViaWebhook: true,
              provider: 'custom_webhook',
              verificationId,
              message: 'Kode OTP berhasil dikirim ke email melalui webhook.',
            },
          };
        }
      } catch {
        // Fall through if webhook unreachable
      }
    }

    return {
      httpStatus: 200,
      body: {
        status: 'ok',
        deliveredViaWebhook: false,
        provider: 'local_preview',
        code: generatedCode,
      },
    };
  }

  // Phone delivery (SMS / WhatsApp OTP API)
  const provider = otpSettings?.provider || (process.env.VERIFYNOW_CUSTOMER_ID ? 'verifynow' : 'local_preview');

  // 1. VerifyNow (MessageCentral SMS & WhatsApp OTP API)
  if (provider === 'verifynow') {
    const customerId = (otpSettings?.verifyNowCustomerId || process.env.VERIFYNOW_CUSTOMER_ID || '').trim();
    const authToken = (otpSettings?.verifyNowAuthToken || process.env.VERIFYNOW_AUTH_TOKEN || '').trim();
    const defaultCc = (otpSettings?.verifyNowCountryCode || '62').trim();
    const flowType: OtpDeliveryChannel =
      waChannel || otpSettings?.verifyNowChannel || 'WHATSAPP';

    if (!customerId || !authToken) {
      return {
        httpStatus: 400,
        body: {
          status: 'error',
          deliveredViaWebhook: false,
          provider: 'verifynow',
          message: 'Customer ID dan Auth Token VerifyNow belum diisi di Pengaturan Server.',
        },
      };
    }

    const { countryCode, mobileNumber } = normalizePhoneForOtpApi(destination, defaultCc);
    if (!mobileNumber) {
      return {
        httpStatus: 400,
        body: {
          status: 'error',
          deliveredViaWebhook: false,
          provider: 'verifynow',
          message: 'Nomor HP tujuan tidak valid.',
        },
      };
    }

    const sendUrl = buildVerifyNowSendUrl({
      countryCode,
      customerId,
      flowType,
      mobileNumber,
    });

    try {
      const resp = await fetch(sendUrl, {
        method: 'POST',
        headers: {
          authToken,
          Accept: 'application/json',
        },
      });
      const json = (await resp.json().catch(() => null)) as {
        responseCode?: number;
        message?: string;
        errorMessage?: string;
        data?: { verificationId?: string | number };
      } | null;

      if (resp.ok && json?.data?.verificationId) {
        return {
          httpStatus: 200,
          body: {
            status: 'ok',
            deliveredViaWebhook: true,
            provider: 'verifynow',
            verificationId: String(json.data.verificationId),
            channelType: flowType,
            message: `Kode OTP berhasil dikirim via VerifyNow (${flowType}).`,
          },
        };
      }

      const apiErr = json?.errorMessage || json?.message || `HTTP ${resp.status}`;
      return {
        httpStatus: 502,
        body: {
          status: 'error',
          deliveredViaWebhook: false,
          provider: 'verifynow',
          message: `VerifyNow gagal mengirim OTP (${flowType}): ${apiErr}`,
        },
      };
    } catch (err: unknown) {
      return {
        httpStatus: 502,
        body: {
          status: 'error',
          deliveredViaWebhook: false,
          provider: 'verifynow',
          message: `Gagal menghubungi server VerifyNow: ${err instanceof Error ? err.message : 'Network error'}`,
        },
      };
    }
  }

  // 2. Fonnte WhatsApp Gateway API
  if (provider === 'fonnte_whatsapp') {
    const token = (otpSettings?.fonnteToken || process.env.FONNTE_TOKEN || '').trim();
    if (!token) {
      return {
        httpStatus: 400,
        body: {
          status: 'error',
          deliveredViaWebhook: false,
          provider: 'fonnte_whatsapp',
          message: 'API Token Fonnte WhatsApp belum diisi di Pengaturan Server.',
        },
      };
    }

    const { e164Digits } = normalizePhoneForOtpApi(destination, otpSettings?.verifyNowCountryCode || '62');
    try {
      const resp = await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: {
          Authorization: token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target: e164Digits,
          message: messageText,
        }),
      });
      const json = (await resp.json().catch(() => null)) as { status?: boolean; reason?: string; detail?: string } | null;
      if (resp.ok && json?.status !== false) {
        const verificationId = `fonnte_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        serverOtpStore.set(verificationId, {
          code: generatedCode,
          destination,
          username,
          expiresAt: Date.now() + 10 * 60 * 1000,
        });
        return {
          httpStatus: 200,
          body: {
            status: 'ok',
            deliveredViaWebhook: true,
            provider: 'fonnte_whatsapp',
            verificationId,
            channelType: 'WHATSAPP',
            message: 'Kode OTP berhasil dikirim ke WhatsApp melalui Fonnte API.',
          },
        };
      }
      return {
        httpStatus: 502,
        body: {
          status: 'error',
          deliveredViaWebhook: false,
          provider: 'fonnte_whatsapp',
          message: `Fonnte gagal mengirim OTP: ${json?.reason || json?.detail || `HTTP ${resp.status}`}`,
        },
      };
    } catch (err: unknown) {
      return {
        httpStatus: 502,
        body: {
          status: 'error',
          deliveredViaWebhook: false,
          provider: 'fonnte_whatsapp',
          message: `Gagal menghubungi API Fonnte: ${err instanceof Error ? err.message : 'Network error'}`,
        },
      };
    }
  }

  // 3. Custom SMS / WhatsApp Webhook API
  if (provider === 'custom_webhook' || process.env.SMS_WEBHOOK_URL) {
    const webhookUrl = (otpSettings?.customWebhookUrl || process.env.SMS_WEBHOOK_URL || '').trim();
    if (!webhookUrl) {
      return {
        httpStatus: 400,
        body: {
          status: 'error',
          deliveredViaWebhook: false,
          provider: 'custom_webhook',
          message: 'URL Webhook SMS/WhatsApp belum diisi.',
        },
      };
    }
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (otpSettings?.customWebhookBearer?.trim()) {
        headers.Authorization = `Bearer ${otpSettings.customWebhookBearer.trim()}`;
      }
      const { e164Digits } = normalizePhoneForOtpApi(destination, otpSettings?.verifyNowCountryCode || '62');
      const resp = await fetch(webhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          channel: waChannel || 'WHATSAPP',
          to: e164Digits,
          destination,
          username,
          code: generatedCode,
          message: messageText,
        }),
      });
      if (resp.ok) {
        const verificationId = `wh_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        serverOtpStore.set(verificationId, {
          code: generatedCode,
          destination,
          username,
          expiresAt: Date.now() + 10 * 60 * 1000,
        });
        return {
          httpStatus: 200,
          body: {
            status: 'ok',
            deliveredViaWebhook: true,
            provider: 'custom_webhook',
            verificationId,
            channelType: waChannel || 'WHATSAPP',
            message: 'Kode OTP berhasil dikirim ke SMS/WhatsApp melalui Webhook API.',
          },
        };
      }
      return {
        httpStatus: 502,
        body: {
          status: 'error',
          deliveredViaWebhook: false,
          provider: 'custom_webhook',
          message: `Webhook SMS/WA gagal (HTTP ${resp.status}).`,
        },
      };
    } catch (err: unknown) {
      return {
        httpStatus: 502,
        body: {
          status: 'error',
          deliveredViaWebhook: false,
          provider: 'custom_webhook',
          message: `Gagal menghubungi Webhook SMS/WA: ${err instanceof Error ? err.message : 'Network error'}`,
        },
      };
    }
  }

  // 4. Local Preview / Offline LAN fallback
  return {
    httpStatus: 200,
    body: {
      status: 'ok',
      deliveredViaWebhook: false,
      provider: 'local_preview',
      channelType: waChannel || 'WHATSAPP',
      code: generatedCode,
    },
  };
}

export interface VerifyResetCodeRequest {
  verificationId: string;
  code: string;
  destination: string;
  otpSettings?: OtpGatewaySettings;
}

export async function processVerifyResetCode(
  reqBody: VerifyResetCodeRequest
): Promise<{ httpStatus: number; body: { status: 'ok' | 'error'; valid: boolean; message?: string } }> {
  const { verificationId, code, destination, otpSettings } = reqBody || {};
  const cleanOtp = (code || '').replace(/\D/g, '');
  if (!verificationId || !cleanOtp) {
    return {
      httpStatus: 400,
      body: { status: 'error', valid: false, message: 'ID verifikasi dan kode OTP wajib diisi.' },
    };
  }

  // VerifyNow external OTP validation
  if (otpSettings?.provider === 'verifynow') {
    const customerId = (otpSettings.verifyNowCustomerId || process.env.VERIFYNOW_CUSTOMER_ID || '').trim();
    const authToken = (otpSettings.verifyNowAuthToken || process.env.VERIFYNOW_AUTH_TOKEN || '').trim();
    const { countryCode } = normalizePhoneForOtpApi(destination, otpSettings.verifyNowCountryCode || '62');
    const url = buildVerifyNowValidateUrl({
      countryCode,
      customerId,
      verificationId,
      code: cleanOtp,
    });
    try {
      const resp = await fetch(url, {
        method: 'GET',
        headers: { authToken, Accept: 'application/json' },
      });
      const json = (await resp.json().catch(() => null)) as {
        responseCode?: number;
        message?: string;
        errorMessage?: string;
        data?: { verificationStatus?: string };
      } | null;
      const verified =
        resp.ok &&
        (json?.data?.verificationStatus === 'VERIFICATION_COMPLETED' ||
          json?.responseCode === 200);
      if (verified) {
        return { httpStatus: 200, body: { status: 'ok', valid: true } };
      }
      return {
        httpStatus: 400,
        body: {
          status: 'error',
          valid: false,
          message: json?.errorMessage || json?.message || 'Kode OTP VerifyNow tidak cocok.',
        },
      };
    } catch {
      return {
        httpStatus: 502,
        body: { status: 'error', valid: false, message: 'Gagal memvalidasi OTP ke server VerifyNow.' },
      };
    }
  }

  // Server-stored session (Fonnte / Webhook)
  pruneExpiredOtpSessions();
  const stored = serverOtpStore.get(verificationId);
  if (!stored) {
    return {
      httpStatus: 400,
      body: { status: 'error', valid: false, message: 'Sesi OTP kedaluwarsa atau tidak ditemukan.' },
    };
  }
  if (stored.code !== cleanOtp) {
    return {
      httpStatus: 400,
      body: { status: 'error', valid: false, message: 'Kode verifikasi angka tidak sesuai.' },
    };
  }
  serverOtpStore.delete(verificationId);
  return { httpStatus: 200, body: { status: 'ok', valid: true } };
}
