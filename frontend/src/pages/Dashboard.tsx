import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  FileVideo,
  ShieldCheck,
  Cpu,
  Eye,
  RefreshCw,
  Plus,
  Upload,
  ArrowRight,
  Shield,
  FileText,
  Clock,
  Activity,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { api } from '../services/api';
import {
  DashboardStats,
  Evidence,
  ChainOfCustody,
  DetectedEvent,
  Case,
  ProcessingJob
} from '../types';
import { StatCard } from '../components/common/StatCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { HashDisplay } from '../components/common/HashDisplay';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<{
    recent_custody: ChainOfCustody[];
    recent_evidence: Evidence[];
    recent_events: DetectedEvent[];
  }>({ recent_custody: [], recent_evidence: [], recent_events: [] });
  const [recentCases, setRecentCases] = useState<Case[]>([]);
  const [processingJobs, setProcessingJobs] = useState<ProcessingJob[]>([]);
  const [reportsCount, setReportsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (force = false) => {
    try {
      const [s, a, casesList, rpts, jobsList] = await Promise.all([
        api.getDashboardStats(force),
        api.getDashboardActivity(force),
        api.listCases(undefined, force),
        api.listReports(undefined, force),
        api.listJobs(6, force).catch(() => [] as ProcessingJob[])
      ]);
      setStats(s);
      setActivity(a);
      setRecentCases(casesList.slice(0, 5));
      setReportsCount(rpts.length);
      setProcessingJobs(jobsList || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData(true);
  };

  // Prepare chart data with brown/beige forensic palette
  const categoryData = stats
    ? Object.entries(stats.event_category_distribution).map(([name, count]) => ({
        name: name.length > 15 ? name.substring(0, 13) + '…' : name,
        fullName: name,
        count
      }))
    : [];

  return (
    <div className="space-y-7">
      {/* Top Banner: Welcome Heading & Primary Actions */}
      <div className="bg-[#FFFCF7] border border-[#D9CBBB] p-6 lg:p-7 rounded-2xl shadow-[0_1px_3px_rgba(68,49,38,0.05)] flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#47765B] animate-pulse" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#796C60]">
              Operational Forensics Workspace
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#342A23]">
            Forensic Investigation Dashboard
          </h1>
          <p className="text-[15px] text-[#796C60] mt-1 max-w-2xl leading-relaxed">
            Centralized digital evidence repository, cryptographic integrity status, and surveillance timeline reconstruction
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap shrink-0">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-secondary"
            title="Refresh dashboard metrics"
          >
            <RefreshCw className={`w-4 h-4 text-[#796C60] ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <Link to="/cases/new" className="btn-secondary">
            <Plus className="w-4 h-4 text-[#604735]" />
            <span>New Investigation</span>
          </Link>
          <Link to="/evidence/upload" className="btn-primary">
            <Upload className="w-4 h-4 text-[#FFFCF7]" />
            <span>Upload Evidence</span>
          </Link>
        </div>
      </div>

      {/* Primary KPI Grid: 6 Real Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="Total Cases"
          value={stats ? stats.total_cases : (loading ? '—' : 0)}
          subtitle="Active investigation dossiers"
          icon={<Briefcase className="w-5 h-5" />}
          accent="brown"
        />
        <StatCard
          title="Evidence Files"
          value={stats ? stats.total_evidence : (loading ? '—' : 0)}
          subtitle="Surveillance media feeds"
          icon={<FileVideo className="w-5 h-5" />}
          accent="accent"
        />
        <StatCard
          title="Verified Evidence"
          value={stats ? stats.files_hashed : (loading ? '—' : 0)}
          subtitle="SHA-256 cryptographically sealed"
          icon={<ShieldCheck className="w-5 h-5" />}
          accent="success"
        />
        <StatCard
          title="Processing Jobs"
          value={stats ? stats.jobs_in_progress : (loading ? '—' : 0)}
          subtitle="Active & queued pipeline"
          icon={<Cpu className="w-5 h-5" />}
          accent="info"
        />
        <StatCard
          title="Candidate Events"
          value={stats ? stats.total_events : (loading ? '—' : 0)}
          subtitle="Motion anomalies detected"
          icon={<Eye className="w-5 h-5" />}
          accent="warning"
        />
        <StatCard
          title="Reports Generated"
          value={reportsCount}
          subtitle="Official court-ready briefs"
          icon={<FileText className="w-5 h-5" />}
          accent="brown"
        />
      </div>

      {/* SECTION A & SECTION B: Investigation Overview & Evidence Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* A. Investigation Overview Table */}
        <div className="bg-[#FFFCF7] border border-[#D9CBBB] rounded-2xl p-6 shadow-[0_1px_3px_rgba(68,49,38,0.05)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E8DED0]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#EFE5D8] flex items-center justify-center text-[#604735]">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#342A23]">Investigation Overview</h2>
                  <p className="text-xs text-[#796C60]">Active cases under formal forensic investigation</p>
                </div>
              </div>
              <Link
                to="/cases"
                className="text-xs font-semibold text-[#8B684D] hover:text-[#443126] flex items-center gap-1 transition-colors"
              >
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="forensic-table">
                <thead>
                  <tr>
                    <th>Case ID</th>
                    <th>Title & Focus</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8DED0]">
                  {loading && recentCases.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[#796C60] text-sm font-sans">
                        Loading active investigations...
                      </td>
                    </tr>
                  ) : recentCases.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[#9A8C7D] text-sm font-sans">
                        No active investigation cases recorded. Click "New Investigation" above.
                      </td>
                    </tr>
                  ) : (
                    recentCases.map((c) => (
                      <tr key={c.id} className="hover:bg-[#F5F0E8]/70 transition-colors">
                        <td className="font-mono font-bold text-[#443126] whitespace-nowrap">
                          <Link to={`/cases/${c.id}`} className="hover:underline">
                            {c.id}
                          </Link>
                        </td>
                        <td className="max-w-[200px]">
                          <Link
                            to={`/cases/${c.id}`}
                            className="font-semibold text-[#342A23] hover:text-[#604735] block truncate text-sm"
                          >
                            {c.title}
                          </Link>
                          <span className="text-xs text-[#796C60] block truncate">{c.category}</span>
                        </td>
                        <td>
                          <StatusBadge status={c.priority} size="sm" />
                        </td>
                        <td>
                          <StatusBadge status={c.status} size="sm" />
                        </td>
                        <td className="text-right whitespace-nowrap">
                          <Link
                            to={`/cases/${c.id}`}
                            className="btn-secondary py-1 px-2.5 text-xs font-semibold"
                          >
                            Dossier
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* B. Evidence Activity Table */}
        <div className="bg-[#FFFCF7] border border-[#D9CBBB] rounded-2xl p-6 shadow-[0_1px_3px_rgba(68,49,38,0.05)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E8DED0]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#EFE5D8] flex items-center justify-center text-[#8B684D]">
                  <FileVideo className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#342A23]">Evidence Activity</h2>
                  <p className="text-xs text-[#796C60]">Recently uploaded surveillance video feeds</p>
                </div>
              </div>
              <Link
                to="/evidence"
                className="text-xs font-semibold text-[#8B684D] hover:text-[#443126] flex items-center gap-1 transition-colors"
              >
                Repository <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="forensic-table">
                <thead>
                  <tr>
                    <th>Evidence ID</th>
                    <th>Filename</th>
                    <th>SHA-256 Digest</th>
                    <th>Case</th>
                    <th className="text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8DED0]">
                  {loading && activity.recent_evidence.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[#796C60] text-sm">
                        Loading ingested evidence media...
                      </td>
                    </tr>
                  ) : activity.recent_evidence.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[#9A8C7D] text-sm">
                        No evidence files ingested yet. Click "Upload Evidence" to ingest media.
                      </td>
                    </tr>
                  ) : (
                    activity.recent_evidence.slice(0, 5).map((ev) => (
                      <tr key={ev.id} className="hover:bg-[#F5F0E8]/70 transition-colors">
                        <td className="font-mono font-bold text-[#443126] whitespace-nowrap">
                          <Link to={`/evidence/${ev.id}`} className="hover:underline">
                            {ev.id}
                          </Link>
                        </td>
                        <td className="max-w-[150px] truncate text-sm font-medium text-[#342A23]">
                          {ev.original_filename}
                        </td>
                        <td>
                          <HashDisplay hash={ev.sha256_hash} short={true} />
                        </td>
                        <td className="font-mono text-xs text-[#604735]">
                          {ev.case_id ? (
                            <Link to={`/cases/${ev.case_id}`} className="hover:underline">
                              {ev.case_id}
                            </Link>
                          ) : (
                            <span className="text-[#9A8C7D] italic">Unassigned</span>
                          )}
                        </td>
                        <td className="text-right whitespace-nowrap">
                          <StatusBadge status={ev.status} size="sm" />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION C & SECTION D: Processing Overview & Event Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* C. Processing Overview: Actual video processing job statuses */}
        <div className="lg:col-span-2 bg-[#FFFCF7] border border-[#D9CBBB] rounded-2xl p-6 shadow-[0_1px_3px_rgba(68,49,38,0.05)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E8DED0]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#EFE5D8] flex items-center justify-center text-[#604735]">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#342A23]">Video Processing Pipeline Overview</h2>
                  <p className="text-xs text-[#796C60]">Status of OpenCV keyframe extraction & MOG2 motion sentinel jobs</p>
                </div>
              </div>
              <Link
                to="/analysis"
                className="text-xs font-semibold text-[#8B684D] hover:text-[#443126] flex items-center gap-1 transition-colors"
              >
                AI Analysis Desk <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="forensic-table">
                <thead>
                  <tr>
                    <th>Job Identifier</th>
                    <th>Evidence Target</th>
                    <th>Pipeline Task</th>
                    <th>Progress</th>
                    <th>Status</th>
                    <th className="text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8DED0]">
                  {processingJobs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[#9A8C7D] text-sm">
                        No processing jobs in pipeline. Video preprocessing begins automatically on evidence upload.
                      </td>
                    </tr>
                  ) : (
                    processingJobs.map((job) => (
                      <tr key={job.id} className="hover:bg-[#F5F0E8]/70 transition-colors">
                        <td className="font-mono font-bold text-[#443126] whitespace-nowrap">
                          {job.id}
                        </td>
                        <td className="font-mono text-xs text-[#604735]">
                          <Link to={`/evidence/${job.evidence_id}`} className="hover:underline">
                            {job.evidence_id}
                          </Link>
                        </td>
                        <td className="text-xs font-semibold text-[#342A23]">
                          {job.job_type.replace(/_/g, ' ')}
                        </td>
                        <td className="w-28">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-[#E8DED0] h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-[#604735] h-full transition-all duration-300"
                                style={{ width: `${job.progress}%` }}
                              />
                            </div>
                            <span className="font-mono text-[11px] font-bold text-[#796C60]">
                              {job.progress}%
                            </span>
                          </div>
                        </td>
                        <td>
                          <StatusBadge status={job.status} size="sm" />
                        </td>
                        <td className="text-right font-mono text-xs text-[#796C60] whitespace-nowrap">
                          {new Date(job.created_at).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* D. Event Distribution: Clean Forensic Chart */}
        <div className="bg-[#FFFCF7] border border-[#D9CBBB] rounded-2xl p-6 shadow-[0_1px_3px_rgba(68,49,38,0.05)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E8DED0]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#EFE5D8] flex items-center justify-center text-[#B78035]">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#342A23]">Event Distribution</h2>
                  <p className="text-xs text-[#796C60]">Candidate categories</p>
                </div>
              </div>
              <Link
                to="/events"
                className="text-xs font-semibold text-[#8B684D] hover:text-[#443126] flex items-center gap-1 transition-colors"
              >
                Review <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="h-60 w-full pt-2">
              {categoryData.length > 0 && categoryData.some((c) => c.count > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 35 }}>
                    <XAxis
                      dataKey="name"
                      stroke="#796C60"
                      fontSize={11}
                      interval={0}
                      angle={-20}
                      textAnchor="end"
                    />
                    <YAxis stroke="#796C60" fontSize={11} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFCF7',
                        borderColor: '#D9CBBB',
                        borderRadius: '10px',
                        fontSize: '12px',
                        color: '#342A23',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
                      }}
                      labelStyle={{ color: '#443126', fontWeight: 700 }}
                    />
                    <Bar
                      dataKey="count"
                      fill="#604735"
                      radius={[4, 4, 0, 0]}
                      isAnimationActive={false}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-xs text-[#796C60] p-4 text-center">
                  <Clock className="w-7 h-7 text-[#9A8C7D] mb-2" />
                  <span>No candidate events detected yet. Upload video to populate categories.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION E: Recent Activity — Chronological Forensic Ledger */}
      <div className="bg-[#FFFCF7] border border-[#D9CBBB] rounded-2xl p-6 shadow-[0_1px_3px_rgba(68,49,38,0.05)]">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E8DED0]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#EFE5D8] flex items-center justify-center text-[#604735]">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#342A23]">Recent Forensic Chain of Custody & Activity</h2>
              <p className="text-xs text-[#796C60]">Tamper-evident chronological audit records of evidentiary actions</p>
            </div>
          </div>
          <Link
            to="/custody"
            className="text-xs font-semibold text-[#8B684D] hover:text-[#443126] flex items-center gap-1 transition-colors"
          >
            Complete Ledger <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="forensic-table">
            <thead>
              <tr>
                <th>Record ID</th>
                <th>UTC Timestamp</th>
                <th>Action Type</th>
                <th>Actor / Investigator</th>
                <th>Evidence Target</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8DED0]">
              {activity.recent_custody.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#9A8C7D] text-sm">
                    No chain-of-custody actions recorded yet.
                  </td>
                </tr>
              ) : (
                activity.recent_custody.slice(0, 6).map((coc) => (
                  <tr key={coc.id} className="hover:bg-[#F5F0E8]/70 transition-colors">
                    <td className="font-mono font-bold text-[#443126] text-xs whitespace-nowrap">
                      {coc.id}
                    </td>
                    <td className="text-[#796C60] font-mono text-xs whitespace-nowrap">
                      {new Date(coc.timestamp).toLocaleString()}
                    </td>
                    <td>
                      <StatusBadge status={coc.action_type.replace(/_/g, ' ')} size="sm" />
                    </td>
                    <td className="font-semibold text-sm text-[#342A23] whitespace-nowrap">
                      {coc.actor}
                    </td>
                    <td className="font-mono text-xs text-[#604735] whitespace-nowrap">
                      <Link to={`/evidence/${coc.evidence_id}`} className="hover:underline">
                        {coc.evidence_id}
                      </Link>
                    </td>
                    <td className="text-xs text-[#534335] max-w-md truncate">
                      {coc.description}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
