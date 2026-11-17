import React, { useState } from 'react';
import { CompanyProfile, Counter } from '../../types/queue';
import {
  getStoredAdminCredentials,
  setStoredAdminCredentials,
  getStoredPenjagaAccounts,
  setStoredPenjagaAccounts,
  loginUserSession,
} from '../../utils/authStore';
import {
  verifyUserLogin,
  verifyPenjagaLanLogin,
  UserSession,
  PenjagaAccount,
} from '../../utils/authLogic';
import { getStoredLanSettings, broadcastSyncEvent } from '../../utils/queueStore';
import {
  ResetTargetRole,
  ResetChannel,
  PendingResetChallenge,
  maskContactInfo,
  generateNumericOtpCode,
  findMatchingContactForReset,
  validatePasswordResetSubmission,
} from '../../utils/passwordResetLogic';
import {
  OtpDeliveryChannel,
  getOtpProviderLabel,
} from '../../utils/otpProviderLogic';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Server,
  UserCheck,
  Globe,
  CheckCircle2,
  Check,
  KeyRound,
  Phone,
  Mail,
  X,
  RefreshCw,
} from 'lucide-react';

interface AdminLoginViewProps {
  company: CompanyProfile;
  counters?: Counter[];
  penjagaAccounts?: PenjagaAccount[];
  initialRoleTab?: 'server' | 'penjaga';
  onLoginSuccess: (session: UserSession) => void;
  onPenjagaAccountsUpdated?: (accounts: PenjagaAccount[]) => void;
  onNavigateDisplay?: () => void;
  onNavigateKiosk?: () => void;
}

