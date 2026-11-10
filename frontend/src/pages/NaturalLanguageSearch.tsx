import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Sparkles, Filter, FileVideo, Eye, ArrowRight, Tag, Shield, Calendar, Clock } from 'lucide-react';
import { api } from '../services/api';
import { SearchResult } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { HashDisplay } from '../components/common/HashDisplay';

export const NaturalLanguageSearch: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQ = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQ);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [searching, setSearching] = useState(false);

  const sampleQueries = [
    'Show candidate intrusion events',
    'Find events with suspicious activity',
    'Show evidence associated with Case 2026',
    'Find events detected with loitering',
    'Show evidence that failed hash verification'
  ];

  const executeSearch = async (queryString: string) => {
    if (!queryString.trim()) return;
    setSearching(true);
    try {
      const data = await api.search(queryString);
      setResult(data);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    if (initialQ) {
      executeSearch(initialQ);
    }
  }, [initialQ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ q: query });
    executeSearch(query);
  };

  const handleSelectSample = (sample: string) => {
    setQuery(sample);
    setSearchParams({ q: sample });
    executeSearch(sample);
  };

  return (
    <div className="space-y-7 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-[#FFFCF7] border border-[#D9CBBB] p-6 lg:p-7 rounded-2xl shadow-[0_1px_3px_rgba(68,49,38,0.05)]">
        <div className="flex items-center gap-2 mb-1">
          <Search className="w-4 h-4 text-[#604735]" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#796C60]">
            Semantic Query Parser & Correlator
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#342A23]">
          Natural-Language Forensic Evidence Search
        </h1>
        <p className="text-[15px] text-[#796C60] mt-1 max-w-2xl leading-relaxed">
          Query multi-camera surveillance archives, candidate events, integrity statuses, and temporal intervals using plain English queries
        </p>
      </div>

      {/* Query Bar Card */}
      <div className="bg-[#FFFCF7] border border-[#D9CBBB] rounded-2xl p-6 shadow-[0_1px_3px_rgba(68,49,38,0.05)] space-y-4">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-[#9A8C7D] absolute left-4 top-3.5 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. 'Show candidate intrusion events' or 'Find evidence associated with Case 2026'..."
              className="w-full bg-[#F5F0E8] border border-[#D9CBBB] rounded-xl pl-12 pr-4 h-12 text-sm sm:text-base text-[#342A23] placeholder-[#9A8C7D] focus:outline-none focus:border-[#8B684D] focus:bg-[#FFFCF7] transition-all font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={searching}
            className="btn-primary h-12 px-6 justify-center shrink-0 font-bold"
          >
            {searching ? 'Parsing Query...' : 'Execute Search'}
          </button>
        </form>

        {/* Suggestion Chips */}
        <div className="space-y-2 pt-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#796C60] flex items-center gap-1.5 font-mono">
            <Sparkles className="w-3.5 h-3.5 text-[#8B684D]" /> Suggested Investigation Queries:
          </span>
          <div className="flex flex-wrap gap-2">
            {sampleQueries.map((sample) => (
              <button
                key={sample}
                type="button"
                onClick={() => handleSelectSample(sample)}
                className="text-xs px-3 py-1.5 rounded-xl bg-[#F5F0E8] hover:bg-[#EFE5D8] border border-[#D9CBBB] text-[#342A23] transition-all cursor-pointer font-medium hover:border-[#8B684D]"
              >
                {sample}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Structured Query Breakdown */}
      {result && (
        <div className="bg-[#EFE5D8] border border-[#D9CBBB] rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#D9CBBB]">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#604735]" />
              <span className="font-bold text-xs uppercase tracking-wider text-[#342A23] font-mono">
                Query Semantic Decomposition & Filters Applied
              </span>
            </div>
            <span className="font-mono text-xs text-[#796C60]">
              Matched {result.evidence_matches?.length || 0} Evidence • {result.event_matches?.length || 0} Events
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-[#FFFCF7] border border-[#D9CBBB]">
              <span className="text-[#796C60] block mb-0.5 font-sans font-semibold">Event Categories:</span>
              <span className="font-bold text-[#443126]">
                {result.matched_criteria?.parsed_filters?.categories?.join(', ') || 'All Categories'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#FFFCF7] border border-[#D9CBBB]">
              <span className="text-[#796C60] block mb-0.5 font-sans font-semibold">Integrity Status:</span>
              <span className="font-bold text-[#443126]">
                {result.matched_criteria?.parsed_filters?.verification_status || 'Any Status'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#FFFCF7] border border-[#D9CBBB]">
              <span className="text-[#796C60] block mb-0.5 font-sans font-semibold">Case Pattern:</span>
              <span className="font-bold text-[#443126]">
                {result.matched_criteria?.parsed_filters?.case_id_pattern || 'All Cases'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#FFFCF7] border border-[#D9CBBB]">
              <span className="text-[#796C60] block mb-0.5 font-sans font-semibold">Time Window:</span>
              <span className="font-bold text-[#443126]">
                {result.matched_criteria?.parsed_filters?.time_range
                  ? JSON.stringify(result.matched_criteria.parsed_filters.time_range)
                  : 'Unrestricted'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Search Results Display */}
      {result && (
        <div className="space-y-6">
          {/* Matched Evidence */}
          <div className="bg-[#FFFCF7] border border-[#D9CBBB] rounded-2xl p-6 shadow-[0_1px_3px_rgba(68,49,38,0.05)] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8DED0]">
              <h2 className="text-lg font-bold text-[#342A23] flex items-center gap-2">
                <FileVideo className="w-5 h-5 text-[#604735]" />
                Matched Surveillance Evidence ({result.evidence_matches?.length || 0})
              </h2>
            </div>

            {(!result.evidence_matches || result.evidence_matches.length === 0) ? (
              <p className="text-xs text-[#796C60] py-4 text-center">No evidence files matched the parsed query.</p>
            ) : (
              <div className="divide-y divide-[#E8DED0]">
                {result.evidence_matches.map((ev) => (
                  <div key={ev.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Link to={`/evidence/${ev.id}`} className="font-bold text-sm text-[#342A23] hover:text-[#604735]">
                          {ev.original_filename}
                        </Link>
                        <StatusBadge status={ev.status} size="sm" />
                      </div>
                      <div className="text-xs text-[#796C60] flex items-center gap-3 font-mono">
                        <span>ID: {ev.id}</span>
                        <span>Camera: {ev.source_device}</span>
                        {ev.case_id && <span>Case: {ev.case_id}</span>}
                      </div>
                    </div>
                    <Link to={`/evidence/${ev.id}`} className="btn-secondary py-1 px-3 text-xs font-semibold">
                      Inspect <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Matched Candidate Events */}
          <div className="bg-[#FFFCF7] border border-[#D9CBBB] rounded-2xl p-6 shadow-[0_1px_3px_rgba(68,49,38,0.05)] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8DED0]">
              <h2 className="text-lg font-bold text-[#342A23] flex items-center gap-2">
                <Eye className="w-5 h-5 text-[#B78035]" />
                Matched Anomaly Events ({result.event_matches?.length || 0})
              </h2>
            </div>

            {(!result.event_matches || result.event_matches.length === 0) ? (
              <p className="text-xs text-[#796C60] py-4 text-center">No candidate events matched the parsed query.</p>
            ) : (
              <div className="space-y-3">
                {result.event_matches.map((evt) => (
                  <div key={evt.id} className="p-4 rounded-xl bg-[#F5F0E8] border border-[#D9CBBB] flex items-center justify-between gap-4">
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#443126]">{evt.id}</span>
                        <span className="font-bold text-[#342A23] text-sm">{evt.event_category}</span>
                        <StatusBadge status={evt.investigator_review_status} size="sm" />
                        <span className="font-mono text-[#604735] font-bold">+{evt.formatted_time}</span>
                      </div>
                      <p className="text-[#534335]">{evt.review_notes}</p>
                      <div className="text-[11px] text-[#796C60] font-mono">
                        Evidence: {evt.evidence_id} • Detector: {evt.model_name}
                      </div>
                    </div>
                    <Link to="/events" className="btn-secondary py-1 px-3 text-xs font-semibold shrink-0">
                      Review Desk
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
