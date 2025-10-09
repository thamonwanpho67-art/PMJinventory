'use client';

import { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaFilter, FaBox, FaExclamationTriangle, FaCheckCircle, FaCog, FaQrcode, FaCamera, FaClock } from 'react-icons/fa';
import LayoutWrapper from '@/components/LayoutWrapper';
import QRCode from 'react-qr-code';
import QRScanner from '@/components/QRScanner';

// Extend Window interface for bulk import functions
declare global {
  interface Window {
    importAssetsFromFile?: () => Promise<void>;
    setupJSONFile?: () => void;
  }
}

interface Asset {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string | null;
  location: string | null;
  status: 'AVAILABLE' | 'DAMAGED' | 'OUT_OF_STOCK';
  imageUrl: string | null;
  quantity: number;
  accountingDate: string | null;
  createdAt: string;
  updatedAt: string;
}

// Helper functions for status
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'AVAILABLE':
      return <FaCheckCircle className="text-green-500" />;
    case 'DAMAGED':
      return <FaExclamationTriangle className="text-yellow-500" />;
    case 'OUT_OF_STOCK':
      return <FaBox className="text-red-500" />;
    default:
      return <FaBox className="text-gray-500" />;
  }
};

const getStatusClass = (status: string) => {
  switch (status) {
    case 'AVAILABLE':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'DAMAGED':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'OUT_OF_STOCK':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'AVAILABLE':
      return 'ว่าง';
    case 'DAMAGED':
      return 'ชำรุด';
    case 'OUT_OF_STOCK':
      return 'หมด';
    default:
      return 'ไม่ทราบสถานะ';
  }
};

const getQuantityStatusClass = (quantity: number) => {
  if (quantity === 0) return 'text-red-600 bg-red-100 border-red-200';
  if (quantity <= 5) return 'text-yellow-600 bg-yellow-100 border-yellow-200';
  return 'text-green-600 bg-green-100 border-green-200';
};

const getQuantityIcon = (quantity: number) => {
  if (quantity === 0) return <FaExclamationTriangle className="text-red-500" />;
  if (quantity <= 5) return <FaExclamationTriangle className="text-yellow-500" />;
  return <FaCheckCircle className="text-green-500" />;
};

// Function to check if asset is older than 7 years
const isAssetOld = (accountingDate: string | null) => {
  if (!accountingDate) return false;
  const assetDate = new Date(accountingDate);
  const currentDate = new Date();
  const diffTime = currentDate.getTime() - assetDate.getTime();
  const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
  return diffYears > 7;
};

