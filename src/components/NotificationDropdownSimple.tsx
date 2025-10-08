'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaBell } from 'react-icons/fa';

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
};

export default function NotificationDropdownSimple() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // ดึงข้อมูลการแจ้งเตือนจากฐานข้อมูล
  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        // API ส่งข้อมูลมาในรูปแบบ { notifications: [], unreadCount: 0 }
        setNotifications(data.notifications || data || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // นับจำนวนที่ยังไม่ได้อ่าน
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // จัดการการคลิกการแจ้งเตือน
  const handleNotificationClick = async (notification: Notification) => {
    try {
      // อัปเดตสถานะเป็นอ่านแล้ว
      if (!notification.isRead) {
        await fetch('/api/notifications', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ids: [notification.id],
            markAsRead: true
          })
        });

        // อัปเดต state ในหน้า
        setNotifications(prev => 
          prev.map(n => 
            n.id === notification.id ? { ...n, isRead: true } : n
          )
        );
      }

      // ปิด dropdown
      setIsOpen(false);

      // นำทางไปหน้าที่เกี่ยวข้อง
      switch (notification.type) {
        case 'LOAN_REQUEST':
        case 'LOAN_APPROVED':
        case 'LOAN_RETURNED':
          router.push('/admin/loans');
          break;
        case 'LOW_STOCK':
          router.push('/admin/assets');
          break;
        default:
          router.push('/admin');
          break;
      }
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  // ทำเครื่องหมายอ่านทั้งหมด
  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          markAsRead: true
        })
      });

      // อัปเดต state
      setNotifications(prev => 
        prev.map(n => ({ ...n, isRead: true }))
      );
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // รีเฟรชการแจ้งเตือนเมื่อเปิด dropdown
  const handleDropdownOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchNotifications(); // รีเฟรชข้อมูลเมื่อเปิด
    }
  };

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
      case 'LOAN_APPROVED':
        return 'border-l-green-500 bg-green-50';
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
      <button
        onClick={handleDropdownOpen}
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
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500 font-kanit">
                  {unreadCount} รายการใหม่
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-blue-600 hover:text-blue-800 font-kanit underline"
                  >
                    อ่านทั้งหมด
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2 font-kanit">กำลังโหลด...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center">
                  <p className="text-sm text-gray-500 font-kanit">ไม่มีการแจ้งเตือน</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`border-l-4 p-4 border-b hover:bg-blue-50 cursor-pointer transition-colors ${
                      getNotificationColor(notification.type)
                    } ${!notification.isRead ? 'bg-white' : 'bg-gray-50'}`}
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
                ))
              )}
            </div>

            <div className="p-3 border-t bg-gray-50 text-center">
              <p className="text-xs text-gray-500 font-kanit">
                💡 คลิกที่การแจ้งเตือนเพื่อไปยังหน้าที่เกี่ยวข้อง
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}