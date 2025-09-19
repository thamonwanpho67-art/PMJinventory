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

  useEffect(() => {
    fetchTransactions();
  }, [pagination.page, filters]);

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

      const response = await fetch(`/api/supply-transactions?${params}`);
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.data.transactions);
        setPagination(data.data.pagination);
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

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const clearFilters = () => {
    setFilters({
      type: 'all',
      startDate: '',
      endDate: '',
      search: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('th-TH', {
      style: 'currency',
      currency: 'THB'
    });
  };

  const getTransactionBadge = (type: 'IN' | 'OUT') => {
    if (type === 'IN') {
      return (
        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-kanit flex items-center space-x-1">
          <FaArrowUp />
          <span>นำเข้า</span>
        </span>
      );
    } else {
      return (
        <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-kanit flex items-center space-x-1">
          <FaArrowDown />
          <span>เบิกออก</span>
        </span>
      );
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (!filters.search) return true;
    
    const searchTerm = filters.search.toLowerCase();
    return (
      transaction.supply.name.toLowerCase().includes(searchTerm) ||
      transaction.supply.category.toLowerCase().includes(searchTerm) ||
      transaction.user.name.toLowerCase().includes(searchTerm) ||
      transaction.department?.toLowerCase().includes(searchTerm) ||
      transaction.notes?.toLowerCase().includes(searchTerm)
    );
  });

  return (
    <LayoutWrapper>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-kanit font-black bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
              ประวัติการเบิกวัสดุ
            </h1>
            <p className="text-pink-700 font-kanit mt-2">
              ติดตามและจัดการประวัติการเบิกจ่ายวัสดุสิ้นเปลือง
            </p>
          </div>
          <button
            onClick={() => window.location.href = '/admin/supplies/distribute'}
            className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-3 rounded-xl font-kanit font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2"
          >
            <FaBox />
            <span>เบิก-จ่ายวัสดุ</span>
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border border-blue-200">
            <div className="flex items-center space-x-3">
              <FaBox className="text-blue-600 text-2xl" />
              <div>
                <p className="text-blue-800 font-kanit font-bold text-2xl">{pagination.total}</p>
                <p className="text-blue-600 text-sm font-kanit">ทั้งหมด</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl border border-green-200">
            <div className="flex items-center space-x-3">
              <FaArrowUp className="text-green-600 text-2xl" />
              <div>
                <p className="text-green-800 font-kanit font-bold text-2xl">
                  {transactions.filter(t => t.transactionType === 'IN').length}
                </p>
                <p className="text-green-600 text-sm font-kanit">นำเข้า</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-2xl border border-red-200">
            <div className="flex items-center space-x-3">
              <FaArrowDown className="text-red-600 text-2xl" />
              <div>
                <p className="text-red-800 font-kanit font-bold text-2xl">
                  {transactions.filter(t => t.transactionType === 'OUT').length}
                </p>
                <p className="text-red-600 text-sm font-kanit">เบิกออก</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl border border-purple-200">
            <div className="flex items-center space-x-3">
              <FaDownload className="text-purple-600 text-2xl" />
              <div>
                <p className="text-purple-800 font-kanit font-bold text-2xl">
                  {formatCurrency(
                    transactions.reduce((sum, t) => sum + (t.totalAmount || 0), 0)
                  ).replace('THB', '').trim()}
                </p>
                <p className="text-purple-600 text-sm font-kanit">มูลค่ารวม</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg border border-pink-100 p-6 mb-8">
          <h2 className="text-lg font-kanit font-bold text-pink-800 mb-4">ตัวกรอง</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            {/* Search */}
            <div>
              <label className="block text-pink-700 font-kanit font-semibold mb-2">
                ค้นหา
              </label>
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pink-400" />
                <input
                  type="text"
                  placeholder="ค้นหาวัสดุ, ผู้เบิก, แผนก..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 font-kanit text-black"
                />
              </div>
            </div>

            {/* Transaction Type */}
            <div>
              <label className="block text-pink-700 font-kanit font-semibold mb-2">
                ประเภท
              </label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full px-4 py-3 border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 font-kanit text-black"
              >
                <option value="all">ทั้งหมด</option>
                <option value="IN">นำเข้า</option>
                <option value="OUT">เบิกออก</option>
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-pink-700 font-kanit font-semibold mb-2">
                จากวันที่
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full px-4 py-3 border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 font-kanit text-black"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-pink-700 font-kanit font-semibold mb-2">
                ถึงวันที่
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-4 py-3 border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 font-kanit text-black"
              />
            </div>
          </div>

          {/* Clear Filters */}
          <div className="flex justify-end mt-4">
            <button
              onClick={clearFilters}
              className="px-6 py-2 bg-pink-100 text-pink-600 rounded-xl hover:bg-pink-200 transition-colors font-kanit"
            >
              ล้างตัวกรอง
            </button>
          </div>
        </div>

        {/* Transactions Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-200 border-t-pink-600 mx-auto mb-4"></div>
            <p className="text-pink-600 font-kanit">กำลังโหลดข้อมูล...</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg border border-pink-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-pink-50 to-rose-50">
                  <tr>
                    <th className="px-6 py-4 text-left font-kanit font-bold text-pink-800">วันที่</th>
                    <th className="px-6 py-4 text-left font-kanit font-bold text-pink-800">ประเภท</th>
                    <th className="px-6 py-4 text-left font-kanit font-bold text-pink-800">วัสดุ</th>
                    <th className="px-6 py-4 text-left font-kanit font-bold text-pink-800">จำนวน</th>
                    <th className="px-6 py-4 text-left font-kanit font-bold text-pink-800">ผู้ทำรายการ</th>
                    <th className="px-6 py-4 text-left font-kanit font-bold text-pink-800">แผนก</th>
                    <th className="px-6 py-4 text-left font-kanit font-bold text-pink-800">คงเหลือ</th>
                    <th className="px-6 py-4 text-left font-kanit font-bold text-pink-800">มูลค่า</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="border-t border-pink-100 hover:bg-pink-25">
                      <td className="px-6 py-4 font-kanit text-sm">
                        {formatDate(transaction.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        {getTransactionBadge(transaction.transactionType)}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-kanit font-semibold text-gray-800">
                            {transaction.supply.name}
                          </div>
                          <div className="text-sm text-gray-600 font-kanit">
                            {transaction.supply.category}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-kanit font-bold ${
                          transaction.transactionType === 'IN' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.transactionType === 'IN' ? '+' : '-'}{transaction.quantity}
                        </span>
                        <span className="text-gray-500 font-kanit ml-1">
                          {transaction.supply.unit}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <FaUser className="text-gray-400" />
                          <span className="font-kanit">{transaction.user.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-kanit">
                        {transaction.department || '-'}
                      </td>
                      <td className="px-6 py-4 font-kanit font-bold text-blue-600">
                        {transaction.remainingStock} {transaction.supply.unit}
                      </td>
                      <td className="px-6 py-4 font-kanit">
                        {transaction.totalAmount ? formatCurrency(transaction.totalAmount) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-pink-100 flex justify-between items-center">
                <div className="text-sm text-gray-600 font-kanit">
                  แสดง {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} 
                  จาก {pagination.total} รายการ
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-4 py-2 border border-pink-200 rounded-lg font-kanit disabled:opacity-50 disabled:cursor-not-allowed hover:bg-pink-50"
                  >
                    ก่อนหน้า
                  </button>
                  
                  {[...Array(pagination.totalPages)].map((_, index) => {
                    const page = index + 1;
                    if (
                      page === 1 ||
                      page === pagination.totalPages ||
                      (page >= pagination.page - 2 && page <= pagination.page + 2)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-4 py-2 rounded-lg font-kanit ${
                            page === pagination.page
                              ? 'bg-pink-500 text-white'
                              : 'border border-pink-200 hover:bg-pink-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (
                      page === pagination.page - 3 ||
                      page === pagination.page + 3
                    ) {
                      return <span key={page} className="px-2">...</span>;
                    }
                    return null;
                  })}
                  
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-4 py-2 border border-pink-200 rounded-lg font-kanit disabled:opacity-50 disabled:cursor-not-allowed hover:bg-pink-50"
                  >
                    ถัดไป
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {filteredTransactions.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-gray-600 font-kanit text-lg">ไม่พบประวัติการทำรายการ</p>
          </div>
        )}
      </div>
    </LayoutWrapper>
  );
}

