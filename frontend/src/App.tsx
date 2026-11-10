import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { AppLayout } from './components/layout/AppLayout';

// Direct import for auth pages to ensure immediate rendering
import { Login } from './pages/Login';
import { Register } from './pages/Register';

// Lazy-loaded pages for optimal performance & code-splitting
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const CasesList = lazy(() => import('./pages/CasesList').then(m => ({ default: m.CasesList })));
const CreateCase = lazy(() => import('./pages/CreateCase').then(m => ({ default: m.CreateCase })));
const CaseDetail = lazy(() => import('./pages/CaseDetail').then(m => ({ default: m.CaseDetail })));
const EvidenceRepository = lazy(() => import('./pages/EvidenceRepository').then(m => ({ default: m.EvidenceRepository })));
const UploadEvidence = lazy(() => import('./pages/UploadEvidence').then(m => ({ default: m.UploadEvidence })));
const EvidenceDetail = lazy(() => import('./pages/EvidenceDetail').then(m => ({ default: m.EvidenceDetail })));
const IntegrityVerification = lazy(() => import('./pages/IntegrityVerification').then(m => ({ default: m.IntegrityVerification })));
const ChainOfCustody = lazy(() => import('./pages/ChainOfCustody').then(m => ({ default: m.ChainOfCustody })));
const VideoAnalysis = lazy(() => import('./pages/VideoAnalysis').then(m => ({ default: m.VideoAnalysis })));
const EventReview = lazy(() => import('./pages/EventReview').then(m => ({ default: m.EventReview })));
const NaturalLanguageSearch = lazy(() => import('./pages/NaturalLanguageSearch').then(m => ({ default: m.NaturalLanguageSearch })));
const ForensicTimeline = lazy(() => import('./pages/ForensicTimeline').then(m => ({ default: m.ForensicTimeline })));
const EventCorrelation = lazy(() => import('./pages/EventCorrelation').then(m => ({ default: m.EventCorrelation })));
const AuthenticityAnalysis = lazy(() => import('./pages/AuthenticityAnalysis').then(m => ({ default: m.AuthenticityAnalysis })));
const Reports = lazy(() => import('./pages/Reports').then(m => ({ default: m.Reports })));
const AuditLogs = lazy(() => import('./pages/AuditLogs').then(m => ({ default: m.AuditLogs })));
const UserManagement = lazy(() => import('./pages/UserManagement').then(m => ({ default: m.UserManagement })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const NotFound = lazy(() => import('./pages/NotFound').then(m => ({ default: m.NotFound })));

// Forensic page loading skeleton
const PageLoadingSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse">
    <div className="h-20 bg-[#FFFCF7] border border-[#D9CBBB] rounded-2xl p-6 shadow-xs flex items-center justify-between">
      <div className="space-y-2">
        <div className="h-6 w-56 bg-[#E8DED0] rounded-md" />
        <div className="h-4 w-96 bg-[#EFE5D8] rounded-md" />
      </div>
      <div className="h-10 w-32 bg-[#E8DED0] rounded-lg" />
    </div>
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-28 bg-[#FFFCF7] border border-[#D9CBBB] rounded-2xl p-4" />
      ))}
    </div>
    <div className="h-80 bg-[#FFFCF7] border border-[#D9CBBB] rounded-2xl p-6" />
  </div>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#F5F0E8] text-[#604735]">
        <div className="w-12 h-12 rounded-2xl bg-[#604735] text-[#FFFCF7] flex items-center justify-center mb-3 shadow-md">
          <span className="font-mono font-bold text-lg">TRX</span>
        </div>
        <span className="text-xs font-mono font-semibold tracking-widest text-[#796C60]">
          VALIDATING INVESTIGATOR CLEARANCE...
        </span>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <NotificationProvider>
        <AuthProvider>
          <Suspense fallback={<PageLoadingSkeleton />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Workspace Layout */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="dashboard" element={<Dashboard />} />

                {/* Cases */}
                <Route path="cases" element={<CasesList />} />
                <Route path="cases/new" element={<CreateCase />} />
                <Route path="cases/:id" element={<CaseDetail />} />

                {/* Evidence */}
                <Route path="evidence" element={<EvidenceRepository />} />
                <Route path="evidence/upload" element={<UploadEvidence />} />
                <Route path="evidence/:id" element={<EvidenceDetail />} />

                {/* Integrity & Custody */}
                <Route path="integrity" element={<IntegrityVerification />} />
                <Route path="custody" element={<ChainOfCustody />} />

                {/* Video Analysis & Anomaly Review */}
                <Route path="analysis" element={<VideoAnalysis />} />
                <Route path="events" element={<EventReview />} />

                {/* Intelligence & Reconstruction */}
                <Route path="search" element={<NaturalLanguageSearch />} />
                <Route path="timeline" element={<ForensicTimeline />} />
                <Route path="correlation" element={<EventCorrelation />} />
                <Route path="correlation/:caseId" element={<EventCorrelation />} />
                <Route path="authenticity" element={<AuthenticityAnalysis />} />

                {/* Reports & Audit */}
                <Route path="reports" element={<Reports />} />
                <Route path="audit" element={<AuditLogs />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="settings" element={<Settings />} />

                {/* Catch-all 404 */}
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </Suspense>
        </AuthProvider>
      </NotificationProvider>
    </BrowserRouter>
  );
};

export default App;
