'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import LayoutWrapper from '@/components/LayoutWrapper';
import { FaClock, FaCheckCircle, FaTimesCircle, FaGift, FaClipboardList, FaCalendarAlt, FaBox, FaSearch, FaFilter, FaCalendar } from 'react-icons/fa';

type Loan = {
  id: string;
  quantity: number;
  dueDate?: string;
  dueAt?: string;
  note?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'RETURNED';
  borrowedAt?: string | null;
  returnedAt?: string | null;
  createdAt: string;
  asset: {
    id: string;
    code: string;
    name: string;
    description?: string | null;
  };
  user: {
    id: string;
    name?: string | null;
    email: string;
  };
};

const statusConfig = {
  PENDING: {
    label: 'รอการอนุมัติ',
    icon: FaClock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-200'
  },
  APPROVED: {
    label: 'อนุมัติแล้ว',
    icon: FaCheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-200'
  },
  RETURNED: {
    label: 'คืนแล้ว',
    icon: FaGift,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200'
  },
  REJECTED: {
    label: 'ไม่อนุมัติ',
    icon: FaTimesCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-200'
  }
};

export default function LoansAndHistoryPage() {
  const { status } = useSession();
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const [loans, setLoans] = useState<Loan[]>([]);
  const [filteredLoans, setFilteredLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchLoans = async () => {
    try {
      const response = await fetch('/api/loans');
      if (response.ok) {
        const data = await response.json();
        setLoans(data);
      }
    } catch (error) {
      console.error('Error fetching loans:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterLoans = useCallback(() => {
    let filtered = loans;

    // แยกตาม tab
    if (activeTab === 'current') {
      // หน้ารายการปัจจุบัน - แสดงที่ยังไม่คืน
      filtered = filtered.filter(loan => loan.status !== 'RETURNED');
    } else {
      // หน้าประวัติ - แสดงทั้งหมด
      filtered = loans;
    }

    // กรองตามคำค้นหา
    if (searchTerm) {
      filtered = filtered.filter(
        (loan) =>
          loan.asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          loan.asset.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          loan.note?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // กรองตามสถานะ
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((loan) => loan.status === statusFilter);
    }

    // กรองตามช่วงวันที่
    if (startDate) {
      filtered = filtered.filter((loan) => {
        const loanDate = new Date(loan.createdAt);
        const start = new Date(startDate);
        return loanDate >= start;
      });
    }

    if (endDate) {
      filtered = filtered.filter((loan) => {
        const loanDate = new Date(loan.createdAt);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Set to end of day
        return loanDate <= end;
      });
    }

    setFilteredLoans(filtered);
  }, [loans, activeTab, searchTerm, statusFilter, startDate, endDate]);

  useEffect(() => {
    fetchLoans();
  }, []);

  useEffect(() => {
    filterLoans();
  }, [filterLoans]);

  if (status === 'loading' || loading) {
    return (
      <LayoutWrapper>
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-500 mx-auto"></div>
            <p className="text-pink-600 mt-4 font-kanit text-lg">กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      </LayoutWrapper>
    );
  }

  if (status === 'unauthenticated') {
    redirect('/login');
  }

  const getStatusBadge = (loan: Loan) => {
    const config = statusConfig[loan.status];
    const IconComponent = config.icon;
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${config.color} ${config.bgColor} ${config.borderColor} font-kanit`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCurrentLoansStats = () => {
    const currentLoans = loans.filter(loan => loan.status !== 'RETURNED');
    return {
      total: currentLoans.length,
      pending: currentLoans.filter(loan => loan.status === 'PENDING').length,
      approved: currentLoans.filter(loan => loan.status === 'APPROVED').length,
      rejected: currentLoans.filter(loan => loan.status === 'REJECTED').length,
    };
  };

  const getHistoryStats = () => {
    return {
      total: loans.length,
      returned: loans.filter(loan => loan.status === 'RETURNED').length,
      pending: loans.filter(loan => loan.status === 'PENDING').length,
      approved: loans.filter(loan => loan.status === 'APPROVED').length,
    };
  };

  const currentStats = getCurrentLoansStats();
  const historyStats = getHistoryStats();

  return (
    <LayoutWrapper>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-100">
        <div className="container mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-gray-900 font-kanit mb-2">
              📋 รายการยืม-คืนครุภัณฑ์
            </h1>
            <p className="text-gray-600 font-kanit text-lg">
              จัดการรายการยืมและดูประวัติการยืม-คืนของคุณ
            </p>
          </div>

          {/* Tabs */}
          <div className="mb-8">
            <div className="bg-white rounded-xl shadow-lg p-2">
              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveTab('current')}
                  className={`flex-1 py-3 px-6 rounded-lg font-kanit font-semibold transition-all duration-300 ${
                    activeTab === 'current'
                      ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <FaClipboardList className="inline mr-2" />
                  รายการปัจจุบัน ({currentStats.total})
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`flex-1 py-3 px-6 rounded-lg font-kanit font-semibold transition-all duration-300 ${
                    activeTab === 'history'
                      ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <FaCalendarAlt className="inline mr-2" />
                  ประวัติทั้งหมด ({historyStats.total})
                </button>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {activeTab === 'current' ? (
              <>
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-400">
                  <div className="flex items-center">
                    <FaClipboardList className="text-blue-500 text-2xl mr-3" />
                    <div>
                      <p className="text-sm text-gray-600 font-kanit">รายการทั้งหมด</p>
                      <p className="text-2xl font-bold text-gray-900 font-kanit">{currentStats.total}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-400">
                  <div className="flex items-center">
                    <FaClock className="text-yellow-500 text-2xl mr-3" />
                    <div>
                      <p className="text-sm text-gray-600 font-kanit">รอการอนุมัติ</p>
                      <p className="text-2xl font-bold text-gray-900 font-kanit">{currentStats.pending}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-400">
                  <div className="flex items-center">
                    <FaCheckCircle className="text-green-500 text-2xl mr-3" />
                    <div>
                      <p className="text-sm text-gray-600 font-kanit">อนุมัติแล้ว</p>
                      <p className="text-2xl font-bold text-gray-900 font-kanit">{currentStats.approved}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-400">
                  <div className="flex items-center">
                    <FaTimesCircle className="text-red-500 text-2xl mr-3" />
                    <div>
                      <p className="text-sm text-gray-600 font-kanit">ไม่อนุมัติ</p>
                      <p className="text-2xl font-bold text-gray-900 font-kanit">{currentStats.rejected}</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-400">
                  <div className="flex items-center">
                    <FaCalendarAlt className="text-purple-500 text-2xl mr-3" />
                    <div>
                      <p className="text-sm text-gray-600 font-kanit">ประวัติทั้งหมด</p>
                      <p className="text-2xl font-bold text-gray-900 font-kanit">{historyStats.total}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-400">
                  <div className="flex items-center">
                    <FaGift className="text-blue-500 text-2xl mr-3" />
                    <div>
                      <p className="text-sm text-gray-600 font-kanit">คืนแล้ว</p>
                      <p className="text-2xl font-bold text-gray-900 font-kanit">{historyStats.returned}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-400">
                  <div className="flex items-center">
                    <FaClock className="text-yellow-500 text-2xl mr-3" />
                    <div>
                      <p className="text-sm text-gray-600 font-kanit">รอการอนุมัติ</p>
                      <p className="text-2xl font-bold text-gray-900 font-kanit">{historyStats.pending}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-400">
                  <div className="flex items-center">
                    <FaCheckCircle className="text-green-500 text-2xl mr-3" />
                    <div>
                      <p className="text-sm text-gray-600 font-kanit">อนุมัติแล้ว</p>
                      <p className="text-2xl font-bold text-gray-900 font-kanit">{historyStats.approved}</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Filter Bar */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  {/* Search */}
                  <div className="relative flex-1">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="ค้นหาชื่ออุปกรณ์, รหัส, หรือหมายเหตุ..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent font-kanit text-black"
                    />
                  </div>

                  {/* Status Filter */}
                  <div className="relative">
                    <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent font-kanit bg-white text-black"
                    >
                      <option value="ALL">ทุกสถานะ</option>
                      <option value="PENDING">รอการอนุมัติ</option>
                      <option value="APPROVED">อนุมัติแล้ว</option>
                      <option value="RETURNED">คืนแล้ว</option>
                      <option value="REJECTED">ไม่อนุมัติ</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Date Range Filter */}
              <div className="border-t pt-4">
                <div className="flex items-center mb-3">
                  <FaCalendar className="text-pink-500 mr-2" />
                  <h3 className="font-kanit font-semibold text-gray-700">กรองตามช่วงวันที่</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 font-kanit mb-1">
                      วันที่เริ่มต้น
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full py-3 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent font-kanit text-black"
                    />
                  </div>
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 font-kanit mb-1">
                      วันที่สิ้นสุด
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full py-3 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent font-kanit text-black"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setStartDate('');
                        setEndDate('');
                      }}
                      className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-kanit font-medium transition-colors"
                    >
                      ล้างวันที่
                    </button>
                  </div>
                </div>

                {/* Quick Date Filters */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      const today = new Date();
                      setStartDate(today.toISOString().split('T')[0]);
                      setEndDate(today.toISOString().split('T')[0]);
                    }}
                    className="px-4 py-2 bg-pink-100 hover:bg-pink-200 text-pink-700 rounded-lg font-kanit text-sm transition-colors"
                  >
                    วันนี้
                  </button>
                  <button
                    onClick={() => {
                      const today = new Date();
                      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                      setStartDate(weekAgo.toISOString().split('T')[0]);
                      setEndDate(today.toISOString().split('T')[0]);
                    }}
                    className="px-4 py-2 bg-pink-100 hover:bg-pink-200 text-pink-700 rounded-lg font-kanit text-sm transition-colors"
                  >
                    7 วันที่แล้ว
                  </button>
                  <button
                    onClick={() => {
                      const today = new Date();
                      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                      setStartDate(monthAgo.toISOString().split('T')[0]);
                      setEndDate(today.toISOString().split('T')[0]);
                    }}
                    className="px-4 py-2 bg-pink-100 hover:bg-pink-200 text-pink-700 rounded-lg font-kanit text-sm transition-colors"
                  >
                    30 วันที่แล้ว
                  </button>
                  <button
                    onClick={() => {
                      const today = new Date();
                      const threeMonthsAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
                      setStartDate(threeMonthsAgo.toISOString().split('T')[0]);
                      setEndDate(today.toISOString().split('T')[0]);
                    }}
                    className="px-4 py-2 bg-pink-100 hover:bg-pink-200 text-pink-700 rounded-lg font-kanit text-sm transition-colors"
                  >
                    3 เดือนที่แล้ว
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-600 font-kanit">
              แสดงผล {filteredLoans.length} รายการจากทั้งหมด {activeTab === 'current' ? currentStats.total : historyStats.total} รายการ
              {(startDate || endDate) && (
                <span className="text-pink-600 ml-2">
                  {startDate && endDate && startDate === endDate 
                    ? `(วันที่ ${new Date(startDate).toLocaleDateString('th-TH')})` 
                    : startDate && endDate 
                    ? `(${new Date(startDate).toLocaleDateString('th-TH')} - ${new Date(endDate).toLocaleDateString('th-TH')})` 
                    : startDate 
                    ? `(ตั้งแต่ ${new Date(startDate).toLocaleDateString('th-TH')})` 
                    : `(ถึง ${new Date(endDate).toLocaleDateString('th-TH')})`
                  }
                </span>
              )}
            </div>
          </div>

          {/* Loans List */}
          <div className="space-y-6">
            {filteredLoans.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <FaBox className="mx-auto text-gray-300 text-6xl mb-4" />
                <p className="text-gray-500 font-kanit text-xl">
                  {activeTab === 'current' ? 'ไม่มีรายการยืมปัจจุบัน' : 'ไม่พบประวัติการยืม'}
                </p>
                <p className="text-gray-400 font-kanit">
                  {searchTerm || statusFilter !== 'ALL' 
                    ? 'ลองเปลี่ยนเงื่อนไขการกรองข้อมูล' 
                    : activeTab === 'current' 
                      ? 'ยืนคำขอยืมอุปกรณ์เพื่อเริ่มต้นใช้งาน'
                      : 'เมื่อคุณมีการยืม-คืนอุปกรณ์ จะปรากฏที่นี่'}
                </p>
              </div>
            ) : (
              filteredLoans.map((loan) => (
                <div key={loan.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Asset Info */}
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl flex items-center justify-center">
                        <FaBox className="text-white text-2xl" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 font-kanit">
                          {loan.asset.name}
                        </h3>
                        <p className="text-gray-600 font-kanit">
                          รหัส: {loan.asset.code} • จำนวน: {loan.quantity} ชิ้น
                        </p>
                        {loan.note && (
                          <p className="text-sm text-gray-500 font-kanit mt-1">
                            หมายเหตุ: {loan.note}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Status and Dates */}
                    <div className="text-right">
                      <div className="mb-2">
                        {getStatusBadge(loan)}
                      </div>
                      <div className="text-sm text-gray-500 font-kanit space-y-1">
                        <p>วันที่ยื่นคำขอ: {formatDate(loan.createdAt)}</p>
                        {loan.dueDate && (
                          <p>กำหนดคืน: {formatDate(loan.dueDate)}</p>
                        )}
                        {loan.dueAt && (
                          <p>กำหนดคืน: {formatDate(loan.dueAt)}</p>
                        )}
                        {loan.borrowedAt && (
                          <p>วันที่อนุมัติ: {formatDate(loan.borrowedAt)}</p>
                        )}
                        {loan.returnedAt && (
                          <p>วันที่คืน: {formatDate(loan.returnedAt)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </LayoutWrapper>
  );
}

