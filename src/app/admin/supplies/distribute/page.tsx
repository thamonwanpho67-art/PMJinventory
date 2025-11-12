'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import LayoutWrapper from '@/components/LayoutWrapper';
import AlertService from '@/lib/alert';
import { DEPARTMENTS } from '@/lib/constants';
import { 
  FaArrowDown, 
  FaArrowUp, 
  FaSearch, 
  FaPlus,
  FaMinus,
  FaBox,
  FaHistory,
  FaBuilding
} from 'react-icons/fa';

type Supply = {
  id: string;
  name: string;
  description?: string;
  category: string;
  unit: string;
  quantity: number;
  minStock: number;
  unitPrice?: number;
  supplier?: string;
  location?: string;
  status: string;
  imageUrl?: string;
};

type TransactionFormData = {
  supplyId: string;
  transactionType: 'IN' | 'OUT';
  quantity: string;
  unitPrice: string;
  department: string;
  notes: string;
  approvedBy: string;
};

export default function SupplyDistributePage() {
  const { data: session, status } = useSession();
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [selectedSupply, setSelectedSupply] = useState<Supply | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState<TransactionFormData>({
    supplyId: '',
    transactionType: 'OUT',
    quantity: '',
    unitPrice: '',
    department: '',
    notes: '',
    approvedBy: ''
  });

  const fetchSupplies = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/supplies');
      if (response.ok) {
        const data = await response.json();
        setSupplies(data.data);
      } else {
        await AlertService.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      }
    } catch (error) {
      console.error('Error fetching supplies:', error);
      await AlertService.error('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupplies();
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

  if (status === 'unauthenticated' || session?.user?.role !== 'ADMIN') {
    redirect('/login');
  }



  const handleSupplySelect = (supply: Supply) => {
    setSelectedSupply(supply);
    setFormData({
      ...formData,
      supplyId: supply.id,
      unitPrice: supply.unitPrice?.toString() || ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSupply || !formData.quantity) {
      await AlertService.warning('กรุณาเลือกวัสดุและระบุจำนวน');
      return;
    }

    const quantity = parseInt(formData.quantity);
    if (quantity <= 0) {
      await AlertService.warning('กรุณาระบุจำนวนที่ถูกต้อง');
      return;
    }

    if (formData.transactionType === 'OUT' && quantity > selectedSupply.quantity) {
      await AlertService.warning('จำนวนที่เบิกเกินจำนวนที่มีในสต็อก');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch('/api/supply-transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const transactionType = formData.transactionType === 'IN' ? 'เพิ่มสต็อก' : 'เบิกวัสดุ';
        await AlertService.success(`${transactionType}เรียบร้อยแล้ว`);
        resetForm();
        fetchSupplies();
      } else {
        const error = await response.json();
        await AlertService.error(error.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Error creating transaction:', error);
      await AlertService.error('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      supplyId: '',
      transactionType: 'OUT',
      quantity: '',
      unitPrice: '',
      department: '',
      notes: '',
      approvedBy: ''
    });
    setSelectedSupply(null);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      AVAILABLE: { color: 'bg-green-100 text-green-800', text: 'พร้อมใช้งาน' },
      LOW_STOCK: { color: 'bg-orange-100 text-orange-800', text: 'สต็อกต่ำ' },
      OUT_OF_STOCK: { color: 'bg-red-100 text-red-800', text: 'หมดสต็อก' },
      DISCONTINUED: { color: 'bg-gray-100 text-gray-800', text: 'เลิกใช้งาน' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-kanit ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const filteredSupplies = supplies.filter(supply => 
    supply.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supply.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <LayoutWrapper>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-kanit font-black bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
              เบิก-จ่ายวัสดุสิ้นเปลือง
            </h1>
            <p className="text-pink-700 font-kanit mt-2">
              บันทึกการเบิกจ่ายและเพิ่มสต็อกวัสดุอุปกรณ์
            </p>
          </div>
          <button
            onClick={() => window.location.href = '/admin/supplies/history'}
            className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-3 rounded-xl font-kanit font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2"
          >
            <FaHistory />
            <span>ประวัติการเบิก</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Supply Selection */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-pink-100 p-6">
              <h2 className="text-xl font-kanit font-bold text-pink-800 mb-4">
                เลือกวัสดุ
              </h2>
              
              {/* Search */}
              <div className="relative mb-6">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pink-400" />
                <input
                  type="text"
                  placeholder="ค้นหาวัสดุ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 font-kanit text-black"
                />
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-pink-200 border-t-pink-600 mx-auto mb-4"></div>
                  <p className="text-pink-600 font-kanit">กำลังโหลด...</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredSupplies.map((supply) => (
                    <div
                      key={supply.id}
                      onClick={() => handleSupplySelect(supply)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                        selectedSupply?.id === supply.id
                          ? 'border-pink-300 bg-pink-50'
                          : 'border-gray-200 hover:border-pink-200 hover:bg-pink-25'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-kanit font-semibold text-gray-900">{supply.name}</h3>
                          <p className="text-sm text-gray-900 font-kanit">{supply.category}</p>
                          {supply.description && (
                            <p className="text-sm text-gray-900 font-kanit mt-1">{supply.description}</p>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <div className="flex items-center space-x-2">
                            <span className={`font-kanit font-bold text-lg ${
                              supply.quantity <= 0 ? 'text-red-600' : 
                              supply.quantity <= supply.minStock ? 'text-orange-600' : 'text-green-600'
                            }`}>
                              {supply.quantity}
                            </span>
                            <span className="text-gray-900 font-kanit">{supply.unit}</span>
                          </div>
                          {getStatusBadge(supply.status)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {filteredSupplies.length === 0 && !loading && (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">📦</div>
                  <p className="text-gray-900 font-kanit">ไม่พบวัสดุที่ตรงกับการค้นหา</p>
                </div>
              )}
            </div>
          </div>

          {/* Transaction Form */}
          <div>
            <div className="bg-white rounded-2xl shadow-lg border border-pink-100 p-6">
              <h2 className="text-xl font-kanit font-bold text-pink-800 mb-4">
                บันทึกการทำรายการ
              </h2>

              {selectedSupply ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Selected Supply Info */}
                  <div className="bg-pink-50 p-4 rounded-xl border border-pink-200">
                    <h3 className="font-kanit font-semibold text-pink-800">{selectedSupply.name}</h3>
                    <p className="text-sm text-pink-600 font-kanit">{selectedSupply.category}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm font-kanit text-pink-700">คงเหลือ:</span>
                      <span className="font-kanit font-bold text-pink-800">
                        {selectedSupply.quantity} {selectedSupply.unit}
                      </span>
                    </div>
                  </div>

                  {/* Transaction Type */}
                  <div>
                    <label className="block text-pink-900 font-kanit font-semibold mb-3">
                      ประเภทรายการ *
                    </label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="OUT"
                          checked={formData.transactionType === 'OUT'}
                          onChange={(e) => setFormData({...formData, transactionType: e.target.value as 'OUT'})}
                          className="mr-2"
                        />
                        <span className="flex items-center space-x-2 font-kanit text-gray-900">
                          <FaMinus className="text-red-500" />
                          <span>เบิกออก</span>
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="IN"
                          checked={formData.transactionType === 'IN'}
                          onChange={(e) => setFormData({...formData, transactionType: e.target.value as 'IN'})}
                          className="mr-2"
                        />
                        <span className="flex items-center space-x-2 font-kanit text-gray-900">
                          <FaPlus className="text-green-500" />
                          <span>นำเข้า</span>
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="block text-pink-900 font-kanit font-semibold mb-2">
                      จำนวน *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.quantity}
                        onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                        className="w-full px-4 py-3 border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 font-kanit text-gray-900"
                        min="1"
                        max={formData.transactionType === 'OUT' ? selectedSupply.quantity : undefined}
                        required
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-900 font-kanit">
                        {selectedSupply.unit}
                      </span>
                    </div>
                  </div>

                  {/* Unit Price */}
                  <div>
                    <label className="block text-pink-900 font-kanit font-semibold mb-2">
                      ราคาต่อหน่วย (บาท)
                    </label>
                    <input
                      type="number"
                      value={formData.unitPrice}
                      onChange={(e) => setFormData({...formData, unitPrice: e.target.value})}
                      className="w-full px-4 py-3 border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 font-kanit text-gray-900"
                      step="0.01"
                      min="0"
                      placeholder="250"
                    />
                  </div>

                  {/* Department */}
                  {formData.transactionType === 'OUT' && (
                    <div>
                      <label className="block text-pink-900 font-kanit font-semibold mb-2">
                        <FaBuilding className="inline mr-2" />
                        แผนก/หน่วยงาน
                      </label>
                      <select
                        value={formData.department}
                        onChange={(e) => setFormData({...formData, department: e.target.value})}
                        className="w-full px-4 py-3 border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 font-kanit bg-white text-gray-900"
                      >
                        <option value="">เลือกแผนก</option>
                        {DEPARTMENTS.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <label className="block text-pink-900 font-kanit font-semibold mb-2">
                      หมายเหตุ
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      className="w-full px-4 py-3 border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 font-kanit text-gray-900"
                      rows={3}
                      placeholder="รายละเอียดเพิ่มเติม..."
                    />
                  </div>

                  {/* Approved By */}
                  <div>
                    <label className="block text-pink-900 font-kanit font-semibold mb-2">
                      ผู้อนุมัติ
                    </label>
                    <input
                      type="text"
                      value={formData.approvedBy}
                      onChange={(e) => setFormData({...formData, approvedBy: e.target.value})}
                      className="w-full px-4 py-3 border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 font-kanit text-gray-900"
                      placeholder="ชื่อผู้อนุมัติ"
                    />
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex space-x-4 pt-6 border-t border-pink-100">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="flex-1 px-6 py-3 border border-pink-300 text-pink-600 rounded-xl font-kanit font-semibold hover:bg-pink-50 transition-colors"
                    >
                      ล้างข้อมูล
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-kanit font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                    >
                      {submitting ? 'กำลังบันทึก...' : 'บันทึกรายการ'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-center py-8">
                  <FaBox className="text-6xl text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-900 font-kanit">กรุณาเลือกวัสดุที่ต้องการทำรายการ</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </LayoutWrapper>
  );
}

