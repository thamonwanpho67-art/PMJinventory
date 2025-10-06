'use client';

import { useState } from 'react';
import { FaBell } from 'react-icons/fa';

export default function NotificationDropdownSimple() {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount] = useState(5); // Mock data

  // Mock notifications
  const mockNotifications = [
    {
      id: '1',
      title: 'คำขอยืมใหม่',
      message: 'สมชาย ใจดี ขอยืม เก้าอี้สำนักงาน รุ่น A1',
      type: 'LOAN_REQUEST',
      isRead: false,
      createdAt: '2025-10-06T10:00:00Z'
    },
    {
      id: '2',
      title: 'คำขอยืมใหม่',
      message: 'สมหญิง สวยงาม ขอยืม โต๊ะทำงาน รุ่น B2',
      type: 'LOAN_REQUEST',
      isRead: false,
      createdAt: '2025-10-06T09:30:00Z'
    },
    {
      id: '3',
      title: 'วัสดุใกล้หมด',
      message: 'กระดาษ A4 เหลือจำนวนน้อย (เหลือ 5 ชิ้น)',
      type: 'LOW_STOCK',
      isRead: false,
      createdAt: '2025-10-06T09:00:00Z'
    }
  ];

  const formatTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 60) {
      return `${diffMinutes} นาทีที่แล้ว`;
    }
    const diffHours = Math.floor(diffMinutes / 60);
    return `${diffHours} ชั่วโมงที่แล้ว`;
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'LOAN_REQUEST':
        return 'border-l-blue-500 bg-blue-50';
      case 'LOW_STOCK':
        return 'border-l-yellow-500 bg-yellow-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <FaBell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border z-50 max-h-96 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900 font-kanit">
                การแจ้งเตือน
              </h3>
              <span className="text-sm text-gray-500 font-kanit">
                {unreadCount} รายการใหม่
              </span>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {mockNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`border-l-4 p-4 border-b hover:bg-gray-50 cursor-pointer transition-colors ${
                    getNotificationColor(notification.type)
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-semibold text-gray-900 font-kanit">
                          {notification.title}
                        </h4>
                        {!notification.isRead && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1 font-kanit">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-2 font-kanit">
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 border-t bg-gray-50 text-center">
              <p className="text-xs text-gray-500 font-kanit">
                💡 ระบบการแจ้งเตือนพร้อมใช้งานแล้ว!
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}