import React, { useState, useEffect, useRef, memo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Search,
  LogOut,
  Database,
  Activity,
  Menu,
  Bell,
  User,
  ChevronDown,
  CheckCircle2,
  ShieldAlert,
  Settings as SettingsIcon,
  Shield
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';

interface TopbarProps {
  onMenuClick?: () => void;
}

export const Topbar: React.FC<TopbarProps> = memo(({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchVal, setSearchVal] = useState('');
  const [backendStatus, setBackendStatus] = useState<{ online: boolean; db: boolean }>({
    online: false,
    db: false,
  });

  // User menu & notifications popover state
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    const checkHealth = async () => {
      try {
        const res = await api.getHealth();
        if (isMounted) {
          setBackendStatus({ online: res.status === 'healthy', db: res.database === 'connected' });
        }
      } catch {
        if (isMounted) {
          setBackendStatus({ online: false, db: false });
        }
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchVal.trim())}`);
      setSearchVal('');
    }
  };

  // Breadcrumb and Page Title generator
  const pathParts = location.pathname.split('/').filter(Boolean);
  const getSectionAndTitle = () => {
    if (pathParts.length === 0 || pathParts[0] === 'dashboard') {
      return { section: 'OVERVIEW', title: 'Dashboard' };
    }
    const root = pathParts[0];
    switch (root) {
      case 'cases':
        return {
          section: 'INVESTIGATIONS',
          title: pathParts[1] ? (pathParts[1] === 'new' ? 'New Case' : `Case ${pathParts[1]}`) : 'Investigation Cases'
        };
      case 'evidence':
        return {
          section: 'INVESTIGATIONS',
          title: pathParts[1] ? (pathParts[1] === 'upload' ? 'Upload Evidence' : `Evidence ${pathParts[1]}`) : 'Evidence Repository'
        };
      case 'integrity':
        return { section: 'FORENSIC ANALYSIS', title: 'Integrity Verification' };
      case 'custody':
        return { section: 'FORENSIC ANALYSIS', title: 'Chain of Custody' };
      case 'analysis':
        return { section: 'FORENSIC ANALYSIS', title: 'AI Analysis' };
      case 'events':
        return { section: 'FORENSIC ANALYSIS', title: 'Event Review' };
      case 'search':
        return { section: 'FORENSIC ANALYSIS', title: 'Evidence Search' };
      case 'timeline':
        return { section: 'FORENSIC ANALYSIS', title: 'Forensic Timeline' };
      case 'correlation':
        return { section: 'FORENSIC ANALYSIS', title: 'Event Correlation' };
      case 'authenticity':
        return { section: 'FORENSIC ANALYSIS', title: 'Authenticity Analysis' };
      case 'reports':
        return { section: 'MANAGEMENT', title: 'Forensic Reports' };
      case 'audit':
        return { section: 'MANAGEMENT', title: 'Audit Logs' };
      case 'users':
        return { section: 'MANAGEMENT', title: 'User Management' };
      case 'settings':
        return { section: 'MANAGEMENT', title: 'Settings' };
      default:
        return { section: 'TRACE X', title: root.toUpperCase() };
    }
  };

  const { section, title } = getSectionAndTitle();

  return (
    <header className="h-[68px] bg-[#FFFCF7] border-b border-[#D9CBBB] px-4 sm:px-6 lg:px-8 flex items-center justify-between z-20 shrink-0 shadow-[0_1px_2px_rgba(68,49,38,0.03)]">
      {/* Left: Mobile Menu Toggle + Breadcrumbs & Current Page Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-[#796C60] hover:text-[#342A23] hover:bg-[#EFE5D8] transition-colors cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 truncate">
          <span className="text-xs font-bold tracking-widest text-[#796C60] uppercase hidden sm:inline whitespace-nowrap">
            {section} /
          </span>
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-[#342A23] truncate">
            {title}
          </h1>
        </div>
      </div>

      {/* Center Global Search Input */}
      <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center relative w-72 lg:w-96 mx-4">
        <Search className="w-4 h-4 text-[#9A8C7D] absolute left-3.5 pointer-events-none" />
        <input
          type="text"
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
          placeholder="Search evidence, hashes, or events... (Enter)"
          className="w-full h-10 bg-[#F5F0E8] border border-[#D9CBBB] rounded-xl pl-10 pr-3.5 text-sm text-[#342A23] placeholder-[#9A8C7D] focus:outline-none focus:border-[#8B684D] focus:bg-[#FFFCF7] focus:ring-2 focus:ring-[#8B684D]/20 transition-all"
        />
      </form>

      {/* Right Controls: Health, Notifications & User Menu */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Backend Health Status Indicator */}
        <div
          className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[#F5F0E8] border border-[#D9CBBB] text-xs font-mono select-none"
          title={`Backend API: ${backendStatus.online ? 'Online' : 'Offline'} | Database: ${backendStatus.db ? 'Connected' : 'Disconnected'}`}
        >
          <div className="flex items-center gap-1.5">
            <Activity className={`w-3.5 h-3.5 ${backendStatus.online ? 'text-[#47765B]' : 'text-[#A64B43]'}`} />
            <span className="text-[#796C60] font-medium">API</span>
            <span className={`w-1.5 h-1.5 rounded-full ${backendStatus.online ? 'bg-[#47765B]' : 'bg-[#A64B43]'}`} />
          </div>
          <span className="text-[#D9CBBB]">|</span>
          <div className="flex items-center gap-1.5">
            <Database className={`w-3.5 h-3.5 ${backendStatus.db ? 'text-[#47765B]' : 'text-[#A64B43]'}`} />
            <span className="text-[#796C60] font-medium">DB</span>
            <span className={`w-1.5 h-1.5 rounded-full ${backendStatus.db ? 'bg-[#47765B]' : 'bg-[#A64B43]'}`} />
          </div>
        </div>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 text-[#796C60] hover:text-[#342A23] hover:bg-[#EFE5D8] rounded-xl transition-colors relative cursor-pointer"
            title="System alerts & notifications"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#8B684D]" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-[#FFFCF7] border border-[#D9CBBB] rounded-2xl shadow-xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-[#E8DED0]">
                <span className="font-bold text-sm text-[#342A23]">System Notifications</span>
                <span className="text-xs bg-[#EAF2EC] text-[#47765B] px-2 py-0.5 rounded-md font-semibold font-mono">
                  ACTIVE
                </span>
              </div>
              <div className="mt-3 space-y-2.5 text-xs text-[#534335]">
                <div className="p-2.5 rounded-xl bg-[#F5F0E8] border border-[#D9CBBB]/60 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#47765B] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[#342A23] block">ISO/IEC 27037 Audit Active</span>
                    <span className="text-[#796C60]">Cryptographic ledger recording streaming SHA-256 verification events.</span>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#F5F0E8] border border-[#D9CBBB]/60 flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-[#B78035] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[#342A23] block">Motion Sentinel CV Ready</span>
                    <span className="text-[#796C60]">OpenCV MOG2 background subtraction configured for surveillance video.</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile & Menu Dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2.5 pl-2 sm:pl-3 py-1.5 pr-2 rounded-xl hover:bg-[#EFE5D8] transition-colors cursor-pointer border border-transparent hover:border-[#D9CBBB]"
            aria-label="User account menu"
          >
            <div className="w-8 h-8 rounded-lg bg-[#604735] flex items-center justify-center text-[#FFFCF7] text-xs font-bold shadow-2xs">
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-sm font-semibold text-[#342A23] truncate max-w-[120px] leading-tight">
                {user?.full_name || user?.username || 'Investigator'}
              </span>
              <span className="text-[11px] text-[#796C60] font-medium leading-tight">
                {user?.role || 'Staff'}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-[#796C60]" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-[#FFFCF7] border border-[#D9CBBB] rounded-2xl shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="p-2.5 rounded-xl bg-[#F5F0E8] border border-[#D9CBBB]/70 mb-2">
                <div className="font-bold text-sm text-[#342A23] truncate">
                  {user?.full_name || user?.username}
                </div>
                <div className="text-xs text-[#796C60] truncate font-mono">
                  {user?.email || 'officer@tracex.internal'}
                </div>
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-[#604735]">
                  <Shield className="w-3.5 h-3.5 text-[#8B684D]" />
                  <span className="font-semibold">{user?.agency || 'Digital Forensics Unit'}</span>
                </div>
              </div>

              <div className="space-y-1 text-sm">
                <Link
                  to="/settings"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[#342A23] hover:bg-[#EFE5D8] font-medium transition-colors"
                >
                  <SettingsIcon className="w-4 h-4 text-[#604735]" />
                  <span>Workstation Settings</span>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    logout();
                    navigate('/login');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[#A64B43] hover:bg-[#F8EBEA] font-semibold transition-colors cursor-pointer text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Terminate Session</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
});
