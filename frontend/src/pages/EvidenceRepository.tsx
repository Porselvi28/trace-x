import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileVideo, Upload, Search, Filter, ArrowRight, ShieldCheck, RefreshCw, Download } from 'lucide-react';
import { api } from '../services/api';
import { Evidence } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { HashDisplay } from '../components/common/HashDisplay';

export const EvidenceRepository: React.FC = () => {
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchEvidence = async (force = false) => {
    if (force) setRefreshing(true);
    try {
      const data = await api.listEvidence(
        {
          search: search || undefined,
          status: statusFilter,
        },
        force
      );
      setEvidence(data);
    } catch (err) {
      console.error('Failed to list evidence:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEvidence();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEvidence(true);
  };

  const filteredEvidence = evidence.filter((ev) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        ev.id.toLowerCase().includes(q) ||
        ev.original_filename.toLowerCase().includes(q) ||
        ev.source_device.toLowerCase().includes(q) ||
        ev.source_vendor.toLowerCase().includes(q) ||
        (ev.case_id && ev.case_id.toLowerCase().includes(q)) ||
        (ev.sha256_hash && ev.sha256_hash.toLowerCase().includes(q))
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
            <FileVideo className="w-4 h-4 text-[#604735]" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#796C60]">
              Cryptographic Ingestion Storage
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#342A23]">
            Digital Evidence Repository
          </h1>
          <p className="text-[15px] text-[#796C60] mt-1 max-w-2xl leading-relaxed">
            Cryptographically sealed CCTV video files, DVR extractions, and authenticated bitwise metadata records
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => fetchEvidence(true)}
            disabled={refreshing}
            className="btn-secondary"
            title="Refresh evidence list"
          >
            <RefreshCw className={`w-4 h-4 text-[#796C60] ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <Link to="/evidence/upload" className="btn-primary">
            <Upload className="w-4 h-4 text-[#FFFCF7]" />
            <span>Ingest Video Evidence</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#FFFCF7] border border-[#D9CBBB] rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-[0_1px_3px_rgba(68,49,38,0.05)]">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full relative">
          <Search className="w-4 h-4 text-[#9A8C7D] absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by evidence ID, original filename, source camera, vendor, or SHA-256..."
            className="w-full form-input pl-10 pr-3.5 h-10 text-sm bg-[#F5F0E8] focus:bg-[#FFFCF7]"
          />
        </form>

        <div className="flex items-center gap-2.5 text-sm text-[#796C60]">
          <Filter className="w-4 h-4 text-[#8B684D]" />
          <span className="font-semibold text-xs text-[#342A23] uppercase tracking-wider">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#F5F0E8] border border-[#D9CBBB] rounded-xl px-3 h-10 text-sm text-[#342A23] focus:outline-none focus:border-[#8B684D] font-medium cursor-pointer"
          >
            <option value="All">All Ingestion States</option>
            <option value="Uploaded">Uploaded</option>
            <option value="Preprocessing">Preprocessing</option>
            <option value="Processed">Processed</option>
            <option value="Processing Failed">Processing Failed</option>
          </select>
        </div>
      </div>

      {/* Structured Evidence Table */}
      <div className="bg-[#FFFCF7] border border-[#D9CBBB] rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(68,49,38,0.05)]">
        <div className="overflow-x-auto">
          <table className="forensic-table">
            <thead>
              <tr>
                <th>Evidence ID</th>
                <th>File & Source Device</th>
                <th>Case Association</th>
                <th>SHA-256 Digest</th>
                <th>Specifications</th>
                <th>Ingestion Date</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8DED0]">
              {loading && evidence.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#796C60] text-sm">
                    Loading digital evidence repository...
                  </td>
                </tr>
              ) : filteredEvidence.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#9A8C7D] text-sm">
                    No evidence items match the search criteria. Click "Ingest Video Evidence" above.
                  </td>
                </tr>
              ) : (
                filteredEvidence.map((ev) => (
                  <tr key={ev.id} className="hover:bg-[#F5F0E8]/70 transition-colors">
                    <td className="font-mono font-bold text-[#443126] text-sm whitespace-nowrap">
                      <Link to={`/evidence/${ev.id}`} className="hover:underline flex items-center gap-1.5">
                        <FileVideo className="w-3.5 h-3.5 text-[#8B684D]" />
                        <span>{ev.id}</span>
                      </Link>
                    </td>
                    <td className="max-w-xs">
                      <Link
                        to={`/evidence/${ev.id}`}
                        className="font-bold text-[#342A23] hover:text-[#604735] block truncate text-sm"
                      >
                        {ev.original_filename}
                      </Link>
                      <div className="text-xs text-[#796C60] truncate flex items-center gap-1.5 mt-0.5">
                        <span className="font-semibold text-[#443126]">{ev.source_device}</span>
                        <span>•</span>
                        <span>{ev.source_vendor}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap">
                      {ev.case_id ? (
                        <Link
                          to={`/cases/${ev.case_id}`}
                          className="font-mono text-xs font-semibold text-[#604735] hover:underline bg-[#EFE5D8] px-2 py-0.5 rounded border border-[#D9CBBB]"
                        >
                          {ev.case_id}
                        </Link>
                      ) : (
                        <span className="text-xs text-[#9A8C7D] italic">Unassigned</span>
                      )}
                    </td>
                    <td>
                      <HashDisplay hash={ev.sha256_hash} short={true} />
                    </td>
                    <td className="text-xs text-[#534335] whitespace-nowrap font-mono">
                      {ev.width > 0 ? (
                        <span>
                          {ev.width}×{ev.height} • {ev.fps}fps
                        </span>
                      ) : (
                        <span className="text-[#9A8C7D] italic">Not decoded</span>
                      )}
                      <div className="text-[11px] text-[#796C60]">
                        {(ev.file_size / (1024 * 1024)).toFixed(2)} MB
                      </div>
                    </td>
                    <td className="font-mono text-xs text-[#796C60] whitespace-nowrap">
                      {new Date(ev.created_at).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap">
                      <StatusBadge status={ev.status} size="sm" />
                    </td>
                    <td className="text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <a
                          href={api.getDownloadUrl(ev.id)}
                          className="p-1.5 rounded-lg text-[#796C60] hover:text-[#342A23] hover:bg-[#EFE5D8] transition-colors"
                          title="Download evidence binary"
                          aria-label="Download"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        <Link
                          to={`/evidence/${ev.id}`}
                          className="btn-secondary py-1 px-3 text-xs font-semibold"
                        >
                          Inspect <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info bar */}
        <div className="px-6 py-3 border-t border-[#E8DED0] bg-[#FFFCF7] flex items-center justify-between text-xs text-[#796C60]">
          <span>Showing {filteredEvidence.length} of {evidence.length} evidence items</span>
          <span className="font-mono font-medium">Streaming SHA-256 validation ready</span>
        </div>
      </div>
    </div>
  );
};
