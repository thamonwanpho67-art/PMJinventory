"use client";

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Sidebar from '@/components/Sidebar';
import NotificationDropdownSimple from '@/components/NotificationDropdownSimple';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'ADMIN';

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <header className="bg-gradient-to-r from-pink-50 to-rose-50 shadow-sm border-b border-pink-200">
          <div className="flex items-center justify-between px-4 py-3">
            {/* Mobile menu button - only show on mobile */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-md text-pink-400 hover:text-pink-600 hover:bg-pink-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-pink-500 lg:hidden"
            >
              <span className="sr-only">เปิดเมนู</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            {/* Title */}
            <h1 className="text-lg font-semibold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
              ระบบยืม-คืนครุภัณฑ์
            </h1>
            
            {/* Right side - Notifications (Admin only) */}
            <div className="flex items-center space-x-4">
              {isAdmin && <NotificationDropdownSimple />}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
