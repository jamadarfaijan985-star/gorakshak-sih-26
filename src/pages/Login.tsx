import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { authService } from '../services/authService';
import { ApiError } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { InnovxLogo } from '../components/InnovxLogo';
import { env } from '../config/env';

const DEMO_USER = {
  id: 'demo-user',
  name: 'Demo Farm Manager',
  email: 'demo@innovx.local',
  role: 'farmer' as const,
  preferred_language: 'en',
  farm_id: null,
  created_at: new Date(0).toISOString(),
};

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }

    setLoading(true);
    try {
      if (env.DEMO_MODE) {
        setUser(DEMO_USER);
        navigate('/', { replace: true });
        return;
      }

      const response = await authService.login({ email: email.trim(), password });
      setUser(response.user);
      navigate('/', { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setError('Invalid email or password.');
        } else if (err.status === 0) {
          setError('Cannot reach server. Check VITE_API_BASE_URL and backend status.');
        } else {
          setError(err.detail || 'Login failed. Please try again.');
        }
      } else {
        setError('Unexpected error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <InnovxLogo className="h-10 w-auto mb-3" />
          <h1 className="text-xl font-black text-[#403129] tracking-tight">
            GoDrishti
          </h1>
          <p className="text-xs text-[#746E68] mt-0.5 text-center">
            AI Dairy Livestock Health Intelligence
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-[#D9CFC7] rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-[#403129] mb-5">Sign in to your account</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-800">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="block text-xs font-semibold text-[#403129] mb-1">
                Email Address
              </label>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="farmer@vaishnavidairy.in"
                className="w-full px-3 py-2.5 bg-[#F9F8F6] border border-[#D9CFC7] rounded-xl text-sm outline-none focus:border-[#8A5B3D] focus:ring-1 focus:ring-[#8A5B3D] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#403129] mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 pr-10 bg-[#F9F8F6] border border-[#D9CFC7] rounded-xl text-sm outline-none focus:border-[#8A5B3D] focus:ring-1 focus:ring-[#8A5B3D] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-2.5 text-[#746E68] hover:text-[#403129]"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#8A5B3D] hover:bg-[#403129] disabled:bg-[#C9B59C] text-white text-sm font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in…</span>
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-4 text-center text-xs text-[#746E68]">
            New to GoDrishti?{' '}
            <Link
              to="/register"
              className="font-semibold text-[#8A5B3D] hover:text-[#403129] hover:underline"
            >
              Create an account
            </Link>
          </div>
        </div>

        {/* Demo hint */}
        <p className="mt-4 text-center text-[11px] text-[#746E68]">
          Backend:{' '}
          <span className="font-mono bg-[#EFE9E3] px-1 py-0.5 rounded text-[#403129]">
            {import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}
          </span>
        </p>
      </div>
    </div>
  );
};
