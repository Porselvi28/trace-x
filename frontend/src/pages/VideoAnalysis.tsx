import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Cpu,
  RefreshCw,
  Camera,
  Layers,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  ShieldCheck,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { Evidence, ProcessingJob, DetectedEvent } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { useNotification } from '../contexts/NotificationContext';

export const VideoAnalysis: React.FC = () => {
  const { notify } = useNotification();
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [jobs, setJobs] = useState<ProcessingJob[]>([]);
  const [events, setEvents] = useState<DetectedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);

  const fetchEvidence = async () => {
    try {
      const data = await api.listEvidence();
      setEvidenceList(data);
      if (data.length > 0 && !selectedId) {
        setSelectedId(data[0].id);
      }
    } catch (err) {
      console.error('Error fetching evidence:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDetails = async (id: string) => {
    if (!id) return;
    try {
      const [jList, eList] = await Promise.all([
        api.getEvidenceJobs(id),
        api.listEvents({ evidence_id: id })
      ]);
      setJobs(jList);
      setEvents(eList);
    } catch (err) {
      console.error('Error fetching jobs/events:', err);
    }
  };

  useEffect(() => {
    fetchEvidence();
  }, []);

  useEffect(() => {
    if (selectedId) {
      fetchDetails(selectedId);
    }
  }, [selectedId]);

  const handleStartPipeline = async () => {
    if (!selectedId) return;
    setTriggering(true);
    try {
      await api.startProcessing(selectedId);
      notify('success', 'Pipeline Dispatched', 'Background video analysis job queued and executing.');
      setTimeout(() => fetchDetails(selectedId), 2500);
    } catch (err: any) {
      notify('error', 'Execution Failed', err.response?.data?.detail || 'Pipeline could not start');
    } finally {
      setTriggering(false);
    }
  };

  const handleReviewEvent = async (eventId: string, newStatus: 'Confirmed' | 'Rejected') => {
    try {
      await api.reviewEvent(eventId, {
        investigator_review_status: newStatus,
        review_notes: `Investigator recorded finding as ${newStatus}.`
      });
      notify('success', 'Finding Recorded', `Event status set to ${newStatus}.`);
      setEvents((prev) =>
        prev.map((e) =>
          e.id === eventId
            ? { ...e, investigator_review_status: newStatus }
            : e
        )
      );
    } catch (err: any) {
      notify('error', 'Review Failed', err.response?.data?.detail || 'Execution error');
    }
  };

  const selectedEvidence = evidenceList.find((e) => e.id === selectedId);

  return (
    <div className="space-y-7">
      {/* Header Banner */}
      <div className="bg-[#FFFCF7] border border-[#D9CBBB] p-6 lg:p-7 rounded-2xl shadow-[0_1px_3px_rgba(68,49,38,0.05)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Cpu className="w-4 h-4 text-[#604735]" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#796C60]">
              Computer Vision & Ingestion Preprocessing
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#342A23]">
            AI Analysis & Forensic Preprocessing
          </h1>
          <p className="text-[15px] text-[#796C60] mt-1 max-w-2xl leading-relaxed">
            OpenCV optical motion sentinel inference, keyframe extraction, technical parameter decomposition, and anomaly review
          </p>
        </div>

        <button
          type="button"
          onClick={() => selectedId && fetchDetails(selectedId)}
          className="btn-secondary shrink-0"
        >
          <RefreshCw className="w-4 h-4 text-[#796C60]" />
          <span>Refresh Analysis</span>
        </button>
      </div>

      {/* Available AI Models Architecture Status Matrix */}
      <div className="bg-[#FFFCF7] border border-[#D9CBBB] rounded-2xl p-6 shadow-[0_1px_3px_rgba(68,49,38,0.05)] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E8DED0]">
          <div>
            <h2 className="text-lg font-bold text-[#342A23] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#47765B]" />
              AI Model Operational Availability Matrix
            </h2>
            <p className="text-xs text-[#796C60]">
              Forensic compliance distinction between functioning engines and unconfigured neural modules
            </p>
          </div>
          <span className="text-xs font-mono text-[#47765B] bg-[#EAF2EC] px-2.5 py-1 rounded-md font-bold border border-[#BCD5C3]">
            STANDARDS COMPLIANT
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-4 rounded-xl bg-[#EAF2EC] border border-[#BCD5C3] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#47765B] text-sm font-sans">OpenCV MOG2 Sentinel</span>
              <span className="px-2 py-0.5 rounded bg-[#47765B] text-[#FFFCF7] text-[10px] font-bold">
                OPERATIONAL
              </span>
            </div>
            <p className="text-[#342A23] font-sans text-xs leading-relaxed">
              Real background subtractor contour motion detection & keyframe sampling at 5-second intervals.
            </p>
            <span className="text-[11px] text-[#47765B] font-semibold block pt-1">
              Architecture: cv2.createBackgroundSubtractorMOG2
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#FBF5EA] border border-[#E8D4B5] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#B78035] text-sm font-sans">YOLOv8 Deep Learning</span>
              <span className="px-2 py-0.5 rounded bg-[#B78035] text-[#FFFCF7] text-[10px] font-bold">
                UNCONFIGURED
              </span>
            </div>
            <p className="text-[#796C60] font-sans text-xs leading-relaxed">
              Pluggable object detector stub declaring unconfigured status. Refuses fabricated inferences.
            </p>
            <span className="text-[11px] text-[#B78035] font-semibold block pt-1">
              Status: Model weights not bound
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#FBF5EA] border border-[#E8D4B5] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#B78035] text-sm font-sans">Authenticity Deepfake Classifier</span>
              <span className="px-2 py-0.5 rounded bg-[#B78035] text-[#FFFCF7] text-[10px] font-bold">
                UNCONFIGURED
              </span>
            </div>
            <p className="text-[#796C60] font-sans text-xs leading-relaxed">
              Temporal artifact analyzer declaring unconfigured status. Refuses fabricated synthetic conclusions.
            </p>
            <span className="text-[11px] text-[#B78035] font-semibold block pt-1">
              Status: Weights pending calibration
            </span>
          </div>
        </div>
      </div>

      {/* Main Workspace Card: Target Evidence Selection */}
      <div className="bg-[#FFFCF7] border border-[#D9CBBB] rounded-2xl p-6 lg:p-7 shadow-[0_1px_3px_rgba(68,49,38,0.05)] space-y-6">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#342A23] mb-2.5 font-mono">
            Select Ingested Evidence Video for Analysis
          </label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="flex-1 bg-[#F5F0E8] border border-[#D9CBBB] rounded-xl px-3.5 h-11 text-sm text-[#342A23] focus:outline-none focus:border-[#8B684D] font-mono cursor-pointer"
            >
              {evidenceList.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.id} — {e.original_filename} ({e.source_device})
                </option>
              ))}
            </select>

            <button
              onClick={handleStartPipeline}
              disabled={triggering || !selectedId}
              className="btn-primary h-11 px-6 shrink-0 justify-center font-bold"
            >
              <Cpu className={`w-4 h-4 ${triggering ? 'animate-spin' : ''}`} />
              <span>{triggering ? 'Queuing Analysis...' : 'Execute Analysis Pipeline'}</span>
            </button>
          </div>
        </div>

        {/* Selected Video Specifications */}
        {selectedEvidence && (
          <div className="p-5 bg-[#F5F0E8] border border-[#D9CBBB] rounded-xl grid grid-cols-2 sm:grid-cols-5 gap-4 text-xs font-mono">
            <div>
              <span className="text-[#796C60] block font-sans font-semibold uppercase mb-1">Status</span>
              <StatusBadge status={selectedEvidence.status} size="sm" />
            </div>
            <div>
              <span className="text-[#796C60] block font-sans font-semibold uppercase">Dimensions</span>
              <span className="text-[#342A23] font-semibold text-sm">
                {selectedEvidence.width > 0 ? `${selectedEvidence.width}×${selectedEvidence.height}` : 'Not Decoded'}
              </span>
            </div>
            <div>
              <span className="text-[#796C60] block font-sans font-semibold uppercase">Frame Rate</span>
              <span className="text-[#342A23] font-semibold text-sm">
                {selectedEvidence.fps > 0 ? `${selectedEvidence.fps} fps` : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-[#796C60] block font-sans font-semibold uppercase">Duration</span>
              <span className="text-[#604735] font-bold text-sm">
                {selectedEvidence.duration_seconds}s
              </span>
            </div>
            <div>
              <span className="text-[#796C60] block font-sans font-semibold uppercase">Camera Device</span>
              <span className="text-[#342A23] font-sans font-medium text-sm truncate block">
                {selectedEvidence.source_device}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Grid: Extracted Keyframes & Candidate Events Desk */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Extracted Frames Gallery */}
        <div className="bg-[#FFFCF7] border border-[#D9CBBB] rounded-2xl p-6 shadow-[0_1px_3px_rgba(68,49,38,0.05)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E8DED0]">
            <div>
              <h2 className="text-lg font-bold text-[#342A23] flex items-center gap-2">
                <Camera className="w-5 h-5 text-[#604735]" />
                Extracted Keyframe Strip
              </h2>
              <p className="text-xs text-[#796C60]">Derived keyframes sampled via OpenCV pipeline</p>
            </div>
            <span className="text-xs text-[#9A8C7D] font-mono">5s Interval</span>
          </div>

          {events.some((e) => e.frame_reference) ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {events
                .filter((e) => e.frame_reference)
                .map((e) => (
                  <div key={e.id} className="relative rounded-xl overflow-hidden border border-[#D9CBBB] bg-[#EFE5D8] shadow-2xs group">
                    <img
                      src={e.frame_reference}
                      alt={e.formatted_time}
                      className="w-full h-28 object-cover"
                    />
                    <div className="p-2 bg-[#342A23]/90 text-xs font-mono text-[#FFFCF7] flex justify-between items-center">
                      <span className="font-bold">+{e.formatted_time}</span>
                      <span className="text-[11px] truncate max-w-[80px]">{e.event_category}</span>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="p-12 text-center bg-[#EFE5D8]/40 border border-[#D9CBBB] rounded-xl text-sm text-[#796C60]">
              <Camera className="w-10 h-10 text-[#9A8C7D] mx-auto mb-2" />
              <span>No keyframes currently extracted. Execute the analysis pipeline above to sample frames.</span>
            </div>
          )}
        </div>

        {/* Candidate Events Review Controls */}
        <div className="bg-[#FFFCF7] border border-[#D9CBBB] rounded-2xl p-6 shadow-[0_1px_3px_rgba(68,49,38,0.05)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E8DED0]">
            <div>
              <h2 className="text-lg font-bold text-[#342A23] flex items-center gap-2">
                <Eye className="w-5 h-5 text-[#B78035]" />
                Candidate Detections ({events.length})
              </h2>
              <p className="text-xs text-[#796C60]">Automated CV motion triggers requiring judicial affirmation</p>
            </div>
            <Link to="/events" className="text-xs font-semibold text-[#8B684D] hover:underline flex items-center gap-1">
              Full Desk <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {events.length === 0 ? (
              <div className="p-12 text-center bg-[#EFE5D8]/40 border border-[#D9CBBB] rounded-xl text-sm text-[#796C60]">
                No candidate events detected yet in this clip.
              </div>
            ) : (
              events.map((evt) => (
                <div
                  key={evt.id}
                  className="p-4 rounded-xl bg-[#F5F0E8] border border-[#D9CBBB] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#342A23] text-sm">{evt.event_category}</span>
                      <StatusBadge status={evt.investigator_review_status} size="sm" />
                      <span className="font-mono text-[#604735] font-bold">+{evt.formatted_time}</span>
                    </div>
                    <p className="text-[#796C60]">{evt.review_notes}</p>
                    <span className="text-[11px] text-[#9A8C7D] font-mono block">
                      Detector: {evt.model_name}
                      {evt.model_confidence ? ` • Conf: ${(evt.model_confidence * 100).toFixed(0)}%` : ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleReviewEvent(evt.id, 'Confirmed')}
                      className="px-2.5 py-1.5 rounded-lg bg-[#EAF2EC] hover:bg-[#BCD5C3] border border-[#BCD5C3] text-[#47765B] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                      title="Confirm candidate finding"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Confirm
                    </button>
                    <button
                      onClick={() => handleReviewEvent(evt.id, 'Rejected')}
                      className="px-2.5 py-1.5 rounded-lg bg-[#F8EBEA] hover:bg-[#E3BFBC] border border-[#E3BFBC] text-[#A64B43] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                      title="Reject candidate finding"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Processing Pipeline History Table */}
      <div className="bg-[#FFFCF7] border border-[#D9CBBB] rounded-2xl p-6 shadow-[0_1px_3px_rgba(68,49,38,0.05)]">
        <div className="flex items-center justify-between pb-3 border-b border-[#E8DED0] mb-4">
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-[#604735]" />
            <h2 className="text-lg font-bold text-[#342A23]">Processing Job Telemetry & Execution Log</h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="forensic-table">
            <thead>
              <tr>
                <th>Job Identifier</th>
                <th>Target Evidence</th>
                <th>Task Type</th>
                <th>Progress</th>
                <th>Status</th>
                <th className="text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8DED0]">
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#9A8C7D] text-sm">
                    No processing jobs recorded for this evidence item.
                  </td>
                </tr>
              ) : (
                jobs.map((j) => (
                  <tr key={j.id} className="hover:bg-[#F5F0E8]/70 transition-colors">
                    <td className="font-mono font-bold text-[#443126] text-xs whitespace-nowrap">
                      {j.id}
                    </td>
                    <td className="font-mono text-xs text-[#604735] whitespace-nowrap">
                      {j.evidence_id}
                    </td>
                    <td className="text-xs font-semibold text-[#342A23] whitespace-nowrap">
                      {j.job_type.replace(/_/g, ' ')}
                    </td>
                    <td className="w-32">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-[#E8DED0] h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-[#604735] h-full"
                            style={{ width: `${j.progress}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] font-bold text-[#796C60]">
                          {j.progress}%
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap">
                      <StatusBadge status={j.status} size="sm" />
                    </td>
                    <td className="font-mono text-xs text-[#796C60] text-right whitespace-nowrap">
                      {new Date(j.created_at).toLocaleString()}
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
