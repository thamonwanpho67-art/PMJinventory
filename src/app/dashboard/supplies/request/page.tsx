'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import LayoutWrapper from '@/components/LayoutWrapper';
import AlertService from '@/lib/alert';
import { DEPARTMENTS } from '@/lib/constants';
import { 
  FaBox,
  FaSearch,
  FaFilter,
  FaMinus,
  FaBuilding,
  FaClipboardList
} from 'react-icons/fa';

type Supply = {
  id: string;
  name: string;
  description?: string;
  category: string;
  unit: string;
  quantity: number;
  minStock: number;
  status: string;
  imageUrl?: string;
};

export default function SupplyRequestPage() {
  const { data: session, status } = useSession();
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [selectedSupply, setSelectedSupply] = useState<Supply | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  
  const [formData, setFormData] = useState({
    quantity: '',
    department: '',
    notes: '',
  });

  const fetchSupplies = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/supplies');
      if (response.ok) {
        const data = await response.json();
        // Filter only available supplies
        setSupplies(data.data.filter((s: Supply) => s.status === 'AVAILABLE' && s.quantity > 0));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSupply) {
      await AlertService.error('กรุณาเลือกวัสดุที่ต้องการเบิก');
      return;
    }

    if (!formData.quantity || parseInt(formData.quantity) < 1) {
      await AlertService.error('กรุณาระบุจำนวนที่ต้องการเบิก');
      return;
    }

    if (!formData.department) {
      await AlertService.error('กรุณาเลือกแผนก');
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch('/api/supply-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          supplyId: selectedSupply.id,
          quantity: parseInt(formData.quantity),
          requesterName: session?.user?.name || 'ผู้ใช้งาน',
          department: formData.department,
          requestDate: new Date().toISOString(),
          purpose: formData.notes,
          notes: formData.notes,
        }),
      });

      if (response.ok) {
        await AlertService.success('ส่งคำขอเบิกวัสดุเรียบร้อยแล้ว');
        resetForm();
        fetchSupplies();
      } else {
        const error = await response.json();
        await AlertService.error(error.error || 'เกิดข้อผิดพลาดในการส่งคำขอ');
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      await AlertService.error('เกิดข้อผิดพลาดในการส่งคำขอ');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      quantity: '',
      department: '',
      notes: '',
    });
    setSelectedSupply(null);
  };

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

  const categories = [...new Set(supplies.map(s => s.category))];
  
  const filteredSupplies = supplies.filter(supply => {
    const matchesSearch = supply.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supply.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || supply.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <LayoutWrapper>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-kanit font-black bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
              เบิกวัสดุสิ้นเปลือง
            </h1>
            <p className="text-pink-700 font-kanit mt-2">
              เลือกวัสดุที่ต้องการเบิกและส่งคำขอ
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <FaClipboardList className="text-pink-500 text-3xl" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Supply List */}
          <div className="lg:col-span-2">
            {/* Search and Filter */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="ค้นหาวัสดุ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent font-kanit text-gray-900"
                />
              </div>
              <div className="relative">
                <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent font-kanit bg-white text-gray-900"
                >
                  <option value="ALL">ทุกหมวดหมู่</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Supply Cards */}
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-200 border-t-pink-600 mx-auto mb-4"></div>
                  <p className="text-pink-600 font-kanit">กำลังโหลดข้อมูล...</p>
                </div>
              ) : filteredSupplies.length === 0 ? (
                <div className="text-center py-8 bg-white rounded-xl border border-pink-100">
                  <FaBox className="text-4xl text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-900 font-kanit">ไม่พบวัสดุที่ตรงกับการค้นหา</p>
                </div>
              ) : (
                filteredSupplies.map((supply) => (
                  <div
                    key={supply.id}
                    onClick={() => setSelectedSupply(supply)}
                    className={`bg-white rounded-xl p-4 border-2 cursor-pointer transition-all ${
                      selectedSupply?.id === supply.id
                        ? 'border-pink-300 bg-pink-50 shadow-lg'
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
                            supply.quantity <= supply.minStock ? 'text-orange-600' : 'text-green-600'
                          }`}>
                            {supply.quantity}
                          </span>
                          <span className="text-gray-900 font-kanit">{supply.unit}</span>
                        </div>
                        <span className="text-xs font-kanit text-gray-900">คงเหลือ</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Request Form */}
          <div>
            <div className="bg-white rounded-2xl shadow-lg border border-pink-100 p-6 sticky top-6">
              <h2 className="text-xl font-kanit font-bold text-pink-800 mb-4 flex items-center gap-2">
                <FaMinus className="text-red-500" />
                ส่งคำขอเบิกวัสดุ
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

                  {/* Quantity */}
                  <div>
                    <label className="block text-pink-900 font-kanit font-semibold mb-2">
                      จำนวนที่ต้องการเบิก *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.quantity}
                        onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                        className="w-full px-4 py-3 border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 font-kanit text-gray-900"
                        min="1"
                        max={selectedSupply.quantity}
                        placeholder="ระบุจำนวน"
                        required
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-900 font-kanit">
                        {selectedSupply.unit}
                      </span>
                    </div>
                    <p className="text-xs text-pink-600 font-kanit mt-1">
                      สามารถเบิกได้สูงสุด {selectedSupply.quantity} {selectedSupply.unit}
                    </p>
                  </div>

                  {/* Department */}
                  <div>
                    <label className="block text-pink-900 font-kanit font-semibold mb-2">
                      <FaBuilding className="inline mr-2" />
                      แผนก/หน่วยงาน *
                    </label>
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData({...formData, department: e.target.value})}
                      className="w-full px-4 py-3 border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 font-kanit bg-white text-gray-900"
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
                      placeholder="เหตุผลในการเบิก..."
                    />
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex flex-col space-y-3 pt-4 border-t border-pink-100">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-kanit font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                    >
                      {submitting ? 'กำลังส่งคำขอ...' : 'ส่งคำขอเบิก'}
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="w-full px-6 py-3 border border-pink-300 text-pink-600 rounded-xl font-kanit font-semibold hover:bg-pink-50 transition-colors"
                    >
                      ล้างข้อมูล
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-center py-8">
                  <FaBox className="text-6xl text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-900 font-kanit">กรุณาเลือกวัสดุที่ต้องการเบิก</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </LayoutWrapper>
  );
}
