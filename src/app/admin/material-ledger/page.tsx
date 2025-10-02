'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import LayoutWrapper from '@/components/LayoutWrapper';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaFileExcel,
  FaSearch,
  FaFilter,
  FaBook,
  FaCalendarAlt,
  FaTimes
} from 'react-icons/fa';
import * as XLSX from 'xlsx';

type MaterialLedgerEntry = {
  id: string;
  type: string; // ประเภท
  materialName: string; // ชื่อหรือชนิดวัสดุ
  unit: string; // หน่วยนับ
  code: string; // รหัส
  maxQuantity: number; // จำนวนอย่างสูง
  minQuantity: number; // จำนวนอย่างต่ำ
  date: string; // วันเดือนปี
  fromTo: string; // รับจาก/จ่ายให้
  documentNumber: string; // เลขที่เอกสาร
  unitPrice: number; // ราคาต่อหน่วย(บาท)
  receiveQuantity: number; // จำนวนรับ
  issueQuantity: number; // จำนวนจ่าย
  balanceQuantity: number; // จำนวนคงเหลือ
  totalAmount: number; // จำนวนเงิน (บาท)
  remarks: string; // หมายเหตุ
  createdAt: string;
  updatedAt: string;
};

type MaterialLedgerFormData = {
  type: string;
  materialName: string;
  unit: string;
  code: string;
  maxQuantity: string;
  minQuantity: string;
  date: string;
  fromTo: string;
  documentNumber: string;
  unitPrice: string;
  receiveQuantity: string;
  issueQuantity: string;
  balanceQuantity: string;
  totalAmount: string;
  remarks: string;
};

