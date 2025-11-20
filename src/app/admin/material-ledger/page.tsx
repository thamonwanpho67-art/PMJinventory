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
    const mockData: MaterialLedgerEntry[] = [];
    
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
    // สร้าง workbook ใหม่
    const wb = XLSX.utils.book_new();
    
    // สร้าง worksheet
    const ws: any = {};
    
    // Header ของเอกสาร (แถว 1-6)
    ws['A1'] = { v: 'ประเภท', s: { 
      font: { bold: true, size: 14 }, 
      alignment: { horizontal: 'left' },
      border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
    } };
    ws['B1'] = { v: 'วัดสู่สำนักงาน', s: { 
      font: { size: 12 }, 
      alignment: { horizontal: 'left' },
      border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
    } };
    ws['G1'] = { v: 'รหัส ........................................................................', s: { 
      font: { size: 12 }, 
      alignment: { horizontal: 'left' },
      border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
    } };
    
    ws['A2'] = { v: 'ชื่อหรือชนิดของวัสดุ', s: { 
      font: { bold: true, size: 14 }, 
      alignment: { horizontal: 'left' },
      border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
    } };
    ws['B2'] = { v: 'กระทรวงดิจิตอลเศรษฐกิจ และ สังคม', s: { 
      font: { size: 12 }, 
      alignment: { horizontal: 'left' },
      border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
    } };
    ws['G2'] = { v: 'จำนวนอย่างสูง ........................................................................', s: { 
      font: { size: 12 }, 
      alignment: { horizontal: 'left' },
      border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
    } };
    
    ws['A3'] = { v: 'หน่วยนับ', s: { 
      font: { bold: true, size: 14 }, 
      alignment: { horizontal: 'left' },
      border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
    } };
    ws['B3'] = { v: 'รัม', s: { 
      font: { size: 12 }, 
      alignment: { horizontal: 'left' },
      border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
    } };
    ws['G3'] = { v: 'จำนวนอย่างต่ำ ........................................................................', s: { 
      font: { size: 12 }, 
      alignment: { horizontal: 'left' },
      border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
    } };
    
    // เติมเซลล์ว่างในแถว 1-3 ให้มีเส้นตาราง
    const emptyStyle = { 
      border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
    };
    
    // แถว 1
    ws['C1'] = { v: '', s: emptyStyle };
    ws['D1'] = { v: '', s: emptyStyle };
    ws['E1'] = { v: '', s: emptyStyle };
    ws['F1'] = { v: '', s: emptyStyle };
    ws['H1'] = { v: '', s: emptyStyle };
    ws['I1'] = { v: '', s: emptyStyle };
    
    // แถว 2
    ws['C2'] = { v: '', s: emptyStyle };
    ws['D2'] = { v: '', s: emptyStyle };
    ws['E2'] = { v: '', s: emptyStyle };
    ws['F2'] = { v: '', s: emptyStyle };
    ws['H2'] = { v: '', s: emptyStyle };
    ws['I2'] = { v: '', s: emptyStyle };
    
    // แถว 3
    ws['C3'] = { v: '', s: emptyStyle };
    ws['D3'] = { v: '', s: emptyStyle };
    ws['E3'] = { v: '', s: emptyStyle };
    ws['F3'] = { v: '', s: emptyStyle };
    ws['H3'] = { v: '', s: emptyStyle };
    ws['I3'] = { v: '', s: emptyStyle };
    
    // ช่องว่าง (เพิ่มเส้นตารางให้ทุกเซลล์)
    for (let row = 4; row <= 7; row++) {
      for (let col = 0; col < 9; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: row - 1, c: col });
        ws[cellRef] = { v: '', s: { 
          border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
        } };
      }
    }
    
    // Header ของตาราง (แถว 8-9)
    ws['A8'] = { v: 'วัน เดือน ปี', s: { 
      font: { bold: true, size: 12 }, 
      alignment: { horizontal: 'center', vertical: 'center' }, 
      border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } },
      fill: { fgColor: { rgb: 'F0F0F0' } }
    } };
    
    ws['B8'] = { v: 'รับจาก/จ่ายให้', s: { 
      font: { bold: true, size: 12 }, 
      alignment: { horizontal: 'center', vertical: 'center' }, 
      border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } },
      fill: { fgColor: { rgb: 'F0F0F0' } }
    } };
    
    ws['C8'] = { v: 'เลขที่เอกสาร', s: { 
      font: { bold: true, size: 12 }, 
      alignment: { horizontal: 'center', vertical: 'center' }, 
      border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } },
      fill: { fgColor: { rgb: 'F0F0F0' } }
    } };
    
    // Header ราคาหน่วย
    ws['D8'] = { v: 'ราคาหน่วย', s: { 
      font: { bold: true, size: 12 }, 
      alignment: { horizontal: 'center', vertical: 'center' }, 
      border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } },
      fill: { fgColor: { rgb: 'F0F0F0' } }
    } };
    ws['D9'] = { v: '(บาท)', s: { 
      font: { bold: true, size: 10 }, 
      alignment: { horizontal: 'center', vertical: 'center' }, 
      border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } },
      fill: { fgColor: { rgb: 'F0F0F0' } }
    } };
    
    // Header จำนวน (merged cell)
    ws['E8'] = { v: 'จำนวน', s: { 
      font: { bold: true, size: 12 }, 
      alignment: { horizontal: 'center', vertical: 'center' }, 
      border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } },
      fill: { fgColor: { rgb: 'F0F0F0' } }
    } };
    
    // Sub-headers จำนวน
    ws['E9'] = { v: 'รับ', s: { 
      font: { bold: true, size: 11 }, 
      alignment: { horizontal: 'center', vertical: 'center' }, 
      border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } },
      fill: { fgColor: { rgb: 'F0F0F0' } }
    } };
    ws['F9'] = { v: 'จ่าย', s: { 
      font: { bold: true, size: 11 }, 
      alignment: { horizontal: 'center', vertical: 'center' }, 
      border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } },
      fill: { fgColor: { rgb: 'F0F0F0' } }
    } };
    ws['G9'] = { v: 'คงเหลือ', s: { 
      font: { bold: true, size: 11 }, 
      alignment: { horizontal: 'center', vertical: 'center' }, 
      border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } },
      fill: { fgColor: { rgb: 'F0F0F0' } }
    } };
    
    ws['H8'] = { v: 'จำนวนเงิน(บาท)', s: { 
      font: { bold: true, size: 12 }, 
      alignment: { horizontal: 'center', vertical: 'center' }, 
      border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } },
      fill: { fgColor: { rgb: 'F0F0F0' } }
    } };
    
    ws['I8'] = { v: 'หมายเหตุ', s: { 
      font: { bold: true, size: 12 }, 
      alignment: { horizontal: 'center', vertical: 'center' }, 
      border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } },
      fill: { fgColor: { rgb: 'F0F0F0' } }
    } };
    
    // เติมข้อมูลจริงจากระบบ
    let currentRow = 10;
    entries.forEach((entry, index) => {
      const row = currentRow + index;
      
      // แปลงวันที่เป็นรูปแบบไทย
      const thaiDate = new Date(entry.date).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      
      ws[`A${row}`] = { v: thaiDate, s: { 
        alignment: { horizontal: 'center', vertical: 'center' },
        border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
      } };
      
      ws[`B${row}`] = { v: entry.fromTo, s: { 
        alignment: { horizontal: 'left', vertical: 'center' },
        border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
      } };
      
      ws[`C${row}`] = { v: entry.documentNumber, s: { 
        alignment: { horizontal: 'center', vertical: 'center' },
        border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
      } };
      
      ws[`D${row}`] = { v: entry.unitPrice, s: { 
        alignment: { horizontal: 'center', vertical: 'center' },
        border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
      } };
      
      ws[`E${row}`] = { v: entry.receiveQuantity, s: { 
        alignment: { horizontal: 'center', vertical: 'center' },
        border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
      } };
      
      ws[`F${row}`] = { v: entry.issueQuantity, s: { 
        alignment: { horizontal: 'center', vertical: 'center' },
        border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
      } };
      
      ws[`G${row}`] = { v: entry.balanceQuantity, s: { 
        alignment: { horizontal: 'center', vertical: 'center' },
        border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
      } };
      
      ws[`H${row}`] = { v: entry.totalAmount, s: { 
        alignment: { horizontal: 'right', vertical: 'center' },
        border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
      } };
      
      ws[`I${row}`] = { v: entry.remarks, s: { 
        alignment: { horizontal: 'left', vertical: 'center' },
        border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
      } };
    });
    
    // เพิ่มแถวว่างสำหรับเติมข้อมูลในอนาคต (20 แถว)
    for (let i = 0; i < 20; i++) {
      const row = currentRow + entries.length + i;
      for (let col = 0; col < 9; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: row - 1, c: col });
        ws[cellRef] = { v: '', s: { 
          border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
        } };
      }
    }
    
    // ตั้งค่า range ของ worksheet
    ws['!ref'] = `A1:I${currentRow + entries.length + 20}`;
    
    // ตั้งค่าความกว้างของคอลัมน์
    ws['!cols'] = [
      { wch: 18 }, // วัน เดือน ปี
      { wch: 30 }, // รับจาก/จ่ายให้
      { wch: 20 }, // เลขที่เอกสาร
      { wch: 12 }, // ราคาหน่วย
      { wch: 10 }, // รับ
      { wch: 10 }, // จ่าย
      { wch: 12 }, // คงเหลือ
      { wch: 15 }, // จำนวนเงิน
      { wch: 25 }  // หมายเหตุ
    ];
    
    // ตั้งค่าความสูงของแถว
    ws['!rows'] = [
      { hpt: 20 }, // แถว 1
      { hpt: 20 }, // แถว 2
      { hpt: 20 }, // แถว 3
      { hpt: 15 }, // แถว 4
      { hpt: 15 }, // แถว 5
      { hpt: 15 }, // แถว 6
      { hpt: 15 }, // แถว 7
      { hpt: 25 }, // แถว 8 (header)
      { hpt: 20 }  // แถว 9 (sub-header)
    ];
    
    // ผสาน cells สำหรับ header
    ws['!merges'] = [
      { s: { r: 7, c: 4 }, e: { r: 7, c: 6 } }, // ผสาน "จำนวน" header
      { s: { r: 7, c: 0 }, e: { r: 8, c: 0 } }, // ผสาน "วัน เดือน ปี"
      { s: { r: 7, c: 1 }, e: { r: 8, c: 1 } }, // ผสาน "รับจาก/จ่ายให้"
      { s: { r: 7, c: 2 }, e: { r: 8, c: 2 } }, // ผสาน "เลขที่เอกสาร"
      { s: { r: 7, c: 7 }, e: { r: 8, c: 7 } }, // ผสาน "จำนวนเงิน"
      { s: { r: 7, c: 8 }, e: { r: 8, c: 8 } }  // ผสาน "หมายเหตุ"
    ];
    
    // เพิ่ม worksheet เข้า workbook
    XLSX.utils.book_append_sheet(wb, ws, 'บัญชีวัสดุ');
    
    // ส่งออกไฟล์
    const fileName = `บัญชีวัสดุ_${new Date().toLocaleDateString('th-TH').replace(/\//g, '-')}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    alert('ส่งออกไฟล์ Excel ในรูปแบบบัญชีวัสดุทางราชการเรียบร้อยแล้ว');
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
