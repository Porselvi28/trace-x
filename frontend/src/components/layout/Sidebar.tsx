import React, { memo } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  FileVideo,
  CheckCircle2,
  GitCommit,
  Cpu,
  Search,
  Clock,
  Network,
  ShieldAlert,
  FileText,
  History,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
  Users,
  X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  mobileOpen?: boolean;
  setMobileOpen?: (v: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = memo(({
  collapsed,
  setCollapsed,
  mobileOpen = false,
  setMobileOpen
}) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Administrator';

  const navGroups = [
    {
      group: 'OVERVIEW',
      items: [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      ]
    },
    {
      group: 'INVESTIGATIONS',
      items: [
        { to: '/cases', label: 'Investigation Cases', icon: Briefcase },
        { to: '/evidence', label: 'Evidence Repository', icon: FileVideo },
      ]
    },
    {
      group: 'FORENSIC ANALYSIS',
      items: [
        { to: '/integrity', label: 'Integrity Verification', icon: CheckCircle2 },
        { to: '/custody', label: 'Chain of Custody', icon: GitCommit },
        { to: '/analysis', label: 'AI Analysis', icon: Cpu },
        { to: '/search', label: 'Evidence Search', icon: Search },
        { to: '/timeline', label: 'Forensic Timeline', icon: Clock },
        { to: '/correlation', label: 'Event Correlation', icon: Network },
        { to: '/authenticity', label: 'Authenticity Analysis', icon: ShieldAlert },
      ]
    },
    {
      group: 'MANAGEMENT',
      items: [
        { to: '/reports', label: 'Reports', icon: FileText },
        { to: '/audit', label: 'Audit Logs', icon: History },
        ...(isAdmin ? [{ to: '/users', label: 'User Management', icon: Users }] : []),
        { to: '/settings', label: 'Settings', icon: Settings },
      ]
    }
  ];

  const handleLinkClick = () => {
    if (setMobileOpen) {
      setMobileOpen(false);
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#E8DED0] border-r border-[#D9CBBB] select-none text-[#342A23]">
      {/* Brand Header */}
      <div className="h-[68px] flex items-center justify-between px-4 border-b border-[#D9CBBB] bg-[#E0D3C2]/90 shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-[#604735] flex items-center justify-center shrink-0 text-[#FFFCF7] shadow-sm ring-1 ring-[#443126]/30">
            <Shield className="w-5 h-5 text-[#FFFCF7]" />
          </div>
          {(!collapsed || mobileOpen) && (
            <div className="flex flex-col truncate">
              <span className="font-extrabold text-base tracking-wider text-[#342A23] flex items-center gap-1.5 leading-tight">
                TRACE <span className="text-[#8B684D]">X</span>
              </span>
              <span className="text-[11px] font-bold text-[#796C60] tracking-widest uppercase mt-0.5">
                DIGITAL FORENSICS
              </span>
            </div>
          )}
        </div>

        {/* Mobile close button or Desktop collapse toggle */}
        {mobileOpen ? (
          <button
            type="button"
            onClick={() => setMobileOpen && setMobileOpen(false)}
            className="p-1.5 text-[#796C60] hover:text-[#342A23] rounded-lg hover:bg-[#D4C4B2] transition-colors lg:hidden cursor-pointer"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex text-[#796C60] hover:text-[#342A23] p-1.5 rounded-lg hover:bg-[#D4C4B2] transition-colors cursor-pointer"
            title={collapsed ? 'Expand sidebar (260px)' : 'Collapse sidebar (80px)'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        )}
      </div>

      {/* Navigation Groups List */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-4">
        {navGroups.map((grp) => (
          <div key={grp.group} className="space-y-1">
            {(!collapsed || mobileOpen) ? (
              <div className="px-3 pt-1.5 pb-1 text-[11px] font-bold tracking-wider text-[#796C60] uppercase">
                {grp.group}
              </div>
            ) : (
              <div className="h-2" />
            )}
            <div className="space-y-1">
              {grp.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={handleLinkClick}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 h-[48px] rounded-xl text-[15px] font-medium transition-all relative group ${
                        isActive
                          ? 'bg-[#D4C4B2] text-[#443126] font-semibold shadow-2xs border-l-4 border-[#604735]'
                          : 'text-[#534335] hover:text-[#342A23] hover:bg-[#DFD3C3] border-l-4 border-transparent'
                      } ${collapsed && !mobileOpen ? 'justify-center px-0' : ''}`
                    }
                    title={collapsed && !mobileOpen ? item.label : undefined}
                  >
                    <Icon className="w-5 h-5 shrink-0 text-[#604735]" />
                    {(!collapsed || mobileOpen) && (
                      <span className="truncate tracking-wide">{item.label}</span>
                    )}

                    {/* Tooltip on collapsed desktop */}
                    {collapsed && !mobileOpen && (
                      <div className="fixed left-[84px] ml-1 hidden group-hover:flex z-50 px-2.5 py-1.5 bg-[#443126] text-[#FFFCF7] text-xs font-semibold rounded-md shadow-lg whitespace-nowrap pointer-events-none">
                        {item.label}
                      </div>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer System Status & Logged User Info */}
      <div className="p-3.5 border-t border-[#D9CBBB] bg-[#E0D3C2]/70 shrink-0">
        {(!collapsed || mobileOpen) ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-[#796C60]">
              <span className="font-semibold text-[#443126]">TRACE X v1.0</span>
              <span className="inline-flex items-center gap-1.5 text-[#47765B] font-semibold text-xs">
                <span className="w-2 h-2 rounded-full bg-[#47765B] animate-pulse"></span> ONLINE
              </span>
            </div>
            <div className="text-xs text-[#796C60] truncate border-t border-[#D9CBBB]/60 pt-1.5 flex items-center justify-between">
              <span className="truncate font-medium text-[#342A23]">
                {user?.full_name || user?.username || 'Investigator'}
              </span>
              <span className="text-[11px] font-semibold text-[#8B684D] px-2 py-0.5 rounded-md bg-[#E8DED0] border border-[#D9CBBB]">
                {user?.role || 'Staff'}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center py-1" title="TRACE X — Online">
            <span className="w-2.5 h-2.5 rounded-full bg-[#47765B] ring-2 ring-[#47765B]/30"></span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar — exactly 260px expanded, 80px collapsed */}
      <aside
        className={`hidden lg:block transition-[width] duration-200 ease-in-out shrink-0 z-30 h-screen ${
          collapsed ? 'w-20' : 'w-[260px]'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Slide-in Drawer with Backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-[#342A23]/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen && setMobileOpen(false)}
            aria-hidden="true"
          />
          {/* Drawer Content */}
          <div className="relative w-[270px] max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
});
