import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Briefcase, ArrowLeft, Check } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';

export const CreateCase: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notify } = useNotification();

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Physical Intrusion',
    priority: 'Medium',
    status: 'Active',
    investigator_name: user?.full_name || 'Lead Investigator',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      notify('error', 'Validation Error', 'Case title is mandatory');
      return;
    }

    setSubmitting(true);
    try {
      const created = await api.createCase(form as any);
      notify('success', 'Case Initialized', `Case ${created.id} was created successfully.`);
      navigate(`/cases/${created.id}`);
    } catch (err: any) {
      notify('error', 'Failed to Create Case', err.response?.data?.detail || 'An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link
          to="/cases"
          className="inline-flex items-center gap-2 text-sm text-[#796C60] hover:text-[#443126] transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Cases Directory
        </Link>
      </div>

      <div className="bg-[#FFFCF7] border border-[#D9CBBB] rounded-2xl p-7 shadow-xs">
        <div className="flex items-center gap-3.5 pb-5 border-b border-[#E8DED0]">
          <div className="w-11 h-11 rounded-xl bg-[#EFE5D8] border border-[#D9CBBB] flex items-center justify-center text-[#604735]">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#342A23]">Initialize Investigation Case</h1>
            <p className="text-sm text-[#796C60] mt-0.5">
              Establish case jurisdiction and assign lead forensic investigator
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold uppercase tracking-wider text-[#443126] mb-2 font-mono">
              Case Title / Incident Header *
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Operation Iron Gate — Perimeter Sector 4 Intrusion"
              className="w-full form-input"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold uppercase tracking-wider text-[#443126] mb-2 font-mono">
              Investigation Narrative & Scope
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Detail incident parameters, physical locations, target DVR cameras, and acquisition mandates..."
              className="w-full form-input resize-y"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold uppercase tracking-wider text-[#443126] mb-2 font-mono">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full form-input"
              >
                <option value="Physical Intrusion">Physical Intrusion</option>
                <option value="Theft Investigation">Theft Investigation</option>
                <option value="Traffic Collision">Traffic Collision</option>
                <option value="Perimeter Security">Perimeter Security</option>
                <option value="Surveillance Audit">Surveillance Audit</option>
                <option value="Cybercrime Correlation">Cybercrime Correlation</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold uppercase tracking-wider text-[#443126] mb-2 font-mono">
                Priority
              </label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full form-input"
              >
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold uppercase tracking-wider text-[#443126] mb-2 font-mono">
                Assigned Lead
              </label>
              <input
                type="text"
                value={form.investigator_name}
                onChange={(e) => setForm({ ...form, investigator_name: e.target.value })}
                className="w-full form-input"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold uppercase tracking-wider text-[#443126] mb-2 font-mono">
              Initial Analyst Notes & Directives
            </label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="e.g. Secure North Gate DVR exports and establish bitwise SHA-256 hashes."
              className="w-full form-input resize-y"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#E8DED0]">
            <Link to="/cases" className="btn-secondary">
              Cancel
            </Link>
            <button type="submit" disabled={submitting} className="btn-primary">
              <Check className="w-4 h-4" />
              <span>{submitting ? 'Creating Case...' : 'Initialize Case Dossier'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
