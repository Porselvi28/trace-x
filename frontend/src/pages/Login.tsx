import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Key, User, ArrowRight, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const { notify } = useNotification();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      await login({ username, password });
      notify('success', 'Authentication Successful', `Welcome back, Investigator ${username}.`);
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Invalid username or password';
      setErrorMsg(msg);
      notify('error', 'Authentication Failed', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const fillQuickDev = (role: 'admin' | 'investigator') => {
    if (role === 'admin') {
      setUsername('admin');
      setPassword('adminpassword123');
    } else {
      setUsername('investigator');
      setPassword('investigator123');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#F5F0E8]">
      <div className="w-full max-w-md bg-[#FFFCF7] border border-[#D9CBBB] rounded-2xl p-8 sm:p-9 shadow-sm">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#604735] flex items-center justify-center mx-auto mb-4 text-[#FFFCF7] shadow-sm ring-1 ring-[#443126]/20">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-wider text-[#342A23]">
            TRACE <span className="text-[#8B684D]">X</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#796C60] mt-1.5 font-medium tracking-wide">
            Digital Evidence. Intelligent Analysis. Verifiable Findings.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3.5 rounded-xl bg-[#F8EBEA] border border-[#A64B43] text-[#A64B43] text-sm flex items-center gap-2.5 font-medium">
            <Lock className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#443126] mb-1.5 font-mono">
              Investigator Identifier
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[#9A8C7D] absolute left-3.5 top-3.5 pointer-events-none" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. admin or investigator"
                className="w-full form-input pl-10 h-11 text-sm bg-[#F5F0E8] focus:bg-[#FFFCF7]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#443126] mb-1.5 font-mono">
              Access Token / Password
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-[#9A8C7D] absolute left-3.5 top-3.5 pointer-events-none" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full form-input pl-10 h-11 text-sm bg-[#F5F0E8] focus:bg-[#FFFCF7]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 btn-primary h-11 text-sm font-semibold justify-center"
          >
            <span>{submitting ? 'Verifying Credentials...' : 'Authenticate Investigator Session'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Development Quick-Fill Helper for Evaluation Demonstration */}
        <div className="mt-8 pt-6 border-t border-[#E8DED0]">
          <div className="text-xs font-semibold text-[#796C60] uppercase tracking-wider mb-2.5 text-center">
            Demo Credentials (1-Click Fill)
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => fillQuickDev('admin')}
              className="py-2 px-3 rounded-lg border border-[#D9CBBB] bg-[#EFE5D8] hover:bg-[#E8DED0] text-xs sm:text-sm text-[#342A23] font-semibold transition-colors text-center"
            >
              Administrator
            </button>
            <button
              type="button"
              onClick={() => fillQuickDev('investigator')}
              className="py-2 px-3 rounded-lg border border-[#D9CBBB] bg-[#EFE5D8] hover:bg-[#E8DED0] text-xs sm:text-sm text-[#342A23] font-semibold transition-colors text-center"
            >
              Investigator
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-xs sm:text-sm text-[#796C60]">
          New forensic user?{' '}
          <Link to="/register" className="text-[#604735] font-semibold hover:underline transition-colors">
            Register Account
          </Link>
        </div>
      </div>
    </div>
  );
};
