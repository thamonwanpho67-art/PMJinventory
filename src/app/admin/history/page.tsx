'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import LayoutWrapper from '@/components/LayoutWrapper';
import { FaHistory, FaCalendarAlt, FaUser, FaBox, FaArrowRight, FaDownload, FaFilter, FaSearch, FaClock, FaCheckCircle, FaTimesCircle, FaGift, FaFileExcel } from 'react-icons/fa';
import * as XLSX from 'xlsx';

type HistoryRecord = {
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

export default function HistoryPage() {
  const { data: session, status } = useSession();
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterDate, setFilterDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (session?.user?.id) {
      fetchHistory();
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

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/loans');
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      } else {
        setError('ไม่สามารถโหลดข้อมูลได้');
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    // สร้าง workbook ใหม่
    const wb = XLSX.utils.book_new();
    
    // สร้าง worksheet
    const ws: any = {};
    
    // Header ของเอกสาร
    ws['A1'] = { v: 'รายงานประวัติการยืม-คืนครุภัณฑ์', s: { font: { bold: true, size: 16 }, alignment: { horizontal: 'center' } } };
    ws['A2'] = { v: `ข้อมูล ณ วันที่ ${new Date().toLocaleDateString('th-TH')}`, s: { font: { size: 12 }, alignment: { horizontal: 'center' } } };
    ws['A3'] = { v: '' }; // ช่องว่าง
    
    // Header ของตาราง
    const headers = [
      'ลำดับ',
      'วันที่ยื่นคำขอ',
      'ครุภัณฑ์',
      'รหัสครุภัณฑ์',
      'ผู้ยืม',
      'อีเมล',
      'จำนวน',
      'กำหนดคืน',
      'สถานะ',
      'วันที่ยืม',
      'วันที่คืน',
      'หมายเหตุ'
    ];
    
    // เพิ่ม headers ในแถวที่ 4
    headers.forEach((header, index) => {
      const cellRef = XLSX.utils.encode_cell({ r: 3, c: index });
      ws[cellRef] = { 
        v: header, 
        s: { 
          font: { bold: true, size: 12 }, 
          alignment: { horizontal: 'center', vertical: 'center' },
          fill: { fgColor: { rgb: 'F0F0F0' } },
          border: { 
            top: { style: 'thin' }, 
            left: { style: 'thin' }, 
            bottom: { style: 'thin' }, 
            right: { style: 'thin' } 
          }
        } 
      };
    });
    
    // เพิ่มข้อมูล
    filteredHistory.forEach((record, index) => {
      const row = 4 + index; // เริ่มจากแถวที่ 5 (index 4)
      
      const rowData = [
        index + 1,
        new Date(record.createdAt).toLocaleDateString('th-TH'),
        record.asset.name,
        record.asset.code,
        record.user.name || record.user.email,
        record.user.email,
        record.quantity,
        new Date(record.dueDate).toLocaleDateString('th-TH'),
        statusConfig[record.status].label,
        record.borrowedAt ? new Date(record.borrowedAt).toLocaleDateString('th-TH') : '-',
        record.returnedAt ? new Date(record.returnedAt).toLocaleDateString('th-TH') : '-',
        record.note || '-'
      ];
      
      rowData.forEach((data, colIndex) => {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: colIndex });
        ws[cellRef] = { 
          v: data,
          s: {
            alignment: { horizontal: colIndex === 0 ? 'center' : 'left', vertical: 'center' },
            border: { 
              top: { style: 'thin' }, 
              left: { style: 'thin' }, 
              bottom: { style: 'thin' }, 
              right: { style: 'thin' } 
            }
          }
        };
      });
    });
    
    // ตั้งค่า range ของ worksheet
    const lastRow = 4 + filteredHistory.length;
    ws['!ref'] = `A1:L${lastRow}`;
    
    // ผสาน cells สำหรับ header
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 11 } }, // ผสาน title
      { s: { r: 1, c: 0 }, e: { r: 1, c: 11 } }  // ผสาน date
    ];
    
    // ตั้งค่าความกว้างของคอลัมน์
    ws['!cols'] = [
      { wch: 8 },  // ลำดับ
      { wch: 15 }, // วันที่ยื่นคำขอ
      { wch: 25 }, // ครุภัณฑ์
      { wch: 15 }, // รหัสครุภัณฑ์
      { wch: 20 }, // ผู้ยืม
      { wch: 25 }, // อีเมล
      { wch: 8 },  // จำนวน
      { wch: 15 }, // กำหนดคืน
      { wch: 15 }, // สถานะ
      { wch: 15 }, // วันที่ยืม
      { wch: 15 }, // วันที่คืน
      { wch: 30 }  // หมายเหตุ
    ];
    
    // เพิ่ม worksheet เข้า workbook
    XLSX.utils.book_append_sheet(wb, ws, 'ประวัติการยืม-คืน');
    
    // ส่งออกไฟล์
    const fileName = `ประวัติการยืม-คืน_${new Date().toLocaleDateString('th-TH').replace(/\//g, '-')}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    alert('ส่งออกไฟล์ Excel เรียบร้อยแล้ว');
  };

  const filteredHistory = history.filter(record => {
    const matchesStatus = filterStatus === 'ALL' || record.status === filterStatus;
    const matchesDate = !filterDate || record.createdAt.startsWith(filterDate);
    const matchesSearch = 
      record.asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.asset.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesDate && matchesSearch;
  });

  // Sort by most recent first
  const sortedHistory = filteredHistory.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

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
            <FaHistory className="text-6xl mb-6 text-pink-500 mx-auto" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent font-kanit mb-4">
              ประวัติการยืม-คืน
            </h1>
            <p className="text-lg text-pink-700 font-medium max-w-2xl mx-auto">
              ตรวจสอบและดาวน์โหลดประวัติการยืม-คืนครุภัณฑ์ทั้งหมดในระบบ
            </p>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-gradient-to-r from-white to-pink-50 rounded-2xl border border-pink-200 p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 items-center w-full lg:w-auto">
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
                  <option value="ALL">ทุกสถานะ</option>
                  <option value="PENDING">รอการอนุมัติ</option>
                  <option value="APPROVED">อนุมัติแล้ว</option>
                  <option value="REJECTED">ไม่อนุมัติ</option>
                  <option value="RETURNED">คืนแล้ว</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <FaCalendarAlt className="text-pink-600" />
                <input
                  type="month"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="px-4 py-2 border border-pink-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-pink-50/30 text-gray-800 font-medium"
                />
              </div>
            </div>

            <button
              onClick={exportToExcel}
              disabled={filteredHistory.length === 0}
              className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-2 rounded-lg font-medium hover:from-green-600 hover:to-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaFileExcel className="w-4 h-4" />
              <span>ดาวน์โหลด Excel</span>
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-pink-600">{history.length}</div>
            <div className="text-pink-700 text-sm font-medium">ทั้งหมด</div>
          </div>
          <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {history.filter(record => record.status === 'PENDING').length}
            </div>
            <div className="text-yellow-700 text-sm font-medium">รอการอนุมัติ</div>
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {history.filter(record => record.status === 'APPROVED').length}
            </div>
            <div className="text-blue-700 text-sm font-medium">อนุมัติแล้ว</div>
          </div>
          <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {history.filter(record => record.status === 'REJECTED').length}
            </div>
            <div className="text-red-700 text-sm font-medium">ไม่อนุมัติ</div>
          </div>
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {history.filter(record => record.status === 'RETURNED').length}
            </div>
            <div className="text-green-700 text-sm font-medium">คืนแล้ว</div>
          </div>
        </div>

        {/* History Timeline */}
        <div className="bg-gradient-to-r from-white to-pink-50 rounded-2xl border border-pink-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-pink-200 bg-gradient-to-r from-pink-50 to-rose-50 flex items-center space-x-2">
            <FaHistory className="text-pink-600 text-lg" />
            <h2 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent font-kanit">
              ประวัติทั้งหมด ({sortedHistory.length} รายการ)
            </h2>
          </div>

          {sortedHistory.length === 0 ? (
            <div className="text-center py-16">
              <FaHistory className="text-6xl mb-6 text-pink-400 mx-auto" />
              <h3 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-3 font-kanit">
                ไม่มีประวัติ
              </h3>
              <p className="text-pink-600 font-medium">
                {searchTerm || filterStatus !== 'ALL' || filterDate ? 'ไม่พบประวัติที่ตรงกับเงื่อนไขการค้นหา' : 'ยังไม่มีประวัติการยืม-คืนในระบบ'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-pink-100">
              {sortedHistory.map((record, index) => (
                <div key={record.id} className="p-6 hover:bg-pink-50/50 transition-colors relative">
                  {/* Timeline Line */}
                  {index !== sortedHistory.length - 1 && (
                    <div className="absolute left-12 top-16 w-0.5 h-full bg-pink-200"></div>
                  )}
                  
                  <div className="flex space-x-4">
                    {/* Timeline Icon */}
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${statusConfig[record.status].color.replace('text-', 'bg-').replace('-800', '-200')}`}>
                      {React.createElement(statusConfig[record.status].icon, { className: 'w-4 h-4' })}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start space-x-3">
                          <FaBox className="text-pink-600 text-lg mt-1" />
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 font-kanit">
                              {record.asset.name}
                            </h3>
                            <p className="text-sm text-pink-600 font-medium">
                              รหัส: {record.asset.code}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <FaUser className="text-gray-400 text-xs" />
                              <p className="text-sm text-gray-600">
                                ผู้ยืม: {record.user.name || record.user.email}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-bold ${statusConfig[record.status].color}`}>
                            {React.createElement(statusConfig[record.status].icon, { className: 'w-3 h-3' })}
                            <span>{statusConfig[record.status].label}</span>
                          </span>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(record.createdAt).toLocaleDateString('th-TH')}
                          </p>
                        </div>
                      </div>

                      {/* Timeline Steps */}
                      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                          <div>
                            <p className="text-xs text-pink-600 font-medium">ยื่นคำขอ</p>
                            <p className="text-xs text-gray-600">
                              {new Date(record.createdAt).toLocaleDateString('th-TH')}
                            </p>
                          </div>
                        </div>
                        
                        {(record.status === 'APPROVED' || record.status === 'RETURNED') && record.borrowedAt && (
                          <>
                            <FaArrowRight className="text-pink-300 self-center hidden lg:block" />
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                              <div>
                                <p className="text-xs text-blue-600 font-medium">อนุมัติ/ยืม</p>
                                <p className="text-xs text-gray-600">
                                  {new Date(record.borrowedAt).toLocaleDateString('th-TH')}
                                </p>
                              </div>
                            </div>
                          </>
                        )}
                        
                        {record.status === 'RETURNED' && record.returnedAt && (
                          <>
                            <FaArrowRight className="text-pink-300 self-center hidden lg:block" />
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                              <div>
                                <p className="text-xs text-green-600 font-medium">คืนแล้ว</p>
                                <p className="text-xs text-gray-600">
                                  {new Date(record.returnedAt).toLocaleDateString('th-TH')}
                                </p>
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Details */}
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-pink-600 font-medium">จำนวน:</span>
                          <p className="text-gray-900 font-semibold">{record.quantity} ชิ้น</p>
                        </div>
                        <div>
                          <span className="text-pink-600 font-medium">กำหนดคืน:</span>
                          <p className="text-gray-900">
                            {new Date(record.dueDate).toLocaleDateString('th-TH')}
                          </p>
                        </div>
                        <div>
                          <span className="text-pink-600 font-medium">อีเมล:</span>
                          <p className="text-gray-900 text-xs">{record.user.email}</p>
                        </div>
                      </div>

                      {record.note && (
                        <div className="mt-3 p-3 bg-pink-50 rounded-lg border border-pink-100">
                          <span className="text-pink-600 font-medium text-sm">หมายเหตุ:</span>
                          <p className="text-gray-700 text-sm mt-1">{record.note}</p>
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

