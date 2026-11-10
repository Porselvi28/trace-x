import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, Info, ShieldCheck, RefreshCw, Cpu, Layers } from 'lucide-react';
import { api } from '../services/api';
import { Evidence } from '../types';
import { useNotification } from '../contexts/NotificationContext';

export const AuthenticityAnalysis: React.FC = () => {
  const { notify } = useNotification();
  const [modelStatus, setModelStatus] = useState<any | null>(null);
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [selectedEvidenceId, setSelectedEvidenceId] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any | null>(null);

  useEffect(() => {
    api.getAuthenticityStatus().then(setModelStatus).catch(console.error);
    api.listEvidence().then((evs) => {
      setEvidenceList(evs);
      if (evs.length > 0) setSelectedEvidenceId(evs[0].id);
    }).catch(console.error);
  }, []);

  const handleRunScan = async () => {
    if (!selectedEvidenceId) return;
    setScanning(true);
    setScanResult(null);
    try {
      const res = await api.scanAuthenticity(selectedEvidenceId);
      setScanResult(res);
      notify('info', 'Authenticity Query Dispatched', 'Modular interface evaluated neural model configuration.');
    } catch (err: any) {
      notify('error', 'Execution Error', err.response?.data?.detail || 'Scan interface error');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="space-y-7 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-[#FFFCF7] border border-[#D9CBBB] p-6 lg:p-7 rounded-2xl shadow-[0_1px_3px_rgba(68,49,38,0.05)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert className="w-4 h-4 text-[#B78035]" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#796C60]">
              Modular Synthetic Media Analysis
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#342A23]">
            AI Video Authenticity & Manipulation Interface
          </h1>
          <p className="text-[15px] text-[#796C60] mt-1 max-w-2xl leading-relaxed">
            Pluggable deepfake detection, synthetic generation analysis, and temporal compression artifact inspection interface
          </p>
        </div>
      </div>

      {/* Forensic Standard Admissibility Warning */}
      <div className="p-5 rounded-2xl bg-[#FBF5EA] border border-[#B78035]/60 text-sm flex items-start gap-3.5 shadow-2xs">
        <Info className="w-5 h-5 text-[#B78035] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-[#342A23] block text-sm">
            Forensic Rule Regarding Video Authenticity:
          </span>
          <p className="text-[#534335] leading-relaxed text-xs sm:text-sm">
            An ordinary cryptographic SHA-256 hash guarantees that a file matches its acquired bitstream, but
            <strong> cannot</strong> detect whether the captured content was synthetically generated or deepfake manipulated
            prior to acquisition. Deep learning manipulation classifiers require rigorous benchmark calibration. TRACE X
            strictly refuses to fabricate synthetic conclusions without validated neural model weights.
          </p>
        </div>
      </div>

      {/* Model Specification Card */}
      {modelStatus && (
        <div className="bg-[#FFFCF7] border border-[#D9CBBB] rounded-2xl p-6 lg:p-7 shadow-[0_1px_3px_rgba(68,49,38,0.05)] space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E8DED0]">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#796C60] font-mono">
                Integration Engine Specification
              </span>
              <h2 className="text-lg font-bold text-[#342A23] mt-0.5">{modelStatus.model_name}</h2>
              <span className="text-xs font-mono text-[#604735]">Architecture Version: {modelStatus.model_version}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#796C60] uppercase font-mono">Status:</span>
              <span className="px-3 py-1 rounded-md bg-[#FBF5EA] border border-[#B78035] text-[#B78035] text-xs font-mono font-bold">
                MODEL UNCONFIGURED
              </span>
            </div>
          </div>

          <div className="p-4 bg-[#EFE5D8] rounded-xl border border-[#D9CBBB] text-xs font-mono text-[#B78035] flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 text-[#B78035]" />
            <span className="font-semibold">{modelStatus.status_message}</span>
          </div>

          <div className="pt-2">
            <span className="text-xs font-bold text-[#796C60] block mb-3 uppercase tracking-wider font-mono">
              Supported Forensic Inspection Interfaces:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              {modelStatus.supported_inspections?.map((insp: string, i: number) => (
                <div key={i} className="p-3.5 rounded-xl bg-[#F5F0E8] border border-[#D9CBBB] text-[#342A23] flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-[#604735]" />
                  <span className="font-sans font-medium">{insp}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Scan Execution Card */}
      <div className="bg-[#FFFCF7] border border-[#D9CBBB] rounded-2xl p-6 lg:p-7 shadow-[0_1px_3px_rgba(68,49,38,0.05)] space-y-5">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#342A23] mb-2.5 font-mono">
            Target Evidence File for Authenticity Query
          </label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <select
              value={selectedEvidenceId}
              onChange={(e) => setSelectedEvidenceId(e.target.value)}
              className="flex-1 bg-[#F5F0E8] border border-[#D9CBBB] rounded-xl px-3.5 h-11 text-sm text-[#342A23] focus:outline-none focus:border-[#8B684D] font-mono cursor-pointer"
            >
              {evidenceList.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.id} — {e.original_filename} ({e.source_device})
                </option>
              ))}
            </select>

            <button
              onClick={handleRunScan}
              disabled={scanning || !selectedEvidenceId}
              className="btn-primary h-11 px-6 shrink-0 justify-center font-bold"
            >
              <Cpu className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
              <span>{scanning ? 'Querying Engine...' : 'Run Authenticity Query'}</span>
            </button>
          </div>
        </div>

        {/* Scan Result */}
        {scanResult && (
          <div className="p-5 rounded-2xl bg-[#FBF5EA] border border-[#B78035] space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#B78035]/30">
              <span className="font-bold text-[#B78035] text-sm">
                AUTHENTICITY SCAN OUTCOME
              </span>
              <span className="text-[#796C60] font-mono">
                {new Date(scanResult.analyzed_at).toLocaleTimeString()}
              </span>
            </div>

            <div className="p-3 bg-[#FFFCF7] rounded-xl border border-[#D9CBBB] text-[#342A23]">
              <div>Target File: <strong>{scanResult.evidence_id}</strong></div>
              <div>Model: <strong>{scanResult.model_name}</strong></div>
              <div>Status: <strong className="text-[#B78035]">{scanResult.authenticity_status}</strong></div>
            </div>

            <p className="text-xs text-[#534335] font-sans leading-relaxed italic">
              {scanResult.notes}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
