'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { FaBox, FaCalendarAlt, FaHashtag, FaInfoCircle, FaSpinner, FaTimes, FaSyncAlt } from 'react-icons/fa';

interface AssetData {
  id: string;
  name: string;
  code: string;
  description?: string;
  quantity: number;
  availableQuantity: number;
  createdAt: string;
  updatedAt: string;
}

interface Loan {
  id: string;
  status: string;
  quantity: number;
}

export default function PublicAssetInfoPage() {
  const params = useParams();
  const assetId = params.id as string;
  
  const [asset, setAsset] = useState<AssetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchAssetData = async () => {
    if (!assetId) return;
    
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/assets/${assetId}`);
      
      if (response.ok) {
        const data = await response.json();
        
        // คำนวณจำนวนที่พร้อมใช้งาน
        const loansResponse = await fetch(`/api/loans?assetId=${assetId}`);
        const loansData = await loansResponse.json();
        
        const borrowedCount = loansData
          .filter((loan: Loan) => loan.status === 'BORROWED')
          .reduce((sum: number, loan: Loan) => sum + loan.quantity, 0);
        
        const availableQuantity = data.quantity - borrowedCount;
        
        setAsset({
          ...data,
          availableQuantity
        });
        setLastUpdated(new Date());
      } else {
        setError('ไม่พบข้อมูลครุภัณฑ์');
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssetData();
    
    // อัปเดตข้อมูลทุก 30 วินาที
    const interval = setInterval(fetchAssetData, 30000);
    
    return () => clearInterval(interval);
  }, [assetId]);

  const getAvailabilityStatus = () => {
    if (!asset) return { text: 'ไม่ทราบ', color: 'text-gray-600 bg-gray-100' };
    
    if (asset.availableQuantity > 0) {
      return { text: 'พร้อมใช้งาน', color: 'text-emerald-600 bg-emerald-100' };
    } else {
      return { text: 'ไม่พร้อมใช้งาน', color: 'text-red-600 bg-red-100' };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const refreshData = () => {
    fetchAssetData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md w-full">
          <FaSpinner className="text-5xl text-blue-600 mx-auto mb-6 animate-spin" />
          <h2 className="text-2xl font-kanit font-bold text-gray-900 mb-2">กำลังโหลดข้อมูล</h2>
          <p className="text-gray-600 font-kanit">กรุณารอสักครู่...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md w-full">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaTimes className="text-3xl text-red-600" />
          </div>
          <h2 className="text-2xl font-kanit font-bold text-gray-900 mb-4">เกิดข้อผิดพลาด</h2>
          <p className="text-red-600 font-kanit mb-6">{error}</p>
          <button
            onClick={refreshData}
            className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-3 rounded-xl hover:from-red-600 hover:to-pink-600 transition-all duration-300 font-kanit font-bold"
          >
            <FaSyncAlt className="inline mr-2" />
            ลองใหม่อีกครั้ง
          </button>
        </div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md w-full">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaBox className="text-3xl text-gray-600" />
          </div>
          <h2 className="text-2xl font-kanit font-bold text-gray-900 mb-4">ไม่พบข้อมูล</h2>
          <p className="text-gray-600 font-kanit">ไม่พบข้อมูลครุภัณฑ์ที่ร้องขอ</p>
        </div>
      </div>
    );
  }

  const status = getAvailabilityStatus();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaBox className="text-3xl text-blue-600" />
            </div>
            <h1 className="text-3xl font-kanit font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
              ข้อมูลครุภัณฑ์
            </h1>
            <p className="text-gray-600 font-kanit">ข้อมูลสถานะและจำนวนคงเหลือแบบเรียลไทม์</p>
          </div>

          {/* Asset Status Badge */}
          <div className="flex justify-center mb-4">
            <span className={`px-6 py-3 rounded-full text-lg font-bold font-kanit ${status.color}`}>
              {status.text}
            </span>
          </div>

          {/* Last Updated */}
          <div className="text-center text-sm text-gray-500 font-kanit">
            อัปเดตล่าสุด: {lastUpdated.toLocaleTimeString('th-TH')}
            <button
              onClick={refreshData}
              className="ml-2 text-blue-600 hover:text-blue-700 transition-colors"
              title="รีเฟรชข้อมูล"
            >
              <FaSyncAlt className="inline" />
            </button>
          </div>
        </div>

        {/* Asset Details */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h2 className="text-xl font-kanit font-bold text-gray-900 mb-6 flex items-center">
            <FaInfoCircle className="mr-3 text-blue-600" />
            รายละเอียดครุภัณฑ์
          </h2>

          <div className="space-y-6">
            {/* Asset Name */}
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4">
              <label className="text-sm font-medium text-gray-600 font-kanit block mb-2">ชื่อครุภัณฑ์</label>
              <h3 className="text-2xl font-kanit font-bold text-gray-900">{asset.name}</h3>
            </div>

            {/* Asset Code */}
            <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-4">
              <label className="text-sm font-medium text-gray-600 font-kanit flex items-center mb-2">
                <FaHashtag className="mr-2" />
                รหัสครุภัณฑ์
              </label>
              <p className="text-xl font-kanit font-bold text-gray-900">{asset.code}</p>
            </div>

            {/* Description */}
            {asset.description && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4">
                <label className="text-sm font-medium text-gray-600 font-kanit block mb-2">รายละเอียด</label>
                <p className="text-gray-900 font-kanit leading-relaxed">{asset.description}</p>
              </div>
            )}

            {/* Quantity Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 text-center">
                <label className="text-sm font-medium text-gray-600 font-kanit block mb-2">จำนวนทั้งหมด</label>
                <div className="text-3xl font-bold text-emerald-600 font-kanit">{asset.quantity}</div>
                <div className="text-sm text-emerald-600 font-kanit">ชิ้น</div>
              </div>

              <div className={`rounded-xl p-4 text-center ${
                asset.availableQuantity > 0 
                  ? 'bg-gradient-to-r from-blue-50 to-cyan-50' 
                  : 'bg-gradient-to-r from-red-50 to-pink-50'
              }`}>
                <label className="text-sm font-medium text-gray-600 font-kanit block mb-2">จำนวนพร้อมใช้</label>
                <div className={`text-3xl font-bold font-kanit ${
                  asset.availableQuantity > 0 ? 'text-blue-600' : 'text-red-600'
                }`}>
                  {asset.availableQuantity}
                </div>
                <div className={`text-sm font-kanit ${
                  asset.availableQuantity > 0 ? 'text-blue-600' : 'text-red-600'
                }`}>
                  ชิ้น
                </div>
              </div>
            </div>

            {/* Usage Statistics */}
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-4">
              <label className="text-sm font-medium text-gray-600 font-kanit block mb-2">สถิติการใช้งาน</label>
              <div className="flex justify-between items-center">
                <span className="text-gray-900 font-kanit">จำนวนที่ถูกยืม:</span>
                <span className="text-xl font-bold text-orange-600 font-kanit">
                  {asset.quantity - asset.availableQuantity} ชิ้น
                </span>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-3">
                <div className="bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-orange-500 to-yellow-500 h-3 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${asset.quantity > 0 ? ((asset.quantity - asset.availableQuantity) / asset.quantity) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-600 font-kanit mt-1">
                  <span>0%</span>
                  <span>อัตราการใช้งาน</span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            {/* Timestamps */}
            <div className="bg-gradient-to-r from-gray-50 to-slate-100 rounded-xl p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 font-kanit flex items-center mb-2">
                    <FaCalendarAlt className="mr-2" />
                    วันที่เพิ่มเข้าระบบ
                  </label>
                  <p className="text-gray-900 font-kanit">{formatDate(asset.createdAt)}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600 font-kanit flex items-center mb-2">
                    <FaCalendarAlt className="mr-2" />
                    อัปเดตล่าสุด
                  </label>
                  <p className="text-gray-900 font-kanit">{formatDate(asset.updatedAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white rounded-2xl shadow-xl p-6 text-center">
          <p className="text-gray-600 font-kanit mb-2">
            ระบบจัดการครุภัณฑ์
          </p>
          <p className="text-sm text-gray-500 font-kanit">
            ข้อมูลจะอัปเดตอัตโนมัติทุก 30 วินาที
          </p>
        </div>
      </div>
    </div>
  );
}