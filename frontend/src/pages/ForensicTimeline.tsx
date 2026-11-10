import React, { useState, useEffect } from 'react';
import { Clock, Filter, ArrowRight, ShieldCheck, FileVideo, Eye, RefreshCw, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Case } from '../types';

export const ForensicTimeline: React.FC = () => {
  const [timelineItems, setTimelineItems] = useState<any[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCase, setSelectedCase] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    api.listCases().then(setCases).catch(console.error);
  }, []);

  const fetchTimeline = async (force = false) => {
    if (force) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await api.getTimeline(
        {
          case_id: selectedCase || undefined,
          category: categoryFilter,
        },
        force
      );
      setTimelineItems(data);
    } catch (err) {
      console.error('Failed to load timeline:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, [selectedCase, categoryFilter]);

  const getTimeTypeBadge = (timeType: string) => {
    switch (timeType) {
      case 'MEDIA_EVENT_OFFSET':
        return (
          <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-[#EFE5D8] text-[#604735] border border-[#D9CBBB] font-bold">
            MEDIA OFFSET
          </span>
        );
      case 'INGESTION_TIMESTAMP':
        return (
          <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-[#EAF2EC] text-[#47765B] border border-[#BCD5C3] font-bold">
            FILE INGESTION
          </span>
        );
      case 'SYSTEM_AUDIT_TIME':
        return (
          <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-[#EFF4F8] text-[#647D91] border border-[#C8D7E2] font-bold">
            AUDIT TRANSACTION
          </span>
        );
      default:
        return (
          <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-[#EFE5D8] text-[#796C60]">
            SYSTEM TIME
          </span>
        );
    }
  };

  return (
    <div className="space-y-7 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-[#FFFCF7] border border-[#D9CBBB] p-6 lg:p-7 rounded-2xl shadow-[0_1px_3px_rgba(68,49,38,0.05)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-[#604735]" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#796C60]">
              Chronological Evidence Sequence
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#342A23]">
            Forensic Unified Timeline
          </h1>
          <p className="text-[15px] text-[#796C60] mt-1 max-w-2xl leading-relaxed">
            Chronological forensic reconstruction synchronizing file acquisitions, integrity checks, and candidate anomaly detections
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchTimeline(true)}
          disabled={refreshing}
          className="btn-secondary shrink-0"
          title="Refresh timeline reconstruction"
        >
          <RefreshCw className={`w-4 h-4 text-[#796C60] ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-[#FFFCF7] border border-[#D9CBBB] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_1px_3px_rgba(68,49,38,0.05)]">
        <div className="flex items-center gap-2.5 text-sm text-[#796C60] w-full sm:w-auto">
          <span className="font-semibold text-xs text-[#342A23] uppercase tracking-wider font-mono">
            Target Investigation:
          </span>
          <select
            value={selectedCase}
            onChange={(e) => setSelectedCase(e.target.value)}
            className="flex-1 sm:flex-none bg-[#F5F0E8] border border-[#D9CBBB] rounded-xl px-3.5 h-10 text-sm text-[#342A23] focus:outline-none focus:border-[#8B684D] font-medium cursor-pointer"
          >
            <option value="">All Active Cases</option>
            {cases.map((c) => (
              <option key={c.id} value={c.id}>
                {c.id} — {c.title}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2.5 text-sm text-[#796C60] w-full sm:w-auto">
          <Filter className="w-4 h-4 text-[#8B684D]" />
          <span className="font-semibold text-xs text-[#342A23] uppercase tracking-wider font-mono">
            Category:
          </span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[#F5F0E8] border border-[#D9CBBB] rounded-xl px-3.5 h-10 text-sm text-[#342A23] focus:outline-none focus:border-[#8B684D] font-medium cursor-pointer"
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
      </div>

      {/* Chronological Vertical Timeline View */}
      <div className="bg-[#FFFCF7] border border-[#D9CBBB] rounded-2xl p-6 lg:p-8 shadow-[0_1px_3px_rgba(68,49,38,0.05)]">
        {loading && timelineItems.length === 0 ? (
          <div className="py-12 text-center text-[#796C60] text-sm">
            Reconstructing unified forensic timeline...
          </div>
        ) : timelineItems.length === 0 ? (
          <div className="py-12 text-center text-[#9A8C7D] text-sm">
            No events or evidence found for the selected timeline criteria.
          </div>
        ) : (
          <div className="relative pl-6 sm:pl-8 border-l-2 border-[#D9CBBB] space-y-7">
            {timelineItems.map((item, idx) => (
              <div key={idx} className="relative group">
                <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-4 h-4 rounded-full bg-[#604735] border-4 border-[#FFFCF7] shadow-xs group-hover:scale-110 transition-transform" />
                <div className="p-5 rounded-2xl bg-[#F5F0E8] border border-[#D9CBBB] space-y-2.5 transition-all hover:border-[#8B684D]">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      {getTimeTypeBadge(item.time_type)}
                      <span className="font-bold text-sm text-[#342A23]">{item.title}</span>
                    </div>
                    <span className="font-mono text-xs text-[#796C60] bg-[#FFFCF7] px-2 py-0.5 rounded border border-[#D9CBBB]">
                      {new Date(item.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-sm text-[#534335] leading-relaxed">{item.description}</p>

                  <div className="flex items-center gap-4 text-xs text-[#796C60] pt-2 border-t border-[#D9CBBB]/60 font-mono flex-wrap">
                    <span>Source: <strong className="text-[#342A23]">{item.source_device || 'System'}</strong></span>
                    {item.evidence_id && (
                      <span>
                        Target:{' '}
                        <Link to={`/evidence/${item.evidence_id}`} className="text-[#604735] font-bold hover:underline">
                          {item.evidence_id}
                        </Link>
                      </span>
                    )}
                    {item.case_id && <span>Case: <strong>{item.case_id}</strong></span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
