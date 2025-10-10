'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import LayoutWrapper from '@/components/LayoutWrapper';
import ClientOnly from '@/components/ClientOnly';
import LoadingSpinner from '@/components/LoadingSpinner';
import { FaUserCircle, FaBox, FaCheckCircle, FaExclamationCircle, FaSearch, FaQrcode, FaClipboardList, FaPlus } from 'react-icons/fa';
import Link from 'next/link';

// Dynamic imports to reduce chunk size
const BorrowForm = dynamic(() => import('@/components/BorrowForm'), {
  loading: () => <LoadingSpinner size="md" color="pink" text="กำลังโหลดฟอร์ม..." />,
  ssr: false
});

type Asset = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  quantity: number;
  createdAt: string;
  updatedAt: string;
};

type UserAsset = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  available: number;
  borrowed: number;
  status: string;
  imageUrl?: string | null;
  description?: string | null;
  canBorrow: boolean;
};

type AssetSummary = {
  totalAssets: number;
  totalQuantity: number;
  totalAvailable: number;
  totalBorrowed: number;
  categories: number;
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showBorrowForm, setShowBorrowForm] = useState(false);
  const [userAssets, setUserAssets] = useState<UserAsset[]>([]);
  const [groupedAssets, setGroupedAssets] = useState<Record<string, UserAsset[]>>({});
  const [summary, setSummary] = useState<AssetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // ดึงข้อมูลอุปกรณ์สำหรับ user
  useEffect(() => {
    const fetchUserAssets = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/user-assets');
        if (response.ok) {
          const data = await response.json();
          setUserAssets(data.data.assets || []);
          setGroupedAssets(data.data.groupedAssets || {});
          setSummary(data.data.summary || null);
        } else {
          throw new Error('Failed to fetch user assets');
        }
      } catch (error) {
        console.error('Error fetching user assets:', error);
        setError('ไม่สามารถโหลดข้อมูลได้');
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchUserAssets();
    }
  }, [session]);

  // Loading state for session
  if (status === 'loading') {
    return <LoadingSpinner fullScreen color="pink" text="กำลังตรวจสอบสิทธิ์..." size="xl" />;
  }

  // Redirect if not authenticated
  if (!session) {
    redirect('/login');
    return null;
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-rose-50 p-4">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-gradient-to-r from-pink-100 to-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaExclamationCircle className="text-2xl text-pink-600" />
          </div>
          <h2 className="text-xl font-kanit font-bold text-pink-800 mb-2">เกิดข้อผิดพลาด</h2>
          <p className="text-pink-600 font-kanit mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-2 rounded-lg hover:from-pink-600 hover:to-rose-600 transition-colors font-kanit font-bold"
          >
            ลองใหม่อีกครั้ง
          </button>
        </div>
      </div>
    );
  }

  // Loading state  
  if (loading) {
    return <LoadingSpinner fullScreen color="pink" text="กำลังโหลดข้อมูล..." size="xl" />;
  }

  // กรองข้อมูลตามการค้นหาและหมวดหมู่
  const filteredAssets = userAssets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || asset.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSelectAsset = (asset: Asset) => {
    setSelectedAsset(asset);
    setShowBorrowForm(true);
  };

  const handleCloseBorrowForm = () => {
    setShowBorrowForm(false);
    setSelectedAsset(null);
  };

  const handleBorrowSuccess = () => {
    // Refresh the page or asset list
    window.location.reload();
  };

  return (
    <ClientOnly fallback={<LoadingSpinner fullScreen color="pink" text="กำลังโหลด..." />}>
      <LayoutWrapper>
        <div className="p-6">
          {/* Welcome Header */}
          <div className="mb-8 p-6 bg-gradient-to-r from-pink-50 to-rose-50 rounded-2xl border border-pink-200">
            <div className="flex items-center space-x-3 mb-2">
              <FaUserCircle className="text-pink-600 text-3xl" />
              <h1 className="text-3xl font-kanit font-black bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                ยินดีต้อนรับ, {session?.user?.name}
              </h1>
            </div>
            <p className="text-pink-700 font-kanit font-medium">
              ดูอุปกรณ์ที่มีให้ยืมและจำนวนคงเหลือ
            </p>
          </div>

          {/* Quick Action Cards */}
          <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link 
              href="/dashboard/borrow"
              className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                  <FaPlus className="text-blue-600 text-xl" />
                </div>
                <div>
                  <h3 className="text-lg font-kanit font-bold text-blue-800">ยื่นคำขอยืม</h3>
                  <p className="text-blue-600 text-sm font-kanit">ยื่นคำขอยืมอุปกรณ์</p>
                </div>
              </div>
            </Link>

            <Link 
              href="/dashboard/supplies"
              className="bg-white rounded-2xl shadow-lg border border-green-100 p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-100 to-green-200 rounded-full flex items-center justify-center">
                  <FaClipboardList className="text-green-600 text-xl" />
                </div>
                <div>
                  <h3 className="text-lg font-kanit font-bold text-green-800">วัสดุสิ้นเปลือง</h3>
                  <p className="text-green-600 text-sm font-kanit">ดูและเบิกวัสดุสิ้นเปลือง</p>
                </div>
              </div>
            </Link>

            <Link 
              href="/dashboard/inventory-check"
              className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-purple-200 rounded-full flex items-center justify-center">
                  <FaQrcode className="text-purple-600 text-xl" />
                </div>
                <div>
                  <h3 className="text-lg font-kanit font-bold text-purple-800">ตรวจนับครุภัณฑ์</h3>
                  <p className="text-purple-600 text-sm font-kanit">สแกน QR เพื่อตรวจนับ</p>
                </div>
              </div>
            </Link>

            <Link 
              href="/dashboard/loans-history"
              className="bg-white rounded-2xl shadow-lg border border-orange-100 p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-100 to-orange-200 rounded-full flex items-center justify-center">
                  <FaClipboardList className="text-orange-600 text-xl" />
                </div>
                <div>
                  <h3 className="text-lg font-kanit font-bold text-orange-800">ประวัติการยืม</h3>
                  <p className="text-orange-600 text-sm font-kanit">ดูประวัติการยืม-คืน</p>
                </div>
              </div>
            </Link>
          </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border border-blue-200">
              <div className="flex items-center space-x-3">
                <FaBox className="text-blue-600 text-2xl" />
                <div>
                  <p className="text-blue-800 font-kanit font-bold text-2xl">{summary.totalAssets}</p>
                  <p className="text-blue-600 text-sm font-kanit">รายการอุปกรณ์</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl border border-green-200">
              <div className="flex items-center space-x-3">
                <FaCheckCircle className="text-green-600 text-2xl" />
                <div>
                  <p className="text-green-800 font-kanit font-bold text-2xl">{summary.totalAvailable}</p>
                  <p className="text-green-600 text-sm font-kanit">พร้อมใช้งาน</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-2xl border border-orange-200">
              <div className="flex items-center space-x-3">
                <FaExclamationCircle className="text-orange-600 text-2xl" />
                <div>
                  <p className="text-orange-800 font-kanit font-bold text-2xl">{summary.totalBorrowed}</p>
                  <p className="text-orange-600 text-sm font-kanit">กำลังยืม</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl border border-purple-200">
              <div className="flex items-center space-x-3">
                <div>
                  <p className="text-purple-800 font-kanit font-bold text-2xl">{summary.categories}</p>
                  <p className="text-purple-600 text-sm font-kanit">หมวดหมู่</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filter */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pink-400" />
            <input
              type="text"
              placeholder="ค้นหาอุปกรณ์..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 font-kanit text-black"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-3 border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 font-kanit text-black"
          >
            <option value="all">ทุกหมวดหมู่</option>
            {Object.keys(groupedAssets).map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        {/* Assets Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-200 border-t-pink-600 mx-auto mb-4"></div>
            <p className="text-pink-600 font-kanit">กำลังโหลดข้อมูล...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {filteredAssets.map((asset) => (
              <div key={asset.id} className="bg-white rounded-2xl shadow-lg border border-pink-100 overflow-hidden hover:shadow-xl transition-shadow">
                {asset.imageUrl && (
                  <div className="h-48 bg-gray-100 flex items-center justify-center relative">
                    <Image 
                      src={`${asset.imageUrl}?t=${Date.now()}`} 
                      alt={asset.name}
                      fill
                      className="object-contain"
                      onError={(e) => {
                        // Fallback to a default image if loading fails
                        const target = e.target as HTMLImageElement;
                        target.src = '/images/default-asset.png';
                      }}
                    />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-kanit font-bold text-lg text-gray-800">{asset.name}</h3>
                    <span className="px-3 py-1 bg-pink-100 text-pink-600 rounded-full text-xs font-kanit">
                      {asset.category}
                    </span>
                  </div>
                  
                  {asset.description && (
                    <p className="text-gray-600 text-sm font-kanit mb-4">{asset.description}</p>
                  )}
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-kanit text-sm">ทั้งหมด:</span>
                      <span className="font-kanit font-bold text-gray-800">{asset.quantity} ชิ้น</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-kanit text-sm">พร้อมใช้งาน:</span>
                      <span className={`font-kanit font-bold ${asset.available > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {asset.available} ชิ้น
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-kanit text-sm">กำลังยืม:</span>
                      <span className="font-kanit font-bold text-orange-600">{asset.borrowed} ชิ้น</span>
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                    <div 
                      className="bg-gradient-to-r from-pink-500 to-rose-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(asset.available / asset.quantity) * 100}%` }}
                    ></div>
                  </div>
                  
                  <button
                    onClick={() => {
                      // Convert UserAsset to Asset type for compatibility
                      const assetForBorrow: Asset = {
                        id: asset.id,
                        code: asset.id, // Using id as code for now
                        name: asset.name,
                        description: asset.description,
                        quantity: asset.quantity,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                      };
                      handleSelectAsset(assetForBorrow);
                    }}
                    disabled={!asset.canBorrow}
                    className={`w-full py-3 px-4 rounded-xl font-kanit font-semibold transition-all duration-200 ${
                      asset.canBorrow
                        ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600 shadow-lg hover:shadow-xl'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {asset.canBorrow ? 'ขอยืม' : `หมด (เหลือ ${asset.available} ชิ้น)`}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredAssets.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-gray-600 font-kanit text-lg">ไม่พบอุปกรณ์ที่ตรงกับการค้นหา</p>
          </div>
        )}

        {/* Borrow Form Modal */}
        {showBorrowForm && (
          <BorrowForm
            selectedAsset={selectedAsset}
            onClose={handleCloseBorrowForm}
            onSuccess={handleBorrowSuccess}
          />
        )}
      </div>
    </LayoutWrapper>
    </ClientOnly>
  );
}

