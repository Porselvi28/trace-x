import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, RefreshCw, Info, CheckCircle2, Copy, Check } from 'lucide-react';
import { api } from '../services/api';
import { Evidence, VerificationResult } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { HashDisplay } from '../components/common/HashDisplay';
import { useNotification } from '../contexts/NotificationContext';

export const IntegrityVerification: React.FC = () => {
  const { notify } = useNotification();
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    fetchEvidence();
  }, []);

  const handleVerify = async (targetId: string) => {
    if (!targetId) return;
    setVerifying(true);
    setResult(null);
    try {
      const res = await api.verifyIntegrity(targetId);
      setResult(res);
      if (res.verification_status === 'HASH MATCH') {
        notify('success', 'Bitwise Hash Match', 'Recorded SHA-256 hash mathematically matches current storage bytes.');
      } else {
        notify('error', 'Hash Mismatch Detected', 'Discrepancy identified between recorded benchmark and current bytes!');
      }
      fetchEvidence();
    } catch (err: any) {
      notify('error', 'Verification Failed', err.response?.data?.detail || 'Execution error during streaming calculation');
    } finally {
      setVerifying(false);
    }
  };

  const selectedEvidence = evidenceList.find((e) => e.id === selectedId);

  return (
    <div className="space-y-7 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-[#FFFCF7] border border-[#D9CBBB] p-6 lg:p-7 rounded-2xl shadow-[0_1px_3px_rgba(68,49,38,0.05)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-4 h-4 text-[#47765B]" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#796C60]">
              Cryptographic Integrity Engine
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#342A23]">
            Cryptographic Integrity Verification Desk
          </h1>
          <p className="text-[15px] text-[#796C60] mt-1 max-w-2xl leading-relaxed">
            Real-time streaming recalculation of 256-bit cryptographic digests against initial acquisition reference benchmarks
          </p>
        </div>
      </div>

      {/* Forensic Standard Admissibility Notice */}
      <div className="p-5 rounded-2xl bg-[#EFE5D8] border border-[#D9CBBB] text-sm flex items-start gap-3.5 shadow-2xs">
        <Info className="w-5 h-5 text-[#604735] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-[#342A23] block text-sm">
            ISO/IEC 27037 Digital Evidence Admissibility Standard:
          </span>
          <p className="text-[#534335] leading-relaxed text-xs sm:text-sm">
            A matching SHA-256 hash mathematically proves bitwise parity with the stored reference file. It establishes
            that the media has not suffered storage bit-rot, intentional filesystem modification, or accidental corruption
            since ingestion. It does <em>not</em> independently prove camera sensor authenticity prior to ingestion or
            rule out deepfake synthesis.
          </p>
        </div>
      </div>

      {/* Verification Selection Card */}
      <div className="bg-[#FFFCF7] border border-[#D9CBBB] rounded-2xl p-6 lg:p-7 shadow-[0_1px_3px_rgba(68,49,38,0.05)] space-y-6">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#342A23] mb-2.5 font-mono">
            Select Evidence Media File for Dynamic Verification
          </label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <select
              value={selectedId}
              onChange={(e) => {
                setSelectedId(e.target.value);
                setResult(null);
              }}
              className="flex-1 bg-[#F5F0E8] border border-[#D9CBBB] rounded-xl px-3.5 h-11 text-sm text-[#342A23] focus:outline-none focus:border-[#8B684D] font-mono cursor-pointer"
            >
              {evidenceList.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.id} — {e.original_filename} ({e.source_device})
                </option>
              ))}
            </select>

            <button
              onClick={() => handleVerify(selectedId)}
              disabled={verifying || !selectedId}
              className="btn-primary h-11 px-6 shrink-0 justify-center font-bold"
            >
              <RefreshCw className={`w-4 h-4 ${verifying ? 'animate-spin' : ''}`} />
              <span>{verifying ? 'Streaming & Recalculating...' : 'Recalculate & Verify'}</span>
            </button>
          </div>
        </div>

        {/* Selected Evidence Overview Panel */}
        {selectedEvidence && (
          <div className="p-5 rounded-xl bg-[#F5F0E8] border border-[#D9CBBB] space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#D9CBBB]">
              <div>
                <span className="text-xs text-[#796C60] font-mono uppercase block font-semibold">Active Target Evidence</span>
                <span className="text-base font-bold text-[#342A23]">{selectedEvidence.original_filename}</span>
                <span className="text-xs text-[#796C60] block mt-0.5">
                  Camera: <strong className="text-[#342A23]">{selectedEvidence.source_device}</strong> • Ingested by:{' '}
                  {selectedEvidence.uploaded_by}
                </span>
              </div>
              <StatusBadge status={selectedEvidence.status} />
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-bold text-[#796C60] uppercase tracking-wider block font-mono">
                Initial Recorded Reference SHA-256 Digest:
              </span>
              <div className="p-3 bg-[#FFFCF7] border border-[#D9CBBB] rounded-xl font-mono text-xs text-[#443126] font-semibold break-all select-all flex items-center justify-between gap-2 shadow-2xs">
                <span>{selectedEvidence.sha256_hash}</span>
                <span className="text-[11px] font-bold text-[#47765B] px-2 py-0.5 rounded bg-[#EAF2EC] shrink-0">
                  BENCHMARK
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Verification Result Banner */}
        {result && (
          <div
            className={`p-6 rounded-2xl border space-y-4 animate-in fade-in zoom-in-95 duration-150 ${
              result.verification_status === 'HASH MATCH'
                ? 'bg-[#EAF2EC] border-[#47765B] text-[#47765B]'
                : 'bg-[#F8EBEA] border-[#A64B43] text-[#A64B43]'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-current/20">
              <div className="flex items-center gap-3">
                {result.verification_status === 'HASH MATCH' ? (
                  <div className="w-10 h-10 rounded-xl bg-[#47765B] text-[#FFFCF7] flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-[#A64B43] text-[#FFFCF7] flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                )}
                <div>
                  <h2 className="text-lg font-bold leading-tight">
                    VERIFICATION OUTCOME: {result.verification_status}
                  </h2>
                  <span className="text-xs text-[#534335] font-mono block mt-0.5">
                    Completed at: {new Date(result.verified_at).toLocaleString()}
                  </span>
                </div>
              </div>

              <span
                className={`px-3 py-1 rounded-md text-xs font-mono font-bold border ${
                  result.verification_status === 'HASH MATCH'
                    ? 'bg-[#FFFCF7] text-[#47765B] border-[#BCD5C3]'
                    : 'bg-[#FFFCF7] text-[#A64B43] border-[#E3BFBC]'
                }`}
              >
                {result.verification_status === 'HASH MATCH' ? 'BITWISE EQUALITY CONFIRMED' : 'BIT-ROT / TAMPER DETECTED'}
              </span>
            </div>

            {/* Comparison Hash Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-3 bg-[#FFFCF7] rounded-xl border border-current/20 text-[#342A23] space-y-1">
                <span className="text-[#796C60] font-sans font-bold uppercase text-[11px] block">
                  Reference SHA-256 Benchmark:
                </span>
                <span className="break-all font-semibold block select-all">{result.recorded_hash}</span>
              </div>
              <div className="p-3 bg-[#FFFCF7] rounded-xl border border-current/20 text-[#342A23] space-y-1">
                <span className="text-[#796C60] font-sans font-bold uppercase text-[11px] block">
                  Dynamic Recalculated SHA-256:
                </span>
                <span className="break-all font-semibold block select-all">{result.current_hash}</span>
              </div>
            </div>

            <p className="text-xs text-[#534335] font-sans italic pt-1 leading-relaxed">
              {result.forensic_disclaimer}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
