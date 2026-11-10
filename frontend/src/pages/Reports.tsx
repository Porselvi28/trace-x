import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Download, Plus, ShieldCheck, X, RefreshCw, Calendar, ArrowRight, User } from 'lucide-react';
import { api } from '../services/api';
import { GeneratedReport, Case } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { useNotification } from '../contexts/NotificationContext';

export const Reports: React.FC = () => {
  const { notify } = useNotification();
  const [reports, setReports] = useState<GeneratedReport[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // New Report Modal
  const [showModal, setShowModal] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [reportTitle, setReportTitle] = useState('');
  const [summaryNotes, setSummaryNotes] = useState('');
  const [generating, setGenerating] = useState(false);

  const fetchReports = async (force = false) => {
    if (force) setRefreshing(true);
    else setLoading(true);
    try {
      const [rpts, cList] = await Promise.all([api.listReports(undefined, force), api.listCases(undefined, force)]);
      setReports(rpts);
      setCases(cList);
      if (cList.length > 0 && !selectedCaseId) {
        setSelectedCaseId(cList[0].id);
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaseId) {
      notify('error', 'Case Required', 'Please choose an investigation case to report on');
      return;
    }
    setGenerating(true);
    try {
      const created = await api.generateReport({
        case_id: selectedCaseId,
        report_title: reportTitle.trim() || undefined,
        summary_notes: summaryNotes.trim() || undefined,
      });
      notify('success', 'Forensic PDF Generated', `Report ${created.id} generated and ready for court submission.`);
      setShowModal(false);
      setReportTitle('');
      setSummaryNotes('');
      fetchReports(true);
    } catch (err: any) {
      notify('error', 'Generation Error', err.response?.data?.detail || 'Failed to compile report');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-7">
      {/* Header Banner */}
      <div className="bg-[#FFFCF7] border border-[#D9CBBB] p-6 lg:p-7 rounded-2xl shadow-[0_1px_3px_rgba(68,49,38,0.05)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4 text-[#604735]" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#796C60]">
              Official Court Brief Compilation
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#342A23]">
            Official Forensic Investigation Reports
          </h1>
          <p className="text-[15px] text-[#796C60] mt-1 max-w-2xl leading-relaxed">
            Downloadable court-ready PDF briefs synthesizing evidence inventory, SHA-256 signatures, candidate events, and chain of custody logs
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => fetchReports(true)}
            disabled={refreshing}
            className="btn-secondary"
            title="Refresh reports"
          >
            <RefreshCw className={`w-4 h-4 text-[#796C60] ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary"
          >
            <Plus className="w-4 h-4 text-[#FFFCF7]" />
            <span>Compile Forensic Report</span>
          </button>
        </div>
      </div>

      {/* Structured Reports Table */}
      <div className="bg-[#FFFCF7] border border-[#D9CBBB] rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(68,49,38,0.05)]">
        <div className="overflow-x-auto">
          <table className="forensic-table">
            <thead>
              <tr>
                <th>Report ID</th>
                <th>Report Title & Case Scope</th>
                <th>Case Identifier</th>
                <th>Lead Investigator</th>
                <th>Compiled Date</th>
                <th>Status</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8DED0]">
              {loading && reports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#796C60] text-sm">
                    Loading compiled forensic briefs...
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#9A8C7D] text-sm">
                    No official forensic reports compiled yet. Click "Compile Forensic Report" to generate a PDF brief.
                  </td>
                </tr>
              ) : (
                reports.map((r) => (
                  <tr key={r.id} className="hover:bg-[#F5F0E8]/70 transition-colors">
                    <td className="font-mono font-bold text-[#443126] text-xs whitespace-nowrap">
                      <span className="bg-[#EFE5D8] px-2.5 py-1 rounded-md border border-[#D9CBBB]">
                        {r.id}
                      </span>
                    </td>
                    <td className="max-w-xs">
                      <span className="font-bold text-sm text-[#342A23] block truncate">
                        {r.report_title}
                      </span>
                      <span className="text-xs text-[#796C60] block truncate mt-0.5">
                        {r.summary_notes || 'Official judicial evidence summary brief.'}
                      </span>
                    </td>
                    <td className="font-mono text-xs whitespace-nowrap">
                      <Link to={`/cases/${r.case_id}`} className="text-[#604735] font-bold hover:underline">
                        {r.case_id}
                      </Link>
                    </td>
                    <td className="font-semibold text-sm text-[#342A23] whitespace-nowrap">
                      {r.generated_by}
                    </td>
                    <td className="font-mono text-xs text-[#796C60] whitespace-nowrap">
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap">
                      <StatusBadge status="COMPLETED" size="sm" />
                    </td>
                    <td className="text-right whitespace-nowrap">
                      <a
                        href={api.getReportDownloadUrl(r.id)}
                        className="btn-primary py-1.5 px-3 text-xs font-semibold"
                        download
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download PDF</span>
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-3 border-t border-[#E8DED0] bg-[#FFFCF7] flex items-center justify-between text-xs text-[#796C60]">
          <span>Total Compiled Briefs: {reports.length}</span>
          <span className="font-mono font-medium">Court-admissible PDF generation (ReportLab)</span>
        </div>
      </div>

      {/* New Report Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#342A23]/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-[#FFFCF7] border border-[#D9CBBB] rounded-2xl p-6 lg:p-7 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-[#E8DED0]">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-[#604735]" />
                <h3 className="text-lg font-bold text-[#342A23]">Compile Official Forensic PDF Brief</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-[#796C60] hover:text-[#342A23] hover:bg-[#EFE5D8]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#342A23] mb-2 font-mono">
                  Select Target Investigation Case *
                </label>
                <select
                  value={selectedCaseId}
                  onChange={(e) => setSelectedCaseId(e.target.value)}
                  className="w-full form-input"
                  required
                >
                  {cases.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.id} — {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#342A23] mb-2 font-mono">
                  Report Title
                </label>
                <input
                  type="text"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  placeholder="e.g. Official Digital Evidence Audit Brief"
                  className="w-full form-input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#342A23] mb-2 font-mono">
                  Summary Findings & Investigator Certification
                </label>
                <textarea
                  rows={3}
                  value={summaryNotes}
                  onChange={(e) => setSummaryNotes(e.target.value)}
                  placeholder="Enter judicial conclusions, evidence integrity verification confirmations, and scene assessments..."
                  className="w-full form-input resize-y text-sm"
                />
              </div>

              <div className="pt-4 border-t border-[#E8DED0] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="btn-primary"
                >
                  <Plus className="w-4 h-4" />
                  <span>{generating ? 'Compiling PDF Brief...' : 'Generate Official Report'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
