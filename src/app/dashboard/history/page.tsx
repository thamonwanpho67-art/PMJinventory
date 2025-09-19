'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { FaClock, FaCheckCircle, FaTimesCircle, FaHourglass, FaCalendarAlt, FaBox, FaSearch, FaFilter } from 'react-icons/fa';
import LayoutWrapper from '@/components/LayoutWrapper';

interface Loan {
  id: string;
  quantity: number;
  status: 'PENDING' | 'APPROVED' | 'RETURNED' | 'REJECTED';
  borrowedAt: string | null;
  dueAt: string;
  returnedAt: string | null;
  note: string | null;
  createdAt: string;
  asset: {
    id: string;
    name: string;
    code: string;
  };
}

export default function UserHistoryPage() {
  const { data: session, status } = useSession();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [filteredLoans, setFilteredLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('ALL');

  useEffect(() => {
    if (session?.user?.id) {
      fetchLoans();
    }
  }, [session?.user?.id]);

  useEffect(() => {
    filterLoans();
  }, [loans, searchTerm, statusFilter, dateFilter]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-500 mx-auto"></div>
          <p className="text-pink-600 mt-4 font-kanit text-lg">กำลังโหลดข้อมูล...</p>
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
      const data = await response.json();
      setLoans(data);
    } catch (error) {
      console.error('Error fetching loans:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterLoans = () => {
    let filtered = loans;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (loan) =>
          loan.asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          loan.asset.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((loan) => loan.status === statusFilter);
    }

    // Filter by date
    if (dateFilter !== 'ALL') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      filtered = filtered.filter((loan) => {
        const loanDate = new Date(loan.createdAt);
        switch (dateFilter) {
          case 'TODAY':
            return loanDate >= today;
          case 'YESTERDAY':
            return loanDate >= yesterday && loanDate < today;
          case 'WEEK':
            return loanDate >= weekAgo;
          case 'MONTH':
            return loanDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    setFilteredLoans(filtered);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <FaClock className="text-yellow-500" />;
      case 'APPROVED':
        return <FaCheckCircle className="text-green-500" />;
      case 'RETURNED':
        return <FaCheckCircle className="text-blue-500" />;
      case 'REJECTED':
        return <FaTimesCircle className="text-red-500" />;
      default:
        return <FaHourglass className="text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'รออนุมัติ';
      case 'APPROVED':
        return 'อนุมัติแล้ว';
      case 'RETURNED':
        return 'คืนแล้ว';
      case 'REJECTED':
        return 'ปฏิเสธ';
      default:
        return 'ไม่ระบุ';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'APPROVED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'RETURNED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getProgressPercentage = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 25;
      case 'APPROVED':
        return 75;
      case 'RETURNED':
        return 100;
      case 'REJECTED':
        return 0;
      default:
        return 0;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-500 mx-auto"></div>
          <p className="text-pink-600 mt-4 font-kanit text-lg">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <LayoutWrapper>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-100">
        <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 font-kanit mb-2">
            📈 ประวัติการยืมของฉัน
          </h1>
          <p className="text-gray-600 font-kanit text-lg">
            ดูประวัติการยืมอุปกรณ์ทั้งหมดของคุณ
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-400">
            <div className="flex items-center">
              <FaBox className="text-blue-500 text-2xl mr-3" />
              <div>
                <p className="text-sm text-gray-600 font-kanit">ทั้งหมด</p>
                <p className="text-2xl font-bold text-gray-900 font-kanit">
                  {loans.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-400">
            <div className="flex items-center">
              <FaClock className="text-yellow-500 text-2xl mr-3" />
              <div>
                <p className="text-sm text-gray-600 font-kanit">รออนุมัติ</p>
                <p className="text-2xl font-bold text-gray-900 font-kanit">
                  {loans.filter(loan => loan.status === 'PENDING').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-400">
            <div className="flex items-center">
              <FaCheckCircle className="text-green-500 text-2xl mr-3" />
              <div>
                <p className="text-sm text-gray-600 font-kanit">อนุมัติแล้ว</p>
                <p className="text-2xl font-bold text-gray-900 font-kanit">
                  {loans.filter(loan => loan.status === 'APPROVED').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-600">
            <div className="flex items-center">
              <FaCheckCircle className="text-blue-500 text-2xl mr-3" />
              <div>
                <p className="text-sm text-gray-600 font-kanit">คืนแล้ว</p>
                <p className="text-2xl font-bold text-gray-900 font-kanit">
                  {loans.filter(loan => loan.status === 'RETURNED').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="ค้นหาอุปกรณ์หรือรหัส..."
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
                <option value="ALL">สถานะทั้งหมด</option>
                <option value="PENDING">รออนุมัติ</option>
                <option value="APPROVED">อนุมัติแล้ว</option>
                <option value="RETURNED">คืนแล้ว</option>
                <option value="REJECTED">ปฏิเสธ</option>
              </select>
            </div>

            {/* Date Filter */}
            <div className="relative">
              <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent font-kanit bg-white text-black"
              >
                <option value="ALL">ช่วงเวลาทั้งหมด</option>
                <option value="TODAY">วันนี้</option>
                <option value="YESTERDAY">เมื่อวาน</option>
                <option value="WEEK">สัปดาห์นี้</option>
                <option value="MONTH">เดือนนี้</option>
              </select>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600 font-kanit">
            แสดงผล {filteredLoans.length} รายการจากทั้งหมด {loans.length} รายการ
          </div>
        </div>

        {/* Loans List */}
        <div className="space-y-6">
          {filteredLoans.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <FaBox className="mx-auto text-gray-300 text-6xl mb-4" />
              <p className="text-gray-500 font-kanit text-xl mb-2">ไม่พบประวัติการยืม</p>
              <p className="text-gray-400 font-kanit">
                {searchTerm || statusFilter !== 'ALL' || dateFilter !== 'ALL' 
                  ? 'ลองเปลี่ยนเงื่อนไขการกรองข้อมูล' 
                  : 'คุณยังไม่เคยยื่นคำขอยืมอุปกรณ์'}
              </p>
            </div>
          ) : (
            filteredLoans
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((loan) => (
                <div key={loan.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                    {/* Main Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <FaBox className="text-pink-500 text-xl" />
                        <h3 className="text-xl font-bold text-gray-900 font-kanit">
                          {loan.asset.name}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeClass(loan.status)} font-kanit`}>
                          {getStatusText(loan.status)}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm text-gray-600">
                        <div>
                          <p className="font-kanit"><span className="font-semibold">รหัสอุปกรณ์:</span> {loan.asset.code}</p>
                        </div>
                        <div>
                          <p className="font-kanit"><span className="font-semibold">จำนวน:</span> {loan.quantity} ชิ้น</p>
                        </div>
                        <div>
                          <p className="font-kanit"><span className="font-semibold">ครบกำหนด:</span> {new Date(loan.dueAt).toLocaleDateString('th-TH')}</p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-gray-600 font-kanit mb-1">
                          <span>สถานะความคืบหนา</span>
                          <span>{getProgressPercentage(loan.status)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-500 ${
                              loan.status === 'REJECTED' ? 'bg-red-500' :
                              loan.status === 'PENDING' ? 'bg-yellow-500' :
                              loan.status === 'APPROVED' ? 'bg-green-500' :
                              'bg-blue-500'
                            }`}
                            style={{ width: `${getProgressPercentage(loan.status)}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Timeline */}
                      <div className="flex items-center gap-4 text-xs text-gray-600 font-kanit">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                          <span>ยื่นคำขอ: {new Date(loan.createdAt).toLocaleDateString('th-TH')}</span>
                        </div>
                        
                        {loan.borrowedAt && (
                          <>
                            <div className="w-4 h-0.5 bg-gray-300"></div>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                              <span>อนุมัติ: {new Date(loan.borrowedAt).toLocaleDateString('th-TH')}</span>
                            </div>
                          </>
                        )}
                        
                        {loan.returnedAt && (
                          <>
                            <div className="w-4 h-0.5 bg-gray-300"></div>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                              <span>คืนแล้ว: {new Date(loan.returnedAt).toLocaleDateString('th-TH')}</span>
                            </div>
                          </>
                        )}
                      </div>

                      {loan.note && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
                          <p className="text-sm text-gray-700 font-kanit">
                            <span className="font-semibold">หมายเหตุ:</span> {loan.note}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Status Icon */}
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-pink-600 rounded-full flex items-center justify-center shadow-lg">
                        {getStatusIcon(loan.status)}
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

