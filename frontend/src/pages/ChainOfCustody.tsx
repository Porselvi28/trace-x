import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GitCommit, Filter, Search, Info, RefreshCw, Shield, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { ChainOfCustody as CustodyRecord } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';

export const ChainOfCustody: React.FC = () => {
  const [records, setRecords] = useState<CustodyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterAction, setFilterAction] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'timeline'>('table');

  const fetchCustody = async (force = false) => {
    if (force) setRefreshing(true);
    try {
      const data = await api.listAllCustody(100, force);
      setRecords(data);
    } catch (err) {
      console.error('Failed to fetch custody records:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCustody();
  }, []);

  const filteredRecords = records.filter((r) => {
    if (filterAction !== 'All' && r.action_type !== filterAction) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        r.id.toLowerCase().includes(q) ||
        r.evidence_id.toLowerCase().includes(q) ||
        (r.case_id && r.case_id.toLowerCase().includes(q)) ||
        r.actor.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q)
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
            <GitCommit className="w-4 h-4 text-[#604735]" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#796C60]">
              Tamper-Evident Forensic Audit Ledger
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#342A23]">
            Chain of Custody Forensic Ledger
          </h1>
          <p className="text-[15px] text-[#796C60] mt-1 max-w-2xl leading-relaxed">
            Immutable, append-only chronological custody records verifying digital evidence handling, hash calculations, and courtroom admissibility
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <div className="bg-[#EFE5D8] border border-[#D9CBBB] rounded-xl p-1 flex items-center">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-[#604735] text-[#FFFCF7] shadow-2xs'
                  : 'text-[#796C60] hover:text-[#342A23]'
              }`}
            >
              Structured Table
            </button>
            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'timeline'
                  ? 'bg-[#604735] text-[#FFFCF7] shadow-2xs'
                  : 'text-[#796C60] hover:text-[#342A23]'
              }`}
            >
              Chronological Timeline
            </button>
          </div>

          <button
            type="button"
            onClick={() => fetchCustody(true)}
            disabled={refreshing}
            className="btn-secondary"
            title="Refresh custody transactions"
          >
            <RefreshCw className={`w-4 h-4 text-[#796C60] ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Forensic Legal Disclosure Alert */}
      <div className="p-5 rounded-2xl bg-[#EFE5D8] border border-[#D9CBBB] text-sm flex items-start gap-3.5 shadow-2xs">
        <Info className="w-5 h-5 text-[#604735] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-[#342A23] block text-sm">
            Evidentiary Standard & Custody Audit Disclosure:
          </span>
          <p className="text-[#534335] leading-relaxed text-xs sm:text-sm">
            This chain of custody ledger is an append-only sequential record tracking all file uploads, SHA-256 verifications,
            optical motion analyses, investigator classifications, and exports. In accordance with digital forensics guidelines,
            operational audit logs maintain strict procedural integrity and support physical intake forms for judicial proceedings.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-[#FFFCF7] border border-[#D9CBBB] rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-[0_1px_3px_rgba(68,49,38,0.05)]">
        <div className="flex-1 w-full relative">
          <Search className="w-4 h-4 text-[#9A8C7D] absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search custody entries by record ID, target evidence, actor, or case..."
            className="w-full form-input pl-10 pr-3.5 h-10 text-sm bg-[#F5F0E8] focus:bg-[#FFFCF7]"
          />
        </div>

        <div className="flex items-center gap-2.5 text-sm text-[#796C60] shrink-0">
          <Filter className="w-4 h-4 text-[#8B684D]" />
          <span className="font-semibold text-xs text-[#342A23] uppercase tracking-wider">Action:</span>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="bg-[#F5F0E8] border border-[#D9CBBB] rounded-xl px-3 h-10 text-sm text-[#342A23] focus:outline-none focus:border-[#8B684D] font-medium cursor-pointer"
          >
            <option value="All">All Actions</option>
            <option value="EVIDENCE_UPLOADED">Evidence Uploaded</option>
            <option value="HASH_CALCULATED">Hash Calculated</option>
            <option value="INTEGRITY_VERIFIED">Integrity Verified</option>
            <option value="PREPROCESSING_STARTED">Preprocessing Started</option>
            <option value="ANALYSIS_COMPLETED">Analysis Completed</option>
            <option value="EVIDENCE_EXPORTED">Evidence Exported</option>
          </select>
        </div>
      </div>

      {/* View Mode: Structured Table */}
      {viewMode === 'table' ? (
        <div className="bg-[#FFFCF7] border border-[#D9CBBB] rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(68,49,38,0.05)]">
          <div className="overflow-x-auto">
            <table className="forensic-table">
              <thead>
                <tr>
                  <th>Record ID</th>
                  <th>UTC Timestamp</th>
                  <th>Action Type</th>
                  <th>Actor / Investigator</th>
                  <th>Target Evidence</th>
                  <th>Associated Case</th>
                  <th>Description & Operational Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8DED0]">
                {loading && records.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#796C60] text-sm">
                      Loading chain of custody ledger...
                    </td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#9A8C7D] text-sm">
                      No custody records match the search filter.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-[#F5F0E8]/70 transition-colors">
                      <td className="font-mono font-bold text-[#443126] text-xs whitespace-nowrap">
                        <span className="bg-[#EFE5D8] px-2 py-0.5 rounded border border-[#D9CBBB]">
                          {r.id}
                        </span>
                      </td>
                      <td className="text-[#796C60] font-mono text-xs whitespace-nowrap">
                        {new Date(r.timestamp).toLocaleString()}
                      </td>
                      <td className="whitespace-nowrap">
                        <StatusBadge status={r.action_type.replace(/_/g, ' ')} size="sm" />
                      </td>
                      <td className="font-semibold text-sm text-[#342A23] whitespace-nowrap">
                        {r.actor}
                      </td>
                      <td className="font-mono text-xs text-[#604735] whitespace-nowrap">
                        <Link to={`/evidence/${r.evidence_id}`} className="hover:underline">
                          {r.evidence_id}
                        </Link>
                      </td>
                      <td className="font-mono text-xs text-[#604735] whitespace-nowrap">
                        {r.case_id ? (
                          <Link to={`/cases/${r.case_id}`} className="hover:underline">
                            {r.case_id}
                          </Link>
                        ) : (
                          <span className="text-[#9A8C7D] italic">Unassigned</span>
                        )}
                      </td>
                      <td className="text-xs text-[#534335] max-w-md">
                        {r.description}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-3 border-t border-[#E8DED0] bg-[#FFFCF7] flex items-center justify-between text-xs text-[#796C60]">
            <span>Showing {filteredRecords.length} of {records.length} ledger entries</span>
            <span className="font-mono font-medium">Cryptographic sequence preserved</span>
          </div>
        </div>
      ) : (
        /* View Mode: Vertical Forensic Timeline */
        <div className="bg-[#FFFCF7] border border-[#D9CBBB] rounded-2xl p-6 lg:p-8 shadow-[0_1px_3px_rgba(68,49,38,0.05)]">
          <div className="relative pl-6 sm:pl-8 border-l-2 border-[#D9CBBB] space-y-6">
            {filteredRecords.map((r) => (
              <div key={r.id} className="relative group">
                <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-4 h-4 rounded-full bg-[#604735] border-4 border-[#FFFCF7] shadow-xs" />
                <div className="p-4 rounded-xl bg-[#F5F0E8] border border-[#D9CBBB] space-y-2">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={r.action_type.replace(/_/g, ' ')} size="sm" />
                      <span className="font-mono font-bold text-xs text-[#443126]">{r.id}</span>
                    </div>
                    <span className="text-xs font-mono text-[#796C60]">
                      {new Date(r.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-[#342A23]">{r.description}</p>
                  <div className="flex items-center gap-4 text-xs text-[#796C60] pt-1 border-t border-[#D9CBBB]/60 font-mono">
                    <span>Officer: <strong className="text-[#342A23]">{r.actor}</strong></span>
                    <span>Target: <strong className="text-[#604735]">{r.evidence_id}</strong></span>
                    {r.case_id && <span>Case: <strong>{r.case_id}</strong></span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
