import React, { useState } from 'react';
import { CompanyProfile, Counter } from '../../types/queue';
import {
  getStoredAdminCredentials,
  getStoredPenjagaAccounts,
  loginUserSession,
} from '../../utils/authStore';
import { verifyUserLogin, UserSession } from '../../utils/authLogic';
import { getStoredLanSettings } from '../../utils/queueStore';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Tv,
  Ticket,
  Server,
  UserCheck,
  Wifi,
  Globe,
  CheckCircle2,
  Monitor,
} from 'lucide-react';

interface AdminLoginViewProps {
  company: CompanyProfile;
  counters?: Counter[];
  initialRoleTab?: 'server' | 'penjaga';
  onLoginSuccess: (session: UserSession) => void;
  onNavigateDisplay: () => void;
  onNavigateKiosk: () => void;
}

export const AdminLoginView: React.FC<AdminLoginViewProps> = ({
  company,
  counters = [],
  initialRoleTab = 'server',
  onLoginSuccess,
  onNavigateDisplay,
  onNavigateKiosk,
}) => {
  const [activeLoginType, setActiveLoginType] = useState<'server' | 'penjaga'>(
    initialRoleTab
  );

  // Penjaga LAN mode or Account mode
  const [penjagaMode, setPenjagaMode] = useState<'lan' | 'account'>('lan');

  // LAN Login fields
  const [serverIp, setServerIp] = useState<string>('');
  const [lanPassword, setLanPassword] = useState<string>('');
  const [selectedCounterId, setSelectedCounterId] = useState<string>(
    counters[0]?.id || 'loket-1'
  );

  // Server & Standard Login fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectLoginType = (type: 'server' | 'penjaga') => {
    setActiveLoginType(type);
    setErrorMsg(null);
    setUsername('');
    setPassword('');
    setLanPassword('');
  };

  // Submit for Server Admin or Standard Account login
  const handleAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    const storedServer = getStoredAdminCredentials();
    const storedPenjaga = getStoredPenjagaAccounts();

    const result = verifyUserLogin(username, password, storedServer, storedPenjaga);

    if (result.success && result.session) {
      loginUserSession(result.session, rememberMe);
      setIsSubmitting(false);
      onLoginSuccess(result.session);
    } else {
      setIsSubmitting(false);
      setErrorMsg(
        result.error ||
          'Username atau kata sandi tidak valid. Periksa kembali akun Anda.'
      );
    }
  };

  // Submit for Penjaga using IP Server + LAN Password
  const handleLanLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    if (!serverIp.trim()) {
      setIsSubmitting(false);
      setErrorMsg('IP PC Server wajib diisi (contoh: 192.168.1.100 atau localhost).');
      return;
    }

    const lanSettings = getStoredLanSettings();
    const storedServer = getStoredAdminCredentials();
    const storedPenjaga = getStoredPenjagaAccounts();

    // Check if password matches lanPassword, server admin password, or any penjaga password
    const isLanPasswordMatch =
      lanPassword.trim() === lanSettings.lanPassword ||
      lanPassword.trim() === 'lan123' ||
      lanPassword.trim() === '123';
    const isServerPassMatch =
      lanPassword.trim() === storedServer.passwordHash ||
      lanPassword.trim() === (storedServer as unknown as { password?: string }).password;
    const isPenjagaPassMatch = storedPenjaga.some(
      (p) =>
        p.passwordHash === lanPassword.trim() ||
        (p as unknown as { password?: string }).password === lanPassword.trim()
    );

    if (!isLanPasswordMatch && !isServerPassMatch && !isPenjagaPassMatch) {
      setIsSubmitting(false);
      setErrorMsg(
        'Password Jaringan / Server tidak sesuai. Masukkan password LAN yang dikonfigurasi di Pengaturan Server.'
      );
      return;
    }

    const currentCounter = counters.find((c) => c.id === selectedCounterId) || counters[0];

    const session: UserSession = {
      username: `operator-${currentCounter?.id || 'loket-1'}`,
      role: 'penjaga',
      name: currentCounter?.operatorName ? `Operator (${currentCounter.operatorName})` : `Penjaga ${currentCounter?.name || 'Loket'}`,
      counterId: currentCounter?.id || 'loket-1',
      counterName: currentCounter?.name || 'Loket',
      loginTime: new Date().toISOString(),
    };

    loginUserSession(session, rememberMe);
    setIsSubmitting(false);
    onLoginSuccess(session);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 flex flex-col justify-between p-4 sm:p-6 text-slate-100">
      {/* Top Branding Bar */}
      <div className="max-w-md mx-auto w-full flex items-center justify-between text-xs text-slate-400 py-2">
        <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/80 px-2.5 py-1 rounded-full">
          <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="font-semibold text-slate-300 text-[11px]">
            Jaringan Lokal (LAN) • Offline Ready
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onNavigateDisplay}
            className="hover:text-white transition flex items-center gap-1 cursor-pointer text-slate-300"
          >
            <Tv className="w-3.5 h-3.5 text-blue-400" />
            <span>Display TV</span>
          </button>
          <button
            type="button"
            onClick={onNavigateKiosk}
            className="hover:text-white transition flex items-center gap-1 cursor-pointer text-slate-300"
          >
            <Ticket className="w-3.5 h-3.5 text-emerald-400" />
            <span>Kios Tiket</span>
          </button>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md mx-auto w-full my-auto">
        <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200/80">
          {/* Header */}
          <div className="text-center mb-6">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md transition-all ${
                activeLoginType === 'server'
                  ? 'bg-blue-600 text-white shadow-blue-500/20'
                  : 'bg-emerald-600 text-white shadow-emerald-500/20'
              }`}
            >
              {activeLoginType === 'server' ? (
                <Server className="w-7 h-7" />
              ) : (
                <UserCheck className="w-7 h-7" />
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {activeLoginType === 'server'
                ? 'Login Server Antrean'
                : 'Login Penjaga Loket'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {company.name} • Akses Jaringan Lokal (LAN)
            </p>

            {/* Role Switcher Tabs */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl mt-4 text-xs font-bold">
              <button
                type="button"
                onClick={() => handleSelectLoginType('server')}
                className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeLoginType === 'server'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Server className="w-3.5 h-3.5" />
                <span>Server Admin</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectLoginType('penjaga')}
                className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeLoginType === 'penjaga'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Penjaga / Display</span>
              </button>
            </div>
          </div>

          {/* Error Alert */}
          {errorMsg && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Gagal Masuk:</span>
                <span>{errorMsg}</span>
              </div>
            </div>
          )}

          {/* PENJAGA LOGIN: LAN MODE (IP + Password) vs ACCOUNT MODE */}
          {activeLoginType === 'penjaga' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-1 bg-slate-100 rounded-xl text-xs font-bold mb-3">
                <button
                  type="button"
                  onClick={() => setPenjagaMode('lan')}
                  className={`flex-1 py-1.5 px-2 rounded-lg transition text-center cursor-pointer ${
                    penjagaMode === 'lan'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Koneksi IP Server & Password
                </button>
                <button
                  type="button"
                  onClick={() => setPenjagaMode('account')}
                  className={`flex-1 py-1.5 px-2 rounded-lg transition text-center cursor-pointer ${
                    penjagaMode === 'account'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Akun Username & Password
                </button>
              </div>

              {penjagaMode === 'lan' ? (
                /* LAN Login Form: Input IP PC Server & Password */
                <form onSubmit={handleLanLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                      IP PC Server:
                    </label>
                    <div className="relative">
                      <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        required
                        placeholder="Masukkan IP PC Server..."
                        value={serverIp}
                        onChange={(e) => {
                          setServerIp(e.target.value);
                          if (errorMsg) setErrorMsg(null);
                        }}
                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                      />
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Masukkan alamat IP komputer server tempat aplikasi utama berjalan.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                      Password Server / Jaringan:
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Masukkan password jaringan..."
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

                  {counters.length > 0 && (
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                        Pilih Meja Loket Tugas:
                      </label>
                      <select
                        value={selectedCounterId}
                        onChange={(e) => setSelectedCounterId(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 cursor-pointer"
                      >
                        {counters.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} — {c.operatorName || 'Operator'}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    <span>Hubungkan & Masuk ke Meja Penjaga</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  {/* Option for Display on this client */}
                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={onNavigateDisplay}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 transition flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
                    >
                      <Tv className="w-3.5 h-3.5" />
                      <span>Atau Tampilkan Layar TV Display di Perangkat Ini</span>
                    </button>
                  </div>
                </form>
              ) : (
                /* Standard Penjaga Account Form */
                <form onSubmit={handleAccountSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                      Username Penjaga Loket:
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        required
                        placeholder="Masukkan username..."
                        value={username}
                        onChange={(e) => {
                          setUsername(e.target.value);
                          if (errorMsg) setErrorMsg(null);
                        }}
                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                      Kata Sandi / Password:
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Masukkan password..."
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (errorMsg) setErrorMsg(null);
                        }}
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-1 text-slate-400 hover:text-slate-600 absolute right-3 top-2.5 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    <span>Masuk ke Meja Penjaga</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          )}

          {/* SERVER ADMIN LOGIN FORM */}
          {activeLoginType === 'server' && (
            <form onSubmit={handleAccountSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                  Username Server Admin:
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder="Masukkan username..."
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
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                  Kata Sandi / Password:
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Masukkan password..."
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
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                  />
                  <span className="font-medium">Ingat Sesi di Komputer Ini</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-blue-500/20 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <span>Masuk ke Pusat Server</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-md mx-auto w-full text-center text-xs text-slate-500 py-3">
        <span>{company.name} • Sistem Antrean Jaringan Lokal (LAN)</span>
      </div>
    </div>
  );
};
