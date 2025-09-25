'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { FaBox, FaCheckCircle, FaExclamationTriangle, FaArrowLeft } from 'react-icons/fa';

interface Supply {
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
  createdAt: string;
  updatedAt: string;
}

export default function PublicSupplyPage() {
  const params = useParams();
  const [supply, setSupply] = useState<Supply | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSupply = async () => {
      try {
        const response = await fetch(`/api/supplies/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setSupply(data.supply || data);
        } else {
          throw new Error('Supply not found');
        }
      } catch (error) {
        console.error('Error fetching supply:', error);
        setError('ไม่พบข้อมูลวัสดุ');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchSupply();
    }
  }, [params.id]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      AVAILABLE: { color: 'bg-green-100 text-green-800', text: 'พร้อมใช้งาน', icon: <FaCheckCircle /> },
      LOW_STOCK: { color: 'bg-orange-100 text-orange-800', text: 'สต็อกต่ำ', icon: <FaExclamationTriangle /> },
      OUT_OF_STOCK: { color: 'bg-red-100 text-red-800', text: 'หมดสต็อก', icon: <FaBox /> },
      DISCONTINUED: { color: 'bg-gray-100 text-gray-800', text: 'เลิกใช้งาน', icon: <FaBox /> }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <div className="flex items-center gap-2">
        <span className="text-gray-600">{config.icon}</span>
        <span className={`px-3 py-1 rounded-full text-sm font-kanit ${config.color}`}>
          {config.text}
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-pink-500 mx-auto"></div>
          <p className="text-pink-600 mt-4 font-kanit">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (error || !supply) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <FaBox className="text-gray-400 text-6xl mb-4 mx-auto" />
          <h1 className="text-2xl font-kanit font-bold text-gray-800 mb-2">ไม่พบวัสดุ</h1>
          <p className="text-gray-600 font-kanit mb-6">QR Code นี้อาจไม่ถูกต้องหรือวัสดุถูกลบแล้ว</p>
          <button
            onClick={() => window.history.back()}
            className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-2 rounded-lg font-kanit font-medium hover:from-pink-600 hover:to-rose-600 transition duration-300"
          >
            กลับหน้าเดิม
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-pink-600 hover:text-pink-700 font-kanit font-medium mb-4"
          >
            <FaArrowLeft />
            กลับ
          </button>
          
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl flex items-center justify-center">
                <FaBox className="text-white text-2xl" />
              </div>
              <div>
                <h1 className="text-2xl font-kanit font-bold text-gray-900">{supply.name}</h1>
                <p className="text-gray-600 font-kanit">หมวดหมู่: {supply.category}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Supply Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <h2 className="text-xl font-kanit font-bold text-gray-900 mb-4">ข้อมูลวัสดุ</h2>
              
              {supply.description && (
                <div className="mb-4">
                  <h3 className="font-kanit font-medium text-gray-700 mb-2">คำอธิบาย</h3>
                  <p className="text-gray-600 font-kanit">{supply.description}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-kanit font-medium text-gray-700 mb-2">จำนวนคงเหลือ</h3>
                  <p className="text-gray-900 font-kanit font-bold text-lg">
                    {supply.quantity} {supply.unit}
                  </p>
                </div>
                
                <div>
                  <h3 className="font-kanit font-medium text-gray-700 mb-2">สต็อกต่ำสุด</h3>
                  <p className="text-gray-900 font-kanit">
                    {supply.minStock} {supply.unit}
                  </p>
                </div>

                {supply.unitPrice && (
                  <div>
                    <h3 className="font-kanit font-medium text-gray-700 mb-2">ราคาต่อหน่วย</h3>
                    <p className="text-gray-900 font-kanit">
                      ฿{supply.unitPrice?.toLocaleString()} ต่อ {supply.unit}
                    </p>
                  </div>
                )}

                {supply.supplier && (
                  <div>
                    <h3 className="font-kanit font-medium text-gray-700 mb-2">ผู้จำหน่าย</h3>
                    <p className="text-gray-900 font-kanit">{supply.supplier}</p>
                  </div>
                )}

                {supply.location && (
                  <div>
                    <h3 className="font-kanit font-medium text-gray-700 mb-2">สถานที่เก็บ</h3>
                    <p className="text-gray-900 font-kanit">{supply.location}</p>
                  </div>
                )}

                <div className="md:col-span-2">
                  <h3 className="font-kanit font-medium text-gray-700 mb-2">สถานะ</h3>
                  {getStatusBadge(supply.status)}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-kanit font-bold text-gray-900 mb-4">การดำเนินการ</h2>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const quantity = prompt(`กรุณาระบุจำนวนที่ต้องการเบิก (${supply.unit}):`, '1');
                    if (quantity && parseInt(quantity) > 0) {
                      // Create withdraw request
                      alert(`ส่งคำขอเบิกวัสดุ ${supply.name} จำนวน ${quantity} ${supply.unit} เรียบร้อยแล้ว`);
                    }
                  }}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-kanit font-medium py-3 px-4 rounded-xl transition duration-300"
                  disabled={supply.quantity === 0 || supply.status === 'OUT_OF_STOCK' || supply.status === 'DISCONTINUED'}
                >
                  เบิกวัสดุ
                </button>
                <button
                  onClick={() => window.location.href = '/dashboard'}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-kanit font-medium py-3 px-4 rounded-xl transition duration-300"
                >
                  ไปยังแดชบอร์ด
                </button>
              </div>

              {(supply.status === 'OUT_OF_STOCK' || supply.status === 'DISCONTINUED') && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 font-kanit text-sm">
                    {supply.status === 'OUT_OF_STOCK' 
                      ? 'วัสดุนี้หมดสต็อกแล้ว ไม่สามารถเบิกได้' 
                      : 'วัสดุนี้เลิกใช้งานแล้ว'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Image & Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <h2 className="text-xl font-kanit font-bold text-gray-900 mb-4">รูปภาพ</h2>
              {supply.imageUrl ? (
                <img 
                  src={supply.imageUrl} 
                  alt={supply.name}
                  className="w-full h-64 object-cover rounded-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/images/placeholder-supply.png';
                    target.onerror = null;
                  }}
                />
              ) : (
                <div className="w-full h-64 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                  <FaBox className="text-gray-400 text-6xl" />
                </div>
              )}
            </div>

            {/* Stock Alert */}
            {supply.quantity <= supply.minStock && supply.quantity > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FaExclamationTriangle className="text-orange-500" />
                    <span className="font-kanit font-bold text-orange-800">แจ้งเตือนสต็อกต่ำ</span>
                  </div>
                  <p className="text-orange-700 font-kanit text-sm">
                    จำนวนคงเหลือต่ำกว่าระดับขั้นต่ำ ควรเติมสต็อก
                  </p>
                </div>
              </div>
            )}

            {/* Details */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-kanit font-bold text-gray-900 mb-4">รายละเอียดเพิ่มเติม</h2>
              <div className="space-y-3 text-sm text-gray-500 font-kanit">
                <div className="flex justify-between">
                  <span>เพิ่มเมื่อ:</span>
                  <span>{new Date(supply.createdAt).toLocaleDateString('th-TH')}</span>
                </div>
                <div className="flex justify-between">
                  <span>อัปเดต:</span>
                  <span>{new Date(supply.updatedAt).toLocaleDateString('th-TH')}</span>
                </div>
                <div className="flex justify-between">
                  <span>หน่วยนับ:</span>
                  <span className="font-bold">{supply.unit}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}