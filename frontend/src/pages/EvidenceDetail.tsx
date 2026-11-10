import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FileVideo,
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  Cpu,
  Download,
  Eye,
  CheckCircle2,
  XCircle,
  Camera,
  Layers,
  Clock,
  Shield,
  HardDrive
} from 'lucide-react';
import { api } from '../services/api';
import { Evidence, VerificationResult, DetectedEvent, ChainOfCustody } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { HashDisplay } from '../components/common/HashDisplay';
import { useNotification } from '../contexts/NotificationContext';

export const EvidenceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { notify } = useNotification();

  const [evidence, setEvidence] = useState<Evidence | null>(null);
  const [events, setEvents] = useState<DetectedEvent[]>([]);
  const [custody, setCustody] = useState<ChainOfCustody[]>([]);
  const [loading, setLoading] = useState(true);

  // Integrity Verification State
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);

  // Processing Trigger State
  const [processing, setProcessing] = useState(false);

  const fetchEvidence = async (force = false) => {
    if (!id) return;
    try {
      const [ev, evts, coc] = await Promise.all([
        api.getEvidence(id, force),
        api.listEvents({ evidence_id: id }, force),
        api.getEvidenceCustody(id, force),
      ]);
      setEvidence(ev);
      setEvents(evts);
      setCustody(coc);
    } catch (err) {
      console.error('Failed to load evidence detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvidence();
  }, [id]);

  const handleVerifyIntegrity = async () => {
    if (!id) return;
    setVerifying(true);
    try {
      const res = await api.verifyIntegrity(id);
      setVerificationResult(res);
      if (res.verification_status === 'HASH MATCH') {
        notify('success', 'Bitwise Hash Match', 'File storage integrity verified against initial recorded SHA-256 signature.');
      } else {
        notify('error', 'Hash Mismatch Detected', 'Current file bytes differ from recorded reference hash!');
      }
      const coc = await api.getEvidenceCustody(id, true);
      setCustody(coc);
    } catch (err: any) {
      notify('error', 'Verification Error', err.response?.data?.detail || 'Could not verify hash');
    } finally {
      setVerifying(false);
    }
  };

  const handleTriggerProcessing = async () => {
    if (!id) return;
    setProcessing(true);
    try {
      await api.startProcessing(id);
      notify('info', 'Processing Pipeline Triggered', 'OpenCV metadata extraction and MOG2 candidate detection initiated.');
      setTimeout(() => fetchEvidence(true), 2500);
    } catch (err: any) {
      notify('error', 'Pipeline Error', err.response?.data?.detail || 'Failed to start processing');
    } finally {
      setProcessing(false);
    }
  };

  const handleEventReview = async (eventId: string, status: 'Confirmed' | 'Rejected') => {
    try {
      await api.reviewEvent(eventId, {
        investigator_review_status: status,
        review_notes: `Investigator verified finding as ${status}.`
      });
      notify('success', 'Finding Recorded', `Event status set to ${status}.`);
      setEvents((prev) =>
        prev.map((e) =>
          e.id === eventId
            ? { ...e, investigator_review_status: status, detection_status: `Investigator ${status}` }
            : e
        )
      );
    } catch (err: any) {
      notify('error', 'Review Failed', err.response?.data?.detail || 'Failed to review event');
    }
  };

  if (loading && !evidence) {
    return (
      <div className="space-y-6">
        <div className="h-5 w-40 bg-[#E8DED0] animate-pulse rounded"></div>
        <div className="bg-[#FFFCF7] border border-[#D9CBBB] rounded-2xl p-7 space-y-4">
          <div className="h-8 w-1/3 bg-[#E8DED0] animate-pulse rounded"></div>
          <div className="h-5 w-2/3 bg-[#E8DED0] animate-pulse rounded"></div>
          <div className="grid grid-cols-6 gap-4 pt-4 border-t border-[#D9CBBB]">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-12 bg-[#E8DED0] animate-pulse rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!evidence) {
    return (
      <div className="p-12 text-center bg-[#FFFCF7] border border-[#D9CBBB] rounded-2xl shadow-xs">
        <p className="text-[#796C60] text-base">Evidence item not found or inaccessible.</p>
        <Link to="/evidence" className="btn-primary mt-4 inline-flex">
          Return to Evidence Repository
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {/* Top Breadcrumb Link */}
      <div>
        <Link
          to="/evidence"
          className="inline-flex items-center gap-2 text-sm text-[#796C60] hover:text-[#342A23] transition-colors font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Evidence Repository
        </Link>
      </div>

      {/* Header Overview Card */}
      <div className="bg-[#FFFCF7] border border-[#D9CBBB] rounded-2xl p-6 lg:p-8 shadow-[0_1px_3px_rgba(68,49,38,0.05)]">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 pb-6 border-b border-[#E8DED0]">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-xs font-bold text-[#443126] bg-[#EFE5D8] border border-[#D9CBBB] px-3 py-1 rounded-md">
                {evidence.id}
              </span>
              <StatusBadge status={evidence.status} />
              {evidence.case_id && (
                <Link
                  to={`/cases/${evidence.case_id}`}
                  className="text-xs font-mono text-[#604735] font-bold hover:underline bg-[#EFE5D8] px-2.5 py-1 rounded-md border border-[#D9CBBB]"
                >
                  Case: {evidence.case_id}
                </Link>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#342A23] mt-3">
              {evidence.original_filename}
            </h1>
            <p className="text-xs text-[#796C60] mt-1 font-mono">
              Physical Secure UUID Key: <span className="text-[#342A23] font-semibold">{evidence.stored_filename}</span>
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleVerifyIntegrity}
              disabled={verifying}
              className="btn-primary"
            >
              <ShieldCheck className="w-4 h-4 text-[#FFFCF7]" />
              <span>{verifying ? 'Recalculating SHA-256...' : 'Verify Cryptographic Integrity'}</span>
            </button>

            <button
              onClick={handleTriggerProcessing}
              disabled={processing}
              className="btn-secondary"
            >
              <Cpu className="w-4 h-4 text-[#604735]" />
              <span>{processing ? 'Processing...' : 'Run Analysis Pipeline'}</span>
            </button>

            <a
              href={api.getDownloadUrl(evidence.id)}
              className="btn-secondary"
              download
            >
              <Download className="w-4 h-4 text-[#604735]" />
              <span>Export Binary</span>
            </a>
          </div>
        </div>

        {/* Dynamic Hash Verification Alert */}
        {verificationResult && (
          <div
            className={`mt-5 p-5 rounded-2xl border text-sm font-mono space-y-3 animate-in fade-in duration-150 ${
              verificationResult.verification_status === 'HASH MATCH'
                ? 'bg-[#EAF2EC] border-[#47765B] text-[#47765B]'
                : 'bg-[#F8EBEA] border-[#A64B43] text-[#A64B43]'
            }`}
          >
            <div className="flex items-center justify-between font-bold text-base flex-wrap gap-2">
              <span className="flex items-center gap-2.5">
                {verificationResult.verification_status === 'HASH MATCH' ? (
                  <ShieldCheck className="w-6 h-6 text-[#47765B]" />
                ) : (
                  <ShieldAlert className="w-6 h-6 text-[#A64B43]" />
                )}
                INTEGRITY VERIFICATION OUTCOME: {verificationResult.verification_status}
              </span>
              <span className="text-xs font-normal text-[#534335] font-mono">
                Verified at: {new Date(verificationResult.verified_at).toLocaleTimeString()}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
              <div className="p-3 bg-[#FFFCF7] rounded-xl border border-current/20 text-[#342A23]">
                <span className="text-[#796C60] block mb-1 font-sans font-semibold">Recorded Benchmark Hash:</span>
                <span className="break-all font-semibold block select-all">{verificationResult.recorded_hash}</span>
              </div>
              <div className="p-3 bg-[#FFFCF7] rounded-xl border border-current/20 text-[#342A23]">
                <span className="text-[#796C60] block mb-1 font-sans font-semibold">Recalculated Active Hash:</span>
                <span className="break-all font-semibold block select-all">{verificationResult.current_hash}</span>
              </div>
            </div>

            <p className="text-xs text-[#534335] pt-1 font-sans italic border-t border-current/20">
              {verificationResult.forensic_disclaimer}
            </p>
          </div>
        )}

        {/* Video Technical Parameters & Acquisition Metadata */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 pt-6 text-sm">
          <div>
            <span className="text-[#9A8C7D] block text-xs font-bold uppercase tracking-wider font-mono">
              Source Camera
            </span>
            <span className="text-[#342A23] font-bold text-sm mt-0.5 block">{evidence.source_device}</span>
          </div>
          <div>
            <span className="text-[#9A8C7D] block text-xs font-bold uppercase tracking-wider font-mono">
              DVR Hardware
            </span>
            <span className="text-[#342A23] text-sm mt-0.5 block">{evidence.source_vendor}</span>
          </div>
          <div>
            <span className="text-[#9A8C7D] block text-xs font-bold uppercase tracking-wider font-mono">
              Resolution & FPS
            </span>
            <span className="text-[#604735] font-bold font-mono text-sm mt-0.5 block">
              {evidence.width > 0 ? `${evidence.width}×${evidence.height} @ ${evidence.fps}fps` : 'Not Decoded'}
            </span>
          </div>
          <div>
            <span className="text-[#9A8C7D] block text-xs font-bold uppercase tracking-wider font-mono">
              Video Codec
            </span>
            <span className="text-[#342A23] font-semibold font-mono text-sm mt-0.5 block">{evidence.codec}</span>
          </div>
          <div>
            <span className="text-[#9A8C7D] block text-xs font-bold uppercase tracking-wider font-mono">
              Duration
            </span>
            <span className="text-[#342A23] font-mono text-sm mt-0.5 block">{evidence.duration_seconds}s</span>
          </div>
          <div>
            <span className="text-[#9A8C7D] block text-xs font-bold uppercase tracking-wider font-mono">
              File Size
            </span>
            <span className="text-[#342A23] font-mono text-sm mt-0.5 block">
              {(evidence.file_size / (1024 * 1024)).toFixed(2)} MB
            </span>
          </div>
        </div>

        {/* Reference SHA-256 Signature Display */}
        <div className="mt-5 pt-5 border-t border-[#E8DED0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-bold text-[#796C60] uppercase tracking-wider font-mono">
              CRYPTOGRAPHIC SHA-256 SIGNATURE:
            </span>
            <HashDisplay hash={evidence.sha256_hash} short={false} />
          </div>
          <span className="text-xs text-[#796C60] font-mono">
            Ingested by {evidence.uploaded_by} on {new Date(evidence.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Main Grid: Keyframes & Candidate Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Extracted Keyframe Gallery */}
        <div className="bg-[#FFFCF7] border border-[#D9CBBB] rounded-2xl p-6 shadow-[0_1px_3px_rgba(68,49,38,0.05)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E8DED0]">
            <div>
              <h2 className="text-lg font-bold text-[#342A23] flex items-center gap-2">
                <Camera className="w-5 h-5 text-[#604735]" />
                Representative Extracted Frames
              </h2>
              <p className="text-xs text-[#796C60]">Derived keyframes sampled via OpenCV pipeline</p>
            </div>
            <span className="text-xs text-[#9A8C7D] font-mono">5s Interval</span>
          </div>

          {events.some((e) => e.frame_reference) ? (
            <div className="grid grid-cols-2 gap-3.5">
              {events
                .filter((e) => e.frame_reference)
                .slice(0, 4)
                .map((e, idx) => (
                  <div key={idx} className="relative rounded-xl overflow-hidden border border-[#D9CBBB] bg-[#EFE5D8] group shadow-2xs">
                    <img
                      src={e.frame_reference}
                      alt={`Keyframe at ${e.formatted_time}`}
                      className="w-full h-36 object-cover"
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-[#342A23]/85 backdrop-blur-xs p-2 flex items-center justify-between text-xs font-mono text-[#FFFCF7]">
                      <span className="font-bold">+{e.formatted_time}</span>
                      <span className="text-xs">{e.event_category}</span>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="p-10 text-center bg-[#EFE5D8]/40 border border-[#D9CBBB] rounded-xl">
              <Camera className="w-10 h-10 text-[#9A8C7D] mx-auto mb-2" />
              <p className="text-sm text-[#796C60]">No derived frames extracted yet.</p>
              <button
                onClick={handleTriggerProcessing}
                className="mt-3 btn-secondary text-xs"
              >
                Trigger OpenCV Preprocessing Pipeline
              </button>
            </div>
          )}

          {evidence.acquisition_notes && (
            <div className="p-3.5 bg-[#EFE5D8]/50 border border-[#D9CBBB] rounded-xl text-xs">
              <span className="text-[#9A8C7D] block text-xs uppercase font-bold font-mono">Acquisition Notes:</span>
              <p className="text-[#342A23] mt-1 leading-relaxed text-sm font-medium">{evidence.acquisition_notes}</p>
            </div>
          )}
        </div>

        {/* Candidate Events Flagged in this Clip */}
        <div className="bg-[#FFFCF7] border border-[#D9CBBB] rounded-2xl p-6 shadow-[0_1px_3px_rgba(68,49,38,0.05)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E8DED0]">
            <div>
              <h2 className="text-lg font-bold text-[#342A23] flex items-center gap-2">
                <Eye className="w-5 h-5 text-[#B78035]" />
                Candidate Anomaly Detections ({events.length})
              </h2>
              <p className="text-xs text-[#796C60]">Automated computer vision motion intervals</p>
            </div>
            <Link to="/events" className="text-xs text-[#8B684D] font-bold hover:underline">
              Event Review Desk
            </Link>
          </div>

          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {events.length === 0 ? (
              <div className="p-10 text-center bg-[#EFE5D8]/40 border border-[#D9CBBB] rounded-xl">
                <p className="text-sm text-[#796C60]">No candidate events flagged in this video clip.</p>
              </div>
            ) : (
              events.map((evt) => (
                <div
                  key={evt.id}
                  className="p-4 rounded-xl bg-[#F5F0E8] border border-[#D9CBBB] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-sm text-[#342A23]">{evt.event_category}</span>
                      <StatusBadge status={evt.investigator_review_status} size="sm" />
                      <span className="font-mono text-[#604735] font-bold">+{evt.formatted_time}</span>
                    </div>
                    <p className="text-[#534335] mt-0.5">{evt.review_notes}</p>
                    <span className="text-[11px] text-[#9A8C7D] font-mono block">
                      Detector: {evt.model_name}
                      {evt.model_confidence ? ` • Conf: ${(evt.model_confidence * 100).toFixed(0)}%` : ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleEventReview(evt.id, 'Confirmed')}
                      className="px-2.5 py-1 rounded-md bg-[#EAF2EC] text-[#47765B] border border-[#BCD5C3] font-bold hover:bg-[#BCD5C3] transition-colors cursor-pointer"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => handleEventReview(evt.id, 'Rejected')}
                      className="px-2.5 py-1 rounded-md bg-[#F8EBEA] text-[#A64B43] border border-[#E3BFBC] font-bold hover:bg-[#E3BFBC] transition-colors cursor-pointer"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Chain of Custody for this evidence item */}
      <div className="bg-[#FFFCF7] border border-[#D9CBBB] rounded-2xl p-6 shadow-[0_1px_3px_rgba(68,49,38,0.05)]">
        <div className="flex items-center justify-between pb-3 border-b border-[#E8DED0] mb-4">
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-[#604735]" />
            <h2 className="text-lg font-bold text-[#342A23]">Evidence Custody Trail ({custody.length} Records)</h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="forensic-table">
            <thead>
              <tr>
                <th>Record ID</th>
                <th>UTC Timestamp</th>
                <th>Action</th>
                <th>Actor</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8DED0]">
              {custody.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#9A8C7D] text-sm">
                    No custody records logged for this file.
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
    </div>
  );
};
