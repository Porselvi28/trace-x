import axios from 'axios';
import {
  User,
  Case,
  Evidence,
  VerificationResult,
  DetectedEvent,
  ProcessingJob,
  ChainOfCustody,
  AuditLog,
  GeneratedReport,
  DashboardStats,
  SystemStatus,
  SearchResult,
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

// Attach JWT token from localStorage if present
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('tracex_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
    }
    return Promise.reject(error);
  }
);

// High-performance client-side in-memory cache to eliminate navigation latency and flickering
const cache = new Map<string, { data: any; timestamp: number }>();
const inFlightRequests = new Map<string, Promise<any>>();
const CACHE_TTL_MS = 25000; // 25 seconds cache TTL for stable investigation data

export const invalidateCache = (prefix?: string) => {
  if (!prefix) {
    cache.clear();
  } else {
    for (const key of cache.keys()) {
      if (key.startsWith(prefix)) cache.delete(key);
    }
  }
};

const cachedGet = async <T>(url: string, params?: any, ttl = CACHE_TTL_MS): Promise<T> => {
  const cacheKey = `${url}?${JSON.stringify(params || {})}`;
  const now = Date.now();
  const cached = cache.get(cacheKey);

  // If in cache and still fresh, return immediately (0ms delay)
  if (cached && now - cached.timestamp < ttl) {
    return cached.data as T;
  }

  // If identical request is already in-flight, return the shared promise to prevent redundant round-trips
  if (inFlightRequests.has(cacheKey)) {
    // If we have existing data, return it immediately while in-flight refreshes in background
    if (cached) {
      return cached.data as T;
    }
    return inFlightRequests.get(cacheKey) as Promise<T>;
  }

  // Create single in-flight network request
  const fetchPromise = apiClient
    .get<T>(url, { params })
    .then((res) => {
      cache.set(cacheKey, { data: res.data, timestamp: Date.now() });
      inFlightRequests.delete(cacheKey);
      return res.data;
    })
    .catch((err) => {
      inFlightRequests.delete(cacheKey);
      throw err;
    });

  inFlightRequests.set(cacheKey, fetchPromise);

  // Stale-While-Revalidate: return stale data immediately so UI never lags
  if (cached) {
    return cached.data as T;
  }

  return fetchPromise;
};

