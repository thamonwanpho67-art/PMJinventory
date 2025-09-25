'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { redirect } from 'next/navigation';
import LayoutWrapper from '@/components/LayoutWrapper';
import ClientOnly from '@/components/ClientOnly';
import { 
  FaChartBar, 
  FaUsers, 
  FaBox, 
  FaHandshake, 
  FaExclamationTriangle, 
  FaDownload,
  FaSpinner 
} from 'react-icons/fa';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer 
} from 'recharts';
import * as XLSX from 'xlsx';
import Alert from '@/lib/alert';

type DashboardData = {
  summary: {
    totalAssets: number;
    totalLoans: number;
    totalUsers: number;
    totalPendingLoans: number;
  };
  charts: {
    assetsByCategory: Array<{
      name: string;
      value: number;
      fill: string;
    }>;
    assetsByStatus: Array<{
      name: string;
      value: number;
      fill: string;
    }>;
    monthlyLoans: Array<{
      month: string;
      loans: number;
      returns: number;
    }>;
  };
  recentLoans: Array<{
    id: string;
    userName: string;
    assetName: string;
    status: string;
    createdAt: string;
    dueDate: string;
  }>;
};

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard');
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      } else {
        await Alert.error_messages.serverError();
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      await Alert.error_messages.networkError();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const exportToExcel = async () => {
    if (!dashboardData) return;
    
    setExporting(true);
    try {
      // สร้าง workbook
      const wb = XLSX.utils.book_new();
      
      // Sheet 1: สรุปภาพรวม
      const summaryData = [
        ['สรุปภาพรวมระบบ', ''],
        ['รายการ', 'จำนวน'],
        ['ครุภัณฑ์ทั้งหมด', dashboardData.summary.totalAssets],
        ['การยืมทั้งหมด', dashboardData.summary.totalLoans],
        ['ผู้ใช้งานทั้งหมด', dashboardData.summary.totalUsers],
        ['คำขอที่รอการอนุมัติ', dashboardData.summary.totalPendingLoans],
      ];
      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWs, 'สรุปภาพรวม');
      
      // Sheet 2: ครุภัณฑ์แยกตามประเภท
      const categoryData = [
        ['ครุภัณฑ์แยกตามประเภท', ''],
        ['ประเภท', 'จำนวน'],
        ...dashboardData.charts.assetsByCategory.map(item => [item.name, item.value])
      ];
      const categoryWs = XLSX.utils.aoa_to_sheet(categoryData);
      XLSX.utils.book_append_sheet(wb, categoryWs, 'แยกตามประเภท');
      
      // Sheet 3: ครุภัณฑ์แยกตามสถานะ
      const statusData = [
        ['ครุภัณฑ์แยกตามสถานะ', ''],
        ['สถานะ', 'จำนวน'],
        ...dashboardData.charts.assetsByStatus.map(item => [item.name, item.value])
      ];
      const statusWs = XLSX.utils.aoa_to_sheet(statusData);
      XLSX.utils.book_append_sheet(wb, statusWs, 'แยกตามสถานะ');
      
      // Sheet 4: รายการยืม-คืนล่าสุด
      const loansData = [
        ['รายการยืม-คืนล่าสุด', '', '', '', ''],
        ['ผู้ยืม', 'ครุภัณฑ์', 'สถานะ', 'วันที่ยืม', 'กำหนดคืน'],
        ...dashboardData.recentLoans.map(loan => [
          loan.userName,
          loan.assetName,
          loan.status,
          new Date(loan.createdAt).toLocaleDateString('th-TH'),
          new Date(loan.dueDate).toLocaleDateString('th-TH')
        ])
      ];
      const loansWs = XLSX.utils.aoa_to_sheet(loansData);
      XLSX.utils.book_append_sheet(wb, loansWs, 'รายการยืม-คืนล่าสุด');
      
      // สร้างไฟล์และดาวน์โหลด
      const fileName = `รายงานแดชบอร์ด_${new Date().toLocaleDateString('th-TH')}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      await Alert.success('Export สำเร็จ!', 'ไฟล์ Excel ได้ถูกดาวน์โหลดแล้ว');
    } catch (error) {
      console.error('Export error:', error);
      await Alert.error_messages.serverError();
    } finally {
      setExporting(false);
    }
  };

  if (status === 'loading' || loading) {
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

  if (!dashboardData) {
    return (
      <LayoutWrapper>
        <div className="p-6 text-center">
          <p className="text-red-600">ไม่สามารถโหลดข้อมูลได้</p>
        </div>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 p-6 bg-gradient-to-r from-pink-50 to-rose-50 rounded-2xl border border-pink-200">
          <div className="flex items-center space-x-3">
            <FaChartBar className="text-pink-600 text-3xl" />
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent font-kanit">
                แดชบอร์ด
              </h1>
              <p className="text-pink-700 font-medium font-kanit">
                ภาพรวมการจัดการครุภัณฑ์และสถิติต่างๆ
              </p>
            </div>
          </div>
          <button
            onClick={exportToExcel}
            disabled={exporting}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl font-medium hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed font-kanit"
          >
            {exporting ? (
              <FaSpinner className="h-5 w-5 animate-spin" />
            ) : (
              <FaDownload className="h-5 w-5" />
            )}
            <span>{exporting ? 'กำลัง Export...' : 'Export Excel'}</span>
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 font-kanit">ครุภัณฑ์ทั้งหมด</p>
                <p className="text-3xl font-bold font-kanit">{dashboardData.summary.totalAssets}</p>
              </div>
              <FaBox className="text-4xl text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 font-kanit">การยืมทั้งหมด</p>
                <p className="text-3xl font-bold font-kanit">{dashboardData.summary.totalLoans}</p>
              </div>
              <FaHandshake className="text-4xl text-green-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 font-kanit">ผู้ใช้งานทั้งหมด</p>
                <p className="text-3xl font-bold font-kanit">{dashboardData.summary.totalUsers}</p>
              </div>
              <FaUsers className="text-4xl text-purple-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 font-kanit">รอการอนุมัติ</p>
                <p className="text-3xl font-bold font-kanit">{dashboardData.summary.totalPendingLoans}</p>
              </div>
              <FaExclamationTriangle className="text-4xl text-orange-200" />
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Assets by Category Chart */}
          <div className="bg-white rounded-xl shadow-lg border border-pink-100 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 font-kanit">ครุภัณฑ์แยกตามประเภท</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dashboardData.charts.assetsByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  label={(props: any) => `${props.name} ${(props.percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dashboardData.charts.assetsByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Assets by Status Chart */}
          <div className="bg-white rounded-xl shadow-lg border border-pink-100 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 font-kanit">สถานะครุภัณฑ์</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dashboardData.charts.assetsByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  label={(props: any) => `${props.name} ${(props.percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dashboardData.charts.assetsByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Loans Chart */}
        <div className="bg-white rounded-xl shadow-lg border border-pink-100 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 font-kanit">สถิติการยืม-คืนรายเดือน</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={dashboardData.charts.monthlyLoans}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="loans" fill="#ec4899" name="ยืม" />
              <Bar dataKey="returns" fill="#10b981" name="คืน" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Loans Table */}
        <div className="bg-white rounded-xl shadow-lg border border-pink-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-pink-50 to-rose-50">
            <h3 className="text-lg font-bold text-gray-800 font-kanit">รายการยืม-คืนล่าสุด</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-kanit">
                    ผู้ยืม
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-kanit">
                    ครุภัณฑ์
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-kanit">
                    สถานะ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-kanit">
                    วันที่ยืม
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-kanit">
                    กำหนดคืน
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dashboardData.recentLoans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 font-kanit">
                      {loan.userName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-kanit">
                      {loan.assetName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full font-kanit ${
                        loan.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                        loan.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        loan.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {loan.status === 'APPROVED' ? 'อนุมัติ' :
                         loan.status === 'PENDING' ? 'รอการอนุมัติ' :
                         loan.status === 'REJECTED' ? 'ปฏิเสธ' :
                         loan.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-kanit">
                      {new Date(loan.createdAt).toLocaleDateString('th-TH')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-kanit">
                      {new Date(loan.dueDate).toLocaleDateString('th-TH')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {dashboardData.recentLoans.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500 font-kanit">ไม่มีรายการยืม-คืนล่าสุด</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </LayoutWrapper>
  );
}

