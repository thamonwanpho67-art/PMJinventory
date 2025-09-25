'use client';

import { useState, useEffect } from 'react';
import { FaBox, FaCheckCircle, FaExclamationCircle, FaSearch, FaFilter, FaEye } from 'react-icons/fa';

type UserAsset = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  available: number;
  borrowed: number;
  status: string;
  image?: string | null;
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

interface UserAssetListProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSelectAsset?: (asset: any) => void;
}

export default function UserAssetList({ onSelectAsset }: UserAssetListProps) {
  const [userAssets, setUserAssets] = useState<UserAsset[]>([]);
  const [groupedAssets, setGroupedAssets] = useState<Record<string, UserAsset[]>>({});
  const [summary, setSummary] = useState<AssetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    fetchUserAssets();
  }, []);

  const fetchUserAssets = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user-assets');
      if (response.ok) {
        const data = await response.json();
        setUserAssets(data.data.assets);
        setGroupedAssets(data.data.groupedAssets);
        setSummary(data.data.summary);
      }
    } catch (error) {
      console.error('Error fetching user assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAssets = userAssets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || asset.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAssetSelect = (asset: UserAsset) => {
    if (onSelectAsset) {
      // Convert UserAsset to Asset type for compatibility
      const assetForBorrow = {
        id: asset.id,
        code: asset.id,
        name: asset.name,
        description: asset.description,
        quantity: asset.available,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      onSelectAsset(assetForBorrow);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-200 border-t-pink-600 mx-auto mb-4"></div>
        <p className="text-pink-600 font-kanit">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  return (
    <div>
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
              <FaFilter className="text-purple-600 text-2xl" />
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
            className="w-full pl-10 pr-4 py-3 border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 font-kanit"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-3 border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 font-kanit"
        >
          <option value="all">ทุกหมวดหมู่</option>
          {Object.keys(groupedAssets).map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
        <div className="flex border border-pink-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-4 py-3 font-kanit ${viewMode === 'grid' ? 'bg-pink-500 text-white' : 'bg-white text-pink-500'}`}
          >
            <FaBox />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-3 font-kanit ${viewMode === 'list' ? 'bg-pink-500 text-white' : 'bg-white text-pink-500'}`}
          >
            <FaEye />
          </button>
        </div>
      </div>

      {/* Assets Display */}
      <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
        {filteredAssets.map((asset) => (
          <div key={asset.id} className={`bg-white rounded-2xl shadow-lg border border-pink-100 overflow-hidden hover:shadow-xl transition-shadow ${viewMode === 'list' ? 'flex' : ''}`}>
            {asset.image && (
              <div className={`bg-gray-100 flex items-center justify-center ${viewMode === 'grid' ? 'h-48' : 'w-48 h-32'}`}>
                <img 
                  src={asset.image} 
                  alt={asset.name}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            )}
            <div className={`p-6 ${viewMode === 'list' ? 'flex-1' : ''}`}>
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-kanit font-bold text-lg text-gray-800">{asset.name}</h3>
                <span className="px-3 py-1 bg-pink-100 text-pink-600 rounded-full text-xs font-kanit whitespace-nowrap ml-2">
                  {asset.category}
                </span>
              </div>
              
              {asset.description && (
                <p className="text-gray-600 text-sm font-kanit mb-4">{asset.description}</p>
              )}
              
              <div className={`${viewMode === 'list' ? 'flex space-x-8' : 'space-y-2'} mb-4`}>
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
                onClick={() => handleAssetSelect(asset)}
                disabled={!asset.canBorrow}
                className={`w-full py-3 px-4 rounded-xl font-kanit font-semibold transition-all duration-200 ${
                  asset.canBorrow
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600 shadow-lg hover:shadow-xl'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {asset.canBorrow ? 'ขอยืม' : 'ไม่สามารถยืมได้'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredAssets.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-gray-600 font-kanit text-lg">ไม่พบอุปกรณ์ที่ตรงกับการค้นหา</p>
        </div>
      )}
    </div>
  );
}

