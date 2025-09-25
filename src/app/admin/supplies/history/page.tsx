'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import LayoutWrapper from '@/components/LayoutWrapper';
import AlertService from '@/lib/alert';
import { 
  FaArrowDown, 
  FaArrowUp, 
  FaSearch, 
  FaFilter,
  FaCalendarAlt,
  FaDownload,
  FaEye,
  FaUser,
  FaBox
} from 'react-icons/fa';

type Transaction = {
  id: string;
  transactionType: 'IN' | 'OUT';
  quantity: number;
  remainingStock: number;
  unitPrice?: number;
  totalAmount?: number;
  department?: string;
  notes?: string;
  approvedBy?: string;
  createdAt: string;
  supply: {
    name: string;
    category: string;
    unit: string;
  };
  user: {
    name: string;
    email: string;
  };
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export default function SupplyHistoryPage() {
  const { data: session, status } = useSession();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: 'all',
    startDate: '',
    endDate: '',
    search: ''
  });

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      });

      if (filters.type !== 'all') {
        params.append('type', filters.type);
      }
      if (filters.startDate) {
        params.append('startDate', filters.startDate);
      }
      if (filters.endDate) {
        params.append('endDate', filters.endDate);
      }
      if (filters.search) {
        params.append('search', filters.search);
      }

      const response = await fetch(`/api/supply-transactions?${params}`);
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
        setPagination(data.pagination || pagination);
      } else {
        await AlertService.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      await AlertService.error('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      fetchTransactions();
    }
  }, [pagination.page, filters, status, session]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-rose-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-200 border-t-pink-600 mx-auto mb-4"></div>
          <p className="text-pink-600 font-medium">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated' || session?.user?.role !== 'ADMIN') {
    redirect('/login');
  }

  // Rest of component content continues...
  return (
    <LayoutWrapper>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-50 p-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-xl border border-pink-100 p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="flex items-center space-x-3 mb-4 md:mb-0">
                <div className="p-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl">
                  <FaBox className="text-white text-xl" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 font-kanit">
                    ประวัติการเบิก-จ่ายวัสดุ
                  </h1>
                  <p className="text-gray-600 font-kanit">
                    ดูประวัติการทำธุรกรรมวัสดุสิ้นเปลืองทั้งหมด
                  </p>
                </div>
              </div>
            </div>
          </div>

          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-200 border-t-pink-600 mx-auto mb-4"></div>
              <p className="text-pink-600 font-kanit">กำลังโหลดข้อมูล...</p>
            </div>
          )}

          {!loading && transactions.length === 0 && (
            <div className="bg-white rounded-2xl shadow-xl border border-pink-100 p-12 text-center">
              <FaBox className="text-6xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 font-kanit mb-2">
                ไม่พบข้อมูล
              </h3>
              <p className="text-gray-600 font-kanit">
                ยังไม่มีประวัติการทำธุรกรรมวัสดุ
              </p>
            </div>
          )}
        </div>
      </div>
    </LayoutWrapper>
  );
}