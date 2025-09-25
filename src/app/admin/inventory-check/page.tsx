'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { FaQrcode, FaArrowLeft, FaBox, FaSearch, FaCheckCircle, FaTimes, FaSpinner, FaPlus, FaMinus } from 'react-icons/fa';
import QRScanner from '@/components/QRScanner';
import LayoutWrapper from '@/components/LayoutWrapper';
import LoadingSpinner from '@/components/LoadingSpinner';

interface AssetData {
  id: string;
  name: string;
  code: string;
  description?: string;
  quantity: number;
  availableQuantity: number;
}

interface InventoryCheck {
  assetId: string;
  assetName: string;
  assetCode: string;
  scannedQuantity: number;
  expectedQuantity: number;
  status: 'checked' | 'over' | 'under';
}

export default function InventoryCheckPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [showScanner, setShowScanner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inventoryList, setInventoryList] = useState<InventoryCheck[]>([]);
  const [currentAsset, setCurrentAsset] = useState<AssetData | null>(null);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  if (status === 'loading') {
    return <LoadingSpinner fullScreen color="pink" text="กำลังโหลดข้อมูล..." />;
  }

  if (status === 'unauthenticated' || session?.user?.role !== 'ADMIN') {
    redirect('/dashboard');
  }

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
        const asset = data.asset;
        setCurrentAsset(asset);
        
        // อัปเดต inventory list
        setInventoryList(prev => {
          const existingIndex = prev.findIndex(item => item.assetId === asset.id);
          
          if (existingIndex >= 0) {
            // อัปเดตรายการที่มีอยู่
            const updated = [...prev];
            updated[existingIndex].scannedQuantity += 1;
            
            // อัปเดตสถานะ
            const item = updated[existingIndex];
            if (item.scannedQuantity === item.expectedQuantity) {
              item.status = 'checked';
            } else if (item.scannedQuantity > item.expectedQuantity) {
              item.status = 'over';
            } else {
              item.status = 'under';
            }
            
            return updated;
          } else {
            // เพิ่มรายการใหม่
            const newItem: InventoryCheck = {
              assetId: asset.id,
              assetName: asset.name,
              assetCode: asset.code,
              scannedQuantity: 1,
              expectedQuantity: asset.quantity,
              status: asset.quantity === 1 ? 'checked' : 'under'
            };
            
            return [...prev, newItem];
          }
        });
        
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

  const adjustQuantity = (assetId: string, change: number) => {
    setInventoryList(prev => {
      const updated = prev.map(item => {
        if (item.assetId === assetId) {
          const newQuantity = Math.max(0, item.scannedQuantity + change);
          
          let status: 'checked' | 'over' | 'under' = 'checked';
          if (newQuantity > item.expectedQuantity) {
            status = 'over';
          } else if (newQuantity < item.expectedQuantity) {
            status = 'under';
          }
          
          return {
            ...item,
            scannedQuantity: newQuantity,
            status
          };
        }
        return item;
      });
      
      return updated;
    });
  };

  const removeItem = (assetId: string) => {
    setInventoryList(prev => prev.filter(item => item.assetId !== assetId));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'checked':
        return 'text-emerald-600 bg-emerald-100';
      case 'over':
        return 'text-orange-600 bg-orange-100';
      case 'under':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'checked':
        return 'ถูกต้อง';
      case 'over':
        return 'เกิน';
      case 'under':
        return 'ขาด';
      default:
        return 'ไม่ทราบ';
    }
  };

  const exportReport = () => {
    const report = inventoryList.map(item => ({
      รหัสครุภัณฑ์: item.assetCode,
      ชื่อครุภัณฑ์: item.assetName,
      จำนวนที่ควรมี: item.expectedQuantity,
      จำนวนที่ตรวจนับได้: item.scannedQuantity,
      สถานะ: getStatusText(item.status),
      ผลต่าง: item.scannedQuantity - item.expectedQuantity
    }));

    const csvContent = [
      Object.keys(report[0] || {}).join(','),
      ...report.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `inventory-check-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredInventory = inventoryList.filter(item =>
    item.assetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.assetCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const summary = {
    total: inventoryList.length,
    checked: inventoryList.filter(item => item.status === 'checked').length,
    over: inventoryList.filter(item => item.status === 'over').length,
    under: inventoryList.filter(item => item.status === 'under').length,
  };

  return (
    <LayoutWrapper>
      <div className="p-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-pink-100">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.push('/admin')}
              className="p-2 text-pink-600 hover:text-pink-800 hover:bg-pink-50 rounded-lg transition-colors"
            >
              <FaArrowLeft className="text-xl" />
            </button>
            <h1 className="text-2xl font-kanit font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
              ตรวจนับครุภัณฑ์
            </h1>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowScanner(true)}
                className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 py-2 rounded-lg hover:from-pink-600 hover:to-rose-600 transition-all duration-300 font-kanit shadow-md hover:shadow-lg"
              >
                <FaQrcode className="inline mr-2" />
                สแกน QR
              </button>
              {inventoryList.length > 0 && (
                <button
                  onClick={exportReport}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2 rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 font-kanit shadow-md hover:shadow-lg"
                >
                  ส่งออกรายงาน
                </button>
              )}
            </div>
          </div>
          
          <p className="text-pink-700 font-kanit text-center">
            ใช้กล้องสแกน QR Code บนครุภัณฑ์เพื่อตรวจนับจำนวนในคลัง
          </p>
        </div>

        {/* Summary Cards */}
        {inventoryList.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 shadow-lg border border-pink-100">
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-600">{summary.total}</div>
                <div className="text-sm text-pink-600 font-kanit">รายการทั้งหมด</div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-lg border border-emerald-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">{summary.checked}</div>
                <div className="text-sm text-emerald-600 font-kanit">ถูกต้อง</div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-lg border border-orange-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{summary.over}</div>
                <div className="text-sm text-orange-600 font-kanit">เกิน</div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-lg border border-red-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{summary.under}</div>
                <div className="text-sm text-red-600 font-kanit">ขาด</div>
              </div>
            </div>
          </div>
        )}

        {/* Search Bar */}
        {inventoryList.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-4 mb-6 border border-pink-100">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pink-400" />
              <input
                type="text"
                placeholder="ค้นหาครุภัณฑ์..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-pink-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent font-kanit"
              />
            </div>
          </div>
        )}

        {/* Inventory List */}
        {filteredInventory.length > 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-pink-100">
            <h2 className="text-xl font-kanit font-bold text-pink-800 mb-4">รายการที่ตรวจนับแล้ว</h2>
            
            <div className="space-y-4">
              {filteredInventory.map((item) => (
                <div
                  key={item.assetId}
                  className="border border-pink-100 rounded-xl p-4 hover:shadow-md transition-shadow bg-gradient-to-r from-pink-25 to-rose-25"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-kanit font-bold text-pink-800">{item.assetName}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(item.status)}`}>
                          {getStatusText(item.status)}
                        </span>
                      </div>
                      <p className="text-pink-600 font-kanit mb-2">รหัส: {item.assetCode}</p>
                      
                      <div className="flex items-center space-x-6 text-sm">
                        <span className="text-pink-600 font-kanit">
                          ควรมี: <span className="font-bold">{item.expectedQuantity}</span>
                        </span>
                        <span className="text-pink-600 font-kanit">
                          ตรวจนับได้: <span className="font-bold">{item.scannedQuantity}</span>
                        </span>
                        <span className={`font-kanit font-bold ${
                          item.scannedQuantity === item.expectedQuantity
                            ? 'text-emerald-600'
                            : item.scannedQuantity > item.expectedQuantity
                            ? 'text-orange-600'
                            : 'text-red-600'
                        }`}>
                          ผลต่าง: {item.scannedQuantity - item.expectedQuantity > 0 ? '+' : ''}{item.scannedQuantity - item.expectedQuantity}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => adjustQuantity(item.assetId, -1)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        disabled={item.scannedQuantity === 0}
                      >
                        <FaMinus />
                      </button>
                      
                      <button
                        onClick={() => adjustQuantity(item.assetId, 1)}
                        className="p-2 text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
                      >
                        <FaPlus />
                      </button>
                      
                      <button
                        onClick={() => removeItem(item.assetId)}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : inventoryList.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-pink-100">
            <div className="w-24 h-24 bg-gradient-to-r from-pink-100 to-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaBox className="text-4xl text-pink-600" />
            </div>
            <h2 className="text-2xl font-kanit font-bold text-pink-800 mb-4">
              เริ่มต้นตรวจนับครุภัณฑ์
            </h2>
            <p className="text-pink-600 font-kanit mb-8 max-w-md mx-auto">
              คลิกปุ่ม &quot;สแกน QR&quot; เพื่อเริ่มต้นตรวจนับครุภัณฑ์ในคลัง ระบบจะบันทึกจำนวนที่ตรวจนับได้อัตโนมัติ
            </p>
            <button
              onClick={() => setShowScanner(true)}
              className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-8 py-4 rounded-xl hover:from-pink-600 hover:to-rose-600 transition-all duration-300 font-kanit font-bold transform hover:scale-105 shadow-lg"
            >
              <FaQrcode className="inline mr-2" />
              เริ่มสแกน QR Code
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center border border-pink-100">
            <p className="text-pink-600 font-kanit">ไม่พบรายการที่ตรงกับการค้นหา</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
            <div className="bg-white rounded-2xl p-8 shadow-2xl border border-pink-100">
              <LoadingSpinner size="lg" color="pink" text="กำลังตรวจสอบข้อมูล..." />
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-4 rounded-xl shadow-lg z-50">
            <div className="flex items-center space-x-2">
              <FaTimes />
              <span className="font-kanit">{error}</span>
              <button
                onClick={() => setError('')}
                className="ml-2 text-white hover:text-red-200"
              >
                <FaTimes />
              </button>
            </div>
          </div>
        )}

        {/* QR Scanner Modal */}
        <QRScanner
          isOpen={showScanner}
          onClose={() => setShowScanner(false)}
          onScanResult={handleScanResult}
          title="สแกน QR Code ครุภัณฑ์"
          description="นำกล้องไปส่องที่ QR Code บนครุภัณฑ์ที่ต้องการตรวจนับ"
        />
      </div>
    </LayoutWrapper>
  );
}