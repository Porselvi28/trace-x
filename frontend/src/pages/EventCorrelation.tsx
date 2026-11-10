import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Network, Info, RefreshCw, Clock, ArrowRight, ShieldCheck, Camera } from 'lucide-react';
import { api } from '../services/api';
import { Case } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';

export const EventCorrelation: React.FC = () => {
  const { caseId: paramCaseId } = useParams<{ caseId?: string }>();
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState(paramCaseId || '');
  const [correlationData, setCorrelationData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [windowSeconds, setWindowSeconds] = useState(120);

  useEffect(() => {
    api.listCases().then((cList) => {
      setCases(cList);
      if (cList.length > 0 && !selectedCaseId) {
        setSelectedCaseId(cList[0].id);
      }
    }).catch(console.error);
  }, []);

  const fetchCorrelation = async (cId: string, winSec: number, force = false) => {
    if (!cId) return;
    if (force) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await api.getCorrelation(cId, winSec);
      setCorrelationData(data);
    } catch (err) {
      console.error('Error fetching correlation:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (selectedCaseId) {
      fetchCorrelation(selectedCaseId, windowSeconds);
    }
  }, [selectedCaseId, windowSeconds]);

  return (
    <div className="space-y-7 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-[#FFFCF7] border border-[#D9CBBB] p-6 lg:p-7 rounded-2xl shadow-[0_1px_3px_rgba(68,49,38,0.05)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Network className="w-4 h-4 text-[#604735]" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#796C60]">
              Multi-Feed Temporal Proximity Correlation
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#342A23]">
            Multi-Camera Event Correlation Engine
          </h1>
          <p className="text-[15px] text-[#796C60] mt-1 max-w-2xl leading-relaxed">
            Cluster and corroborate candidate activity intervals across independent DVR channels and physical camera positions
          </p>
        </div>

        <button
          type="button"
          onClick={() => selectedCaseId && fetchCorrelation(selectedCaseId, windowSeconds, true)}
          disabled={refreshing}
          className="btn-secondary shrink-0"
          title="Recalculate clusters"
        >
          <RefreshCw className={`w-4 h-4 text-[#796C60] ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Forensic Notice & Disclaimer Alert */}
      <div className="p-5 rounded-2xl bg-[#EFE5D8] border border-[#D9CBBB] text-sm flex items-start gap-3.5 shadow-2xs">
        <Info className="w-5 h-5 text-[#604735] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-[#342A23] block text-sm">
            Digital Forensics Clock Synchronization Protocol:
          </span>
          <p className="text-[#534335] leading-relaxed text-xs sm:text-sm">
            Independent CCTV recorders rarely share synchronized NTP network time servers. TRACE X groups temporal
            clusters based on relative video offsets and recorded base times. <strong>Forensic Rule:</strong> Temporal
            proximity does not automatically establish causal correlation. Physical scene layout and clock offsets must
            be corroborated prior to judicial testimony.
          </p>
        </div>
      </div>

      {/* Control Card */}
      <div className="bg-[#FFFCF7] border border-[#D9CBBB] rounded-2xl p-5 shadow-[0_1px_3px_rgba(68,49,38,0.05)] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="text-xs font-bold uppercase text-[#342A23] font-mono whitespace-nowrap">
            Target Case:
          </label>
          <select
            value={selectedCaseId}
            onChange={(e) => setSelectedCaseId(e.target.value)}
            className="flex-1 sm:flex-none bg-[#F5F0E8] border border-[#D9CBBB] rounded-xl px-3.5 h-10 text-sm text-[#342A23] focus:outline-none focus:border-[#8B684D] font-medium cursor-pointer"
          >
            {cases.map((c) => (
              <option key={c.id} value={c.id}>
                {c.id} — {c.title}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="text-xs font-bold uppercase text-[#342A23] font-mono whitespace-nowrap">
            Proximity Window:
          </label>
          <select
            value={windowSeconds}
            onChange={(e) => setWindowSeconds(Number(e.target.value))}
            className="bg-[#F5F0E8] border border-[#D9CBBB] rounded-xl px-3.5 h-10 text-sm text-[#342A23] focus:outline-none focus:border-[#8B684D] font-medium cursor-pointer"
          >
            <option value={30}>± 30 Seconds (Tight Proximity)</option>
            <option value={60}>± 60 Seconds (1 Minute)</option>
            <option value={120}>± 120 Seconds (2 Minutes)</option>
            <option value={300}>± 300 Seconds (5 Minutes)</option>
          </select>
        </div>
      </div>

      {/* Correlation Clusters View */}
      {loading && !correlationData ? (
        <div className="bg-[#FFFCF7] border border-[#D9CBBB] rounded-2xl p-12 text-center text-[#796C60] text-sm">
          Clustering multi-camera candidate events...
        </div>
      ) : correlationData && correlationData.clusters ? (
        <div className="space-y-5">
          <div className="flex items-center justify-between px-2 text-xs font-mono text-[#796C60]">
            <span>Active Clusters Found: {correlationData.clusters.length}</span>
            <span>Tolerance Window: ±{windowSeconds}s</span>
          </div>

          {correlationData.clusters.length === 0 ? (
            <div className="bg-[#FFFCF7] border border-[#D9CBBB] rounded-2xl p-12 text-center text-[#9A8C7D] text-sm">
              No overlapping multi-camera candidate event clusters detected within the ±{windowSeconds}s window.
            </div>
          ) : (
            correlationData.clusters.map((cluster: any, idx: number) => (
              <div
                key={idx}
                className="bg-[#FFFCF7] border border-[#D9CBBB] rounded-2xl p-6 shadow-[0_1px_3px_rgba(68,49,38,0.05)] space-y-4"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-[#E8DED0]">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold bg-[#EFE5D8] px-2.5 py-0.5 rounded border border-[#D9CBBB] text-[#443126]">
                      Cluster #{idx + 1}
                    </span>
                    <span className="font-bold text-sm text-[#342A23]">
                      {cluster.events?.length || 0} Correlated Feeds
                    </span>
                  </div>
                  <span className="text-xs font-mono text-[#604735] bg-[#EAF2EC] px-2.5 py-0.5 rounded border border-[#BCD5C3] font-semibold">
                    Temporal Span: ±{cluster.time_span_seconds || 0}s
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {cluster.events?.map((ev: any, eIdx: number) => (
                    <div
                      key={eIdx}
                      className="p-4 rounded-xl bg-[#F5F0E8] border border-[#D9CBBB] space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#342A23] text-sm">{ev.event_category}</span>
                        <span className="font-mono text-[#604735] font-bold">+{ev.formatted_time}</span>
                      </div>
                      <p className="text-[#534335]">{ev.review_notes || 'Candidate motion detected.'}</p>
                      <div className="flex items-center justify-between text-[11px] text-[#796C60] font-mono pt-1 border-t border-[#D9CBBB]/60">
                        <span>Camera: <strong className="text-[#342A23]">{ev.source_device}</strong></span>
                        <Link to={`/evidence/${ev.evidence_id}`} className="text-[#604735] hover:underline font-bold">
                          {ev.evidence_id}
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
};