export default function AdminAssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showOldOnly, setShowOldOnly] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [selectedAssetForAction, setSelectedAssetForAction] = useState<Asset | null>(null);
  const [showAssetModal, setShowAssetModal] = useState(false);

  useEffect(() => {
    fetchAssets();
  }, []);

  useEffect(() => {
    filterAssets();
  }, [assets, searchTerm, showOldOnly]);

  const fetchAssets = async () => {
    try {
      const response = await fetch('/api/assets');
      const data = await response.json();
      setAssets(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching assets:', error);
      setAssets([]); // Ensure assets is always an array
      
      // แสดง error message เฉพาะในกรณีที่จำเป็น
      if (error instanceof Error && error.message !== 'Failed to fetch') {
        console.warn('API Error:', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const filterAssets = () => {
    if (!Array.isArray(assets)) {
      setFilteredAssets([]);
      return;
    }

    let filtered = assets;

    if (searchTerm) {
      filtered = filtered.filter(
        (asset) =>
          asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          asset.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          asset.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (showOldOnly) {
      filtered = filtered.filter(asset => isAssetOld(asset.accountingDate));
    }

    setFilteredAssets(filtered);
  };

  const handleDeleteAsset = async (id: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบอุปกรณ์นี้?')) return;

    try {
      const response = await fetch(`/api/assets/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('ลบอุปกรณ์เรียบร้อยแล้ว');
        fetchAssets();
      } else {
        const errorData = await response.json();
        if (response.status === 409) {
          alert(`ไม่สามารถลบอุปกรณ์ได้: ${errorData.error}\nมีการยืมที่ยังไม่ได้คืน: ${errorData.activeLoans} รายการ`);
        } else if (response.status === 403) {
          alert('คุณไม่มีสิทธิ์ในการลบอุปกรณ์');
        } else if (response.status === 404) {
          alert('ไม่พบอุปกรณ์ที่ต้องการลบ');
        } else {
          alert(`เกิดข้อผิดพลาด: ${errorData.error || 'ไม่สามารถลบอุปกรณ์ได้'}`);
        }
        console.error('Failed to delete asset:', errorData);
      }
    } catch (error) {
      console.error('Error deleting asset:', error);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง');
    }
  };

  // QR Code functions
  const generateQRUrl = (assetId: string) => {
    return `${window.location.origin}/public/asset/${assetId}`;
  };

  const handleQRScan = (data: string) => {
    console.log('QR Code scanned:', data);
    
    // Extract asset ID from QR code URL
    const urlParts = data.split('/');
    const assetId = urlParts[urlParts.length - 1];
    
    // Find asset by ID
    const asset = assets.find(a => a.id === assetId);
    
    if (asset) {
      setSelectedAssetForAction(asset);
      setShowAssetModal(true);
      setShowQRScanner(false);
    } else {
      alert('ไม่พบข้อมูลครุภัณฑ์นี้');
      setShowQRScanner(false);
    }
  };

  const handleBorrowAsset = async (assetId: string) => {
    try {
      // This would typically create a loan request
      const response = await fetch('/api/loans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assetId: assetId,
          requestDate: new Date().toISOString(),
          // Add other required fields
        }),
      });

      if (response.ok) {
        alert('สร้างคำขอยืมสำเร็จ');
        setShowAssetModal(false);
        setSelectedAssetForAction(null);
      } else {
        throw new Error('Failed to create loan request');
      }
    } catch (error) {
      console.error('Error creating loan:', error);
      
      let errorMessage = 'เกิดข้อผิดพลาดในการสร้างคำขอยืม';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-500 mx-auto"></div>
          <p className="text-pink-600 mt-4 font-kanit text-lg">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <LayoutWrapper>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-100">
        <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 font-kanit mb-2 flex items-center">
            <FaBox className="mr-3 text-pink-500" />
            วัสดุครุภัณฑ์
          </h1>
          <p className="text-gray-600 font-kanit text-lg font-light">
            จัดการอุปกรณ์ทั้งหมดในระบบ พร้อมรูปภาพและข้อมูลสถานะ
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-400">
            <div className="flex items-center">
              <FaBox className="text-blue-500 text-2xl mr-3" />
              <div>
                <p className="text-sm text-gray-600 font-kanit">ทั้งหมด</p>
                <p className="text-2xl font-bold text-gray-900 font-kanit">
                  {Array.isArray(assets) ? assets.length : 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-400">
            <div className="flex items-center">
              <FaCheckCircle className="text-green-500 text-2xl mr-3" />
              <div>
                <p className="text-sm text-gray-600 font-kanit">ว่าง</p>
                <p className="text-2xl font-bold text-gray-900 font-kanit">
                  {Array.isArray(assets) ? assets.filter(asset => asset.status === 'AVAILABLE').length : 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-400">
            <div className="flex items-center">
              <FaExclamationTriangle className="text-yellow-500 text-2xl mr-3" />
              <div>
                <p className="text-sm text-gray-600 font-kanit">ชำรุด</p>
                <p className="text-2xl font-bold text-gray-900 font-kanit">
                  {Array.isArray(assets) ? assets.filter(asset => asset.status === 'DAMAGED').length : 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-400">
            <div className="flex items-center">
              <FaExclamationTriangle className="text-red-500 text-2xl mr-3" />
              <div>
                <p className="text-sm text-gray-600 font-kanit">หมดแล้ว</p>
                <p className="text-2xl font-bold text-gray-900 font-kanit">
                  {Array.isArray(assets) ? assets.filter(asset => asset.status === 'OUT_OF_STOCK' || (asset.quantity && asset.quantity === 0)).length : 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-400">
            <div className="flex items-center">
              <FaClock className="text-orange-500 text-2xl mr-3" />
              <div>
                <p className="text-sm text-gray-600 font-kanit">เก่าเกิน 7 ปี</p>
                <p className="text-2xl font-bold text-gray-900 font-kanit">
                  {Array.isArray(assets) ? assets.filter(asset => isAssetOld(asset.accountingDate)).length : 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="ค้นหาอุปกรณ์, รหัส, หรือคำอธิบาย..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      filterAssets();
                    }
                  }}
                  className="w-full pl-10 pr-20 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent font-kanit text-black"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="bg-gray-400 hover:bg-gray-500 text-white p-1.5 rounded-md transition-colors"
                      title="ล้างการค้นหา"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={filterAssets}
                    className="bg-pink-500 hover:bg-pink-600 text-white p-1.5 rounded-md transition-colors"
                    title="ค้นหา"
                  >
                    <FaSearch className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Old Assets Filter */}
              <button
                onClick={() => setShowOldOnly(!showOldOnly)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg font-kanit font-medium transition-colors ${
                  showOldOnly 
                    ? 'bg-orange-500 text-white shadow-lg' 
                    : 'bg-white border border-orange-300 text-orange-600 hover:bg-orange-50'
                }`}
                title="แสดงเฉพาะครุภัณฑ์เก่าเกิน 7 ปี"
              >
                <FaClock />
                <span>{showOldOnly ? 'แสดงทั้งหมด' : 'เก่าเกิน 7 ปี'}</span>
              </button>
            </div>

            <div className="flex gap-3">
              {/* QR Scanner Button */}
              <button
                onClick={() => setShowQRScanner(true)}
                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-kanit font-medium py-3 px-6 rounded-lg transition duration-300 flex items-center gap-2 shadow-lg"
              >
                <FaCamera />
                สแกน QR
              </button>

              {/* Add Button */}
              <button
                onClick={() => window.location.href = '/admin/assets/add'}
                className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-kanit font-medium py-3 px-6 rounded-lg transition duration-300 flex items-center gap-2 shadow-lg"
              >
                <FaPlus />
                เพิ่มอุปกรณ์
              </button>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600 font-kanit">
            แสดงผล {filteredAssets.length} รายการจากทั้งหมด {assets.length} รายการ
            {showOldOnly && (
              <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-600 rounded-md text-xs">
                (กรองเฉพาะครุภัณฑ์เก่าเกิน 7 ปี)
              </span>
            )}
          </div>
        </div>

        {/* Assets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssets.length === 0 ? (
            <div className="col-span-full bg-white rounded-xl shadow-lg p-12 text-center">
              <FaBox className="mx-auto text-gray-300 text-6xl mb-4" />
              <p className="text-gray-500 font-kanit text-xl font-medium">ไม่พบอุปกรณ์</p>
              <p className="text-gray-400 font-kanit">
                {searchTerm ? 'ลองเปลี่ยนคำค้นหา' : 'เพิ่มอุปกรณ์ใหม่เพื่อเริ่มต้น'}
              </p>
            </div>
          ) : (
            filteredAssets.map((asset) => (
              <div key={asset.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
                {/* Asset Image */}
                {asset.imageUrl ? (
                  <div className="h-48 bg-gray-100 overflow-hidden">
                    <img 
                      src={asset.imageUrl} 
                      alt={asset.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                ) : (
                  <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <FaBox className="text-gray-400 text-6xl" />
                  </div>
                )}

                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-pink-600 rounded-lg flex items-center justify-center">
                        <FaBox className="text-white text-xl" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 font-kanit">
                          {asset.name}
                        </h3>
                        <p className="text-sm text-gray-600 font-kanit">
                          รหัส: {asset.code}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => window.location.href = `/admin/assets/edit/${asset.id}`}
                        className="p-2 text-blue-500 hover:bg-blue-100 rounded-lg transition-colors"
                        title="แก้ไข"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDeleteAsset(asset.id)}
                        className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                        title="ลบ"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>

                  {/* QR Code Section */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FaQrcode className="text-gray-600" />
                        <span className="text-sm font-kanit text-gray-700">QR Code</span>
                      </div>
                      <div className="w-16 h-16 bg-white p-2 rounded border">
                        <QRCode
                          value={generateQRUrl(asset.id)}
                          size={48}
                          level="M"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Age Warning Badge */}
                  {isAssetOld(asset.accountingDate) && (
                    <div className="bg-orange-100 border border-orange-200 rounded-lg p-3 mb-4">
                      <div className="flex items-center gap-2">
                        <FaClock className="text-orange-500" />
                        <span className="text-sm font-kanit text-orange-800 font-medium">
                          ครุภัณฑ์เก่าเกิน 7 ปี (จัดหาเมื่อ: {asset.accountingDate ? new Date(asset.accountingDate).toLocaleDateString('th-TH') : 'ไม่ระบุ'})
                        </span>
                      </div>
                    </div>
                  )}

                  {asset.description && (
                    <p className="text-sm text-gray-600 mb-4 font-kanit">
                      {asset.description}
                    </p>
                  )}

                  {/* Status and Quantity */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(asset.status)}
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusClass(asset.status)} font-kanit`}>
                        {getStatusText(asset.status)}
                      </span>
                    </div>
                    
                    {/* Quantity Display */}
                    {asset.quantity !== undefined && (
                      <div className="flex items-center gap-2">
                        {getQuantityIcon(asset.quantity)}
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getQuantityStatusClass(asset.quantity)} font-kanit`}>
                          คงเหลือ: {asset.quantity}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Category and Location */}
                  <div className="flex items-center gap-2 mb-4">
                    {asset.category && (
                      <span className="text-xs text-gray-500 font-kanit bg-gray-100 px-2 py-1 rounded">
                        หมวดหมู่: {asset.category}
                      </span>
                    )}
                    {asset.location && (
                      <span className="text-xs text-gray-500 font-kanit bg-blue-100 px-2 py-1 rounded">
                        สถานที่: {asset.location}
                      </span>
                    )}
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <div className="grid grid-cols-2 gap-4 text-xs text-gray-500 font-kanit">
                      <div>
                        <p>เพิ่มเมื่อ:</p>
                        <p className="font-medium">
                          {new Date(asset.createdAt).toLocaleDateString('th-TH')}
                        </p>
                      </div>
                      <div>
                        <p>อัปเดต:</p>
                        <p className="font-medium">
                          {new Date(asset.updatedAt).toLocaleDateString('th-TH')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

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

      {/* Asset Action Modal */}
      {showAssetModal && selectedAssetForAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-kanit font-bold text-gray-900">ข้อมูลครุภัณฑ์</h3>
              <button
                onClick={() => {
                  setShowAssetModal(false);
                  setSelectedAssetForAction(null);
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
                <h4 className="font-kanit font-bold text-gray-900">{selectedAssetForAction.name}</h4>
                <p className="text-sm text-gray-600 font-kanit">รหัส: {selectedAssetForAction.code}</p>
              </div>

              {selectedAssetForAction.description && (
                <div>
                  <p className="text-sm font-kanit text-gray-700">{selectedAssetForAction.description}</p>
                </div>
              )}

              <div className="flex items-center gap-2">
                {getStatusIcon(selectedAssetForAction.status)}
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusClass(selectedAssetForAction.status)} font-kanit`}>
                  {getStatusText(selectedAssetForAction.status)}
                </span>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <span className="text-sm font-kanit text-gray-600">จำนวนคงเหลือ:</span>
                <span className="font-kanit font-bold">{selectedAssetForAction.quantity || 0}</span>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => handleBorrowAsset(selectedAssetForAction.id)}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-kanit font-medium py-2 px-4 rounded-lg transition duration-300"
                  disabled={selectedAssetForAction.status !== 'AVAILABLE' || selectedAssetForAction.quantity === 0}
                >
                  ยืมครุภัณฑ์
                </button>
                <button
                  onClick={() => window.location.href = `/public/asset/${selectedAssetForAction.id}`}
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

