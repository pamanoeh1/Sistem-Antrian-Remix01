import React, { useState } from 'react';
import {
  AdminCredentials,
  validateAndUpdatePassword,
} from '../../utils/authLogic';
import {
  getStoredAdminCredentials,
  setStoredAdminCredentials,
  resetAdminCredentialsToDefault,
} from '../../utils/authStore';
import {
  KeyRound,
  Lock,
  User,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';

export const ChangePasswordSection: React.FC = () => {
  const [credentials, setCredentials] = useState<AdminCredentials>(() =>
    getStoredAdminCredentials()
  );

  const [currentUsername, setCurrentUsername] = useState(credentials.username);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const calculatePasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, text: 'Kosong', color: 'bg-slate-200' };
    if (pass.length < 5) return { score: 1, text: 'Terlalu Pendek', color: 'bg-rose-500' };
    const hasLetters = /[a-zA-Z]/.test(pass);
    const hasNumbers = /[0-9]/.test(pass);
    const hasSpecial = /[^a-zA-Z0-9]/.test(pass);

    if (pass.length >= 8 && hasLetters && hasNumbers && hasSpecial) {
      return { score: 3, text: 'Sangat Kuat', color: 'bg-emerald-500' };
    }
    if (pass.length >= 6 && hasLetters && hasNumbers) {
      return { score: 2, text: 'Cukup Baik', color: 'bg-blue-500' };
    }
    return { score: 1, text: 'Lemah', color: 'bg-amber-500' };
  };

  const strength = calculatePasswordStrength(newPassword);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    const result = validateAndUpdatePassword(
      currentPassword,
      newPassword,
      confirmPassword,
      credentials,
      currentUsername
    );

    if (result.success && result.updatedCredentials) {
      setStoredAdminCredentials(result.updatedCredentials);
      setCredentials(result.updatedCredentials);
      setSuccessMessage(
        `Password dan akun admin berhasil diperbarui! Gunakan password baru ini untuk login berikutnya.`
      );
      // Clear sensitive inputs
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setErrorMessage(result.error || 'Gagal mengubah password');
    }
  };

  const handleResetToDefault = () => {
    const defaultCreds = resetAdminCredentialsToDefault();
    setCredentials(defaultCreds);
    setCurrentUsername(defaultCreds.username);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setErrorMessage(null);
    setSuccessMessage('Akun admin berhasil di-reset kembali ke bawaan (admin / admin123).');
    setShowResetConfirm(false);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Informational Header */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-900 leading-relaxed">
          <p className="font-bold">Keamanan Panel Admin</p>
          <p className="mt-0.5 text-blue-800">
            Pastikan untuk mengganti password bawaan secara berkala demi menjaga keamanan data operasional antrean dan wewenang pemanggilan loket.
          </p>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-xs text-emerald-800 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Berhasil:</span>
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      {/* Error Notification Banner */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-xs text-rose-800 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Perhatian:</span>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Change Password Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Username */}
        <div>
          <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
            Username Admin:
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              required
              value={currentUsername}
              onChange={(e) => setCurrentUsername(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
            />
          </div>
        </div>

        {/* Current Password */}
        <div>
          <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
            Password Saat Ini (Lama):
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type={showCurrentPassword ? 'text' : 'password'}
              required
              placeholder="Masukkan password yang aktif saat ini..."
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="p-1 text-slate-400 hover:text-slate-600 absolute right-3 top-2.5 cursor-pointer"
              aria-label={showCurrentPassword ? 'Sembunyikan password' : 'Lihat password'}
            >
              {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-bold uppercase text-slate-600">
              Password Baru:
            </label>
            {newPassword && (
              <span className="text-[11px] font-semibold text-slate-500">
                Kekuatan:{' '}
                <strong className={strength.score >= 2 ? 'text-emerald-600' : 'text-amber-600'}>
                  {strength.text}
                </strong>
              </span>
            )}
          </div>
          <div className="relative">
            <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type={showNewPassword ? 'text' : 'password'}
              required
              minLength={5}
              placeholder="Minimal 5 karakter..."
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="p-1 text-slate-400 hover:text-slate-600 absolute right-3 top-2.5 cursor-pointer"
              aria-label={showNewPassword ? 'Sembunyikan password baru' : 'Lihat password baru'}
            >
              {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Strength Bar */}
          {newPassword && (
            <div className="mt-1.5 flex gap-1 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${strength.color}`}
                style={{ width: `${(strength.score / 3) * 100}%` }}
              />
            </div>
          )}
        </div>

        {/* Confirm New Password */}
        <div>
          <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
            Konfirmasi Password Baru:
          </label>
          <div className="relative">
            <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              required
              placeholder="Ulangi password baru yang sama..."
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="p-1 text-slate-400 hover:text-slate-600 absolute right-3 top-2.5 cursor-pointer"
              aria-label={showConfirmPassword ? 'Sembunyikan konfirmasi password' : 'Lihat konfirmasi password'}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="pt-2 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/20 transition cursor-pointer"
          >
            Simpan Perubahan Password
          </button>

          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset ke Default (admin / admin123)</span>
          </button>
        </div>
      </form>

      {/* Reset to Default Credentials Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-1">
              Reset Password Akun?
            </h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Akun akan dikembalikan ke pengaturan awal:{' '}
              <br />
              Username: <strong className="text-slate-900">admin</strong>
              <br />
              Password: <strong className="text-slate-900">admin123</strong>
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleResetToDefault}
                className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Ya, Reset Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