export const AdminLoginView: React.FC<AdminLoginViewProps> = ({
  company,
  counters = [],
  penjagaAccounts,
  initialRoleTab = 'penjaga',
  onLoginSuccess,
  onPenjagaAccountsUpdated,
}) => {
  const [activeLoginType, setActiveLoginType] = useState<'server' | 'penjaga'>(
    initialRoleTab
  );

  // Auto-detect Server IP/Hostname from current browser URL
  const defaultHost =
    typeof window !== 'undefined'
      ? window.location.hostname || 'localhost'
      : 'localhost';

  const [serverIp, setServerIp] = useState<string>(defaultHost);
  const [isCustomIpOpen, setIsCustomIpOpen] = useState<boolean>(false);
  const [selectedCounterId, setSelectedCounterId] = useState<string>(
    counters[0]?.id || 'loket-1'
  );

  // Password for Petugas Loket
  const [lanPassword, setLanPassword] = useState<string>('');

  // Server Admin credentials
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');

  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password Reset Modal State
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetRole, setResetRole] = useState<ResetTargetRole>(initialRoleTab);
  const [resetPenjagaUsername, setResetPenjagaUsername] = useState<string>(() => {
    const list =
      penjagaAccounts && penjagaAccounts.length > 0
        ? penjagaAccounts
        : getStoredPenjagaAccounts();
    return list[0]?.username || 'penjaga';
  });
  const [resetChannel, setResetChannel] = useState<ResetChannel>('email');
  const [resetContactInput, setResetContactInput] = useState('');
  const [resetStep, setResetStep] = useState<'request' | 'verify'>('request');
  const [pendingChallenge, setPendingChallenge] = useState<PendingResetChallenge | null>(null);
  const [deliveredViaWebhook, setDeliveredViaWebhook] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [newResetPassword, setNewResetPassword] = useState('');
  const [confirmResetPassword, setConfirmResetPassword] = useState('');
  const [showNewResetPassword, setShowNewResetPassword] = useState(false);
  const [resetErrorMsg, setResetErrorMsg] = useState<string | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [waChannel, setWaChannel] = useState<OtpDeliveryChannel>('WHATSAPP');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  const liveAdminCredentials = getStoredAdminCredentials();
  const livePenjagaAccounts =
    penjagaAccounts && penjagaAccounts.length > 0
      ? penjagaAccounts
      : getStoredPenjagaAccounts();

  const handleSelectLoginType = (type: 'server' | 'penjaga') => {
    setActiveLoginType(type);
    setErrorMsg(null);
    setSuccessMsg(null);
    setShowPassword(false);
  };

  // Submit for Petugas Loket
  const handleLanLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    const lanSettings = getStoredLanSettings();
    const storedServer = getStoredAdminCredentials();
    const activePenjagaAccounts =
      penjagaAccounts && penjagaAccounts.length > 0
        ? penjagaAccounts
        : getStoredPenjagaAccounts();

    const result = verifyPenjagaLanLogin({
      serverIp,
      password: lanPassword,
      counterId: selectedCounterId,
      counters,
      lanPassword: lanSettings.lanPassword,
      serverPassword: storedServer.passwordHash,
      penjagaAccounts: activePenjagaAccounts,
    });

    if (result.success && result.session) {
      loginUserSession(result.session, rememberMe);
      setIsSubmitting(false);
      onLoginSuccess(result.session);
    } else {
      setIsSubmitting(false);
      setErrorMsg(
        result.error ||
          'Kata sandi salah. Masukkan kata sandi LAN atau kata sandi Server Admin.'
      );
    }
  };

  // Submit for Server Admin
  const handleAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    const storedServer = getStoredAdminCredentials();
    const activePenjagaAccounts =
      penjagaAccounts && penjagaAccounts.length > 0
        ? penjagaAccounts
        : getStoredPenjagaAccounts();

    const result = verifyUserLogin(username, password, storedServer, activePenjagaAccounts);

    if (result.success && result.session) {
      loginUserSession(result.session, rememberMe);
      setIsSubmitting(false);
      onLoginSuccess(result.session);
    } else {
      setIsSubmitting(false);
      setErrorMsg(
        result.error ||
          'Username atau kata sandi salah. Periksa kembali akun Admin Anda.'
      );
    }
  };

  const handleOpenResetModal = () => {
    setResetRole(activeLoginType);
    if (livePenjagaAccounts.length > 0) {
      setResetPenjagaUsername(livePenjagaAccounts[0].username);
    }
    setResetChannel('email');
    setResetContactInput('');
    setResetStep('request');
    setPendingChallenge(null);
    setDeliveredViaWebhook(false);
    setOtpInput('');
    setNewResetPassword('');
    setConfirmResetPassword('');
    setResetErrorMsg(null);
    setShowResetModal(true);
  };

  const getRegisteredContactHint = (): string => {
    if (resetRole === 'server') {
      const val =
        resetChannel === 'phone'
          ? liveAdminCredentials.recoveryPhone || ''
          : liveAdminCredentials.recoveryEmail || '';
      return val ? maskContactInfo(val, resetChannel) : 'Belum terdaftar';
    }
    const acc = livePenjagaAccounts.find(
      (p) => p.username.toLowerCase() === resetPenjagaUsername.toLowerCase()
    );
    const val = resetChannel === 'phone' ? acc?.phone || '' : acc?.email || '';
    return val ? maskContactInfo(val, resetChannel) : 'Belum terdaftar';
  };

  const handleRequestOtpCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setResetErrorMsg(null);

    const storedServer = getStoredAdminCredentials();
    const activeAccounts =
      penjagaAccounts && penjagaAccounts.length > 0
        ? penjagaAccounts
        : getStoredPenjagaAccounts();

    const match = findMatchingContactForReset({
      targetRole: resetRole,
      targetUsername: resetPenjagaUsername,
      channel: resetChannel,
      contactInput: resetContactInput,
      adminCredentials: storedServer,
      penjagaAccounts: activeAccounts,
    });

    if (!match.valid || !match.matchedUsername || !match.matchedDestination) {
      setResetErrorMsg(match.error || 'Kontak tidak cocok dengan data terdaftar.');
      return;
    }

    const lanSettings = getStoredLanSettings();
    const otpGateway = lanSettings.otpGateway;
    const effectiveWaChannel: OtpDeliveryChannel =
      otpGateway?.verifyNowChannel || waChannel;

    setIsSendingOtp(true);
    let code = generateNumericOtpCode();
    let sentViaWebhook = false;
    let verificationId: string | undefined;

    try {
      const resp = await fetch('/api/auth/send-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: resetChannel,
          destination: match.matchedDestination,
          username: match.matchedUsername,
          waChannel: effectiveWaChannel,
          otpSettings: otpGateway,
        }),
      });
      const json = (await resp.json().catch(() => null)) as {
        status?: string;
        deliveredViaWebhook?: boolean;
        verificationId?: string;
        code?: string;
        message?: string;
      } | null;

      if (!resp.ok || json?.status === 'error') {
        setResetErrorMsg(
          json?.message || 'Gateway OTP gagal mengirim kode verifikasi. Periksa konfigurasi API OTP.'
        );
        setIsSendingOtp(false);
        return;
      }

      if (json?.status === 'ok') {
        sentViaWebhook = Boolean(json.deliveredViaWebhook);
        if (json.verificationId) verificationId = json.verificationId;
        if (typeof json.code === 'string' && /^\d{6}$/.test(json.code)) {
          code = json.code;
        }
      }
    } catch {
      // Fallback to local OTP generation when offline / static PHP host
    } finally {
      setIsSendingOtp(false);
    }

    setDeliveredViaWebhook(sentViaWebhook);
    setPendingChallenge({
      targetRole: resetRole,
      targetUsername: match.matchedUsername,
      channel: resetChannel,
      destination: match.matchedDestination,
      code,
      expiresAt: Date.now() + 10 * 60 * 1000,
      verificationId,
      deliveredViaApi: sentViaWebhook,
      providerLabel: getOtpProviderLabel(otpGateway?.provider),
    });
    setResetStep('verify');
    setOtpInput('');
  };

  const handleCompletePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetErrorMsg(null);

    const validation = validatePasswordResetSubmission({
      challenge: pendingChallenge,
      otpInput,
      newPassword: newResetPassword,
      confirmPassword: confirmResetPassword,
    });

    if (!validation.valid || !pendingChallenge) {
      setResetErrorMsg(validation.error || 'Kode verifikasi atau kata sandi tidak valid.');
      return;
    }

    if (pendingChallenge.deliveredViaApi && pendingChallenge.verificationId) {
      setIsVerifyingOtp(true);
      try {
        const lanSettings = getStoredLanSettings();
        const resp = await fetch('/api/auth/verify-reset-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            verificationId: pendingChallenge.verificationId,
            code: otpInput,
            destination: pendingChallenge.destination,
            otpSettings: lanSettings.otpGateway,
          }),
        });
        const json = (await resp.json().catch(() => null)) as {
          valid?: boolean;
          message?: string;
        } | null;
        if (!resp.ok || !json?.valid) {
          setResetErrorMsg(json?.message || 'Kode verifikasi OTP tidak cocok.');
          setIsVerifyingOtp(false);
          return;
        }
      } catch {
        setResetErrorMsg('Gagal memvalidasi kode OTP dengan gateway API.');
        setIsVerifyingOtp(false);
        return;
      } finally {
        setIsVerifyingOtp(false);
      }
    }

    if (pendingChallenge.targetRole === 'server') {
      const currentAdmin = getStoredAdminCredentials();
      const updatedAdmin = {
        ...currentAdmin,
        passwordHash: newResetPassword,
        lastUpdated: new Date().toISOString(),
      };
      setStoredAdminCredentials(updatedAdmin);
      broadcastSyncEvent({
        type: 'ADMIN_CREDENTIALS_UPDATED',
        adminCredentials: updatedAdmin,
        timestamp: Date.now(),
      });
      setActiveLoginType('server');
      setUsername(updatedAdmin.username);
      setPassword('');
    } else {
      const currentAccounts =
        penjagaAccounts && penjagaAccounts.length > 0
          ? penjagaAccounts
          : getStoredPenjagaAccounts();
      const updatedAccounts = currentAccounts.map((acc) =>
        acc.username.toLowerCase() === pendingChallenge.targetUsername.toLowerCase()
          ? { ...acc, passwordHash: newResetPassword }
          : acc
      );
      setStoredPenjagaAccounts(updatedAccounts);
      onPenjagaAccountsUpdated?.(updatedAccounts);
      broadcastSyncEvent({
        type: 'ACCOUNTS_UPDATED',
        penjagaAccounts: updatedAccounts,
        timestamp: Date.now(),
      });
      setActiveLoginType('penjaga');
      setLanPassword('');
    }

    setShowResetModal(false);
    setErrorMsg(null);
    setSuccessMsg(
      `Kata sandi akun "${pendingChallenge.targetUsername}" berhasil direset! Silakan masuk dengan kata sandi baru Anda.`
    );
  };

  const activeCounter =
    counters.find((c) => c.id === selectedCounterId) || counters[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 flex flex-col justify-between p-3 sm:p-6 text-slate-100">
      {/* Main Login Card */}
      <main className="max-w-lg mx-auto w-full my-auto py-4">
        <div className="bg-white text-slate-900 rounded-3xl p-5 sm:p-8 shadow-2xl border border-slate-100">
          {/* Header & Logo */}
          <div className="text-center mb-5">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg transition-all ${
                activeLoginType === 'penjaga'
                  ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-emerald-500/25'
                  : 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-blue-500/25'
              }`}
            >
              {activeLoginType === 'penjaga' ? (
                <UserCheck className="w-7 h-7" />
              ) : (
                <ShieldCheck className="w-7 h-7" />
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {activeLoginType === 'penjaga' ? 'Login Petugas Loket' : 'Login Administrator'}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {company.name} • Akses Pelayanan Antrean
            </p>

            {/* 2-Tab Selector */}
            <div className="grid grid-cols-2 p-1.5 bg-slate-100 rounded-2xl mt-4 text-xs font-bold gap-1">
              <button
                type="button"
                onClick={() => handleSelectLoginType('penjaga')}
                className={`py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
                  activeLoginType === 'penjaga'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>Petugas Loket</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectLoginType('server')}
                className={`py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
                  activeLoginType === 'server'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Server className="w-4 h-4" />
                <span>Server Admin</span>
              </button>
            </div>
          </div>

          {/* Success Alert */}
          {successMsg && (
            <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-900 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Berhasil:</span>
                <span>{successMsg}</span>
              </div>
            </div>
          )}

          {/* Error Alert */}
          {errorMsg && (
            <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Gagal Masuk:</span>
                <span>{errorMsg}</span>
              </div>
            </div>
          )}

          {/* TAB 1: PETUGAS LOKET */}
          {activeLoginType === 'penjaga' && (
            <form onSubmit={handleLanLoginSubmit} className="space-y-4">
              {/* 1. Pilih Meja Loket */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Pilih Meja Loket Anda:
                  </label>
                  <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {activeCounter?.name || 'Loket'}
                  </span>
                </div>

                {counters.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-0.5">
                    {counters.map((c) => {
                      const isSelected = selectedCounterId === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setSelectedCounterId(c.id);
                            if (errorMsg) setErrorMsg(null);
                          }}
                          className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/20 shadow-xs'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <div className="min-w-0 pr-1">
                            <span className="font-bold text-xs block truncate text-slate-900">
                              {c.name}
                            </span>
                            <span className="text-[10px] text-slate-500 block truncate">
                              {c.operatorName || 'Petugas'}
                            </span>
                          </div>
                          {isSelected ? (
                            <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full border border-slate-300 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <select
                    value={selectedCounterId}
                    onChange={(e) => setSelectedCounterId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900"
                  >
                    <option value="loket-1">Loket 1</option>
                  </select>
                )}
              </div>

              {/* 2. Kata Sandi Loket */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Kata Sandi (Password LAN / Loket):
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoFocus
                    placeholder="Masukkan kata sandi..."
                    value={lanPassword}
                    onChange={(e) => {
                      setLanPassword(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 text-slate-400 hover:text-slate-600 absolute right-3 top-2.5 cursor-pointer"
                    aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* 3. Server IP (Auto-detected & collapsible) */}
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Globe className="w-3.5 h-3.5 text-emerald-600" />
                    <span>
                      Host Server: <strong className="font-mono text-slate-900">{serverIp}</strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCustomIpOpen(!isCustomIpOpen)}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                  >
                    {isCustomIpOpen ? 'Sembunyikan IP' : 'Ubah IP'}
                  </button>
                </div>

                {isCustomIpOpen && (
                  <div className="mt-2 pt-2 border-t border-slate-200">
                    <input
                      type="text"
                      placeholder="IP Server (contoh: 192.168.1.100 atau localhost)"
                      value={serverIp}
                      onChange={(e) => setServerIp(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Hanya ubah jika PC Server berada di IP address berbeda.
                    </span>
                  </div>
                )}
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                  />
                  <span className="font-medium">Ingat Sesi di Perangkat Ini</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/25 shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
              >
                <span>Masuk ke {activeCounter?.name || 'Meja Loket'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* TAB 2: SERVER ADMIN */}
          {activeLoginType === 'server' && (
            <form onSubmit={handleAccountSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Username Administrator:
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="Username admin..."
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Kata Sandi / Password:
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoFocus
                    placeholder="Masukkan password admin..."
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 text-slate-400 hover:text-slate-600 absolute right-3 top-2.5 cursor-pointer"
                    aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                  />
                  <span className="font-medium">Ingat Sesi di Perangkat Ini</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-blue-500/25 shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
              >
                <span>Masuk ke Panel Server Admin</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Reset Kata Sandi Trigger */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleOpenResetModal}
              className="text-xs font-bold text-slate-600 hover:text-blue-700 transition flex items-center justify-center gap-1.5 w-full cursor-pointer py-1"
            >
              <KeyRound className="w-3.5 h-3.5 text-blue-600" />
              <span>Reset Kata Sandi</span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-lg mx-auto w-full text-center text-xs text-slate-500 py-2">
        <p>{company.name} • Sistem Antrean Multi-Layar</p>
      </footer>

      {/* Modal Reset Kata Sandi via Kode Verifikasi Angka ke No HP / Email Terdaftar */}
      {showResetModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-password-modal-title"
        >
          <div className="bg-white text-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h2
                    id="reset-password-modal-title"
                    className="font-black text-base text-slate-900"
                  >
                    Reset Kata Sandi
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Verifikasi 6 angka ke No. HP atau Email terdaftar
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                aria-label="Tutup reset kata sandi"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {resetErrorMsg && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{resetErrorMsg}</span>
              </div>
            )}

            {resetStep === 'request' ? (
              <form onSubmit={handleRequestOtpCode} className="space-y-4 text-xs">
                {/* Target Role */}
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1.5">
                    Akun yang Akan Direset:
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setResetRole('server');
                        setResetErrorMsg(null);
                      }}
                      className={`py-2 px-3 rounded-lg font-bold transition cursor-pointer ${
                        resetRole === 'server'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Server Admin
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setResetRole('penjaga');
                        setResetErrorMsg(null);
                      }}
                      className={`py-2 px-3 rounded-lg font-bold transition cursor-pointer ${
                        resetRole === 'penjaga'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Petugas Loket
                    </button>
                  </div>
                </div>

                {/* Petugas Selector when penjaga */}
                {resetRole === 'penjaga' && (
                  <div>
                    <label className="block font-bold uppercase text-slate-700 mb-1">
                      Pilih Akun Petugas:
                    </label>
                    <select
                      value={resetPenjagaUsername}
                      onChange={(e) => {
                        setResetPenjagaUsername(e.target.value);
                        setResetErrorMsg(null);
                      }}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {livePenjagaAccounts.map((acc) => (
                        <option key={acc.username} value={acc.username}>
                          {acc.name} (@{acc.username})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Verification Channel */}
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1.5">
                    Kirim Kode Verifikasi Melalui:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setResetChannel('phone');
                        setResetContactInput('');
                        setResetErrorMsg(null);
                      }}
                      className={`py-2.5 px-3 rounded-xl border font-bold flex items-center justify-center gap-1.5 cursor-pointer transition ${
                        resetChannel === 'phone'
                          ? 'bg-blue-50 border-blue-500 text-blue-800'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>No. HP Terdaftar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setResetChannel('email');
                        setResetContactInput('');
                        setResetErrorMsg(null);
                      }}
                      className={`py-2.5 px-3 rounded-xl border font-bold flex items-center justify-center gap-1.5 cursor-pointer transition ${
                        resetChannel === 'email'
                          ? 'bg-blue-50 border-blue-500 text-blue-800'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Email Terdaftar</span>
                    </button>
                  </div>
                </div>

                {/* Contact Input + Masked Hint */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold uppercase text-slate-700">
                      {resetChannel === 'phone' ? 'Masukkan No. HP Terdaftar:' : 'Masukkan Email Terdaftar:'}
                    </label>
                    <span className="text-[11px] font-mono text-slate-500">
                      Terdaftar: {getRegisteredContactHint()}
                    </span>
                  </div>
                  <div className="relative">
                    {resetChannel === 'phone' ? (
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    ) : (
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    )}
                    <input
                      type={resetChannel === 'phone' ? 'tel' : 'email'}
                      required
                      placeholder={
                        resetChannel === 'phone'
                          ? 'Contoh: 081234567890'
                          : 'Contoh: admin@instansi.go.id'
                      }
                      value={resetContactInput}
                      onChange={(e) => {
                        setResetContactInput(e.target.value);
                        if (resetErrorMsg) setResetErrorMsg(null);
                      }}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {resetChannel === 'phone' && (
                    <div className="mt-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-700">Jalur Pengiriman OTP:</span>
                        <span className="font-semibold text-blue-700">
                          {getOtpProviderLabel(getStoredLanSettings().otpGateway?.provider)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setWaChannel('WHATSAPP')}
                          className={`py-1.5 px-2.5 rounded-lg font-bold text-[11px] border cursor-pointer transition ${
                            waChannel === 'WHATSAPP'
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                              : 'bg-white border-slate-200 text-slate-600'
                          }`}
                        >
                          WhatsApp OTP
                        </button>
                        <button
                          type="button"
                          onClick={() => setWaChannel('SMS')}
                          className={`py-1.5 px-2.5 rounded-lg font-bold text-[11px] border cursor-pointer transition ${
                            waChannel === 'SMS'
                              ? 'bg-blue-50 border-blue-500 text-blue-800'
                              : 'bg-white border-slate-200 text-slate-600'
                          }`}
                        >
                          SMS OTP
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowResetModal(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingOtp}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
                  >
                    <span>{isSendingOtp ? 'Mengirim...' : 'Kirim Kode Verifikasi (6 Angka)'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleCompletePasswordReset} className="space-y-4 text-xs">
                {/* OTP Delivery Confirmation / Local LAN Code Banner */}
                {pendingChallenge && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1 text-emerald-900">
                    <p className="font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        Kode 6 angka dikirim ke{' '}
                        {maskContactInfo(pendingChallenge.destination, pendingChallenge.channel)}
                      </span>
                    </p>
                    {!deliveredViaWebhook && (
                      <div className="mt-1.5 p-2 bg-white border border-emerald-300 rounded-lg flex items-center justify-between">
                        <span className="text-[11px] text-slate-600">
                          Kode Verifikasi ({pendingChallenge.channel === 'phone' ? 'SMS/WA' : 'Email'}):
                        </span>
                        <strong
                          data-testid="reset-otp-preview"
                          className="font-mono text-base font-black tracking-widest text-emerald-700"
                        >
                          {pendingChallenge.code}
                        </strong>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">
                    Masukkan Kode Verifikasi (6 Angka):
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    autoFocus
                    placeholder="Contoh: 123456"
                    value={otpInput}
                    onChange={(e) => {
                      setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6));
                      if (resetErrorMsg) setResetErrorMsg(null);
                    }}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-lg font-black tracking-[0.35em] text-center text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">
                    Kata Sandi Baru:
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type={showNewResetPassword ? 'text' : 'password'}
                      required
                      minLength={5}
                      placeholder="Minimal 5 karakter..."
                      value={newResetPassword}
                      onChange={(e) => setNewResetPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewResetPassword(!showNewResetPassword)}
                      className="p-1 text-slate-400 hover:text-slate-600 absolute right-3 top-2.5 cursor-pointer"
                      aria-label={showNewResetPassword ? 'Sembunyikan sandi' : 'Lihat sandi'}
                    >
                      {showNewResetPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">
                    Konfirmasi Kata Sandi Baru:
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type={showNewResetPassword ? 'text' : 'password'}
                      required
                      placeholder="Ulangi kata sandi baru..."
                      value={confirmResetPassword}
                      onChange={(e) => setConfirmResetPassword(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => handleRequestOtpCode()}
                    disabled={isSendingOtp}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Kirim Ulang Kode</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setResetStep('request');
                        setResetErrorMsg(null);
                      }}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                    >
                      Kembali
                    </button>
                    <button
                      type="submit"
                      disabled={isVerifyingOtp}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-bold rounded-xl shadow-md transition cursor-pointer"
                    >
                      {isVerifyingOtp ? 'Memvalidasi OTP...' : 'Simpan Kata Sandi Baru'}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
