'use client';

import { useState, useEffect } from 'react';
import { FaBell, FaEye, FaEyeSlash, FaTimes } from 'react-icons/fa';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  relatedId?: string;
  relatedType?: string;
  createdAt: string;
}

interface NotificationResponse {
  notifications: Notification[];
  unreadCount: number;
}

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // ดึงข้อมูล notifications
  const fetchNotifications = async (unreadOnly = false) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/notifications?unreadOnly=${unreadOnly}&limit=20`);
      if (response.ok) {
        const data: NotificationResponse = await response.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // อัปเดตสถานะการอ่าน
  const markAsRead = async (ids?: string[]) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ids: ids,
          markAsRead: true
        })
      });

      if (response.ok) {
        await fetchNotifications();
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  // อัปเดตการอ่านแบบเดี่ยว
  const markSingleAsRead = async (id: string) => {
    await markAsRead([id]);
  };

  // อัปเดตการอ่านทั้งหมด
  const markAllAsRead = async () => {
    await markAsRead();
  };

  // ดึงข้อมูลเมื่อเปิด dropdown
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // ดึงข้อมูลครั้งแรกเพื่อแสดงจำนวน unread
  useEffect(() => {
    fetchNotifications(true);
  }, []);

  // ฟอร์แมตเวลา
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffMinutes < 60) {
      return `${diffMinutes} นาทีที่แล้ว`;
    } else if (diffHours < 24) {
      return `${diffHours} ชั่วโมงที่แล้ว`;
    } else {
      return `${diffDays} วันที่แล้ว`;
    }
  };

  // สีของ notification ตาม type
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'LOAN_REQUEST':
        return 'border-l-blue-500 bg-blue-50';
      case 'LOAN_APPROVED':
        return 'border-l-green-500 bg-green-50';
      case 'LOAN_REJECTED':
        return 'border-l-red-500 bg-red-50';
      case 'LOAN_RETURNED':
        return 'border-l-purple-500 bg-purple-50';
      case 'LOW_STOCK':
        return 'border-l-yellow-500 bg-yellow-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <FaBell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Notification Panel */}
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border z-50 max-h-96 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900 font-kanit">
                การแจ้งเตือน
              </h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-800 font-kanit"
                  >
                    อ่านทั้งหมด
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500 font-kanit">
                  ไม่มีการแจ้งเตือน
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`border-l-4 p-4 border-b hover:bg-gray-50 cursor-pointer transition-colors ${
                      getNotificationColor(notification.type)
                    } ${!notification.isRead ? 'bg-opacity-100' : 'bg-opacity-30'}`}
                    onClick={() => {
                      if (!notification.isRead) {
                        markSingleAsRead(notification.id);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className={`text-sm font-semibold text-gray-900 font-kanit ${
                            !notification.isRead ? 'font-bold' : ''
                          }`}>
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
                      
                      {!notification.isRead && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markSingleAsRead(notification.id);
                          }}
                          className="text-gray-400 hover:text-gray-600 ml-2"
                          title="ทำเครื่องหมายว่าอ่านแล้ว"
                        >
                          <FaEye className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}