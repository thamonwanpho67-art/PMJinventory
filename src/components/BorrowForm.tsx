'use client';

import { useState } from 'react';
import { FaEdit, FaTimes } from 'react-icons/fa';

// รายการแผนก
const DEPARTMENTS = [
  'นโยบายและวิชาการ',
  'การพัฒนาสังคมและสวัสดิการ',
  'บริหารงานทั่วไป',
  'ศูนย์บริการคนพิการ'
];

type Asset = {
  id: string;
  code: string;
  name: string;
  quantity: number;
};

type BorrowFormProps = {
  selectedAsset: Asset | null;
  onClose: () => void;
  onSuccess: () => void;
};

export default function BorrowForm({ selectedAsset, onClose, onSuccess }: BorrowFormProps) {
  const [quantity, setQuantity] = useState(1);
  const [borrowDate, setBorrowDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerDepartment, setBorrowerDepartment] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ตั้งค่าวันที่ขั้นต่ำเป็นวันนี้
  const today = new Date().toISOString().split('T')[0];

  if (!selectedAsset) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!borrowerName.trim()) {
      setError('กรุณากรอกชื่อผู้ยืม');
      setLoading(false);
      return;
    }

    if (!borrowerDepartment) {
      setError('กรุณาเลือกแผนก');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/loans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assetId: selectedAsset.id,
          quantity: parseInt(quantity.toString()),
          borrowDate: borrowDate ? new Date(borrowDate).toISOString() : new Date().toISOString(),
          dueAt: dueDate ? dueDate.trim() : null,
          borrowerName: borrowerName.trim(),
          borrowerDepartment: borrowerDepartment,
          note: note.trim() || null,
        }),
      });

      if (response.ok) {
        onSuccess();
        onClose();
        // Reset form
        setQuantity(1);
        setBorrowDate('');
        setDueDate('');
        setBorrowerName('');
        setBorrowerDepartment('');
        setNote('');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'เกิดข้อผิดพลาดในการส่งคำขอ');
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-2">
            <FaEdit className="text-pink-600 text-lg" />
            <h2 className="text-xl font-kanit font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">ยื่นคำขอยืม</h2>
          </div>
          <button
            onClick={onClose}
            className="text-pink-400 hover:text-pink-600 transition-colors"
          >
            <FaTimes className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6 p-4 bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl border border-pink-200">
          <h3 className="font-kanit font-semibold text-gray-900">{selectedAsset.name}</h3>
          <p className="text-sm text-pink-600 font-kanit">รหัส: {selectedAsset.code}</p>
          <p className="text-sm text-pink-600 font-kanit">จำนวนที่มี: {selectedAsset.quantity} ชิ้น</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="quantity" className="block text-sm font-kanit font-semibold text-pink-700 mb-1">
              จำนวนที่ต้องการยืม
            </label>
            <input
              type="number"
              id="quantity"
              min="1"
              max={selectedAsset.quantity}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-pink-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 font-medium bg-pink-50/30"
              required
            />
          </div>

          <div>
            <label htmlFor="borrowerName" className="block text-sm font-kanit font-semibold text-pink-700 mb-1">
              ชื่อผู้ยืม <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="borrowerName"
              value={borrowerName}
              onChange={(e) => setBorrowerName(e.target.value)}
              className="w-full px-3 py-2 border border-pink-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 font-medium bg-pink-50/30"
              placeholder="กรอกชื่อ-นามสกุลผู้ยืม"
              required
            />
          </div>

          <div>
            <label htmlFor="borrowerDepartment" className="block text-sm font-kanit font-semibold text-pink-700 mb-1">
              แผนก <span className="text-red-500">*</span>
            </label>
            <select
              id="borrowerDepartment"
              value={borrowerDepartment}
              onChange={(e) => setBorrowerDepartment(e.target.value)}
              className="w-full px-3 py-2 border border-pink-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 font-medium bg-pink-50/30"
              required
            >
              <option value="">เลือกแผนก</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="borrowDate" className="block text-sm font-kanit font-semibold text-pink-700 mb-1">
              วันที่ยืม
            </label>
            <input
              type="date"
              id="borrowDate"
              min={today}
              value={borrowDate}
              onChange={(e) => setBorrowDate(e.target.value)}
              className="w-full px-3 py-2 border border-pink-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 text-black font-medium bg-pink-50/30"
              required
            />
          </div>

          <div>
            <label htmlFor="dueDate" className="block text-sm font-kanit font-semibold text-pink-700 mb-1">
              กำหนดคืน (ไม่บังคับ)
            </label>
            <input
              type="text"
              id="dueDate"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 border border-pink-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 text-black font-medium bg-pink-50/30"
              placeholder="ระบุวันที่หรือช่วงเวลาที่ต้องการคืน"
            />
          </div>

          <div>
            <label htmlFor="note" className="block text-sm font-kanit font-semibold text-pink-700 mb-1">
              หมายเหตุ (ไม่บังคับ)
            </label>
            <textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-pink-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 font-medium bg-pink-50/30 placeholder-pink-400"
              placeholder="วัตถุประสงค์การใช้งาน..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-xl hover:bg-gray-300 transition-colors font-kanit font-medium"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl hover:from-pink-600 hover:to-rose-600 disabled:opacity-50 transition-colors font-kanit font-medium"
            >
              {loading ? 'กำลังส่ง...' : 'ส่งคำขอ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