export default function MaterialLedgerPage() {
  const { data: session } = useSession();
  const [entries, setEntries] = useState<MaterialLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<MaterialLedgerEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const [formData, setFormData] = useState<MaterialLedgerFormData>({
    type: '',
    materialName: '',
    unit: '',
    code: '',
    maxQuantity: '',
    minQuantity: '',
    date: new Date().toISOString().split('T')[0],
    fromTo: '',
    documentNumber: '',
    unitPrice: '',
    receiveQuantity: '0',
    issueQuantity: '0',
    balanceQuantity: '',
    totalAmount: '',
    remarks: ''
  });

  // Mock data for development
  useEffect(() => {
    const mockData: MaterialLedgerEntry[] = [
      {
        id: '1',
        type: 'สำนักงาน',
        materialName: 'กระดาษ A4',
        unit: 'รีม',
        code: 'P001',
        maxQuantity: 100,
        minQuantity: 10,
        date: '2025-10-01',
        fromTo: 'บริษัท เอบีซี จำกัด',
        documentNumber: 'PO-2025-001',
        unitPrice: 120,
        receiveQuantity: 50,
        issueQuantity: 0,
        balanceQuantity: 50,
        totalAmount: 6000,
        remarks: 'รับเข้าครั้งแรก',
        createdAt: '2025-10-01T10:00:00Z',
        updatedAt: '2025-10-01T10:00:00Z'
      },
      {
        id: '2',
        type: 'สำนักงาน',
        materialName: 'กระดาษ A4',
        unit: 'รีม',
        code: 'P001',
        maxQuantity: 100,
        minQuantity: 10,
        date: '2025-10-02',
        fromTo: 'แผนกบัญชี',
        documentNumber: 'REQ-2025-001',
        unitPrice: 120,
        receiveQuantity: 0,
        issueQuantity: 5,
        balanceQuantity: 45,
        totalAmount: 600,
        remarks: 'จ่ายให้แผนกบัญชี',
        createdAt: '2025-10-02T14:00:00Z',
        updatedAt: '2025-10-02T14:00:00Z'
      }
    ];
    
    setEntries(mockData);
    setLoading(false);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      
      // Auto-calculate total amount
      if (name === 'unitPrice' || name === 'receiveQuantity' || name === 'issueQuantity') {
        const unitPrice = parseFloat(updated.unitPrice) || 0;
        const receiveQty = parseFloat(updated.receiveQuantity) || 0;
        const issueQty = parseFloat(updated.issueQuantity) || 0;
        const totalQty = receiveQty > 0 ? receiveQty : issueQty;
        updated.totalAmount = (unitPrice * totalQty).toString();
      }
      
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.materialName || !formData.code || !formData.unit) {
      alert('กรุณากรอกข้อมูลที่จำเป็น');
      return;
    }

    try {
      const newEntry: MaterialLedgerEntry = {
        id: editingEntry ? editingEntry.id : Date.now().toString(),
        type: formData.type,
        materialName: formData.materialName,
        unit: formData.unit,
        code: formData.code,
        maxQuantity: parseFloat(formData.maxQuantity) || 0,
        minQuantity: parseFloat(formData.minQuantity) || 0,
        date: formData.date,
        fromTo: formData.fromTo,
        documentNumber: formData.documentNumber,
        unitPrice: parseFloat(formData.unitPrice) || 0,
        receiveQuantity: parseFloat(formData.receiveQuantity) || 0,
        issueQuantity: parseFloat(formData.issueQuantity) || 0,
        balanceQuantity: parseFloat(formData.balanceQuantity) || 0,
        totalAmount: parseFloat(formData.totalAmount) || 0,
        remarks: formData.remarks,
        createdAt: editingEntry ? editingEntry.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (editingEntry) {
        setEntries(prev => prev.map(entry => entry.id === editingEntry.id ? newEntry : entry));
      } else {
        setEntries(prev => [newEntry, ...prev]);
      }

      resetForm();
      alert(editingEntry ? 'แก้ไขรายการเรียบร้อยแล้ว' : 'เพิ่มรายการเรียบร้อยแล้ว');
    } catch (error) {
      console.error('Error saving entry:', error);
      alert('เกิดข้อผิดพลาดในการบันทึก');
    }
  };

  const handleEdit = (entry: MaterialLedgerEntry) => {
    setEditingEntry(entry);
    setFormData({
      type: entry.type,
      materialName: entry.materialName,
      unit: entry.unit,
      code: entry.code,
      maxQuantity: entry.maxQuantity.toString(),
      minQuantity: entry.minQuantity.toString(),
      date: entry.date,
      fromTo: entry.fromTo,
      documentNumber: entry.documentNumber,
      unitPrice: entry.unitPrice.toString(),
      receiveQuantity: entry.receiveQuantity.toString(),
      issueQuantity: entry.issueQuantity.toString(),
      balanceQuantity: entry.balanceQuantity.toString(),
      totalAmount: entry.totalAmount.toString(),
      remarks: entry.remarks
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('คุณแน่ใจหรือไม่ที่จะลบรายการนี้?')) {
      setEntries(prev => prev.filter(entry => entry.id !== id));
      alert('ลบรายการเรียบร้อยแล้ว');
    }
  };

  const resetForm = () => {
    setFormData({
      type: '',
      materialName: '',
      unit: '',
      code: '',
      maxQuantity: '',
      minQuantity: '',
      date: new Date().toISOString().split('T')[0],
      fromTo: '',
      documentNumber: '',
      unitPrice: '',
      receiveQuantity: '0',
      issueQuantity: '0',
      balanceQuantity: '',
      totalAmount: '',
      remarks: ''
    });
    setEditingEntry(null);
    setShowModal(false);
  };

  const exportToExcel = () => {
    const exportData = entries.map(entry => ({
      'ประเภท': entry.type,
      'ชื่อหรือชนิดวัสดุ': entry.materialName,
      'หน่วยนับ': entry.unit,
      'รหัส': entry.code,
      'จำนวนอย่างสูง': entry.maxQuantity,
      'จำนวนอย่างต่ำ': entry.minQuantity,
      'วันเดือนปี': entry.date,
      'รับจาก/จ่ายให้': entry.fromTo,
      'เลขที่เอกสาร': entry.documentNumber,
      'ราคาต่อหน่วย(บาท)': entry.unitPrice,
      'จำนวนรับ': entry.receiveQuantity,
      'จำนวนจ่าย': entry.issueQuantity,
      'จำนวนคงเหลือ': entry.balanceQuantity,
      'จำนวนเงิน(บาท)': entry.totalAmount,
      'หมายเหตุ': entry.remarks
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'บัญชีวัสดุ');
    
    // Auto-fit column widths
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    const colWidths: any[] = [];
    for (let C = range.s.c; C <= range.e.c; ++C) {
      let maxWidth = 10;
      for (let R = range.s.r; R <= range.e.r; ++R) {
        const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
        if (cell && cell.v) {
          const cellLength = cell.v.toString().length;
          maxWidth = Math.max(maxWidth, cellLength);
        }
      }
      colWidths.push({ wch: Math.min(maxWidth + 2, 50) });
    }
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, `บัญชีวัสดุ_${new Date().toLocaleDateString('th-TH')}.xlsx`);
  };

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.materialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || entry.type === filterType;
    
    return matchesSearch && matchesType;
  });

  const types = [...new Set(entries.map(e => e.type))];

  if (session?.user?.role !== 'ADMIN') {
    return (
      <LayoutWrapper>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">ไม่มีสิทธิ์เข้าถึง</h2>
            <p className="text-gray-600">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p>
          </div>
        </div>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-100">
        <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-kanit font-black bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
              บัญชีวัสดุ
            </h1>
            <p className="text-pink-700 font-kanit mt-2">
              จัดการบัญชีรับ-จ่ายวัสดุและการติดตามสต็อก
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={exportToExcel}
              className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl font-kanit font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2"
            >
              <FaFileExcel />
              <span>ส่งออก Excel</span>
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-3 rounded-xl font-kanit font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2"
            >
              <FaPlus />
              <span>เพิ่มรายการใหม่</span>
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pink-400" />
            <input
              type="text"
              placeholder="ค้นหาวัสดุ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent font-kanit text-gray-900 bg-white"
            />
          </div>
          <div className="relative">
            <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pink-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="pl-10 pr-8 py-3 border border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent font-kanit bg-white text-gray-900"
            >
              <option value="all">ทุกประเภท</option>
              {types.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Material Ledger Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-200 border-t-pink-600 mx-auto mb-4"></div>
            <p className="text-pink-600 font-kanit">กำลังโหลดข้อมูล...</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg border border-pink-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-pink-50 to-rose-50">
                  <tr>
                    <th className="px-3 py-3 text-left font-kanit font-bold text-pink-800 text-xs">ประเภท</th>
                    <th className="px-3 py-3 text-left font-kanit font-bold text-pink-800 text-xs">ชื่อหรือชนิดวัสดุ</th>
                    <th className="px-3 py-3 text-left font-kanit font-bold text-pink-800 text-xs">หน่วยนับ</th>
                    <th className="px-3 py-3 text-left font-kanit font-bold text-pink-800 text-xs">รหัส</th>
                    <th className="px-3 py-3 text-left font-kanit font-bold text-pink-800 text-xs">สูงสุด</th>
                    <th className="px-3 py-3 text-left font-kanit font-bold text-pink-800 text-xs">ต่ำสุด</th>
                    <th className="px-3 py-3 text-left font-kanit font-bold text-pink-800 text-xs">วันที่</th>
                    <th className="px-3 py-3 text-left font-kanit font-bold text-pink-800 text-xs">รับจาก/จ่ายให้</th>
                    <th className="px-3 py-3 text-left font-kanit font-bold text-pink-800 text-xs">เลขที่เอกสาร</th>
                    <th className="px-3 py-3 text-left font-kanit font-bold text-pink-800 text-xs">ราคา/หน่วย</th>
                    <th className="px-3 py-3 text-left font-kanit font-bold text-pink-800 text-xs">รับ</th>
                    <th className="px-3 py-3 text-left font-kanit font-bold text-pink-800 text-xs">จ่าย</th>
                    <th className="px-3 py-3 text-left font-kanit font-bold text-pink-800 text-xs">คงเหลือ</th>
                    <th className="px-3 py-3 text-left font-kanit font-bold text-pink-800 text-xs">จำนวนเงิน</th>
                    <th className="px-3 py-3 text-left font-kanit font-bold text-pink-800 text-xs">หมายเหตุ</th>
                    <th className="px-3 py-3 text-left font-kanit font-bold text-pink-800 text-xs">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map((entry) => (
                    <tr key={entry.id} className="border-t border-pink-100 hover:bg-pink-25">
                      <td className="px-3 py-3 font-kanit text-xs text-gray-900">{entry.type}</td>
                      <td className="px-3 py-3 font-kanit text-xs font-semibold text-gray-900">{entry.materialName}</td>
                      <td className="px-3 py-3 font-kanit text-xs text-gray-900">{entry.unit}</td>
                      <td className="px-3 py-3 font-kanit text-xs font-mono text-gray-900">{entry.code}</td>
                      <td className="px-3 py-3 font-kanit text-xs text-gray-900">{entry.maxQuantity}</td>
                      <td className="px-3 py-3 font-kanit text-xs text-gray-900">{entry.minQuantity}</td>
                      <td className="px-3 py-3 font-kanit text-xs text-gray-900">{new Date(entry.date).toLocaleDateString('th-TH')}</td>
                      <td className="px-3 py-3 font-kanit text-xs text-gray-900">{entry.fromTo}</td>
                      <td className="px-3 py-3 font-kanit text-xs font-mono text-gray-900">{entry.documentNumber}</td>
                      <td className="px-3 py-3 font-kanit text-xs text-right text-gray-900">{entry.unitPrice.toLocaleString()}</td>
                      <td className="px-3 py-3 font-kanit text-xs text-right text-green-600 font-semibold">{entry.receiveQuantity || '-'}</td>
                      <td className="px-3 py-3 font-kanit text-xs text-right text-red-600 font-semibold">{entry.issueQuantity || '-'}</td>
                      <td className="px-3 py-3 font-kanit text-xs text-right font-semibold text-gray-900">{entry.balanceQuantity}</td>
                      <td className="px-3 py-3 font-kanit text-xs text-right font-semibold text-gray-900">{entry.totalAmount.toLocaleString()}</td>
                      <td className="px-3 py-3 font-kanit text-xs text-gray-900">{entry.remarks || '-'}</td>
                      <td className="px-3 py-3">
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleEdit(entry)}
                            className="p-1 bg-pink-100 text-pink-600 rounded hover:bg-pink-200 transition-colors"
                            title="แก้ไข"
                          >
                            <FaEdit className="text-xs" />
                          </button>
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                            title="ลบ"
                          >
                            <FaTrash className="text-xs" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {filteredEntries.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <p className="text-gray-600 font-kanit text-lg">ไม่พบรายการบัญชีวัสดุ</p>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-kanit font-bold text-pink-800">
                  {editingEntry ? 'แก้ไขรายการบัญชีวัสดุ' : 'เพิ่มรายการบัญชีวัสดุใหม่'}
                </h2>
                <button
                  onClick={resetForm}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <FaTimes />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-gray-700 font-kanit font-semibold mb-2">
                      ประเภท *
                    </label>
                    <input
                      type="text"
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 font-kanit text-gray-900"
                      placeholder="เช่น สำนักงาน, ทำความสะอาด"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-kanit font-semibold mb-2">
                      ชื่อหรือชนิดวัสดุ *
                    </label>
                    <input
                      type="text"
                      name="materialName"
                      value={formData.materialName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 font-kanit text-gray-900"
                      placeholder="เช่น กระดาษ A4"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-kanit font-semibold mb-2">
                      หน่วยนับ *
                    </label>
                    <input
                      type="text"
                      name="unit"
                      value={formData.unit}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 font-kanit text-gray-900"
                      placeholder="เช่น รีม, ชิ้น, กล่อง"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-gray-700 font-kanit font-semibold mb-2">
                      รหัส *
                    </label>
                    <input
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 font-kanit text-gray-900"
                      placeholder="เช่น P001"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-kanit font-semibold mb-2">
                      จำนวนอย่างสูง
                    </label>
                    <input
                      type="number"
                      name="maxQuantity"
                      value={formData.maxQuantity}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 font-kanit text-gray-900"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-kanit font-semibold mb-2">
                      จำนวนอย่างต่ำ
                    </label>
                    <input
                      type="number"
                      name="minQuantity"
                      value={formData.minQuantity}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 font-kanit text-gray-900"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-kanit font-semibold mb-2">
                      วันเดือนปี *
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 font-kanit text-gray-900"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-gray-700 font-kanit font-semibold mb-2">
                      รับจาก/จ่ายให้
                    </label>
                    <input
                      type="text"
                      name="fromTo"
                      value={formData.fromTo}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 font-kanit text-gray-900"
                      placeholder="เช่น บริษัท ABC จำกัด, แผนกบัญชี"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-kanit font-semibold mb-2">
                      เลขที่เอกสาร
                    </label>
                    <input
                      type="text"
                      name="documentNumber"
                      value={formData.documentNumber}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 font-kanit text-gray-900"
                      placeholder="เช่น PO-2025-001"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-kanit font-semibold mb-2">
                      ราคาต่อหน่วย (บาท)
                    </label>
                    <input
                      type="number"
                      name="unitPrice"
                      value={formData.unitPrice}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 font-kanit text-gray-900"
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-gray-700 font-kanit font-semibold mb-2">
                      จำนวนรับ
                    </label>
                    <input
                      type="number"
                      name="receiveQuantity"
                      value={formData.receiveQuantity}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 font-kanit text-gray-900"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-kanit font-semibold mb-2">
                      จำนวนจ่าย
                    </label>
                    <input
                      type="number"
                      name="issueQuantity"
                      value={formData.issueQuantity}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 font-kanit text-gray-900"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-kanit font-semibold mb-2">
                      จำนวนคงเหลือ
                    </label>
                    <input
                      type="number"
                      name="balanceQuantity"
                      value={formData.balanceQuantity}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 font-kanit text-gray-900"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-kanit font-semibold mb-2">
                      จำนวนเงิน (บาท)
                    </label>
                    <input
                      type="number"
                      name="totalAmount"
                      value={formData.totalAmount}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 font-kanit text-gray-900 bg-gray-50"
                      step="0.01"
                      min="0"
                      readOnly
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-kanit font-semibold mb-2">
                    หมายเหตุ
                  </label>
                  <textarea
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 font-kanit text-gray-900"
                    rows={3}
                    placeholder="หมายเหตุเพิ่มเติม..."
                  />
                </div>

                <div className="flex space-x-4 pt-6 border-t border-pink-100">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 px-6 py-3 border border-pink-300 text-pink-600 rounded-xl font-kanit font-semibold hover:bg-pink-50 transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-kanit font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    {editingEntry ? 'บันทึกการแก้ไข' : 'เพิ่มรายการ'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        </div>
      </div>
    </LayoutWrapper>
  );
}
