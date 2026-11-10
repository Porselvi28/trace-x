import React, { useState, useEffect } from 'react';
import { Eye, CheckCircle2, XCircle, Filter, Search, Camera, MessageSquare, ShieldCheck, X, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { DetectedEvent } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { useNotification } from '../contexts/NotificationContext';

export const EventReview: React.FC = () => {
  const { notify } = useNotification();
  const [events, setEvents] = useState<DetectedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');

  // Review Note Modal State
  const [reviewingEvent, setReviewingEvent] = useState<DetectedEvent | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewAction, setReviewAction] = useState<'Confirmed' | 'Rejected'>('Confirmed');

  const fetchEvents = async (force = false) => {
    if (force) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await api.listEvents(
        {
          category: categoryFilter,
          review_status: statusFilter,
        },
        force
      );
      setEvents(data);
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [categoryFilter, statusFilter]);

  const openReviewModal = (evt: DetectedEvent, action: 'Confirmed' | 'Rejected') => {
    setReviewingEvent(evt);
    setReviewAction(action);
    setReviewNotes(evt.review_notes || '');
  };

  const handleConfirmReview = async () => {
    if (!reviewingEvent) return;
    try {
      await api.reviewEvent(reviewingEvent.id, {
        investigator_review_status: reviewAction,
        review_notes: reviewNotes,
      });
      notify('success', 'Finding Recorded', `Event ${reviewingEvent.id} affirmed as ${reviewAction}.`);
      setReviewingEvent(null);
      fetchEvents(true);
    } catch (err: any) {
      notify('error', 'Review Failed', err.response?.data?.detail || 'Execution error');
    }
  };

  const filteredEvents = events.filter((e) => {
    if (search) {
      const q = search.toLowerCase();
      return (
        e.id.toLowerCase().includes(q) ||
        e.event_category.toLowerCase().includes(q) ||
        e.evidence_id.toLowerCase().includes(q) ||
        (e.source_device && e.source_device.toLowerCase().includes(q)) ||
        (e.review_notes && e.review_notes.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-7">
      {/* Header Banner */}
      <div className="bg-[#FFFCF7] border border-[#D9CBBB] p-6 lg:p-7 rounded-2xl shadow-[0_1px_3px_rgba(68,49,38,0.05)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Eye className="w-4 h-4 text-[#B78035]" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#796C60]">
              Forensic Motion & Anomaly Review Desk
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#342A23]">
            Investigator Anomaly Review Desk
          </h1>
          <p className="text-[15px] text-[#796C60] mt-1 max-w-2xl leading-relaxed">
            Evaluate computer vision candidate intervals, corroborate timestamps, and record official judicial findings
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchEvents(true)}
          disabled={refreshing}
          className="btn-secondary shrink-0"
          title="Refresh detected events"
        >
          <RefreshCw className={`w-4 h-4 text-[#796C60] ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Forensic Distinction Notice */}
      <div className="p-5 rounded-2xl bg-[#EFE5D8] border border-[#D9CBBB] text-sm flex items-start gap-3.5 shadow-2xs">
        <ShieldCheck className="w-5 h-5 text-[#604735] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-[#342A23] block text-sm">
            Forensic Standard of Admissibility:
          </span>
          <p className="text-[#534335] leading-relaxed text-xs sm:text-sm">
            All automated computer vision detections are strictly designated as <strong>Candidates</strong> until formally
            affirmed by an authorized forensic investigator. Only investigator-confirmed findings are cited in official
            court-ready PDF briefs.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-[#FFFCF7] border border-[#D9CBBB] rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-[0_1px_3px_rgba(68,49,38,0.05)]">
        <div className="flex-1 w-full relative">
          <Search className="w-4 h-4 text-[#9A8C7D] absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search candidate events by ID, category, camera, or notes..."
            className="w-full form-input pl-10 pr-3.5 h-10 text-sm bg-[#F5F0E8] focus:bg-[#FFFCF7]"
          />
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto text-sm font-medium flex-wrap">
          <div className="flex items-center gap-2 text-[#796C60]">
            <Filter className="w-4 h-4 text-[#8B684D]" />
            <span className="font-semibold text-xs text-[#342A23] uppercase tracking-wider">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-[#F5F0E8] border border-[#D9CBBB] rounded-xl px-3 h-10 text-sm text-[#342A23] focus:outline-none focus:border-[#8B684D] font-medium cursor-pointer"
            >
              <option value="All">All Categories</option>
              <option value="Intrusion">Intrusion</option>
              <option value="Loitering">Loitering</option>
              <option value="Abandoned object">Abandoned object</option>
              <option value="Fight or physical altercation">Fight / Altercation</option>
              <option value="Accident">Accident</option>
              <option value="Suspicious activity">Suspicious activity</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-[#796C60]">
            <span className="font-semibold text-xs text-[#342A23] uppercase tracking-wider">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#F5F0E8] border border-[#D9CBBB] rounded-xl px-3 h-10 text-sm text-[#342A23] focus:outline-none focus:border-[#8B684D] font-medium cursor-pointer"
            >
              <option value="All">All Reviews</option>
              <option value="Pending Review">Pending Review</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Events Cards / Table Grid */}
      <div className="space-y-4">
        {loading && events.length === 0 ? (
          <div className="bg-[#FFFCF7] border border-[#D9CBBB] rounded-2xl p-12 text-center text-[#796C60] text-sm">
            Loading candidate anomaly events...
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="bg-[#FFFCF7] border border-[#D9CBBB] rounded-2xl p-12 text-center text-[#9A8C7D] text-sm">
            No candidate events match the current filter criteria.
          </div>
        ) : (
          filteredEvents.map((evt) => (
            <div
              key={evt.id}
              className="bg-[#FFFCF7] border border-[#D9CBBB] rounded-2xl p-5 sm:p-6 shadow-[0_1px_3px_rgba(68,49,38,0.05)] flex flex-col md:flex-row items-start md:items-center justify-between gap-5 transition-all hover:border-[#8B684D]"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {/* Frame Thumbnail if available */}
                {evt.frame_reference ? (
                  <div className="w-24 h-20 rounded-xl overflow-hidden border border-[#D9CBBB] bg-[#EFE5D8] shrink-0 shadow-2xs">
                    <img
                      src={evt.frame_reference}
                      alt={evt.formatted_time}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-[#EFE5D8] border border-[#D9CBBB] flex items-center justify-center text-[#9A8C7D] shrink-0">
                    <Camera className="w-6 h-6" />
                  </div>
                )}

                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-xs font-bold text-[#443126] bg-[#EFE5D8] px-2.5 py-0.5 rounded border border-[#D9CBBB]">
                      {evt.id}
                    </span>
                    <span className="font-bold text-base text-[#342A23]">{evt.event_category}</span>
                    <StatusBadge status={evt.investigator_review_status} size="sm" />
                    <span className="font-mono text-xs font-bold text-[#604735] bg-[#EAF2EC] px-2 py-0.5 rounded border border-[#BCD5C3]">
                      Offset: +{evt.formatted_time}
                    </span>
                  </div>

                  <p className="text-sm text-[#534335] leading-relaxed max-w-2xl">
                    {evt.review_notes || 'Pending investigator review notes.'}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-[#796C60] pt-1 flex-wrap font-mono">
                    <span>Evidence: <strong>{evt.evidence_id}</strong></span>
                    <span>Camera: <strong>{evt.source_device || 'Unknown'}</strong></span>
                    <span>Detector: <strong>{evt.model_name}</strong></span>
                    {evt.model_confidence ? <span>Conf: <strong>{(evt.model_confidence * 100).toFixed(0)}%</strong></span> : null}
                  </div>
                </div>
              </div>

              {/* Review Controls */}
              <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                <button
                  onClick={() => openReviewModal(evt, 'Confirmed')}
                  className="px-3.5 py-2 rounded-xl bg-[#EAF2EC] hover:bg-[#BCD5C3] border border-[#BCD5C3] text-[#47765B] text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" /> Confirm Finding
                </button>
                <button
                  onClick={() => openReviewModal(evt, 'Rejected')}
                  className="px-3.5 py-2 rounded-xl bg-[#F8EBEA] hover:bg-[#E3BFBC] border border-[#E3BFBC] text-[#A64B43] text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <XCircle className="w-4 h-4" /> Reject Finding
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Review Modal */}
      {reviewingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#342A23]/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-[#FFFCF7] border border-[#D9CBBB] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8DED0]">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#604735]" />
                <h3 className="text-base font-bold text-[#342A23]">
                  Record Judicial Review Finding: {reviewAction.toUpperCase()}
                </h3>
              </div>
              <button
                onClick={() => setReviewingEvent(null)}
                className="p-1 rounded-lg hover:bg-[#EFE5D8] text-[#796C60] hover:text-[#342A23]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs font-mono text-[#796C60] bg-[#F5F0E8] p-3 rounded-xl border border-[#D9CBBB]">
              <div>Target Event: <strong className="text-[#342A23]">{reviewingEvent.id}</strong></div>
              <div>Category: <strong className="text-[#342A23]">{reviewingEvent.event_category}</strong> (+{reviewingEvent.formatted_time})</div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#342A23] mb-2 font-mono">
                Investigator Finding Notes & Justification *
              </label>
              <textarea
                rows={3}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Detail observations, corroborated camera angles, or grounds for confirmation/rejection..."
                className="w-full form-input resize-y text-sm"
              />
            </div>

            <div className="pt-3 border-t border-[#E8DED0] flex items-center justify-end gap-3">
              <button
                onClick={() => setReviewingEvent(null)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReview}
                className={reviewAction === 'Confirmed' ? 'btn-primary' : 'btn-danger'}
              >
                {reviewAction === 'Confirmed' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                <span>Affirm {reviewAction}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
