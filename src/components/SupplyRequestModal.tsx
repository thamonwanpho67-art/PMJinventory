'use client';

import { useState } from 'react';
import { FaClipboard, FaTimes, FaUser, FaBuilding, FaCalendar, FaStickyNote } from 'react-icons/fa';
import { DEPARTMENTS } from '@/lib/constants';

interface Supply {
  id: string;
  name: string;
  unit: string;
  quantity: number;
}

interface SupplyRequestModalProps {
  supply: Supply;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SupplyRequestModal({ supply, isOpen, onClose, onSuccess }: SupplyRequestModalProps) {
  const [formData, setFormData] = useState({
    quantity: 1,
    requesterName: '',
    department: '',
    requestDate: new Date().toISOString().split('T')[0],
    purpose: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!formData.requesterName.trim()) {
      setError('กรุณากรอกชื่อผู้ขอเบิก');
      setLoading(false);
      return;
    }

    if (!formData.department) {
      setError('กรุณาเลือกแผนก');
      setLoading(false);
      return;
    }

    if (formData.quantity <= 0 || formData.quantity > supply.quantity) {
      setError(`จำนวนที่ขอเบิกต้องอยู่ระหว่าง 1-${supply.quantity}`);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/supply-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          supplyId: supply.id,
          quantity: formData.quantity,
          requesterName: formData.requesterName.trim(),
          department: formData.department,
          requestDate: formData.requestDate,
          purpose: formData.purpose.trim() || null,
          notes: formData.notes.trim() || null,
        }),
      });

      if (response.ok) {
        onSuccess();
        resetForm();
        alert('ยื่นคำขอเบิกวัสดุเรียบร้อยแล้ว');
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

  const resetForm = () => {
    setFormData({
      quantity: 1,
      requesterName: '',
      department: '',
      requestDate: new Date().toISOString().split('T')[0],
      purpose: '',
      notes: ''
    });
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full p-4 max-h-[95vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <FaClipboard className="text-pink-600 text-lg" />
            <h2 className="text-lg font-kanit font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
              ยื่นคำขอเบิกวัสดุ
            </h2>
          </div>
          <button
            onClick={resetForm}
            className="text-pink-400 hover:text-pink-600 transition-colors"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4 p-3 bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg border border-pink-200">
          <h3 className="font-kanit font-semibold text-gray-900 text-sm">{supply.name}</h3>
          <p className="text-xs text-pink-600 font-kanit">จำนวนคงเหลือ: {supply.quantity} {supply.unit}</p>
        </div>

        {error && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="quantity" className="block text-xs font-kanit font-semibold text-pink-700 mb-1">
              จำนวนที่ต้องการเบิก
            </label>
            <input
              type="number"
              id="quantity"
              min="1"
              max={supply.quantity}
              value={formData.quantity}
              onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
              className="w-full px-3 py-2 border border-pink-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 font-medium bg-pink-50/30 text-sm"
              required
            />
            <p className="text-xs text-gray-500 mt-1">หน่วย: {supply.unit}</p>
          </div>

          <div>
            <label htmlFor="requesterName" className="block text-xs font-kanit font-semibold text-pink-700 mb-1">
              <FaUser className="inline mr-1" />
              ชื่อผู้ขอเบิก <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="requesterName"
              value={formData.requesterName}
              onChange={(e) => setFormData(prev => ({ ...prev, requesterName: e.target.value }))}
              className="w-full px-3 py-2 border border-pink-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 font-medium bg-pink-50/30 text-sm"
              placeholder="กรอกชื่อ-นามสกุล"
              required
            />
          </div>

          <div>
            <label htmlFor="department" className="block text-xs font-kanit font-semibold text-pink-700 mb-1">
              <FaBuilding className="inline mr-1" />
              แผนก <span className="text-red-500">*</span>
            </label>
            <select
              id="department"
              value={formData.department}
              onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
              className="w-full px-3 py-2 border border-pink-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 font-medium bg-pink-50/30 text-sm"
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
            <label htmlFor="requestDate" className="block text-xs font-kanit font-semibold text-pink-700 mb-1">
              <FaCalendar className="inline mr-1" />
              วันที่ต้องการใช้
            </label>
            <input
              type="date"
              id="requestDate"
              value={formData.requestDate}
              onChange={(e) => setFormData(prev => ({ ...prev, requestDate: e.target.value }))}
              className="w-full px-3 py-2 border border-pink-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 text-black font-medium bg-pink-50/30 text-sm"
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          <div>
            <label htmlFor="purpose" className="block text-xs font-kanit font-semibold text-pink-700 mb-1">
              วัตถุประสงค์การใช้งาน
            </label>
            <input
              type="text"
              id="purpose"
              value={formData.purpose}
              onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
              className="w-full px-3 py-2 border border-pink-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 font-medium bg-pink-50/30 text-sm"
              placeholder="เช่น งานประชุม, งานจัดอบรม, งานเอกสาร"
            />
          </div>

          <div>
            <label htmlFor="notes" className="block text-xs font-kanit font-semibold text-pink-700 mb-1">
              <FaStickyNote className="inline mr-1" />
              หมายเหตุเพิ่มเติม
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 border border-pink-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 font-medium bg-pink-50/30 placeholder-pink-400 text-sm"
              placeholder="ข้อมูลเพิ่มเติม..."
            />
          </div>

          <div className="flex gap-2 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={resetForm}
              className="flex-1 px-3 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors font-kanit font-medium text-sm"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-3 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg hover:from-pink-600 hover:to-rose-600 disabled:opacity-50 transition-colors font-kanit font-medium text-sm"
            >
              {loading ? 'กำลังส่ง...' : 'ส่งคำขอ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}