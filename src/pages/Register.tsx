import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { authService } from '../services/authService';
import { ApiError } from '../services/api';
import { InnovxLogo } from '../components/InnovxLogo';
import { useApp } from '../context/AppContext';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useApp();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'farmer' as 'farmer' | 'vet' | 'admin',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setError(t.errorNameEmailRequired);
      return;
    }
    if (form.password.length < 6) {
      setError(t.errorPasswordTooShort);
      return;
    }

    setLoading(true);
    try {
      await authService.register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone || undefined,
        role: form.role,
      });
      setSuccess(true);
      setTimeout(() => navigate('/login', { replace: true }), 2000);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 400) {
          setError(t.errorEmailExists);
        } else if (err.status === 0) {
          setError(t.errorCannotReachServer);
        } else {
          setError(err.detail || t.errorUnexpected);
        }
      } else {
        setError(t.errorUnexpected);
      }
    } finally {
      setLoading(false);
    }
  };

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm({ ...form, [key]: e.target.value }),
  });

  return (
    <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <InnovxLogo className="h-10 w-auto mb-3" />
          <h1 className="text-xl font-black text-[#403129]">{t.appName}</h1>
          <p className="text-xs text-[#746E68] mt-0.5">{t.appSubtitle}</p>
        </div>

        <div className="bg-white border border-[#D9CFC7] rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-[#403129] mb-5">{t.createAccountHeading}</h2>

          {success && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{t.accountCreatedMsg}</span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-800">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
            <div>
              <label className="block text-xs font-semibold text-[#403129] mb-1">{t.fullNameLabel}</label>
              <input type="text" required {...field('name')} placeholder="Ramesh Sharma"
                className="w-full px-3 py-2.5 bg-[#F9F8F6] border border-[#D9CFC7] rounded-xl text-sm outline-none focus:border-[#8A5B3D] focus:ring-1 focus:ring-[#8A5B3D]" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#403129] mb-1">{t.emailLabel}</label>
              <input type="email" required autoComplete="email" {...field('email')} placeholder={t.emailPlaceholder}
                className="w-full px-3 py-2.5 bg-[#F9F8F6] border border-[#D9CFC7] rounded-xl text-sm outline-none focus:border-[#8A5B3D] focus:ring-1 focus:ring-[#8A5B3D]" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#403129] mb-1">{t.passwordLabel}</label>
              <input type="password" required autoComplete="new-password" {...field('password')} placeholder={t.passwordPlaceholderMinChar}
                className="w-full px-3 py-2.5 bg-[#F9F8F6] border border-[#D9CFC7] rounded-xl text-sm outline-none focus:border-[#8A5B3D] focus:ring-1 focus:ring-[#8A5B3D]" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#403129] mb-1">{t.phoneOptionalLabel}</label>
              <input type="tel" {...field('phone')} placeholder="+91 98765 43210"
                className="w-full px-3 py-2.5 bg-[#F9F8F6] border border-[#D9CFC7] rounded-xl text-sm outline-none focus:border-[#8A5B3D] focus:ring-1 focus:ring-[#8A5B3D]" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#403129] mb-1">{t.roleLabel}</label>
              <select {...field('role')}
                className="w-full px-3 py-2.5 bg-[#F9F8F6] border border-[#D9CFC7] rounded-xl text-sm outline-none focus:border-[#8A5B3D]">
                <option value="farmer">{t.roleFarmer}</option>
                <option value="vet">{t.roleVet}</option>
                <option value="admin">{t.roleAdmin}</option>
              </select>
            </div>

            <button type="submit" disabled={loading || success}
              className="w-full py-2.5 bg-[#8A5B3D] hover:bg-[#403129] disabled:bg-[#C9B59C] text-white text-sm font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 mt-1">
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /><span>{t.creatingAccountLabel}</span></>
              ) : (
                t.createAccountBtn
              )}
            </button>
          </form>

          <div className="mt-4 text-center text-xs text-[#746E68]">
            {t.alreadyHaveAccount}{' '}
            <Link to="/login" className="font-semibold text-[#8A5B3D] hover:text-[#403129] hover:underline">
              {t.signInLink}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
