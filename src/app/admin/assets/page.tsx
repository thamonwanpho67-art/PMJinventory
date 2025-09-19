'use client';

import { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaFilter, FaDownload, FaBox, FaExclamationTriangle, FaCheckCircle, FaCog } from 'react-icons/fa';
import LayoutWrapper from '@/components/LayoutWrapper';

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

export default function AdminAssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAssets();
  }, []);

  useEffect(() => {
    filterAssets();
  }, [assets, searchTerm]);

  const fetchAssets = async () => {
    try {
      const response = await fetch('/api/assets');
      const data = await response.json();
      setAssets(data);
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAssets = () => {
    let filtered = assets;

    if (searchTerm) {
      filtered = filtered.filter(
        (asset) =>
          asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          asset.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          asset.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
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
        fetchAssets();
      } else {
        console.error('Failed to delete asset');
      }
    } catch (error) {
      console.error('Error deleting asset:', error);
    }
  };

  const exportToCSV = () => {
    const csvContent = [
      ['รหัสอุปกรณ์', 'ชื่ออุปกรณ์', 'คำอธิบาย', 'สถานะ', 'จำนวน', 'หมวดหมู่', 'สถานที่', 'วันที่เพิ่ม', 'อัปเดตล่าสุด'].join(','),
      ...filteredAssets.map(asset => [
        asset.code,
        asset.name,
        asset.description || '-',
        getStatusText(asset.status),
        asset.quantity || 0,
        asset.category || '-',
        asset.location || '-',
        new Date(asset.createdAt).toLocaleDateString('th-TH'),
        new Date(asset.updatedAt).toLocaleDateString('th-TH')
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `คลังอุปกรณ์_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            คลังอุปกรณ์
          </h1>
          <p className="text-gray-600 font-kanit text-lg font-light">
            จัดการอุปกรณ์ทั้งหมดในระบบ พร้อมรูปภาพและข้อมูลสถานะ
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-400">
            <div className="flex items-center">
              <FaBox className="text-blue-500 text-2xl mr-3" />
              <div>
                <p className="text-sm text-gray-600 font-kanit">ทั้งหมด</p>
                <p className="text-2xl font-bold text-gray-900 font-kanit">
                  {assets.length}
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
                  {assets.filter(asset => asset.status === 'AVAILABLE').length}
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
                  {assets.filter(asset => asset.status === 'DAMAGED').length}
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
                  {assets.filter(asset => asset.status === 'OUT_OF_STOCK' || (asset.quantity && asset.quantity === 0)).length}
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
            </div>

            <div className="flex gap-3">
              {/* Export Button */}
              <button
                onClick={exportToCSV}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-kanit font-medium py-3 px-6 rounded-lg transition duration-300 flex items-center gap-2 shadow-lg"
              >
                <FaDownload />
                ส่งออก CSV
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
                        target.src = '/images/placeholder-asset.png';
                        target.onerror = null;
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
    </div>
    </LayoutWrapper>
  );
}

