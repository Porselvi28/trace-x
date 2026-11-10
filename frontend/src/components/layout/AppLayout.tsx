import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export const AppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F5F0E8] text-[#342A23] font-sans antialiased">
      {/* Persistent Left Sidebar */}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main View Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Persistent Topbar */}
        <Topbar onMenuClick={() => setMobileOpen(true)} />

        {/* Scrollable Viewport with Stable Responsive Padding */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 relative bg-[#F5F0E8]">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