export const api = {
  invalidateCache,

  // --- AUTH ---
  login: async (credentials: any) => {
    const res = await apiClient.post<{ access_token: string; user: User }>('/auth/login', credentials);
    if (res.data.access_token) {
      localStorage.setItem('tracex_token', res.data.access_token);
      localStorage.setItem('tracex_user', JSON.stringify(res.data.user));
      invalidateCache();
    }
    return res.data;
  },
  register: async (userData: any) => {
    const res = await apiClient.post<User>('/auth/register', userData);
    return res.data;
  },
  getMe: async () => {
    return cachedGet<User>('/auth/me', undefined, 60000);
  },
  logout: () => {
    localStorage.removeItem('tracex_token');
    localStorage.removeItem('tracex_user');
    invalidateCache();
  },

  // --- DASHBOARD ---
  getDashboardStats: async (forceRefresh = false) => {
    if (forceRefresh) invalidateCache('/dashboard/stats');
    return cachedGet<DashboardStats>('/dashboard/stats', undefined, 10000);
  },
  getDashboardActivity: async (forceRefresh = false) => {
    if (forceRefresh) invalidateCache('/dashboard/activity');
    return cachedGet<{
      recent_custody: ChainOfCustody[];
      recent_evidence: Evidence[];
      recent_events: DetectedEvent[];
    }>('/dashboard/activity', undefined, 10000);
  },

  // --- CASES ---
  listCases: async (params?: { search?: string; status?: string; priority?: string }, forceRefresh = false) => {
    if (forceRefresh) invalidateCache('/cases');
    return cachedGet<Case[]>('/cases', params, 15000);
  },
  getCase: async (id: string, forceRefresh = false) => {
    if (forceRefresh) invalidateCache(`/cases/${id}`);
    return cachedGet<Case>(`/cases/${id}`, undefined, 15000);
  },
  createCase: async (caseData: Partial<Case>) => {
    const res = await apiClient.post<Case>('/cases', caseData);
    invalidateCache('/cases');
    invalidateCache('/dashboard');
    return res.data;
  },
  updateCase: async (id: string, updateData: Partial<Case>) => {
    const res = await apiClient.patch<Case>(`/cases/${id}`, updateData);
    invalidateCache(`/cases/${id}`);
    invalidateCache('/cases');
    invalidateCache('/dashboard');
    return res.data;
  },
  getCaseEvidence: async (caseId: string, forceRefresh = false) => {
    if (forceRefresh) invalidateCache(`/cases/${caseId}/evidence`);
    return cachedGet<Evidence[]>(`/cases/${caseId}/evidence`, undefined, 15000);
  },

  // --- EVIDENCE ---
  listEvidence: async (params?: { case_id?: string; status?: string; search?: string }, forceRefresh = false) => {
    if (forceRefresh) invalidateCache('/evidence');
    return cachedGet<Evidence[]>('/evidence', params, 15000);
  },
  getEvidence: async (id: string, forceRefresh = false) => {
    if (forceRefresh) invalidateCache(`/evidence/${id}`);
    return cachedGet<Evidence>(`/evidence/${id}`, undefined, 15000);
  },
  uploadEvidence: async (formData: FormData, onUploadProgress?: (progressEvent: any) => void) => {
    const res = await apiClient.post<Evidence>('/evidence/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    });
    invalidateCache('/evidence');
    invalidateCache('/dashboard');
    invalidateCache('/cases');
    invalidateCache('/timeline');
    return res.data;
  },
  verifyIntegrity: async (evidenceId: string) => {
    const res = await apiClient.post<VerificationResult>(`/evidence/${evidenceId}/verify`);
    invalidateCache(`/evidence/${evidenceId}`);
    invalidateCache('/evidence');
    invalidateCache('/dashboard');
    invalidateCache('/custody');
    return res.data;
  },
  getDownloadUrl: (evidenceId: string) => {
    return `${API_BASE}/evidence/${evidenceId}/download`;
  },

  // --- CHAIN OF CUSTODY ---
  getEvidenceCustody: async (evidenceId: string, forceRefresh = false) => {
    if (forceRefresh) invalidateCache(`/evidence/${evidenceId}/custody`);
    return cachedGet<ChainOfCustody[]>(`/evidence/${evidenceId}/custody`, undefined, 10000);
  },
  getCaseCustody: async (caseId: string, forceRefresh = false) => {
    if (forceRefresh) invalidateCache(`/cases/${caseId}/custody`);
    return cachedGet<ChainOfCustody[]>(`/cases/${caseId}/custody`, undefined, 10000);
  },
  listAllCustody: async (limit: number = 50, forceRefresh = false) => {
    if (forceRefresh) invalidateCache('/custody');
    return cachedGet<ChainOfCustody[]>('/custody', { limit }, 10000);
  },

  // --- PROCESSING & JOBS ---
  startProcessing: async (evidenceId: string) => {
    const res = await apiClient.post<ProcessingJob>(`/evidence/${evidenceId}/process`);
    invalidateCache(`/evidence/${evidenceId}`);
    invalidateCache('/dashboard');
    invalidateCache('/jobs');
    return res.data;
  },
  listJobs: async (limit: number = 10, forceRefresh = false) => {
    if (forceRefresh) invalidateCache('/jobs');
    return cachedGet<ProcessingJob[]>('/jobs', { limit }, 8000);
  },
  getJobStatus: async (jobId: string) => {
    const res = await apiClient.get<ProcessingJob>(`/jobs/${jobId}`);
    return res.data;
  },
  getEvidenceJobs: async (evidenceId: string) => {
    const res = await apiClient.get<ProcessingJob[]>(`/evidence/${evidenceId}/jobs`);
    return res.data;
  },

  // --- DETECTED EVENTS ---
  listEvents: async (params?: { case_id?: string; evidence_id?: string; category?: string; review_status?: string }, forceRefresh = false) => {
    if (forceRefresh) invalidateCache('/events');
    return cachedGet<DetectedEvent[]>('/events', params, 15000);
  },
  getEvent: async (id: string) => {
    const res = await apiClient.get<DetectedEvent>(`/events/${id}`);
    return res.data;
  },
  reviewEvent: async (id: string, reviewData: { investigator_review_status: string; review_notes?: string }) => {
    const res = await apiClient.patch<DetectedEvent>(`/events/${id}/review`, reviewData);
    invalidateCache('/events');
    invalidateCache('/dashboard');
    return res.data;
  },

  // --- SEARCH ---
  search: async (query: string, case_id?: string) => {
    const res = await apiClient.post<SearchResult>('/search', { query, case_id });
    return res.data;
  },
  getSearchHistory: async () => {
    const res = await apiClient.get<any[]>('/search/history');
    return res.data;
  },

  // --- TIMELINE ---
  getTimeline: async (params?: { case_id?: string; category?: string }, forceRefresh = false) => {
    if (forceRefresh) invalidateCache('/timeline');
    return cachedGet<any[]>('/timeline', params, 15000);
  },

  // --- CORRELATION ---
  getCorrelation: async (caseId: string, proximitySeconds: number = 120) => {
    return cachedGet<any>(`/correlation/${caseId}`, { proximity_seconds: proximitySeconds }, 15000);
  },

  // --- AUTHENTICITY ANALYSIS ---
  getAuthenticityStatus: async () => {
    return cachedGet<any>('/authenticity/status', undefined, 60000);
  },
  scanAuthenticity: async (evidenceId: string) => {
    const res = await apiClient.post<any>(`/authenticity/${evidenceId}/analyze`);
    return res.data;
  },

  // --- REPORTS ---
  generateReport: async (payload: { case_id: string; report_title?: string; summary_notes?: string }) => {
    const res = await apiClient.post<GeneratedReport>('/reports/generate', payload);
    invalidateCache('/reports');
    return res.data;
  },
  listReports: async (caseId?: string, forceRefresh = false) => {
    if (forceRefresh) invalidateCache('/reports');
    return cachedGet<GeneratedReport[]>('/reports', { case_id: caseId }, 15000);
  },
  getReport: async (id: string) => {
    const res = await apiClient.get<GeneratedReport>(`/reports/${id}`);
    return res.data;
  },
  getReportDownloadUrl: (id: string) => {
    return `${API_BASE}/reports/${id}/download`;
  },

  // --- AUDIT LOGS ---
  getAuditLogs: async (params?: { resource_type?: string; outcome?: string; limit?: number }, forceRefresh = false) => {
    if (forceRefresh) invalidateCache('/audit-logs');
    return cachedGet<AuditLog[]>('/audit-logs', params, 15000);
  },

  // --- SYSTEM HEALTH ---
  getHealth: async () => {
    return cachedGet<any>('/health', undefined, 30000);
  },
  getSystemStatus: async () => {
    return cachedGet<SystemStatus>('/system/status', undefined, 30000);
  },

  // --- USERS ---
  listUsers: async () => {
    return cachedGet<User[]>('/users', undefined, 30000);
  },
  updateUserRole: async (userId: number, role: string) => {
    const res = await apiClient.patch<User>(`/users/${userId}/role`, { role });
    invalidateCache('/users');
    return res.data;
  },
};
