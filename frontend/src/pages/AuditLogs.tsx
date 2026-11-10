import React, { useState, useEffect } from 'react';
import { History, Search, Filter, RefreshCw, Shield } from 'lucide-react';
import { api } from '../services/api';
import { AuditLog } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [outcomeFilter, setOutcomeFilter] = useState('All');
  const [resourceFilter, setResourceFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const fetchLogs = async (force = false) => {
    if (force) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await api.getAuditLogs(
        {
          outcome: outcomeFilter !== 'All' ? outcomeFilter : undefined,
          resource_type: resourceFilter !== 'All' ? resourceFilter : undefined,
          limit: 100
        },
        force
      );
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [outcomeFilter, resourceFilter]);

  const filtered = logs.filter((l) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      l.action.toLowerCase().includes(q) ||
      l.actor.toLowerCase().includes(q) ||
      (l.resource_id && l.resource_id.toLowerCase().includes(q)) ||
      (l.details && l.details.toLowerCase().includes(q))
    );
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedLogs = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-7">
      {/* Header Banner */}
      <div className="bg-[#FFFCF7] border border-[#D9CBBB] p-6 lg:p-7 rounded-2xl shadow-[0_1px_3px_rgba(68,49,38,0.05)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <History className="w-4 h-4 text-[#604735]" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#796C60]">
              Immutable Forensic Security Telemetry
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#342A23]">
            System Security & Forensic Audit Logs
          </h1>
          <p className="text-[15px] text-[#796C60] mt-1 max-w-2xl leading-relaxed">
            Immutable operational telemetry recording investigator authentication, evidence ingestions, verification outcomes, and administrative access
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchLogs(true)}
          disabled={refreshing}
          className="btn-secondary shrink-0"
          title="Refresh audit trail"
        >
          <RefreshCw className={`w-4 h-4 text-[#796C60] ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#FFFCF7] border border-[#D9CBBB] rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-[0_1px_3px_rgba(68,49,38,0.05)]">
        <div className="flex-1 w-full relative">
          <Search className="w-4 h-4 text-[#9A8C7D] absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search audit trail by actor, action, resource, or details..."
            className="w-full form-input pl-10 pr-3.5 h-10 text-sm bg-[#F5F0E8] focus:bg-[#FFFCF7]"
          />
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto text-sm text-[#796C60] flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#8B684D]" />
            <span className="font-semibold text-xs text-[#342A23] uppercase tracking-wider font-mono">
              Outcome:
            </span>
            <select
              value={outcomeFilter}
              onChange={(e) => {
                setOutcomeFilter(e.target.value);
                setPage(1);
              }}
              className="bg-[#F5F0E8] border border-[#D9CBBB] rounded-xl px-3 h-10 text-sm text-[#342A23] focus:outline-none focus:border-[#8B684D] font-medium cursor-pointer"
            >
              <option value="All">All Outcomes</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="WARNING">WARNING</option>
              <option value="FAILURE">FAILURE</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-xs text-[#342A23] uppercase tracking-wider font-mono">
              Resource:
            </span>
            <select
              value={resourceFilter}
              onChange={(e) => {
                setResourceFilter(e.target.value);
                setPage(1);
              }}
              className="bg-[#F5F0E8] border border-[#D9CBBB] rounded-xl px-3 h-10 text-sm text-[#342A23] focus:outline-none focus:border-[#8B684D] font-medium cursor-pointer"
            >
              <option value="All">All Resources</option>
              <option value="USER">USER</option>
              <option value="CASE">CASE</option>
              <option value="EVIDENCE">EVIDENCE</option>
              <option value="PROCESSING_JOB">PROCESSING_JOB</option>
              <option value="DETECTED_EVENT">DETECTED_EVENT</option>
              <option value="REPORT">REPORT</option>
            </select>
          </div>
        </div>
      </div>

      {/* Structured Audit Table */}
      <div className="bg-[#FFFCF7] border border-[#D9CBBB] rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(68,49,38,0.05)]">
        <div className="overflow-x-auto">
          <table className="forensic-table">
            <thead>
              <tr>
                <th>Log ID</th>
                <th>UTC Timestamp</th>
                <th>Actor / Officer</th>
                <th>Operational Action</th>
                <th>Resource Target</th>
                <th>Outcome</th>
                <th>Telemetry Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8DED0]">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#796C60] text-sm">
                    Querying immutable audit log storage...
                  </td>
                </tr>
              ) : paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#9A8C7D] text-sm">
                    No audit records match the selected filter.
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((l) => (
                  <tr key={l.id} className="hover:bg-[#F5F0E8]/70 transition-colors">
                    <td className="font-mono font-bold text-[#443126] text-xs whitespace-nowrap">
                      #{l.id}
                    </td>
                    <td className="font-mono text-xs text-[#796C60] whitespace-nowrap">
                      {new Date(l.timestamp).toLocaleString()}
                    </td>
                    <td className="font-semibold text-sm text-[#342A23] whitespace-nowrap">
                      {l.actor}
                    </td>
                    <td className="font-mono text-xs font-bold text-[#604735] whitespace-nowrap">
                      {l.action}
                    </td>
                    <td className="font-mono text-xs text-[#796C60] whitespace-nowrap">
                      <span className="bg-[#EFE5D8] px-2 py-0.5 rounded border border-[#D9CBBB]">
                        {l.resource_type}: {l.resource_id || 'system'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap">
                      <StatusBadge status={l.outcome} size="sm" />
                    </td>
                    <td className="text-xs text-[#534335] max-w-sm truncate">
                      {l.details || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Summary Footer */}
        <div className="px-6 py-3.5 border-t border-[#E8DED0] bg-[#FFFCF7] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#796C60]">
          <span>
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length} audit entries
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary py-1 px-3 text-xs disabled:opacity-40"
            >
              Previous
            </button>
            <span className="font-mono font-bold text-[#342A23]">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-secondary py-1 px-3 text-xs disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
