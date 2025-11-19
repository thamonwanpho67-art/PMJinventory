'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import { FaSearch, FaFilter, FaBox, FaExclamationTriangle, FaCheckCircle, FaEye, FaClipboard } from 'react-icons/fa';
import Link from 'next/link';
import LayoutWrapper from '@/components/LayoutWrapper';

interface Asset {
  id: string;
  code: string;
  name: string;
  description: string | null;
  quantity: number;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function UserAssetsPage() {
  const { data: session, status } = useSession();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [quantityFilter, setQuantityFilter] = useState<string>('ALL');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

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

    if (quantityFilter !== 'ALL') {
      filtered = filtered.filter((asset) => {
        switch (quantityFilter) {
          case 'AVAILABLE':
            return asset.quantity > 0;
          case 'LOW':
            return asset.quantity > 0 && asset.quantity <= 5;
          case 'OUT_OF_STOCK':
            return asset.quantity === 0;
          default:
            return true;
        }
      });
    }

    setFilteredAssets(filtered);
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  useEffect(() => {
    filterAssets();
  }, [assets, searchTerm, quantityFilter]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-500 mx-auto"></div>
          <p className="text-pink-600 mt-4 font-kanit text-lg">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    redirect('/login');
  }

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

  const getQuantityStatusText = (quantity: number) => {
    if (quantity === 0) return 'หมดสต็อก';
    if (quantity <= 5) return 'เหลือน้อย';
    return 'พร้อมใช้งาน';
  };

  const openDetailModal = (asset: Asset) => {
    setSelectedAsset(asset);
    setShowDetailModal(true);
  };

  if (loading) {
    return (
      <LayoutWrapper>
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-500 mx-auto"></div>
            <p className="text-pink-600 mt-4 font-kanit text-lg">กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-100">
        <div className="container mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-gray-900 font-kanit mb-2">
              📦 คลังอุปกรณ์
            </h1>
            <p className="text-gray-600 font-kanit text-lg">
              ดูอุปกรณ์ทั้งหมดที่พร้อมให้ยืม
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
                    {Array.isArray(assets) ? assets.length : 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-400">
              <div className="flex items-center">
                <FaCheckCircle className="text-green-500 text-2xl mr-3" />
                <div>
                  <p className="text-sm text-gray-600 font-kanit">พร้อมใช้</p>
                  <p className="text-2xl font-bold text-gray-900 font-kanit">
                    {Array.isArray(assets) ? assets.filter(asset => asset.quantity > 5).length : 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-400">
              <div className="flex items-center">
                <FaExclamationTriangle className="text-yellow-500 text-2xl mr-3" />
                <div>
                  <p className="text-sm text-gray-600 font-kanit">เหลือน้อย</p>
                  <p className="text-2xl font-bold text-gray-900 font-kanit">
                    {Array.isArray(assets) ? assets.filter(asset => asset.quantity > 0 && asset.quantity <= 5).length : 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-400">
              <div className="flex items-center">
                <FaExclamationTriangle className="text-red-500 text-2xl mr-3" />
                <div>
                  <p className="text-sm text-gray-600 font-kanit">หมดสต็อก</p>
                  <p className="text-2xl font-bold text-gray-900 font-kanit">
                    {Array.isArray(assets) ? assets.filter(asset => asset.quantity === 0).length : 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                {/* Search */}
                <div className="relative flex-1">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="ค้นหาชื่ออุปกรณ์หรือรหัสครุภัณฑ์..."
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

                {/* Quantity Filter */}
                <div className="relative">
                  <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <select
                    value={quantityFilter}
                    onChange={(e) => setQuantityFilter(e.target.value)}
                    className="pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent font-kanit bg-white text-black"
                  >
                    <option value="ALL">ทุกสถานะ</option>
                    <option value="AVAILABLE">พร้อมใช้งาน</option>
                    <option value="LOW">เหลือน้อย</option>
                    <option value="OUT_OF_STOCK">หมดสต็อก</option>
                  </select>
                </div>
              </div>

              <Link
                href="/dashboard/borrow"
                className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-kanit font-semibold py-3 px-6 rounded-lg transition duration-300 flex items-center gap-2 shadow-lg"
              >
                <FaClipboard />
                ยื่นคำขอยืม
              </Link>
            </div>

            <div className="mt-4 text-sm text-gray-600 font-kanit">
              แสดงผล {Array.isArray(filteredAssets) ? filteredAssets.length : 0} รายการจากทั้งหมด {Array.isArray(assets) ? assets.length : 0} รายการ
            </div>
          </div>

          {/* Assets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {!Array.isArray(filteredAssets) || filteredAssets.length === 0 ? (
              <div className="col-span-full bg-white rounded-xl shadow-lg p-12 text-center">
                <FaBox className="mx-auto text-gray-300 text-6xl mb-4" />
                <p className="text-gray-500 font-kanit text-xl">ไม่พบอุปกรณ์</p>
                <p className="text-gray-400 font-kanit">
                  {searchTerm || quantityFilter !== 'ALL' 
                    ? 'ลองเปลี่ยนเงื่อนไขการกรองข้อมูล' 
                    : 'ไม่มีอุปกรณ์ในระบบ'}
                </p>
              </div>
            ) : (
              filteredAssets.map((asset) => (
                <div key={asset.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden border border-pink-100 hover:border-pink-200">
                  {/* Asset Image */}
                  {asset.imageUrl ? (
                    <div className="h-48 bg-gray-100 overflow-hidden">
                      <Image 
                        src={asset.imageUrl} 
                        alt={asset.name}
                        width={400}
                        height={192}
                        className="w-full h-full object-cover"
                        priority={false}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200"><svg class="text-gray-400 w-16 h-16" fill="currentColor" viewBox="0 0 20 20"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg></div>';
                          }
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

                      <button
                        onClick={() => openDetailModal(asset)}
                        className="p-2 text-pink-500 hover:bg-pink-100 rounded-lg transition-colors"
                        title="ดูรายละเอียด"
                      >
                        <FaEye />
                      </button>
                    </div>

                    {asset.description && (
                      <p className="text-sm text-gray-600 mb-4 font-kanit line-clamp-2">
                        {asset.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        {getQuantityIcon(asset.quantity)}
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getQuantityStatusClass(asset.quantity)} font-kanit`}>
                          {getQuantityStatusText(asset.quantity)}
                        </span>
                      </div>
                    </div>

                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900 font-kanit mb-1">
                        {asset.quantity} ชิ้น
                      </p>
                      <p className="text-sm text-gray-500 font-kanit">
                        คงเหลือ
                      </p>
                    </div>

                    {asset.quantity > 0 && (
                      <div className="mt-4">
                        <Link
                          href="/dashboard/borrow"
                          className="w-full bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-kanit font-semibold py-2 px-4 rounded-lg transition duration-300 flex items-center justify-center gap-2"
                        >
                          <FaClipboard />
                          ยื่นคำขอยืม
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Detail Modal */}
        {showDetailModal && selectedAsset && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-8 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
              {/* Asset Image in Modal */}
              {selectedAsset.imageUrl && (
                <div className="h-48 bg-gray-100 flex items-center justify-center relative rounded-lg mb-6">
                  <Image 
                    src={selectedAsset.imageUrl} 
                    alt={selectedAsset.name}
                    fill
                    className="object-contain rounded-lg"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    priority={false}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/images/default-asset.svg';
                    }}
                  />
                </div>
              )}
              
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <FaBox className="text-white text-2xl" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 font-kanit">
                    {selectedAsset.name}
                  </h2>
                  <p className="text-gray-600 font-kanit">
                    รหัส: {selectedAsset.code}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {selectedAsset.description && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 font-kanit mb-2">
                      คำอธิบาย
                    </h3>
                    <p className="text-gray-600 font-kanit bg-gray-50 p-3 rounded-lg">
                      {selectedAsset.description}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 font-kanit mb-2">
                      จำนวนคงเหลือ
                    </h3>
                    <div className="flex items-center gap-2">
                      {getQuantityIcon(selectedAsset.quantity)}
                      <span className="text-2xl font-bold text-gray-900 font-kanit">
                        {selectedAsset.quantity} ชิ้น
                      </span>
                    </div>
                    <p className={`text-sm font-kanit mt-1 ${
                      selectedAsset.quantity === 0 ? 'text-red-600' :
                      selectedAsset.quantity <= 5 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {getQuantityStatusText(selectedAsset.quantity)}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 font-kanit mb-2">
                      อัปเดตล่าสุด
                    </h3>
                    <p className="text-gray-900 font-kanit">
                      {new Date(selectedAsset.updatedAt).toLocaleDateString('th-TH', {
                        timeZone: 'Asia/Bangkok',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-kanit"
                >
                  ปิด
                </button>
                {selectedAsset.quantity > 0 && (
                  <Link
                    href="/dashboard/borrow"
                    className="flex-1 bg-gradient-to-r from-pink-500 to-pink-600 text-white px-4 py-3 rounded-lg hover:from-pink-600 hover:to-pink-700 transition-colors font-kanit text-center"
                  >
                    ยื่นคำขอยืม
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </LayoutWrapper>
  );
}

