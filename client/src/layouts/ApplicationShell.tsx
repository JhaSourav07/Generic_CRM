import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export const ApplicationShell: React.FC = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-vynexa-bg text-vynexa-text-primary">
      {/* Sidebar Navigation */}
      <Sidebar
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
      />

      {/* Main Content Viewport */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar onMenuToggle={() => setIsMobileOpen(!isMobileOpen)} />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-vynexa-bg">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
