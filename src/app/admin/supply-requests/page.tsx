'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import LayoutWrapper from '@/components/LayoutWrapper';
import AlertService from '@/lib/alert';
import Swal from 'sweetalert2';
import { DEPARTMENTS } from '@/lib/constants';
import { 
  FaCheck, 
  FaTimes, 
  FaEye, 
  FaClock, 
  FaUser, 
  FaBuilding, 
  FaCalendar,
  FaClipboard,
  FaFilter,
  FaSearch
} from 'react-icons/fa';

type SupplyRequest = {
  id: string;
  quantity: number;
  requesterName: string;
  department: string;
  requestDate: string;
  purpose?: string;
  notes?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  approvedBy?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  supply: {
    name: string;
    category: string;
    unit: string;
    quantity: number;
  };
  user: {
    name?: string;
    email: string;
  };
};

export default function SupplyRequestsPage() {
  const { data: session, status } = useSession();
  const [requests, setRequests] = useState<SupplyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [selectedRequest, setSelectedRequest] = useState<SupplyRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (departmentFilter !== 'ALL') params.append('department', departmentFilter);
      
      const response = await fetch(`/api/supply-requests?${params}`);
      if (response.ok) {
        const data = await response.json();
        setRequests(data.data.requests);
      } else {
        await AlertService.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      await AlertService.error('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter, departmentFilter]);

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

  const handleApprove = async (requestId: string) => {
    const result = await AlertService.confirm(
      'อนุมัติคำขอนี้?',
      'ระบบจะลดจำนวนสต็อกวัสดุโดยอัตโนมัติ'
    );

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/supply-requests/${requestId}/approve`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (response.ok) {
          await AlertService.success('อนุมัติคำขอเรียบร้อยแล้ว');
          fetchRequests();
        } else {
          const error = await response.json();
          await AlertService.error(error.error || 'เกิดข้อผิดพลาด');
        }
      } catch (error) {
        console.error('Error approving request:', error);
        await AlertService.error('เกิดข้อผิดพลาดในการอนุมัติ');
      }
    }
  };

  const handleReject = async (requestId: string) => {
    const { value: reason } = await Swal.fire({
      title: 'ปฏิเสธคำขอนี้?',
      input: 'textarea',
      inputLabel: 'กรุณาระบุเหตุผล:',
      inputPlaceholder: 'เหตุผลในการปฏิเสธ...',
      inputAttributes: {
        'aria-label': 'เหตุผลในการปฏิเสธ'
      },
      showCancelButton: true,
      confirmButtonText: 'ปฏิเสธ',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#dc2626',
      inputValidator: (value: string) => {
        if (!value) {
          return 'กรุณาระบุเหตุผล'
        }
      }
    });

    if (reason) {
      try {
        const response = await fetch(`/api/supply-requests/${requestId}/reject`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            rejectionReason: reason
          })
        });

        if (response.ok) {
          await AlertService.success('ปฏิเสธคำขอเรียบร้อยแล้ว');
          fetchRequests();
        } else {
          const error = await response.json();
          await AlertService.error(error.error || 'เกิดข้อผิดพลาด');
        }
      } catch (error) {
        console.error('Error rejecting request:', error);
        await AlertService.error('เกิดข้อผิดพลาดในการปฏิเสธ');
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { color: 'bg-yellow-100 text-yellow-800', text: 'รอดำเนินการ', icon: FaClock },
      APPROVED: { color: 'bg-blue-100 text-blue-800', text: 'อนุมัติแล้ว', icon: FaCheck },
      REJECTED: { color: 'bg-red-100 text-red-800', text: 'ปฏิเสธ', icon: FaTimes },
      COMPLETED: { color: 'bg-green-100 text-green-800', text: 'เสร็จสิ้น', icon: FaCheck }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-kanit ${config.color}`}>
        {config.icon && <config.icon className="w-3 h-3" />}
        <span>{config.text}</span>
      </span>
    );
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.supply.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.requesterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.department.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const openDetailModal = (request: SupplyRequest) => {
    setSelectedRequest(request);
    setShowDetailModal(true);
  };

  return (
    <LayoutWrapper>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-kanit font-black bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
            คำขอเบิกวัสดุสิ้นเปลือง
          </h1>
          <p className="text-pink-700 font-kanit mt-2">
            จัดการคำขอเบิกวัสดุจากพนักงาน
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-2xl border border-yellow-200">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center space-x-3">
                <FaClock className="text-yellow-600 text-2xl" />
                <div>
                  <p className="text-yellow-800 font-kanit font-bold text-2xl">
                    {requests.filter(r => r.status === 'PENDING').length}
                  </p>
                  <p className="text-yellow-600 text-sm font-kanit">รอดำเนินการ</p>
                </div>
              </div>
              <span className="bg-yellow-200 text-yellow-800 px-3 py-1 rounded-full text-xs font-kanit font-medium">
                รอดำเนินการ
              </span>
            </div>
            <p className="text-yellow-600 text-xs font-kanit mt-2 text-right">
              วันที่อัพเดท {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border border-blue-200">
            <div className="flex items-center space-x-3">
              <FaCheck className="text-blue-600 text-2xl" />
              <div>
                <p className="text-blue-800 font-kanit font-bold text-2xl">
                  {requests.filter(r => r.status === 'APPROVED').length}
                </p>
                <p className="text-blue-600 text-sm font-kanit">อนุมัติแล้ว</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl border border-green-200">
            <div className="flex items-center space-x-3">
              <FaCheck className="text-green-600 text-2xl" />
              <div>
                <p className="text-green-800 font-kanit font-bold text-2xl">
                  {requests.filter(r => r.status === 'COMPLETED').length}
                </p>
                <p className="text-green-600 text-sm font-kanit">เสร็จสิ้น</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-2xl border border-red-200">
            <div className="flex items-center space-x-3">
              <FaTimes className="text-red-600 text-2xl" />
              <div>
                <p className="text-red-800 font-kanit font-bold text-2xl">
                  {requests.filter(r => r.status === 'REJECTED').length}
                </p>
                <p className="text-red-600 text-sm font-kanit">ปฏิเสธ</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pink-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อวัสดุ, ผู้ขอ, หรือแผนก..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent font-kanit text-black"
            />
          </div>
          <div className="relative">
            <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent font-kanit bg-white text-black"
            >
              <option value="ALL">ทุกสถานะ</option>
              <option value="PENDING">รอดำเนินการ</option>
              <option value="APPROVED">อนุมัติแล้ว</option>
              <option value="COMPLETED">เสร็จสิ้น</option>
              <option value="REJECTED">ปฏิเสธ</option>
            </select>
          </div>
          <div className="relative">
            <FaBuilding className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent font-kanit bg-white text-black"
            >
              <option value="ALL">ทุกแผนก</option>
              {DEPARTMENTS.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Requests Table */}
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
                    <th className="px-6 py-4 text-left font-kanit font-bold text-pink-800">วัสดุ</th>
                    <th className="px-6 py-4 text-left font-kanit font-bold text-pink-800">ผู้ขอ</th>
                    <th className="px-6 py-4 text-left font-kanit font-bold text-pink-800">แผนก</th>
                    <th className="px-6 py-4 text-left font-kanit font-bold text-pink-800">จำนวน</th>
                    <th className="px-6 py-4 text-left font-kanit font-bold text-pink-800">วันที่ขอ</th>
                    <th className="px-6 py-4 text-left font-kanit font-bold text-pink-800">สถานะ</th>
                    <th className="px-6 py-4 text-left font-kanit font-bold text-pink-800">การจัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((request) => (
                    <tr key={request.id} className="border-t border-pink-100 hover:bg-pink-25">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-kanit font-semibold text-gray-900">{request.supply.name}</div>
                          <div className="text-sm text-gray-900 font-kanit">{request.supply.category}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-kanit font-semibold text-gray-900">{request.requesterName}</div>
                          <div className="text-sm text-gray-900 font-kanit">{request.user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-kanit text-gray-900 font-medium">{request.department}</td>
                      <td className="px-6 py-4">
                        <span className="font-kanit font-bold text-gray-900">
                          {request.quantity} {request.supply.unit}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-kanit text-gray-900 font-medium">
                        {new Date(request.requestDate).toLocaleDateString('th-TH')}
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(request.status)}</td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openDetailModal(request)}
                            className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                            title="ดูรายละเอียด"
                          >
                            <FaEye />
                          </button>
                          {request.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleApprove(request.id)}
                                className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                                title="อนุมัติ"
                              >
                                <FaCheck />
                              </button>
                              <button
                                onClick={() => handleReject(request.id)}
                                className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                                title="ปฏิเสธ"
                              >
                                <FaTimes />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {filteredRequests.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-gray-900 font-kanit text-lg">ไม่พบคำขอเบิกวัสดุ</p>
          </div>
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-kanit font-bold text-pink-800">รายละเอียดคำขอเบิกวัสดุ</h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes className="text-xl" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Supply Info */}
                <div className="bg-pink-50 p-4 rounded-lg">
                  <h3 className="font-kanit font-bold text-pink-800 mb-2">ข้อมูลวัสดุ</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-pink-700 font-kanit">ชื่อวัสดุ:</span>
                      <p className="font-kanit font-bold">{selectedRequest.supply.name}</p>
                    </div>
                    <div>
                      <span className="text-sm text-pink-700 font-kanit">หมวดหมู่:</span>
                      <p className="font-kanit">{selectedRequest.supply.category}</p>
                    </div>
                    <div>
                      <span className="text-sm text-pink-700 font-kanit">จำนวนที่ขอ:</span>
                      <p className="font-kanit font-bold">{selectedRequest.quantity} {selectedRequest.supply.unit}</p>
                    </div>
                    <div>
                      <span className="text-sm text-pink-700 font-kanit">คงเหลือในสต็อก:</span>
                      <p className="font-kanit">{selectedRequest.supply.quantity} {selectedRequest.supply.unit}</p>
                    </div>
                  </div>
                </div>

                {/* Requester Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-kanit font-bold text-gray-900 mb-3">ข้อมูลผู้ขอ</h3>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <FaUser className="text-gray-900" />
                        <span className="font-kanit">{selectedRequest.requesterName}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <FaBuilding className="text-gray-900" />
                        <span className="font-kanit">{selectedRequest.department}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <FaCalendar className="text-gray-900" />
                        <span className="font-kanit">
                          {new Date(selectedRequest.requestDate).toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-kanit font-bold text-gray-900 mb-3">สถานะ</h3>
                    <div className="space-y-2">
                      <div>{getStatusBadge(selectedRequest.status)}</div>
                      {selectedRequest.approvedAt && (
                        <p className="text-sm text-green-600 font-kanit">
                          อนุมัติเมื่อ: {new Date(selectedRequest.approvedAt).toLocaleDateString('th-TH')}
                        </p>
                      )}
                      {selectedRequest.rejectedAt && (
                        <p className="text-sm text-red-600 font-kanit">
                          ปฏิเสธเมื่อ: {new Date(selectedRequest.rejectedAt).toLocaleDateString('th-TH')}
                        </p>
                      )}
                      {selectedRequest.approvedBy && (
                        <p className="text-sm text-gray-900 font-kanit">
                          ผู้อนุมัติ: {selectedRequest.approvedBy}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Purpose and Notes */}
                {(selectedRequest.purpose || selectedRequest.notes) && (
                  <div>
                    <h3 className="font-kanit font-bold text-gray-900 mb-3">รายละเอียดเพิ่มเติม</h3>
                    {selectedRequest.purpose && (
                      <div className="mb-3">
                        <span className="text-sm text-gray-900 font-kanit">วัตถุประสงค์:</span>
                        <p className="font-kanit bg-gray-50 p-2 rounded">{selectedRequest.purpose}</p>
                      </div>
                    )}
                    {selectedRequest.notes && (
                      <div>
                        <span className="text-sm text-gray-900 font-kanit">หมายเหตุ:</span>
                        <p className="font-kanit bg-gray-50 p-2 rounded">{selectedRequest.notes}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Rejection Reason */}
                {selectedRequest.rejectionReason && (
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h3 className="font-kanit font-bold text-red-800 mb-2">เหตุผลที่ปฏิเสธ</h3>
                    <p className="font-kanit text-red-700">{selectedRequest.rejectionReason}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-900 rounded-lg hover:bg-gray-50 transition-colors font-kanit"
                >
                  ปิด
                </button>
                {selectedRequest.status === 'PENDING' && (
                  <>
                    <button
                      onClick={() => {
                        setShowDetailModal(false);
                        handleApprove(selectedRequest.id);
                      }}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-kanit"
                    >
                      อนุมัติ
                    </button>
                    <button
                      onClick={() => {
                        setShowDetailModal(false);
                        handleReject(selectedRequest.id);
                      }}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-kanit"
                    >
                      ปฏิเสธ
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </LayoutWrapper>
  );
}