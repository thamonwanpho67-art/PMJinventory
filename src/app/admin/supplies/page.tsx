'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import LayoutWrapper from '@/components/LayoutWrapper';
import AlertService from '@/lib/alert';
import { DEPARTMENTS } from '@/lib/constants';
import QRCode from 'react-qr-code';
import QRScanner from '@/components/QRScanner';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaBox, 
  FaExclamationTriangle, 
  FaTimes,
  FaSearch,
  FaFilter,
  FaEye,
  FaArrowUp,
  FaArrowDown,
  FaQrcode,
  FaCamera
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
  status: 'AVAILABLE' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'DISCONTINUED';
  imageUrl?: string;
  transactionCount: number;
  createdAt: string;
  updatedAt: string;
};

type SupplyFormData = {
  name: string;
  description: string;
  category: string;
  unit: string;
  quantity: string;
  minStock: string;
  unitPrice: string;
  supplier: string;
  location: string;
  imageUrl: string;
  department: string;
};

export default function SuppliesPage() {
  const { data: session, status } = useSession();
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSupply, setEditingSupply] = useState<Supply | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [selectedSupplyForAction, setSelectedSupplyForAction] = useState<Supply | null>(null);
  const [showSupplyModal, setShowSupplyModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');

  const [formData, setFormData] = useState<SupplyFormData>({
    name: '',
    description: '',
    category: '',
    unit: '',
    quantity: '0',
    minStock: '0',
    unitPrice: '',
    supplier: '',
    location: '',
    imageUrl: '',
    department: ''
  });

  const fetchSupplies = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchSupplies();
  }, [fetchSupplies]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category || !formData.unit || !formData.department) {
      await AlertService.warning('กรุณากรอกข้อมูลที่จำเป็น (ชื่อวัสดุ, หมวดหมู่, หน่วยนับ, และแผนก)');
      return;
    }

    try {
      const url = editingSupply ? `/api/supplies/${editingSupply.id}` : '/api/supplies';
      const method = editingSupply ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await AlertService.success(
          editingSupply ? 'แก้ไขวัสดุเรียบร้อยแล้ว' : 'เพิ่มวัสดุใหม่เรียบร้อยแล้ว'
        );
        resetForm();
        fetchSupplies();
      } else {
        const error = await response.json();
        await AlertService.error(error.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Error saving supply:', error);
      await AlertService.error('เกิดข้อผิดพลาดในการบันทึก');
    }
  };

  const handleEdit = (supply: Supply) => {
    setEditingSupply(supply);
    setFormData({
      name: supply.name,
      description: supply.description || '',
      category: supply.category,
      unit: supply.unit,
      quantity: supply.quantity.toString(),
      minStock: supply.minStock.toString(),
      unitPrice: supply.unitPrice?.toString() || '',
      supplier: supply.supplier || '',
      location: supply.location || '',
      imageUrl: supply.imageUrl || '',
      department: ''
    });
    setImagePreview(supply.imageUrl || '');
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    const result = await AlertService.confirm(
      'คุณแน่ใจหรือไม่?',
      'การลบวัสดุนี้จะไม่สามารถยกเลิกได้'
    );

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/supplies/${id}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          await AlertService.success('ลบวัสดุเรียบร้อยแล้ว');
          fetchSupplies();
        } else {
          const error = await response.json();
          await AlertService.error(error.error || 'เกิดข้อผิดพลาดในการลบ');
        }
      } catch (error) {
        console.error('Error deleting supply:', error);
        await AlertService.error('เกิดข้อผิดพลาดในการลบ');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      unit: '',
      quantity: '0',
      minStock: '0',
      unitPrice: '',
      supplier: '',
      location: '',
      imageUrl: '',
      department: ''
    });
    setEditingSupply(null);
    setShowModal(false);
    setImagePreview('');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      await AlertService.error('รองรับเฉพาะไฟล์รูปภาพ (JPG, PNG, WebP)');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      await AlertService.error('ไฟล์ใหญ่เกินไป (สูงสุด 5MB)');
      return;
    }

    try {
      setUploading(true);

      // Create FormData
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      // Upload to server
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      
      // Update form data with uploaded image URL
      setFormData(prev => ({ ...prev, imageUrl: data.url }));
      setImagePreview(data.url);
      
      await AlertService.success('อัปโหลดรูปภาพสำเร็จ');
    } catch (error) {
      console.error('Error uploading image:', error);
      await AlertService.error('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
    } finally {
      setUploading(false);
    }
  };

  // QR Code functions
  const generateSupplyQRUrl = (supplyId: string) => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/public/supply/${supplyId}`;
    }
    return `/public/supply/${supplyId}`;
  };

  const handleQRScan = (data: string) => {
    console.log('QR Code scanned:', data);
    
    // Extract supply ID from QR code URL
    const urlParts = data.split('/');
    const supplyId = urlParts[urlParts.length - 1];
    
    // Find supply by ID
    const supply = supplies.find(s => s.id === supplyId);
    
    if (supply) {
      setSelectedSupplyForAction(supply);
      setShowSupplyModal(true);
      setShowQRScanner(false);
    } else {
      alert('ไม่พบข้อมูลวัสดุนี้');
      setShowQRScanner(false);
    }
  };

  const handleWithdrawSupply = async (supplyId: string, quantity: number) => {
    try {
      const response = await fetch('/api/supply-transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          supplyId: supplyId,
          type: 'OUT',
          quantity: quantity,
          notes: 'เบิกผ่าน QR Scanner',
        }),
      });

      if (response.ok) {
        alert('เบิกวัสดุสำเร็จ');
        setShowSupplyModal(false);
        setSelectedSupplyForAction(null);
        fetchSupplies(); // Refresh supplies list
      } else {
        throw new Error('Failed to withdraw supply');
      }
    } catch (error) {
      console.error('Error withdrawing supply:', error);
      alert('เกิดข้อผิดพลาดในการเบิกวัสดุ');
    }
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

  const filteredSupplies = supplies.filter(supply => {
    const matchesSearch = supply.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supply.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supply.supplier?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || supply.status === filterStatus;
    const matchesCategory = filterCategory === 'all' || supply.category === filterCategory;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const categories = [...new Set(supplies.map(s => s.category))];

  return (
    <LayoutWrapper>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-kanit font-black bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
              จัดการวัสดุสิ้นเปลือง
            </h1>
            <p className="text-pink-700 font-kanit mt-2">
              จัดการวัสดุอุปกรณ์ที่ใช้แล้วหมดไป เช่น หมึกปริ้นเตอร์ กระดาษ อุปกรณ์สำนักงาน
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowQRScanner(true)}
              className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-3 rounded-xl font-kanit font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2"
            >
              <FaCamera />
              <span>สแกน QR</span>
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-3 rounded-xl font-kanit font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2"
            >
              <FaPlus />
              <span>เพิ่มวัสดุใหม่</span>
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border border-blue-200">
            <div className="flex items-center space-x-3">
              <FaBox className="text-blue-600 text-2xl" />
              <div>
                <p className="text-blue-800 font-kanit font-bold text-2xl">{supplies.length}</p>
                <p className="text-blue-600 text-sm font-kanit">รายการวัสดุ</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl border border-green-200">
            <div className="flex items-center space-x-3">
              <FaArrowUp className="text-green-600 text-2xl" />
              <div>
                <p className="text-green-800 font-kanit font-bold text-2xl">
                  {supplies.filter(s => s.status === 'AVAILABLE').length}
                </p>
                <p className="text-green-600 text-sm font-kanit">พร้อมใช้งาน</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-2xl border border-orange-200">
            <div className="flex items-center space-x-3">
              <FaExclamationTriangle className="text-orange-600 text-2xl" />
              <div>
                <p className="text-orange-800 font-kanit font-bold text-2xl">
                  {supplies.filter(s => s.status === 'LOW_STOCK').length}
                </p>
                <p className="text-orange-600 text-sm font-kanit">สต็อกต่ำ</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-2xl border border-red-200">
            <div className="flex items-center space-x-3">
              <FaArrowDown className="text-red-600 text-2xl" />
              <div>
                <p className="text-red-800 font-kanit font-bold text-2xl">
                  {supplies.filter(s => s.status === 'OUT_OF_STOCK').length}
                </p>
                <p className="text-red-600 text-sm font-kanit">หมดสต็อก</p>
              </div>
            </div>
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
            <option value="all">ทุกสถานะ</option>
            <option value="AVAILABLE">พร้อมใช้งาน</option>
            <option value="LOW_STOCK">สต็อกต่ำ</option>
            <option value="OUT_OF_STOCK">หมดสต็อก</option>
            <option value="DISCONTINUED">เลิกใช้งาน</option>
            </select>
          </div>
          <div className="relative">
            <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent font-kanit bg-white text-black"
            >
            <option value="all">ทุกหมวดหมู่</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
            </select>
          </div>
        </div>

        {/* Supplies Table */}
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
                    <th className="px-6 py-4 text-left font-kanit font-bold text-pink-800">ชื่อวัสดุ</th>
                    <th className="px-6 py-4 text-left font-kanit font-bold text-pink-800">QR Code</th>
                    <th className="px-6 py-4 text-left font-kanit font-bold text-pink-800">หมวดหมู่</th>
                    <th className="px-6 py-4 text-left font-kanit font-bold text-pink-800">จำนวน</th>
                    <th className="px-6 py-4 text-left font-kanit font-bold text-pink-800">หน่วย</th>
                    <th className="px-6 py-4 text-left font-kanit font-bold text-pink-800">สต็อกต่ำสุด</th>
                    <th className="px-6 py-4 text-left font-kanit font-bold text-pink-800">สถานะ</th>
                    <th className="px-6 py-4 text-left font-kanit font-bold text-pink-800">การจัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSupplies.map((supply) => (
                    <tr key={supply.id} className="border-t border-pink-100 hover:bg-pink-25">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-kanit font-semibold text-gray-900">{supply.name}</div>
                          {supply.description && (
                            <div className="text-sm text-gray-900 font-kanit">{supply.description}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-12 h-12 bg-white p-1 rounded border">
                          <QRCode
                            value={generateSupplyQRUrl(supply.id)}
                            size={40}
                            level="M"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 font-kanit text-gray-900">{supply.category}</td>
                      <td className="px-6 py-4">
                        <span className={`font-kanit font-bold ${
                          supply.quantity <= 0 ? 'text-red-600' : 
                          supply.quantity <= supply.minStock ? 'text-orange-600' : 'text-green-600'
                        }`}>
                          {supply.quantity}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-kanit text-gray-900">{supply.unit}</td>
                      <td className="px-6 py-4 font-kanit text-gray-900">{supply.minStock}</td>
                      <td className="px-6 py-4">{getStatusBadge(supply.status)}</td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(supply)}
                            className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                            title="แก้ไข"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(supply.id)}
                            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                            title="ลบ"
                            disabled={supply.transactionCount > 0}
                          >
                            <FaTrash />
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

        {filteredSupplies.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-gray-600 font-kanit text-lg">ไม่พบวัสดุที่ตรงกับการค้นหา</p>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-kanit font-bold text-pink-800">
                  {editingSupply ? 'แก้ไขวัสดุ' : 'เพิ่มวัสดุใหม่'}
                </h2>
                <button
                  onClick={resetForm}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <FaTimes />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-700 font-kanit font-semibold mb-2">
                      ชื่อวัสดุ *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-3 border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 font-kanit text-gray-900"
                      placeholder="เช่น หมึกปริ้นเตอร์ HP"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-kanit font-semibold mb-2">
                      หมวดหมู่ *
                    </label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full px-4 py-3 border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 font-kanit text-gray-900"
                      placeholder="เช่น อุปกรณ์สำนักงาน"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-kanit font-semibold mb-2">
                    รายละเอียด
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-4 py-3 border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 font-kanit text-gray-900"
                    rows={3}
                    placeholder="รายละเอียดเพิ่มเติม..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-gray-700 font-kanit font-semibold mb-2">
                      หน่วยนับ *
                    </label>
                    <input
                      type="text"
                      value={formData.unit}
                      onChange={(e) => setFormData({...formData, unit: e.target.value})}
                      className="w-full px-4 py-3 border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 font-kanit text-gray-900"
                      placeholder="เช่น ชิ้น, กล่อง, แกลลอน"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-kanit font-semibold mb-2">
                      จำนวน
                    </label>
                    <input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                      className="w-full px-4 py-3 border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 font-kanit text-gray-900"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-kanit font-semibold mb-2">
                      สต็อกต่ำสุด
                    </label>
                    <input
                      type="number"
                      value={formData.minStock}
                      onChange={(e) => setFormData({...formData, minStock: e.target.value})}
                      className="w-full px-4 py-3 border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 font-kanit text-gray-900"
                      min="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-700 font-kanit font-semibold mb-2">
                      ราคาต่อหน่วย (บาท)
                    </label>
                    <input
                      type="number"
                      value={formData.unitPrice}
                      onChange={(e) => setFormData({...formData, unitPrice: e.target.value})}
                      className="w-full px-4 py-3 border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 font-kanit text-gray-900"
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-kanit font-semibold mb-2">
                      ผู้จัดจำหน่าย
                    </label>
                    <input
                      type="text"
                      value={formData.supplier}
                      onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                      className="w-full px-4 py-3 border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 font-kanit text-gray-900"
                      placeholder="ชื่อบริษัท/ร้านค้า"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-kanit font-semibold mb-2">
                    ตำแหน่งเก็บ
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="w-full px-4 py-3 border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 font-kanit text-gray-900"
                    placeholder="เช่น ห้องเก็บของ ชั้น 2"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-kanit font-semibold mb-2">
                    แผนก/หน่วยงาน *
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    className="w-full px-4 py-3 border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 font-kanit text-gray-900 bg-white"
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
                  <label className="block text-gray-700 font-kanit font-semibold mb-2">
                    รูปภาพ
                  </label>
                  
                  {/* Image Preview */}
                  {(imagePreview || formData.imageUrl) && (
                    <div className="mb-4 relative">
                      <img 
                        src={imagePreview || formData.imageUrl} 
                        alt="Preview" 
                        className="w-full h-48 object-cover rounded-xl border border-pink-200"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({...formData, imageUrl: ''});
                          setImagePreview('');
                        }}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        title="ลบรูปภาพ"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  )}

                  {/* Upload Button */}
                  <div className="flex gap-2">
                    <label className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-kanit font-semibold shadow-lg hover:shadow-xl transition-all duration-200">
                        <FaCamera />
                        {uploading ? 'กำลังอัปโหลด...' : 'อัปโหลดรูปภาพ'}
                      </div>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleImageUpload}
                        disabled={uploading}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Manual URL Input */}
                  <div className="mt-3">
                    <input
                      type="url"
                      value={formData.imageUrl}
                      onChange={(e) => {
                        setFormData({...formData, imageUrl: e.target.value});
                        setImagePreview(e.target.value);
                      }}
                      className="w-full px-4 py-3 border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 font-kanit text-gray-900"
                      placeholder="หรือใส่ URL รูปภาพ"
                      disabled={uploading}
                    />
                  </div>
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
                    {editingSupply ? 'บันทึกการแก้ไข' : 'เพิ่มวัสดุ'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* QR Scanner Modal */}
        {showQRScanner && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-96 max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-kanit font-bold text-gray-900">สแกน QR Code</h3>
                <button
                  onClick={() => setShowQRScanner(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-4">
                <QRScanner
                  onScan={handleQRScan}
                  onError={(error) => console.error('QR Scanner Error:', error)}
                  onClose={() => setShowQRScanner(false)}
                />
              </div>
              
              <p className="text-sm text-gray-600 font-kanit text-center">
                วางกล้องให้อยู่เหนือ QR Code เพื่อสแกน
              </p>
            </div>
          </div>
        )}

        {/* Supply Action Modal */}
        {showSupplyModal && selectedSupplyForAction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-96 max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-kanit font-bold text-gray-900">ข้อมูลวัสดุ</h3>
                <button
                  onClick={() => {
                    setShowSupplyModal(false);
                    setSelectedSupplyForAction(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-kanit font-bold text-gray-900">{selectedSupplyForAction.name}</h4>
                  <p className="text-sm text-gray-600 font-kanit">หมวดหมู่: {selectedSupplyForAction.category}</p>
                </div>

                {selectedSupplyForAction.description && (
                  <div>
                    <p className="text-sm font-kanit text-gray-700">{selectedSupplyForAction.description}</p>
                  </div>
                )}

                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="grid grid-cols-2 gap-4 text-sm font-kanit">
                    <div>
                      <span className="text-gray-600">จำนวนคงเหลือ:</span>
                      <span className="font-bold ml-2">{selectedSupplyForAction.quantity} {selectedSupplyForAction.unit}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">สต็อกต่ำสุด:</span>
                      <span className="font-bold ml-2">{selectedSupplyForAction.minStock} {selectedSupplyForAction.unit}</span>
                    </div>
                  </div>
                </div>

                <div>{getStatusBadge(selectedSupplyForAction.status)}</div>

                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => {
                      const quantity = prompt(`กรุณาระบุจำนวนที่ต้องการเบิก (${selectedSupplyForAction.unit}):`, '1');
                      if (quantity && parseInt(quantity) > 0) {
                        handleWithdrawSupply(selectedSupplyForAction.id, parseInt(quantity));
                      }
                    }}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-kanit font-medium py-2 px-4 rounded-lg transition duration-300"
                    disabled={selectedSupplyForAction.quantity === 0 || selectedSupplyForAction.status === 'OUT_OF_STOCK'}
                  >
                    เบิกวัสดุ
                  </button>
                  <button
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        window.location.href = `/public/supply/${selectedSupplyForAction.id}`;
                      }
                    }}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-kanit font-medium py-2 px-4 rounded-lg transition duration-300"
                  >
                    ดูรายละเอียด
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </LayoutWrapper>
  );
}

