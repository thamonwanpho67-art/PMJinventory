'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import LayoutWrapper from '@/components/LayoutWrapper';
import AlertService from '@/lib/alert';
import { 
  FaHistory, 
  FaSearch,
  FaCalendarAlt,
  FaBox,
  FaBuilding,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaHourglassHalf
} from 'react-icons/fa';

type SupplyRequest = {
  id: string;
  quantity: number;
  department: string;
  notes?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
  supply: {
    name: string;
    category: string;
    unit: string;
  };
};

export default function SupplyHistoryPage() {
  const { data: session, status } = useSession();
  const [requests, setRequests] = useState<SupplyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/supply-requests');
      if (response.ok) {
        const data = await response.json();
        console.log('Supply requests data:', data);
        // API returns data.data.requests
        setRequests(Array.isArray(data.data?.requests) ? data.data.requests : []);
      } else {
        console.error('Failed to fetch supply requests:', response.status);
        await AlertService.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
        setRequests([]);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      await AlertService.error('เกิดข้อผิดพลาดในการเชื่อมต่อ');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

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

  if (status === 'unauthenticated') {
    redirect('/login');
  }

  const filteredRequests = requests.filter(request => {
    const matchesSearch = 
      request.supply.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.supply.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.department.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'ALL' || request.status === filterStatus;
    
    return matchesSearch && matchesStatus;
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

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { 
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
        text: 'รอดำเนินการ',
        icon: <FaHourglassHalf className="inline mr-1" />
      },
      APPROVED: { 
        color: 'bg-green-100 text-green-800 border-green-200', 
        text: 'อนุมัติ',
        icon: <FaCheckCircle className="inline mr-1" />
      },
      REJECTED: { 
        color: 'bg-red-100 text-red-800 border-red-200', 
        text: 'ไม่อนุมัติ',
        icon: <FaTimesCircle className="inline mr-1" />
      }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-kanit border ${config.color}`}>
        {config.icon}
        {config.text}
      </span>
    );
  };

  const pendingCount = Array.isArray(requests) ? requests.filter(r => r.status === 'PENDING').length : 0;
  const approvedCount = Array.isArray(requests) ? requests.filter(r => r.status === 'APPROVED').length : 0;
  const rejectedCount = Array.isArray(requests) ? requests.filter(r => r.status === 'REJECTED').length : 0;

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
              ติดตามสถานะคำขอเบิกวัสดุสิ้นเปลือง
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <FaHistory className="text-pink-500 text-3xl" />
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl p-6 border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-700 font-kanit text-sm">รอดำเนินการ</p>
                <p className="text-3xl font-kanit font-bold text-yellow-800">
                  {pendingCount}
                </p>
              </div>
              <FaHourglassHalf className="text-4xl text-yellow-500" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-700 font-kanit text-sm">อนุมัติแล้ว</p>
                <p className="text-3xl font-kanit font-bold text-green-800">
                  {approvedCount}
                </p>
              </div>
              <FaCheckCircle className="text-4xl text-green-500" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-700 font-kanit text-sm">ไม่อนุมัติ</p>
                <p className="text-3xl font-kanit font-bold text-red-800">
                  {rejectedCount}
                </p>
              </div>
              <FaTimesCircle className="text-4xl text-red-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Search */}
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อวัสดุ, หมวดหมู่, แผนก..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent font-kanit text-gray-900"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent font-kanit bg-white text-gray-900"
            >
              <option value="ALL">ทุกสถานะ</option>
              <option value="PENDING">รอดำเนินการ</option>
              <option value="APPROVED">อนุมัติ</option>
              <option value="REJECTED">ไม่อนุมัติ</option>
            </select>
          </div>
        </div>

        {/* Results Info */}
        {!loading && requests.length > 0 && (
          <div className="mb-4 flex justify-between items-center">
            <p className="text-gray-900 font-kanit">
              พบ <span className="font-bold text-pink-600">{filteredRequests.length}</span> รายการ
              {filterStatus !== 'ALL' && ` (กรอง: ${
                filterStatus === 'PENDING' ? 'รอดำเนินการ' :
                filterStatus === 'APPROVED' ? 'อนุมัติ' : 'ไม่อนุมัติ'
              })`}
            </p>
            <p className="text-sm text-gray-900 font-kanit">
              ทั้งหมด {requests.length} รายการ
            </p>
          </div>
        )}

        {/* Requests List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-200 border-t-pink-600 mx-auto mb-4"></div>
            <p className="text-pink-600 font-kanit">กำลังโหลดข้อมูล...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border border-pink-100 p-12 text-center">
            <FaBox className="text-6xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-900 font-kanit text-lg mb-2">
              {requests.length === 0 ? 'คุณยังไม่มีประวัติการเบิกวัสดุ' : 'ไม่พบรายการที่ตรงกับการค้นหา'}
            </p>
            {requests.length === 0 && (
              <>
                <p className="text-gray-600 font-kanit text-sm mb-6">
                  เริ่มต้นเบิกวัสดุสิ้นเปลืองได้เลย
                </p>
                <a
                  href="/dashboard/supplies/request"
                  className="inline-block px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-kanit font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  เบิกวัสดุ
                </a>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <div key={request.id} className="bg-white rounded-xl shadow-md border border-pink-100 p-6 hover:shadow-lg transition-shadow">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  {/* Left Section */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-kanit font-bold text-gray-900 text-lg">
                          {request.supply.name}
                        </h3>
                        <p className="text-sm text-gray-900 font-kanit">
                          {request.supply.category}
                        </p>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="flex items-center space-x-2">
                        <FaBox className="text-pink-500" />
                        <div>
                          <p className="text-xs text-gray-900 font-kanit">จำนวน</p>
                          <p className="font-kanit font-bold text-gray-900">
                            {request.quantity} {request.supply.unit}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <FaBuilding className="text-pink-500" />
                        <div>
                          <p className="text-xs text-gray-900 font-kanit">แผนก</p>
                          <p className="font-kanit font-semibold text-gray-900">
                            {request.department}
                          </p>
                        </div>
                      </div>
                    </div>

                    {request.notes && (
                      <div className="mt-4 p-3 bg-pink-50 rounded-lg">
                        <p className="text-sm text-gray-900 font-kanit">
                          <span className="font-semibold">หมายเหตุ:</span> {request.notes}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right Section - Date Info */}
                  <div className="flex flex-col items-end space-y-2 min-w-[200px]">
                    <div className="flex items-center space-x-2 text-gray-900">
                      <FaClock className="text-pink-500" />
                      <div className="text-right">
                        <p className="text-xs font-kanit">วันที่ขอเบิก</p>
                        <p className="text-sm font-kanit font-semibold">
                          {formatDate(request.createdAt)}
                        </p>
                      </div>
                    </div>
                    
                    {request.status !== 'PENDING' && (
                      <div className="flex items-center space-x-2 text-gray-900">
                        <FaCalendarAlt className="text-pink-500" />
                        <div className="text-right">
                          <p className="text-xs font-kanit">วันที่อัปเดต</p>
                          <p className="text-sm font-kanit font-semibold">
                            {formatDate(request.updatedAt)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </LayoutWrapper>
  );
}
