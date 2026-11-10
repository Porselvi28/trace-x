import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, ArrowRight, Lock } from 'lucide-react';
import { api } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { notify } = useNotification();

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    badge_number: '',
    role: 'Investigator',
    agency: 'Digital Forensic Investigation Unit',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      await api.register(form);
      notify('success', 'Registration Complete', 'You may now authenticate with your credentials.');
      navigate('/login');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Registration failed';
      setErrorMsg(msg);
      notify('error', 'Registration Failed', msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#F5F0E8]">
      <div className="w-full max-w-lg bg-[#FFFCF7] border border-[#D9CBBB] rounded-2xl p-8 sm:p-9 shadow-sm">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-[#604735] flex items-center justify-center mx-auto mb-3.5 text-[#FFFCF7] shadow-sm ring-1 ring-[#443126]/20">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#342A23]">
            Investigator Onboarding & Enlistment
          </h1>
          <p className="text-xs sm:text-sm text-[#796C60] mt-1.5">
            Create an authorized digital forensics access profile
          </p>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-xl bg-[#F8EBEA] border border-[#A64B43] text-[#A64B43] text-sm flex items-center gap-2.5 font-medium">
            <Lock className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#443126] mb-1.5 font-mono">Username</label>
              <input
                type="text"
                required
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="j.vance"
                className="w-full form-input h-10 text-sm bg-[#F5F0E8] focus:bg-[#FFFCF7]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#443126] mb-1.5 font-mono">Full Legal Name</label>
              <input
                type="text"
                required
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                placeholder="Inspector Jane Vance"
                className="w-full form-input h-10 text-sm bg-[#F5F0E8] focus:bg-[#FFFCF7]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#443126] mb-1.5 font-mono">Official Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="vance@agency.gov"
                className="w-full form-input h-10 text-sm bg-[#F5F0E8] focus:bg-[#FFFCF7]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#443126] mb-1.5 font-mono">Access Password</label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••••••"
                className="w-full form-input h-10 text-sm bg-[#F5F0E8] focus:bg-[#FFFCF7]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#443126] mb-1.5 font-mono">Investigator Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full form-input h-10 text-sm bg-[#F5F0E8] focus:bg-[#FFFCF7]"
              >
                <option value="Investigator">Investigator</option>
                <option value="Viewer">Viewer (Read-Only)</option>
                <option value="Administrator">Administrator</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#443126] mb-1.5 font-mono">Badge / Officer ID</label>
              <input
                type="text"
                value={form.badge_number}
                onChange={(e) => setForm({ ...form, badge_number: e.target.value })}
                placeholder="TRX-491-B"
                className="w-full form-input h-10 text-sm bg-[#F5F0E8] focus:bg-[#FFFCF7]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#443126] mb-1.5 font-mono">Department / Agency</label>
            <input
              type="text"
              value={form.agency}
              onChange={(e) => setForm({ ...form, agency: e.target.value })}
              className="w-full form-input h-10 text-sm bg-[#F5F0E8] focus:bg-[#FFFCF7]"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-4 btn-primary h-11 text-sm font-semibold justify-center"
          >
            <span>{submitting ? 'Registering...' : 'Complete Enlistment'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 text-center text-xs sm:text-sm text-[#796C60]">
          Already enlisted?{' '}
          <Link to="/login" className="text-[#604735] font-semibold hover:underline transition-colors">
            Return to Login
          </Link>
        </div>
      </div>
    </div>
  );
};
