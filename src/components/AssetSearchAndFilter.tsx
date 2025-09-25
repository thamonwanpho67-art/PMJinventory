'use client';

import { useState, useEffect } from 'react';
import { FaSearch, FaSort } from 'react-icons/fa';

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

interface AssetSearchAndFilterProps {
  assets: UserAsset[];
  onFilterChange: (filteredAssets: UserAsset[]) => void;
  categories: string[];
}

export default function AssetSearchAndFilter({ 
  assets, 
  onFilterChange, 
  categories 
}: AssetSearchAndFilterProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    let filtered = [...assets];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(asset =>
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(asset => asset.category === selectedCategory);
    }

    // Filter by availability
    if (availabilityFilter === 'available') {
      filtered = filtered.filter(asset => asset.canBorrow);
    } else if (availabilityFilter === 'unavailable') {
      filtered = filtered.filter(asset => !asset.canBorrow);
    }

    // Sort
    filtered.sort((a: UserAsset, b: UserAsset) => {
      let aValue: string | number, bValue: string | number;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'category':
          aValue = a.category.toLowerCase();
          bValue = b.category.toLowerCase();
          break;
        case 'available':
          aValue = a.available;
          bValue = b.available;
          break;
        case 'quantity':
          aValue = a.quantity;
          bValue = b.quantity;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    onFilterChange(filtered);
  }, [searchTerm, selectedCategory, availabilityFilter, sortBy, sortOrder, assets, onFilterChange]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setAvailabilityFilter('all');
    setSortBy('name');
    setSortOrder('asc');
  };

  const activeFiltersCount = [
    searchTerm,
    selectedCategory !== 'all' ? selectedCategory : '',
    availabilityFilter !== 'all' ? availabilityFilter : ''
  ].filter(Boolean).length;

  return (
    <div className="mb-6 space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pink-400" />
        <input
          type="text"
                        placeholder="ค้นหาด้วยชื่อ รหัส หรือ &quot;ยี่ห้อ&quot; ของครุภัณฑ์"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 font-kanit text-lg"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-pink-400 hover:text-pink-600"
          >
            ✕
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        {/* Category Filter */}
        <div className="flex-1 min-w-48">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-4 py-3 border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 font-kanit"
          >
            <option value="all">ทุกหมวดหมู่</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        {/* Availability Filter */}
        <div className="flex-1 min-w-48">
          <select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
            className="w-full px-4 py-3 border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 font-kanit"
          >
            <option value="all">ทุกสถานะ</option>
            <option value="available">พร้อมยืม</option>
            <option value="unavailable">ไม่สามารถยืม</option>
          </select>
        </div>

        {/* Sort Options */}
        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-3 border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 font-kanit"
          >
            <option value="name">ชื่อ</option>
            <option value="category">หมวดหมู่</option>
            <option value="available">จำนวนที่ว่าง</option>
            <option value="quantity">จำนวนทั้งหมด</option>
          </select>
          
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-4 py-3 border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 bg-white hover:bg-pink-50 transition-colors"
            title={`เรียงลำดับ${sortOrder === 'asc' ? 'น้อยไปมาก' : 'มากไปน้อย'}`}
          >
            <FaSort className={`text-pink-500 ${sortOrder === 'desc' ? 'transform rotate-180' : ''}`} />
          </button>
        </div>

        {/* Clear Filters */}
        {activeFiltersCount > 0 && (
          <button
            onClick={clearFilters}
            className="px-6 py-3 bg-pink-100 text-pink-600 rounded-xl hover:bg-pink-200 transition-colors font-kanit"
          >
            ล้างตัวกรอง ({activeFiltersCount})
          </button>
        )}
      </div>

      {/* Filter Summary */}
      <div className="flex flex-wrap gap-2">
        {searchTerm && (
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-kanit">
            ค้นหา: &ldquo;{searchTerm}&rdquo;
          </span>
        )}
        {selectedCategory !== 'all' && (
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-kanit">
            หมวดหมู่: {selectedCategory}
          </span>
        )}
        {availabilityFilter !== 'all' && (
          <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-kanit">
            สถานะ: {availabilityFilter === 'available' ? 'พร้อมยืม' : 'ไม่สามารถยืม'}
          </span>
        )}
      </div>
    </div>
  );
}

