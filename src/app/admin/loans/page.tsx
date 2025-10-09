'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import LayoutWrapper from '@/components/LayoutWrapper';
import { FaClipboardList, FaClock, FaCheckCircle, FaTimesCircle, FaGift, FaSearch, FaFilter, FaUser, FaBox } from 'react-icons/fa';

type Loan = {
  id: string;
  quantity: number;
  dueAt: string | null;
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
    color: 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800',
    icon: FaClock,
    bgColor: 'bg-yellow-50'
  },
  APPROVED: {
    label: 'อนุมัติแล้ว',
    color: 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800',
    icon: FaCheckCircle,
    bgColor: 'bg-blue-50'
  },
  REJECTED: {
    label: 'ไม่อนุมัติ',
    color: 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800',
    icon: FaTimesCircle,
    bgColor: 'bg-red-50'
  },
  RETURNED: {
    label: 'คืนแล้ว',
    color: 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800',
    icon: FaGift,
    bgColor: 'bg-green-50'
  }
};

export default function AdminLoansPage() {
  const { data: session, status } = useSession();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (session?.user?.id) {
      fetchLoans();
    }
  }, [session?.user?.id]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-rose-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-200 border-t-pink-600 mx-auto mb-4"></div>
          <p className="text-pink-600 font-medium">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated' || session?.user?.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const fetchLoans = async () => {
    try {
      const response = await fetch('/api/loans');
      if (response.ok) {
        const data = await response.json();
        setLoans(data);
      } else {
        setError('ไม่สามารถโหลดข้อมูลได้');
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (loanId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/loans/${loanId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchLoans(); // Refresh the list
      }
    } catch (error) {
      console.error('Error updating loan status:', error);
    }
  };

  const filteredLoans = loans.filter(loan => {
    const matchesStatus = filterStatus === 'ALL' || loan.status === filterStatus;
    const matchesSearch = 
      loan.asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.asset.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <LayoutWrapper>
        <div className="p-6">
          <div className="flex justify-center items-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-200 border-t-pink-600"></div>
          </div>
        </div>
      </LayoutWrapper>
    );
  }

  if (error) {
    return (
      <LayoutWrapper>
        <div className="p-6">
          <div className="bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 rounded-2xl p-6">
            <p className="text-rose-600 font-medium text-center">{error}</p>
          </div>
        </div>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper>
      <div className="p-6 space-y-8">
        {/* Header Section */}
        <div className="text-center py-12 bg-gradient-to-r from-pink-50 to-rose-50 rounded-3xl border border-pink-200 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-100/50 to-rose-100/50"></div>
          <div className="relative z-10">
            <FaClipboardList className="text-6xl mb-6 text-pink-500 mx-auto" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent font-kanit mb-4">
              จัดการคำขอยืม
            </h1>
            <p className="text-lg text-pink-700 font-medium max-w-2xl mx-auto">
              อนุมัติ ปฏิเสธ และติดตามสถานะคำขอยืมครุภัณฑ์ทั้งหมด
            </p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-gradient-to-r from-white to-pink-50 rounded-2xl border border-pink-200 p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="ค้นหาครุภัณฑ์หรือผู้ยืม..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent font-kanit text-black"
              />
            </div>
            
            <div className="relative">
              <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent font-kanit bg-white text-black"
              >
                <option value="ALL">ทั้งหมด</option>
                <option value="PENDING">รอการอนุมัติ</option>
                <option value="APPROVED">อนุมัติแล้ว</option>
                <option value="REJECTED">ไม่อนุมัติ</option>
                <option value="RETURNED">คืนแล้ว</option>
              </select>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-pink-600">{loans.length}</div>
            <div className="text-pink-700 text-sm font-medium">ทั้งหมด</div>
          </div>
          <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {loans.filter(loan => loan.status === 'PENDING').length}
            </div>
            <div className="text-yellow-700 text-sm font-medium">รอการอนุมัติ</div>
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {loans.filter(loan => loan.status === 'APPROVED').length}
            </div>
            <div className="text-blue-700 text-sm font-medium">อนุมัติแล้ว</div>
          </div>
          <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {loans.filter(loan => loan.status === 'REJECTED').length}
            </div>
            <div className="text-red-700 text-sm font-medium">ไม่อนุมัติ</div>
          </div>
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {loans.filter(loan => loan.status === 'RETURNED').length}
            </div>
            <div className="text-green-700 text-sm font-medium">คืนแล้ว</div>
          </div>
        </div>

        {/* Loans List */}
        <div className="bg-gradient-to-r from-white to-pink-50 rounded-2xl border border-pink-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-pink-200 bg-gradient-to-r from-pink-50 to-rose-50 flex items-center space-x-2">
            <FaClipboardList className="text-pink-600 text-lg" />
            <h2 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent font-kanit">
              รายการคำขอยืมทั้งหมด ({filteredLoans.length})
            </h2>
          </div>

          {filteredLoans.length === 0 ? (
            <div className="text-center py-16">
              <FaClipboardList className="text-6xl mb-6 text-pink-400 mx-auto" />
              <h3 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-3 font-kanit">
                ไม่มีคำขอยืม
              </h3>
              <p className="text-pink-600 font-medium">
                {searchTerm || filterStatus !== 'ALL' ? 'ไม่พบคำขอยืมที่ตรงกับเงื่อนไขการค้นหา' : 'ยังไม่มีคำขอยืมในระบบ'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-pink-100">
              {filteredLoans.map((loan) => (
                <div key={loan.id} className={`p-6 hover:${statusConfig[loan.status].bgColor} transition-colors`}>
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start space-x-3">
                          <FaBox className="text-pink-600 text-lg mt-1" />
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 font-kanit">
                              {loan.asset.name}
                            </h3>
                            <p className="text-sm text-pink-600 font-medium">
                              รหัส: {loan.asset.code}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <FaUser className="text-gray-400 text-xs" />
                              <p className="text-sm text-gray-600">
                                ผู้ยืม: {loan.user.name || loan.user.email}
                              </p>
                            </div>
                          </div>
                        </div>
                        <span className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-bold ${statusConfig[loan.status].color}`}>
                          {React.createElement(statusConfig[loan.status].icon, { className: 'w-3 h-3' })}
                          <span>{statusConfig[loan.status].label}</span>
                        </span>
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-4">
                        <div>
                          <span className="text-pink-600 font-medium">จำนวน:</span>
                          <p className="text-gray-900 font-semibold">{loan.quantity} ชิ้น</p>
                        </div>
                        <div>
                          <span className="text-pink-600 font-medium">วันที่ยื่นคำขอ:</span>
                          <p className="text-gray-900">
                            {new Date(loan.createdAt).toLocaleDateString('th-TH')}
                          </p>
                        </div>
                        <div>
                          <span className="text-pink-600 font-medium">กำหนดคืน:</span>
                          <p className="text-gray-900">
                            {loan.dueAt || 'ไม่ระบุ'}
                          </p>
                        </div>
                        <div>
                          <span className="text-pink-600 font-medium">อีเมล:</span>
                          <p className="text-gray-900 text-xs">{loan.user.email}</p>
                        </div>
                      </div>

                      {loan.note && (
                        <div className="mb-4 p-3 bg-pink-50 rounded-lg border border-pink-100">
                          <span className="text-pink-600 font-medium text-sm">หมายเหตุ:</span>
                          <p className="text-gray-700 text-sm mt-1">{loan.note}</p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      {loan.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleStatusUpdate(loan.id, 'APPROVED')}
                            className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg text-sm font-medium hover:from-green-600 hover:to-emerald-600 transition-all"
                          >
                            อนุมัติ
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(loan.id, 'REJECTED')}
                            className="px-4 py-2 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-lg text-sm font-medium hover:from-red-600 hover:to-rose-600 transition-all"
                          >
                            ปฏิเสธ
                          </button>
                        </div>
                      )}

                      {loan.status === 'APPROVED' && (
                        <button
                          onClick={() => handleStatusUpdate(loan.id, 'RETURNED')}
                          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-indigo-600 transition-all"
                        >
                          บันทึกการคืน
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </LayoutWrapper>
  );
}

