'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaQrcode, FaArrowLeft, FaBox, FaEye, FaSpinner, FaBars } from 'react-icons/fa';
import QRScanner from '@/components/QRScanner';
import Sidebar from '@/components/Sidebar';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

interface AssetData {
  id: string;
  name: string;
  code: string;
  description?: string;
  quantity: number;
  availableQuantity: number;
}

export default function InventoryCheckPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [assetData, setAssetData] = useState<AssetData | null>(null);
  const [error, setError] = useState('');

  if (status === 'loading') return <div>Loading...</div>;
  if (!session) redirect('/login');

  const handleScanResult = async (qrData: string) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/qr/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qrData }),
      });

      const data = await response.json();

      if (data.success) {
        setAssetData(data.asset);
        setShowScanner(false);
      } else {
        setError(data.error || 'ไม่สามารถอ่าน QR Code ได้');
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการตรวจสอบ QR Code');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmBorrow = () => {
    if (assetData) {
      // ส่งไปยังหน้า Borrow Form พร้อมข้อมูลที่สแกนได้
      router.push(`/dashboard/borrow?assetId=${assetData.id}`);
    }
  };

  const handleBackToScan = () => {
    setAssetData(null);
    setError('');
    setShowScanner(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      {/* Main Content */}
      <div className={`min-h-screen transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : ''}`}>
        {/* Mobile hamburger menu */}
        <div className="md:hidden p-4 bg-white shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex items-center gap-2 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FaBars className="text-xl" />
            <span className="font-kanit font-medium">เมนู</span>
          </button>
        </div>
        
        {/* Content Container */}
        <div className="p-4 pt-0 md:pt-4">
          <div className="max-w-md mx-auto">
            {/* Header */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FaArrowLeft className="text-xl" />
                </button>
                <h1 className="text-2xl font-kanit font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                  ตรวจนับครุภัณฑ์
                </h1>
                <div className="w-10"></div>
              </div>
              
              <p className="text-gray-600 font-kanit text-center">
                สแกน QR Code เพื่อตรวจสอบและนับครุภัณฑ์
              </p>
            </div>

        {/* Content Area */}
        {!assetData && !showScanner && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="mb-6">
              <div className="w-24 h-24 bg-gradient-to-r from-pink-100 to-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaQrcode className="text-4xl text-pink-600" />
              </div>
              <h2 className="text-xl font-kanit font-bold text-gray-900 mb-2">
                เริ่มต้นตรวจนับ
              </h2>
              <p className="text-gray-600 font-kanit mb-6">
                กดปุ่มด้านล่างเพื่อเปิดกล้องและสแกน QR Code ของครุภัณฑ์ที่ต้องการตรวจนับ
              </p>
            </div>

            <button
              onClick={() => setShowScanner(true)}
              className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-kanit font-bold py-4 px-6 rounded-xl hover:from-pink-600 hover:to-rose-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <FaQrcode className="inline mr-2" />
              เริ่มตรวจนับครุภัณฑ์
            </button>
          </div>
        )}

        {/* Asset Confirmation */}
        {assetData && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-emerald-100 to-emerald-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaBox className="text-2xl text-emerald-600" />
              </div>
              <h2 className="text-xl font-kanit font-bold text-gray-900 mb-2">
                ข้อมูลครุภัณฑ์
              </h2>
              <p className="text-gray-600 font-kanit">
                ตรวจสอบข้อมูลครุภัณฑ์ที่สแกนได้
              </p>
            </div>

            {/* Asset Details */}
            <div className="bg-gradient-to-r from-gray-50 to-pink-50 rounded-xl p-4 mb-6">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600 font-kanit">ชื่อครุภัณฑ์</label>
                  <p className="text-lg font-kanit font-bold text-gray-900">{assetData.name}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600 font-kanit">รหัสครุภัณฑ์</label>
                  <p className="text-gray-900 font-kanit">{assetData.code}</p>
                </div>

                {assetData.description && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 font-kanit">รายละเอียด</label>
                    <p className="text-gray-900 font-kanit">{assetData.description}</p>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                  <span className="text-sm font-medium text-gray-600 font-kanit">จำนวนพร้อมใช้</span>
                  <span className={`text-lg font-bold font-kanit ${
                    assetData.availableQuantity > 0 ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {assetData.availableQuantity} ชิ้น
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <div className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-kanit font-bold py-4 px-6 rounded-xl text-center">
                ✓ ตรวจนับเสร็จสิ้น
              </div>

              <button
                onClick={handleBackToScan}
                className="w-full border-2 border-pink-300 text-pink-600 font-kanit font-bold py-3 px-6 rounded-xl hover:bg-pink-50 transition-colors"
              >
                ตรวจนับครุภัณฑ์อื่น
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <FaSpinner className="text-4xl text-pink-600 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600 font-kanit">กำลังตรวจสอบข้อมูล...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaEye className="text-2xl text-red-600" />
              </div>
              <h3 className="text-lg font-kanit font-bold text-gray-900 mb-2">เกิดข้อผิดพลาด</h3>
              <p className="text-red-600 font-kanit mb-4">{error}</p>
            </div>
            
            <button
              onClick={handleBackToScan}
              className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-kanit font-bold py-3 px-6 rounded-xl hover:from-pink-600 hover:to-rose-600 transition-colors"
            >
              ลองสแกนใหม่อีกครั้ง
            </button>
          </div>
        )}

        {/* QR Scanner Modal */}
        <QRScanner
          isOpen={showScanner}
          onClose={() => setShowScanner(false)}
          onScanResult={handleScanResult}
          title="สแกน QR Code เพื่อตรวจนับ"
          description="นำกล้องไปส่องที่ QR Code บนครุภัณฑ์ที่ต้องการตรวจนับ"
        />
          </div>
        </div>
      </div>
    </div>
  );
}