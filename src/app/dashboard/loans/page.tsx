'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import LayoutWrapper from '@/components/LayoutWrapper';
import { FaClock, FaCheckCircle, FaTimesCircle, FaGift, FaClipboardList, FaStar } from 'react-icons/fa';

type Loan = {
  id: string;
  quantity: number;
  dueDate: string;
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
    icon: FaClock
  },
  APPROVED: {
    label: 'อนุมัติแล้ว',
    color: 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800',
    icon: FaCheckCircle
  },
  REJECTED: {
    label: 'ไม่อนุมัติ',
    color: 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800',
    icon: FaTimesCircle
  },
  RETURNED: {
    label: 'คืนแล้ว',
    color: 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800',
    icon: FaGift
  }
};

export default function LoansPage() {
  const { data: session, status } = useSession();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  if (status === 'unauthenticated') {
    redirect('/login');
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
              รายการยืมของฉัน
            </h1>
            <p className="text-lg text-pink-700 font-medium max-w-2xl mx-auto">
              ตรวจสอบสถานะและประวัติการยืมครุภัณฑ์ของคุณ
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {loans.filter(loan => loan.status === 'RETURNED').length}
            </div>
            <div className="text-green-700 text-sm font-medium">คืนแล้ว</div>
          </div>
          <div className="bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-pink-600">{loans.length}</div>
            <div className="text-pink-700 text-sm font-medium">ทั้งหมด</div>
          </div>
        </div>

        {/* Loans List */}
        <div className="bg-gradient-to-r from-white to-pink-50 rounded-2xl border border-pink-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-pink-200 bg-gradient-to-r from-pink-50 to-rose-50 flex items-center space-x-2">
            <FaStar className="text-pink-600 text-xl" />
            <h2 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent font-kanit">
              ประวัติการยืมทั้งหมด
            </h2>
          </div>

          {loans.length === 0 ? (
            <div className="text-center py-16">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-3 font-kanit">
                ยังไม่มีประวัติการยืม
              </h3>
              <p className="text-pink-600 font-medium mb-6">เริ่มต้นยืมครุภัณฑ์แรกของคุณ</p>
              <a
                href="/dashboard/borrow"
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-3 rounded-xl font-medium hover:from-pink-600 hover:to-rose-600 transition-all shadow-lg hover:shadow-xl"
              >
                <span>ยืมครุภัณฑ์</span>
              </a>
            </div>
          ) : (
            <div className="divide-y divide-pink-100">
              {loans.map((loan) => (
                <div key={loan.id} className="p-6 hover:bg-pink-50/50 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 font-kanit">
                            {loan.asset.name}
                          </h3>
                          <p className="text-sm text-pink-600 font-medium">
                            รหัส: {loan.asset.code}
                          </p>
                        </div>
                        <span className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-bold ${statusConfig[loan.status].color}`}>
                          {React.createElement(statusConfig[loan.status].icon, { className: 'w-3 h-3' })}
                          <span>{statusConfig[loan.status].label}</span>
                        </span>
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
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
                            {new Date(loan.dueDate).toLocaleDateString('th-TH')}
                          </p>
                        </div>
                        <div>
                          <span className="text-pink-600 font-medium">สถานะ:</span>
                          <p className="text-gray-900">
                            {loan.status === 'APPROVED' && loan.borrowedAt 
                              ? `ยืมแล้ว (${new Date(loan.borrowedAt).toLocaleDateString('th-TH')})`
                              : loan.status === 'RETURNED' && loan.returnedAt
                              ? `คืนแล้ว (${new Date(loan.returnedAt).toLocaleDateString('th-TH')})`
                              : statusConfig[loan.status].label
                            }
                          </p>
                        </div>
                      </div>

                      {loan.note && (
                        <div className="mt-3 p-3 bg-pink-50 rounded-lg border border-pink-100">
                          <span className="text-pink-600 font-medium text-sm">หมายเหตุ:</span>
                          <p className="text-gray-700 text-sm mt-1">{loan.note}</p>
                        </div>
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

