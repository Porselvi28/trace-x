import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  FileVideo,
  Upload,
  FileText,
  Network,
  Shield,
  Eye,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Edit,
  Save,
  Download,
  Calendar,
  User,
  Clock,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { Case, Evidence, DetectedEvent, ChainOfCustody, GeneratedReport } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { HashDisplay } from '../components/common/HashDisplay';
import { useNotification } from '../contexts/NotificationContext';

export const CaseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { notify } = useNotification();

  const [caseData, setCaseData] = useState<Case | null>(null);
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [events, setEvents] = useState<DetectedEvent[]>([]);
  const [custody, setCustody] = useState<ChainOfCustody[]>([]);
  const [reports, setReports] = useState<GeneratedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Active Tab: 'evidence' | 'events' | 'custody' | 'reports'
  const [activeTab, setActiveTab] = useState<'evidence' | 'events' | 'custody' | 'reports'>('evidence');

  // Generating Report State
  const [generatingReport, setGeneratingReport] = useState(false);

  // Status Edit State
  const [editingStatus, setEditingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [newPriority, setNewPriority] = useState('');
  const [newNotes, setNewNotes] = useState('');

  const fetchCaseDetails = async (force = false) => {
    if (!id) return;
    if (force) setRefreshing(true);
    try {
      const [c, evs, evts, coc, rpts] = await Promise.all([
        api.getCase(id, force),
        api.getCaseEvidence(id, force),
        api.listEvents({ case_id: id }, force),
        api.getCaseCustody(id, force),
        api.listReports(id, force)
      ]);
      setCaseData(c);
      setEvidenceList(evs);
      setEvents(evts);
      setCustody(coc);
      setReports(rpts);
      setNewStatus(c.status);
      setNewPriority(c.priority);
      setNewNotes(c.notes || '');
    } catch (err) {
      console.error('Error fetching case detail:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCaseDetails();
  }, [id]);

  const handleStatusUpdate = async () => {
    if (!id || !caseData) return;
    try {
      const updated = await api.updateCase(id, {
        status: newStatus as any,
        priority: newPriority as any,
        notes: newNotes
      });
      setCaseData(updated);
      setEditingStatus(false);
      notify('success', 'Case Dossier Updated', `Status changed to ${updated.status}.`);
    } catch (err: any) {
      notify('error', 'Update Failed', err.response?.data?.detail || 'Failed to update case.');
    }
  };

  const handleGenerateReport = async () => {
    if (!id) return;
    setGeneratingReport(true);
    try {
      const report = await api.generateReport({
        case_id: id,
        report_title: `Official Forensic Report — ${caseData?.title}`,
        summary_notes: caseData?.notes || 'Comprehensive evidence analysis and candidate correlation.'
      });
      notify('success', 'PDF Report Generated', `Report ${report.id} generated and ready for court submission.`);
      const rpts = await api.listReports(id, true);
      setReports(rpts);
      setActiveTab('reports');
    } catch (err: any) {
      notify('error', 'Report Generation Failed', err.response?.data?.detail || 'Error generating PDF');
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleEventReview = async (eventId: string, newReviewStatus: 'Confirmed' | 'Rejected') => {
    try {
      await api.reviewEvent(eventId, {
        investigator_review_status: newReviewStatus,
        review_notes: `Marked ${newReviewStatus.toLowerCase()} by lead examiner.`
      });
      notify('success', 'Event Updated', `Classification updated to ${newReviewStatus}.`);
      setEvents((prev) =>
        prev.map((e) =>
          e.id === eventId
            ? { ...e, investigator_review_status: newReviewStatus }
            : e
        )
      );
    } catch (err: any) {
      notify('error', 'Review Failed', err.response?.data?.detail || 'Could not update review status.');
    }
  };

  if (loading && !caseData) {
    return (
      <div className="space-y-6">
        <div className="h-5 w-40 bg-[#E8DED0] animate-pulse rounded"></div>
        <div className="bg-[#FFFCF7] border border-[#D9CBBB] rounded-2xl p-7 space-y-4">
          <div className="h-8 w-1/3 bg-[#E8DED0] animate-pulse rounded"></div>
          <div className="h-5 w-2/3 bg-[#E8DED0] animate-pulse rounded"></div>
          <div className="grid grid-cols-4 gap-4 pt-4 border-t border-[#D9CBBB]">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 bg-[#E8DED0] animate-pulse rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="p-12 text-center bg-[#FFFCF7] border border-[#D9CBBB] rounded-2xl shadow-xs">
        <p className="text-[#796C60] text-base">Case record not found or inaccessible.</p>
        <Link to="/cases" className="btn-primary mt-4 inline-flex">
          Return to Cases Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {/* Top Breadcrumb Link */}
      <div>
        <Link
          to="/cases"
          className="inline-flex items-center gap-2 text-sm text-[#796C60] hover:text-[#342A23] transition-colors font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Cases Directory
        </Link>
      </div>

      {/* Case Header Dossier Card */}
      <div className="bg-[#FFFCF7] border border-[#D9CBBB] rounded-2xl p-6 lg:p-8 shadow-[0_1px_3px_rgba(68,49,38,0.05)]">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 pb-6 border-b border-[#E8DED0]">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-xs font-bold text-[#443126] bg-[#EFE5D8] border border-[#D9CBBB] px-3 py-1 rounded-md">
                {caseData.id}
              </span>
              <StatusBadge status={caseData.status} />
              <StatusBadge status={caseData.priority} />
              <span className="text-xs font-bold text-[#604735] uppercase font-mono tracking-wider">
                Category: {caseData.category}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#342A23] mt-3">
              {caseData.title}
            </h1>
            <p className="text-[15px] text-[#534335] mt-1.5 max-w-3xl leading-relaxed">
              {caseData.description || 'No case scope narrative recorded.'}
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setEditingStatus(!editingStatus)}
              className="btn-secondary"
            >
              <Edit className="w-4 h-4 text-[#604735]" />
              <span>{editingStatus ? 'Cancel Edit' : 'Modify Status'}</span>
            </button>

            <Link
              to={`/evidence/upload?case_id=${caseData.id}`}
              className="btn-secondary"
            >
              <Upload className="w-4 h-4 text-[#604735]" />
              <span>Attach Evidence</span>
            </Link>

            <Link
              to={`/correlation/${caseData.id}`}
              className="btn-secondary"
            >
              <Network className="w-4 h-4 text-[#604735]" />
              <span>Correlate Feeds</span>
            </Link>

            <button
              onClick={handleGenerateReport}
              disabled={generatingReport}
              className="btn-primary"
            >
              <FileText className="w-4 h-4 text-[#FFFCF7]" />
              <span>{generatingReport ? 'Generating PDF...' : 'Generate PDF Report'}</span>
            </button>
          </div>
        </div>

        {/* Status Edit Drawer */}
        {editingStatus && (
          <div className="mt-5 p-5 rounded-2xl bg-[#EFE5D8] border border-[#D9CBBB] grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in duration-150">
            <div>
              <label className="block text-xs font-bold text-[#342A23] mb-1.5 uppercase tracking-wider font-mono">
                Investigation Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full form-input"
              >
                <option value="Active">Active</option>
                <option value="Under Review">Under Review</option>
                <option value="Archived">Archived</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#342A23] mb-1.5 uppercase tracking-wider font-mono">
                Priority Tier
              </label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value)}
                className="w-full form-input"
              >
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleStatusUpdate}
                className="btn-primary w-full justify-center h-10 font-bold"
              >
                <Save className="w-4 h-4" /> <span>Save Dossier Changes</span>
              </button>
            </div>
          </div>
        )}

        {/* Metadata Footer */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 text-sm text-[#796C60]">
          <div>
            <span className="text-[#9A8C7D] block text-xs font-bold uppercase tracking-wider font-mono">
              Lead Investigator
            </span>
            <span className="text-[#342A23] font-bold text-sm mt-0.5 block">{caseData.investigator_name}</span>
          </div>
          <div>
            <span className="text-[#9A8C7D] block text-xs font-bold uppercase tracking-wider font-mono">
              Initialized Date
            </span>
            <span className="text-[#342A23] font-mono text-xs mt-0.5 block">
              {new Date(caseData.created_at).toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-[#9A8C7D] block text-xs font-bold uppercase tracking-wider font-mono">
              Associated Feeds
            </span>
            <span className="text-[#604735] font-bold text-sm mt-0.5 block">
              {evidenceList.length} CCTV Media Items
            </span>
          </div>
          <div>
            <span className="text-[#9A8C7D] block text-xs font-bold uppercase tracking-wider font-mono">
              Detected Findings
            </span>
            <span className="text-[#B78035] font-bold text-sm mt-0.5 block">
              {events.length} Candidate Events
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-[#D9CBBB] flex items-center gap-6 text-sm font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('evidence')}
          className={`pb-3.5 border-b-2 transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'evidence'
              ? 'border-[#604735] text-[#443126] font-bold'
              : 'border-transparent text-[#796C60] hover:text-[#342A23]'
          }`}
        >
          <FileVideo className="w-4 h-4" />
          <span>Evidence Inventory ({evidenceList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('events')}
          className={`pb-3.5 border-b-2 transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'events'
              ? 'border-[#604735] text-[#443126] font-bold'
              : 'border-transparent text-[#796C60] hover:text-[#342A23]'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>Candidate & Confirmed Findings ({events.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('custody')}
          className={`pb-3.5 border-b-2 transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'custody'
              ? 'border-[#604735] text-[#443126] font-bold'
              : 'border-transparent text-[#796C60] hover:text-[#342A23]'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Chain of Custody ({custody.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`pb-3.5 border-b-2 transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'reports'
              ? 'border-[#604735] text-[#443126] font-bold'
              : 'border-transparent text-[#796C60] hover:text-[#342A23]'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Generated Reports ({reports.length})</span>
        </button>
      </div>

      {/* TAB 1: EVIDENCE INVENTORY */}
      {activeTab === 'evidence' && (
        <div className="space-y-4">
          {evidenceList.length === 0 ? (
            <div className="p-12 text-center bg-[#FFFCF7] border border-[#D9CBBB] rounded-2xl shadow-xs">
              <FileVideo className="w-10 h-10 text-[#9A8C7D] mx-auto mb-2" />
              <p className="text-sm text-[#796C60]">No CCTV or video evidence files associated with this case yet.</p>
              <Link
                to={`/evidence/upload?case_id=${caseData.id}`}
                className="mt-4 btn-primary inline-flex"
              >
                <Upload className="w-4 h-4" /> <span>Attach Video Evidence</span>
              </Link>
            </div>
          ) : (
            <div className="bg-[#FFFCF7] border border-[#D9CBBB] rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(68,49,38,0.05)]">
              <div className="overflow-x-auto">
                <table className="forensic-table">
                  <thead>
                    <tr>
                      <th>Evidence ID</th>
                      <th>Filename / Camera</th>
                      <th>SHA-256 Digest</th>
                      <th>Resolution & Duration</th>
                      <th>Status</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8DED0]">
                    {evidenceList.map((ev) => (
                      <tr key={ev.id} className="hover:bg-[#F5F0E8]/70 transition-colors">
                        <td className="font-mono font-bold text-[#443126] text-xs whitespace-nowrap">
                          <Link to={`/evidence/${ev.id}`} className="hover:underline flex items-center gap-1.5">
                            <FileVideo className="w-3.5 h-3.5 text-[#8B684D]" />
                            <span>{ev.id}</span>
                          </Link>
                        </td>
                        <td>
                          <Link
                            to={`/evidence/${ev.id}`}
                            className="font-bold text-[#342A23] hover:text-[#604735] block truncate max-w-xs text-sm"
                          >
                            {ev.original_filename}
                          </Link>
                          <span className="text-xs text-[#796C60] block truncate">
                            {ev.source_device} ({ev.source_vendor})
                          </span>
                        </td>
                        <td>
                          <HashDisplay hash={ev.sha256_hash} short={true} />
                        </td>
                        <td className="text-xs font-mono text-[#534335] whitespace-nowrap">
                          {ev.width > 0 ? `${ev.width}×${ev.height}` : 'Not Decoded'} • {ev.duration_seconds}s
                        </td>
                        <td className="whitespace-nowrap">
                          <StatusBadge status={ev.status} size="sm" />
                        </td>
                        <td className="text-right whitespace-nowrap">
                          <Link
                            to={`/evidence/${ev.id}`}
                            className="btn-secondary py-1 px-3 text-xs font-semibold"
                          >
                            Inspect <ArrowRight className="w-3.5 h-3.5 ml-1" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: FINDINGS / EVENTS */}
      {activeTab === 'events' && (
        <div className="space-y-4">
          {events.length === 0 ? (
            <div className="p-12 text-center bg-[#FFFCF7] border border-[#D9CBBB] rounded-2xl shadow-xs">
              <Eye className="w-10 h-10 text-[#9A8C7D] mx-auto mb-2" />
              <p className="text-sm text-[#796C60]">No candidate events recorded for this investigation yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((evt) => (
                <div
                  key={evt.id}
                  className="bg-[#FFFCF7] border border-[#D9CBBB] rounded-2xl p-5 shadow-[0_1px_3px_rgba(68,49,38,0.05)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono text-xs font-bold text-[#443126] bg-[#EFE5D8] px-2 py-0.5 rounded border border-[#D9CBBB]">
                        {evt.id}
                      </span>
                      <span className="font-bold text-sm text-[#342A23]">{evt.event_category}</span>
                      <StatusBadge status={evt.investigator_review_status} size="sm" />
                      <span className="font-mono text-xs font-bold text-[#604735]">
                        +{evt.formatted_time}
                      </span>
                    </div>
                    <p className="text-xs text-[#534335] max-w-2xl">{evt.review_notes}</p>
                    <div className="text-[11px] text-[#796C60] font-mono">
                      Evidence: {evt.evidence_id} • Camera: {evt.source_device} • Model: {evt.model_name}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleEventReview(evt.id, 'Confirmed')}
                      className="px-3 py-1.5 rounded-lg bg-[#EAF2EC] text-[#47765B] border border-[#BCD5C3] text-xs font-bold hover:bg-[#BCD5C3] transition-colors cursor-pointer"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => handleEventReview(evt.id, 'Rejected')}
                      className="px-3 py-1.5 rounded-lg bg-[#F8EBEA] text-[#A64B43] border border-[#E3BFBC] text-xs font-bold hover:bg-[#E3BFBC] transition-colors cursor-pointer"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CHAIN OF CUSTODY */}
      {activeTab === 'custody' && (
        <div className="bg-[#FFFCF7] border border-[#D9CBBB] rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(68,49,38,0.05)]">
          <div className="overflow-x-auto">
            <table className="forensic-table">
              <thead>
                <tr>
                  <th>Record ID</th>
                  <th>UTC Timestamp</th>
                  <th>Action</th>
                  <th>Actor</th>
                  <th>Target Evidence</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8DED0]">
                {custody.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#9A8C7D] text-sm">
                      No chain of custody transactions recorded for this case.
                    </td>
                  </tr>
                ) : (
                  custody.map((coc) => (
                    <tr key={coc.id} className="hover:bg-[#F5F0E8]/70 transition-colors">
                      <td className="font-mono font-bold text-[#443126] text-xs whitespace-nowrap">
                        {coc.id}
                      </td>
                      <td className="font-mono text-xs text-[#796C60] whitespace-nowrap">
                        {new Date(coc.timestamp).toLocaleString()}
                      </td>
                      <td className="whitespace-nowrap">
                        <StatusBadge status={coc.action_type.replace(/_/g, ' ')} size="sm" />
                      </td>
                      <td className="font-semibold text-sm text-[#342A23] whitespace-nowrap">
                        {coc.actor}
                      </td>
                      <td className="font-mono text-xs text-[#604735] whitespace-nowrap">
                        {coc.evidence_id}
                      </td>
                      <td className="text-xs text-[#534335] max-w-md truncate">
                        {coc.description}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: GENERATED REPORTS */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          {reports.length === 0 ? (
            <div className="p-12 text-center bg-[#FFFCF7] border border-[#D9CBBB] rounded-2xl shadow-xs">
              <FileText className="w-10 h-10 text-[#9A8C7D] mx-auto mb-2" />
              <p className="text-sm text-[#796C60]">No PDF reports generated for this investigation yet.</p>
              <button
                onClick={handleGenerateReport}
                disabled={generatingReport}
                className="mt-4 btn-primary inline-flex"
              >
                <FileText className="w-4 h-4" />
                <span>{generatingReport ? 'Compiling PDF...' : 'Compile First Forensic Brief'}</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#E8DED0] bg-[#FFFCF7] border border-[#D9CBBB] rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(68,49,38,0.05)]">
              {reports.map((r) => (
                <div key={r.id} className="p-5 flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs font-bold text-[#443126] bg-[#EFE5D8] px-2 py-0.5 rounded border border-[#D9CBBB]">
                        {r.id}
                      </span>
                      <span className="font-bold text-sm text-[#342A23]">{r.report_title}</span>
                    </div>
                    <div className="text-xs text-[#796C60] mt-1 font-mono">
                      Compiled: {new Date(r.created_at).toLocaleString()} by {r.generated_by}
                    </div>
                  </div>

                  <a
                    href={api.getReportDownloadUrl(r.id)}
                    className="btn-primary py-1.5 px-3 text-xs font-semibold"
                    download
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
