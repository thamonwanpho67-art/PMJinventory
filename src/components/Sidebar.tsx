"use client";

import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

interface SubNavItem {
  name: string;
  href: string;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  children?: SubNavItem[];
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const isAdmin = session?.user?.role === 'ADMIN';
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    );
  };

  // Auto-expand supply menu if on supply-related pages
  useEffect(() => {
    if (pathname.startsWith('/admin/supplies')) {
      setExpandedItems(prev => prev.includes('วัสดุสิ้นเปลือง') ? prev : [...prev, 'วัสดุสิ้นเปลือง']);
    }
  }, [pathname]);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  // Navigation items based on user role
  const navigationItems = isAdmin ? [
    {
      name: 'แดชบอร์ด',
      href: '/admin',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      name: 'คลังอุปกรณ์',
      href: '/admin/assets',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
    {
      name: 'จัดการคำขอยืม',
      href: '/admin/loans',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      name: 'ประวัติการยืม-คืน',
      href: '/admin/history',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      name: 'ตรวจนับครุภัณฑ์',
      href: '/admin/inventory-check',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
    {
      name: 'จัดการ QR Code',
      href: '/admin/qr-management',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
        </svg>
      ),
    },
    {
      name: 'วัสดุสิ้นเปลือง',
      href: '/admin/supplies',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      children: [
        {
          name: 'จัดการวัสดุ',
          href: '/admin/supplies',
        },
        {
          name: 'เบิก-จ่ายวัสดุ',
          href: '/admin/supplies/distribute',
        },
        {
          name: 'ประวัติการเบิก',
          href: '/admin/supplies/history',
        },
      ],
    },
    {
      name: 'ผู้ใช้งาน',
      href: '/admin/users',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
    },
  ] : [
    {
      name: 'หน้าหลัก',
      href: '/dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      name: 'คลังอุปกรณ์',
      href: '/dashboard/assets',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
    {
      name: 'ยื่นคำขอยืม',
      href: '/dashboard/borrow',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-4 6h4" />
        </svg>
      ),
    },
    {
      name: 'ตรวจนับครุภัณฑ์',
      href: '/dashboard/quick-borrow',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
    {
      name: 'รายการยืม-คืนของฉัน',
      href: '/dashboard/loans-history',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      name: 'เปลี่ยนรหัสผ่าน',
      href: '/dashboard/change-password',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1721 9z" />
        </svg>
      ),
    },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-50 lg:hidden z-20"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-30 lg:translate-x-0 lg:static lg:inset-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } w-64`}
      >
        {/* Logo Section */}
        <div className="flex items-center justify-center h-16 bg-gradient-to-r from-pink-500 to-pink-600 text-white">
          <div className="flex items-center space-x-2">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span className="font-kanit font-black text-lg">ครุภัณฑ์</span>
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-pink-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-pink-100 to-pink-200 rounded-full flex items-center justify-center">
              <span className="text-pink-600 font-semibold text-sm">
                {session?.user?.name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-kanit font-semibold text-gray-900 truncate">
                {session?.user?.name}
              </p>
              <p className="text-xs text-pink-600 font-kanit font-medium truncate">
                {isAdmin ? 'ผู้ดูแลระบบ' : 'เจ้าหน้าที่'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-4 px-2 space-y-1">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const hasSubmenu = item.children && item.children.length > 0;
            const isExpanded = expandedItems.includes(item.name);
            
            return (
              <div key={item.name}>
                {hasSubmenu ? (
                  // Parent item with submenu
                  <button
                    onClick={() => toggleExpanded(item.name)}
                    className={`group flex items-center justify-between w-full px-2 py-2 text-sm font-kanit font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-gradient-to-r from-pink-100 to-pink-200 text-pink-900 border-r-3 border-pink-500'
                        : 'text-gray-600 hover:bg-pink-50 hover:text-pink-800'
                    }`}
                  >
                    <div className="flex items-center">
                      <span className={`mr-3 ${isActive ? 'text-pink-600' : 'text-gray-400 group-hover:text-pink-500'}`}>
                        {item.icon}
                      </span>
                      {item.name}
                    </div>
                    <svg
                      className={`w-4 h-4 transition-transform ${
                        isExpanded ? 'transform rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                ) : (
                  // Regular navigation item
                  <Link
                    href={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-kanit font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-gradient-to-r from-pink-100 to-pink-200 text-pink-900 border-r-3 border-pink-500'
                        : 'text-gray-600 hover:bg-pink-50 hover:text-pink-800'
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    <span className={`mr-3 ${isActive ? 'text-pink-600' : 'text-gray-400 group-hover:text-pink-500'}`}>
                      {item.icon}
                    </span>
                    {item.name}
                  </Link>
                )}
                
                {/* Submenu items */}
                {hasSubmenu && isExpanded && (
                  <div className="ml-4 mt-1 space-y-1">
                    {item.children!.map((subItem: SubNavItem) => {
                      const subIsActive = pathname === subItem.href;
                      return (
                        <Link
                          key={subItem.name}
                          href={subItem.href}
                          className={`group flex items-center px-2 py-2 text-sm font-kanit font-medium rounded-md transition-colors ${
                            subIsActive
                              ? 'bg-gradient-to-r from-pink-100 to-pink-200 text-pink-900 border-r-3 border-pink-500'
                              : 'text-gray-500 hover:bg-pink-50 hover:text-pink-700'
                          }`}
                          onClick={() => setIsOpen(false)}
                        >
                          <span className="mr-3 w-2 h-2 bg-gray-400 rounded-full"></span>
                          {subItem.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-pink-100">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center px-2 py-2 text-sm font-kanit font-medium text-gray-600 rounded-md hover:bg-rose-50 hover:text-rose-700 transition-colors"
          >
            <svg className="mr-3 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            ออกจากระบบ
          </button>
        </div>
      </div>
    </>
  );
}

