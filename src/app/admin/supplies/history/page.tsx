'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import LayoutWrapper from '@/components/LayoutWrapper';
import AlertService from '@/lib/alert';
import { 
  FaHistory, 
  FaArrowDown, 
  FaArrowUp, 
  FaSearch,
  FaCalendarAlt,
  FaFilter,
  FaBox,
  FaUser,
  FaBuilding,
  FaFileExcel
} from 'react-icons/fa';

type SupplyTransaction = {
  id: string;
  transactionType: 'IN' | 'OUT';
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
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

export default function SupplyHistoryPage() {
  const { data: session, status } = useSession();
  const [transactions, setTransactions] = useState<SupplyTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'IN' | 'OUT'>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (filterType !== 'ALL') {
        params.append('type', filterType);
      }
      if (startDate) {
        params.append('startDate', startDate);
      }
      if (endDate) {
        params.append('endDate', endDate);
      }

      const response = await fetch(`/api/supply-transactions?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.data.transactions);
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
    fetchTransactions();
  }, [filterType, startDate, endDate]);

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

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.supply.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.supply.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.department?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatPrice = (price?: number) => {
    if (!price) return '-';
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(price);
  };

  const exportToExcel = () => {
    // สร้างข้อมูลสำหรับ Excel
    const excelData = filteredTransactions.map(transaction => ({
      'วันที่': formatDate(transaction.createdAt),
      'ประเภท': transaction.transactionType === 'IN' ? 'นำเข้า' : 'เบิกออก',
      'ชื่อวัสดุ': transaction.supply.name,
      'หมวดหมู่': transaction.supply.category,
      'จำนวน': `${transaction.quantity} ${transaction.supply.unit}`,
      'ราคาต่อหน่วย': transaction.unitPrice || '-',
      'ราคารวม': transaction.totalPrice || '-',
      'แผนก': transaction.department || '-',
      'ผู้ทำรายการ': transaction.user.name,
      'หมายเหตุ': transaction.notes || '-'
    }));

    // แปลงเป็น CSV
    const headers = Object.keys(excelData[0] || {});
    const csvContent = [
      '\uFEFF' + headers.join(','), // เพิ่ม BOM สำหรับ UTF-8
      ...excelData.map(row => 
        headers.map(header => {
          const value = row[header as keyof typeof row];
          // ใส่ "" ถ้ามี comma หรือ newline
          return typeof value === 'string' && (value.includes(',') || value.includes('\n'))
            ? `"${value.replace(/"/g, '""')}"` 
            : value;
        }).join(',')
      )
    ].join('\n');

    // สร้าง Blob และดาวน์โหลด
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const filename = `supply-history-${new Date().toISOString().split('T')[0]}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    AlertService.success('ดาวน์โหลดไฟล์สำเร็จ');
  };

  return (
    <LayoutWrapper>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-kanit font-black bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
              ประวัติการเบิก-นำเข้าวัสดุ
            </h1>
            <p className="text-pink-700 font-kanit mt-2">
              ติดตามและจัดการประวัติการทำรายการวัสดุสิ้นเปลือง
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-kanit font-medium py-2 px-4 rounded-lg transition duration-300 shadow-lg"
              disabled={filteredTransactions.length === 0}
            >
              <FaFileExcel />
              ดาวน์โหลด Excel
            </button>
            <FaHistory className="text-pink-500 text-3xl" />
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {/* Search */}
          <div className="relative md:col-span-2">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อวัสดุ, หมวดหมู่, ผู้ทำรายการ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent font-kanit text-gray-900"
            />
          </div>

          {/* Transaction Type Filter */}
          <div className="relative">
            <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'ALL' | 'IN' | 'OUT')}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent font-kanit bg-white text-gray-900"
            >
              <option value="ALL">ทุกประเภท</option>
              <option value="IN">นำเข้า</option>
              <option value="OUT">เบิกออก</option>
            </select>
          </div>

          {/* Date Range Toggle */}
          <button
            onClick={() => {
              const today = new Date().toISOString().split('T')[0];
              const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
              setStartDate(lastMonth);
              setEndDate(today);
            }}
            className="px-4 py-3 bg-pink-100 text-pink-700 rounded-lg hover:bg-pink-200 transition-colors font-kanit font-semibold flex items-center justify-center gap-2"
          >
            <FaCalendarAlt />
            30 วันล่าสุด
          </button>
        </div>

        {/* Date Range Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-gray-900 font-kanit font-semibold mb-2">
              วันที่เริ่มต้น
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 font-kanit text-gray-900"
            />
          </div>
          <div>
            <label className="block text-gray-900 font-kanit font-semibold mb-2">
              วันที่สิ้นสุด
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 font-kanit text-gray-900"
            />
          </div>
        </div>

        {/* Summary Stats */}
        {filteredTransactions.length > 0 && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-700 font-kanit text-sm">รายการนำเข้า</p>
                  <p className="text-3xl font-kanit font-bold text-green-800">
                    {filteredTransactions.filter(t => t.transactionType === 'IN').length}
                  </p>
                </div>
                <FaArrowUp className="text-4xl text-green-500" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-700 font-kanit text-sm">รายการเบิกออก</p>
                  <p className="text-3xl font-kanit font-bold text-red-800">
                    {filteredTransactions.filter(t => t.transactionType === 'OUT').length}
                  </p>
                </div>
                <FaArrowDown className="text-4xl text-red-500" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-pink-50 to-rose-100 rounded-xl p-6 border border-pink-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-pink-700 font-kanit text-sm">มูลค่ารวม</p>
                  <p className="text-2xl font-kanit font-bold text-pink-800">
                    {formatPrice(
                      filteredTransactions.reduce((sum, t) => sum + (t.totalPrice || 0), 0)
                    )}
                  </p>
                </div>
                <FaBox className="text-4xl text-pink-500" />
              </div>
            </div>
          </div>
        )}

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
                    <th className="px-6 py-4 text-left font-kanit font-bold text-pink-800">วันที่/เวลา</th>
                    <th className="px-6 py-4 text-left font-kanit font-bold text-pink-800">ประเภท</th>
                    <th className="px-6 py-4 text-left font-kanit font-bold text-pink-800">ชื่อวัสดุ</th>
                    <th className="px-6 py-4 text-left font-kanit font-bold text-pink-800">จำนวน</th>
                    <th className="px-6 py-4 text-left font-kanit font-bold text-pink-800">มูลค่า</th>
                    <th className="px-6 py-4 text-left font-kanit font-bold text-pink-800">แผนก</th>
                    <th className="px-6 py-4 text-left font-kanit font-bold text-pink-800">ผู้ทำรายการ</th>
                    <th className="px-6 py-4 text-left font-kanit font-bold text-pink-800">หมายเหตุ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center">
                        <FaBox className="text-6xl text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-900 font-kanit">ไม่พบประวัติการทำรายการ</p>
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((transaction) => (
                      <tr key={transaction.id} className="border-t border-pink-100 hover:bg-pink-25">
                        <td className="px-6 py-4">
                          <div className="text-sm font-kanit text-gray-900">
                            {formatDate(transaction.createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {transaction.transactionType === 'IN' ? (
                            <span className="flex items-center space-x-2 text-green-600 font-kanit font-semibold">
                              <FaArrowUp />
                              <span>นำเข้า</span>
                            </span>
                          ) : (
                            <span className="flex items-center space-x-2 text-red-600 font-kanit font-semibold">
                              <FaArrowDown />
                              <span>เบิกออก</span>
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-kanit font-semibold text-gray-900">
                            {transaction.supply.name}
                          </div>
                          <div className="text-sm text-gray-900 font-kanit">
                            {transaction.supply.category}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-kanit font-bold text-gray-900">
                            {transaction.quantity} {transaction.supply.unit}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-kanit text-gray-900">
                            {formatPrice(transaction.totalPrice)}
                          </div>
                          {transaction.unitPrice && (
                            <div className="text-sm text-gray-900 font-kanit">
                              ({formatPrice(transaction.unitPrice)}/{transaction.supply.unit})
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {transaction.department ? (
                            <div className="flex items-center space-x-2">
                              <FaBuilding className="text-pink-500" />
                              <span className="font-kanit text-gray-900">{transaction.department}</span>
                            </div>
                          ) : (
                            <span className="text-gray-900 font-kanit">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <FaUser className="text-pink-500" />
                            <div>
                              <div className="font-kanit text-gray-900">{transaction.user.name}</div>
                              {transaction.approvedBy && (
                                <div className="text-sm text-gray-900 font-kanit">
                                  อนุมัติโดย: {transaction.approvedBy}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-kanit text-gray-900 max-w-xs truncate">
                            {transaction.notes || '-'}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </LayoutWrapper>
  );
}
