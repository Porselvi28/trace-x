import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Shield,
  Database,
  Cpu,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  UserCircle,
  FileCheck,
  Server,
  Layers,
  Lock
} from 'lucide-react';
import { api } from '../services/api';
import { SystemStatus } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const Settings: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getSystemStatus().then(setStatus).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-7 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-[#FFFCF7] border border-[#D9CBBB] p-6 lg:p-7 rounded-2xl shadow-[0_1px_3px_rgba(68,49,38,0.05)]">
        <div className="flex items-center gap-2 mb-1">
          <SettingsIcon className="w-4 h-4 text-[#604735]" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#796C60]">
            System Diagnostics & Workstation Parameters
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#342A23]">
          Forensic Diagnostics & System Configuration
        </h1>
        <p className="text-[15px] text-[#796C60] mt-1 max-w-2xl leading-relaxed">
          Forensic workstation runtime status, hardware tool availability, security parameters, and active session configuration
        </p>
      </div>

      {/* SECTION 1: Active Officer Profile */}
      <div className="bg-[#FFFCF7] border border-[#D9CBBB] rounded-2xl p-6 lg:p-7 shadow-[0_1px_3px_rgba(68,49,38,0.05)] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E8DED0]">
          <span className="text-xs font-bold uppercase tracking-wider text-[#796C60] font-mono">
            Active Investigator Session
          </span>
          <span className="text-xs font-mono text-[#47765B] bg-[#EAF2EC] px-2.5 py-0.5 rounded-md font-bold border border-[#BCD5C3]">
            AUTHENTICATED
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#EFE5D8] border border-[#D9CBBB] flex items-center justify-center text-[#604735] shadow-xs">
              <UserCircle className="w-9 h-9" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#342A23]">{user?.full_name || 'Active Investigator'}</h2>
              <div className="flex items-center gap-2 text-xs text-[#796C60] mt-1 flex-wrap font-mono">
                <span className="text-[#342A23] font-semibold">@{user?.username}</span>
                <span>•</span>
                <span className="text-[#604735] font-bold bg-[#EFE5D8] px-2 py-0.5 rounded border border-[#D9CBBB]">
                  {user?.role}
                </span>
                <span>•</span>
                <span>Badge: {user?.badge_number || 'TRX-DEFAULT'}</span>
              </div>
              <span className="text-xs text-[#796C60] mt-1 block font-medium">{user?.agency}</span>
            </div>
          </div>

          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="btn-danger shrink-0"
          >
            <LogOut className="w-4 h-4" />
            <span>Terminate Active Session</span>
          </button>
        </div>
      </div>

      {/* SECTION 2: Subsystem Health Decomposition */}
      {status && (
        <div className="bg-[#FFFCF7] border border-[#D9CBBB] rounded-2xl p-6 lg:p-7 shadow-[0_1px_3px_rgba(68,49,38,0.05)] space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#E8DED0]">
            <span className="text-xs font-bold uppercase tracking-wider text-[#796C60] font-mono">
              Forensic Workstation Sub-Systems
            </span>
            <span className="font-mono text-xs text-[#796C60]">Platform v{status.app_version}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            {/* API Status */}
            <div className="p-4 bg-[#F5F0E8] rounded-xl border border-[#D9CBBB] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Server className="w-5 h-5 text-[#604735]" />
                <div>
                  <span className="text-[#342A23] font-sans font-bold text-sm block">FastAPI REST Core</span>
                  <span className="text-[#796C60] text-[11px]">Python 3.12 + Uvicorn</span>
                </div>
              </div>
              <span className="text-[#47765B] font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> OPERATIONAL
              </span>
            </div>

            {/* Database Status */}
            <div className="p-4 bg-[#F5F0E8] rounded-xl border border-[#D9CBBB] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-[#604735]" />
                <div>
                  <span className="text-[#342A23] font-sans font-bold text-sm block">SQLite Ledger Database</span>
                  <span className="text-[#796C60] text-[11px]">SQLAlchemy Schema Engine</span>
                </div>
              </div>
              <span className={`font-bold flex items-center gap-1.5 ${status.database_connected ? 'text-[#47765B]' : 'text-[#A64B43]'}`}>
                {status.database_connected ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                {status.database_connected ? 'CONNECTED' : 'DISCONNECTED'}
              </span>
            </div>

            {/* OpenCV Computer Vision */}
            <div className="p-4 bg-[#F5F0E8] rounded-xl border border-[#D9CBBB] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Cpu className="w-5 h-5 text-[#604735]" />
                <div>
                  <span className="text-[#342A23] font-sans font-bold text-sm block">OpenCV Computer Vision</span>
                  <span className="text-[#796C60] text-[11px]">Build v{status.opencv_version}</span>
                </div>
              </div>
              <span className="text-[#47765B] font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> BOUND & READY
              </span>
            </div>

            {/* Storage Writable */}
            <div className="p-4 bg-[#F5F0E8] rounded-xl border border-[#D9CBBB] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <HardDrive className="w-5 h-5 text-[#604735]" />
                <div>
                  <span className="text-[#342A23] font-sans font-bold text-sm block">Forensic Storage Directory</span>
                  <span className="text-[#796C60] text-[11px]">Read/Write Evidence Isolation</span>
                </div>
              </div>
              <span className="text-[#47765B] font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> SECURED
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: Security & Cryptographic Standards */}
      <div className="bg-[#FFFCF7] border border-[#D9CBBB] rounded-2xl p-6 lg:p-7 shadow-[0_1px_3px_rgba(68,49,38,0.05)] space-y-4">
        <div className="pb-3 border-b border-[#E8DED0]">
          <h2 className="text-lg font-bold text-[#342A23] flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#604735]" />
            Cryptographic Integrity & Admissibility Framework
          </h2>
          <p className="text-xs text-[#796C60] mt-0.5">
            Standards implemented for judicial digital evidence admissibility
          </p>
        </div>

        <div className="space-y-3 text-xs text-[#534335] leading-relaxed">
          <div className="p-3.5 rounded-xl bg-[#F5F0E8] border border-[#D9CBBB]">
            <strong className="text-[#342A23] font-sans block mb-0.5">SHA-256 Bitwise Streaming Parity</strong>
            Streams 64KB chunks directly from uploaded media files to calculate cryptographic hashes without keeping raw video bytes in memory.
          </div>
          <div className="p-3.5 rounded-xl bg-[#F5F0E8] border border-[#D9CBBB]">
            <strong className="text-[#342A23] font-sans block mb-0.5">Append-Only Sequential Ledger</strong>
            Every evidentiary operation records actor username, UTC ISO timestamp, action type, target file identifier, and previous transaction reference.
          </div>
          <div className="p-3.5 rounded-xl bg-[#F5F0E8] border border-[#D9CBBB]">
            <strong className="text-[#342A23] font-sans block mb-0.5">Path Traversal Prevention</strong>
            Uploaded files are stored using internal UUID v4 identifiers; original filenames are preserved in metadata only, preventing directory traversal.
          </div>
        </div>
      </div>
    </div>
  );
};
