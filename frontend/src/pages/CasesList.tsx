import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Plus, Search, Filter, ArrowRight, Shield, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { Case } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';

export const CasesList: React.FC = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');

  const fetchCases = async (force = false) => {
    if (force) setRefreshing(true);
    try {
      const data = await api.listCases(
        {
          search: search || undefined,
          status: statusFilter,
          priority: priorityFilter,
        },
        force
      );
      setCases(data);
    } catch (err) {
      console.error('Failed to fetch cases:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [statusFilter, priorityFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCases(true);
  };

  const filteredCases = cases.filter((c) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        c.id.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.investigator_name.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q))
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
            <Briefcase className="w-4 h-4 text-[#604735]" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#796C60]">
              Case Dossier Repository
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#342A23]">
            Investigation Cases
          </h1>
          <p className="text-[15px] text-[#796C60] mt-1 max-w-2xl leading-relaxed">
            Authorized multi-source surveillance investigation dossiers, evidence attachments, and judicial finding records
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => fetchCases(true)}
            disabled={refreshing}
            className="btn-secondary"
            title="Refresh cases list"
          >
            <RefreshCw className={`w-4 h-4 text-[#796C60] ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <Link to="/cases/new" className="btn-primary">
            <Plus className="w-4 h-4 text-[#FFFCF7]" />
            <span>New Investigation Case</span>
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
            placeholder="Search by case identifier, title, category, or investigator..."
            className="w-full form-input pl-10 pr-3.5 h-10 text-sm bg-[#F5F0E8] focus:bg-[#FFFCF7]"
          />
        </form>

        <div className="flex items-center gap-4 w-full md:w-auto text-sm font-medium flex-wrap">
          <div className="flex items-center gap-2 text-[#796C60]">
            <Filter className="w-4 h-4 text-[#8B684D]" />
            <span className="font-semibold text-xs text-[#342A23] uppercase tracking-wider">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#F5F0E8] border border-[#D9CBBB] rounded-xl px-3 h-10 text-sm text-[#342A23] focus:outline-none focus:border-[#8B684D] font-medium cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Under Review">Under Review</option>
              <option value="Archived">Archived</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-[#796C60]">
            <span className="font-semibold text-xs text-[#342A23] uppercase tracking-wider">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-[#F5F0E8] border border-[#D9CBBB] rounded-xl px-3 h-10 text-sm text-[#342A23] focus:outline-none focus:border-[#8B684D] font-medium cursor-pointer"
            >
              <option value="All">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Structured Cases Table */}
      <div className="bg-[#FFFCF7] border border-[#D9CBBB] rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(68,49,38,0.05)]">
        <div className="overflow-x-auto">
          <table className="forensic-table">
            <thead>
              <tr>
                <th>Case Identifier</th>
                <th>Title & Focus Scope</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th className="text-center">Evidence Feeds</th>
                <th className="text-center">Candidate Events</th>
                <th>Lead Investigator</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8DED0]">
              {loading && cases.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#796C60] text-sm">
                    Loading investigation cases catalog...
                  </td>
                </tr>
              ) : filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#9A8C7D] text-sm">
                    No investigation cases match the active filter criteria. Click "New Investigation Case" to create one.
                  </td>
                </tr>
              ) : (
                filteredCases.map((c) => (
                  <tr key={c.id} className="hover:bg-[#F5F0E8]/70 transition-colors">
                    <td className="font-mono font-bold text-[#443126] text-sm whitespace-nowrap">
                      <Link to={`/cases/${c.id}`} className="hover:underline flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-[#8B684D]" />
                        <span>{c.id}</span>
                      </Link>
                    </td>
                    <td className="max-w-xs">
                      <Link
                        to={`/cases/${c.id}`}
                        className="font-semibold text-[#342A23] hover:text-[#604735] block truncate text-sm"
                      >
                        {c.title}
                      </Link>
                      <p className="text-xs text-[#796C60] truncate mt-0.5">
                        {c.description || 'No description recorded.'}
                      </p>
                    </td>
                    <td className="text-[#604735] font-semibold text-xs uppercase tracking-wider whitespace-nowrap">
                      {c.category}
                    </td>
                    <td className="whitespace-nowrap">
                      <StatusBadge status={c.priority} size="sm" />
                    </td>
                    <td className="whitespace-nowrap">
                      <StatusBadge status={c.status} size="sm" />
                    </td>
                    <td className="text-center font-mono font-bold text-sm text-[#443126]">
                      {c.evidence_count || 0}
                    </td>
                    <td className="text-center font-mono font-bold text-sm text-[#8B684D]">
                      {c.events_count || 0}
                    </td>
                    <td className="text-[#342A23] font-medium text-sm whitespace-nowrap">
                      {c.investigator_name}
                    </td>
                    <td className="text-right whitespace-nowrap">
                      <Link
                        to={`/cases/${c.id}`}
                        className="btn-secondary py-1 px-3 text-xs font-semibold"
                      >
                        Open Dossier <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info bar */}
        <div className="px-6 py-3 border-t border-[#E8DED0] bg-[#FFFCF7] flex items-center justify-between text-xs text-[#796C60]">
          <span>Showing {filteredCases.length} of {cases.length} investigation cases</span>
          <span className="font-mono font-medium">Chain of custody enabled</span>
        </div>
      </div>
    </div>
  );
};
