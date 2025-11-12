'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import QRScanner from '@/components/QRScanner';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import { FaSearch, FaFilter, FaBoxes, FaExclamationTriangle, FaCheckCircle, FaEye, FaClipboard, FaPlus, FaQrcode } from 'react-icons/fa';
import Link from 'next/link';
import LayoutWrapper from '@/components/LayoutWrapper';
import SupplyRequestModal from '@/components/SupplyRequestModal';

interface Supply {
  id: string;
  code: string;
  name: string;
  description: string | null;
  quantity: number;
  unit: string;
  category: string;
  minQuantity: number;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function UserSuppliesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [filteredSupplies, setFilteredSupplies] = useState<Supply[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [quantityFilter, setQuantityFilter] = useState<string>('ALL');
  const [selectedSupply, setSelectedSupply] = useState<Supply | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [qrError, setQRError] = useState<string | null>(null);
  // Handle QR Scan result
  const handleQRScan = async (result: string) => {
    setShowQRScanner(false);
    setQRError(null);
    let codeOrId = result;
    let itemType = 'unknown'; // 'supply' or 'asset'
    
    // 1. ถ้าเป็น URL เช่น https://.../supply/xxxx หรือ .../asset/xxxx
    try {
      const url = new URL(result);
      const parts = url.pathname.split('/');
      const supplyIdx = parts.findIndex(p => p === 'supply' || p === 'supplies');
      const assetIdx = parts.findIndex(p => p === 'asset' || p === 'assets');
      
      if (supplyIdx !== -1 && parts[supplyIdx + 1]) {
        codeOrId = parts[supplyIdx + 1];
        itemType = 'supply';
      } else if (assetIdx !== -1 && parts[assetIdx + 1]) {
        codeOrId = parts[assetIdx + 1];
        itemType = 'asset';
      }
    } catch (e) {}
    
    // 2. ถ้าเป็น JSON เช่น {"type":"supply","code":"xxxx"} หรือ {"type":"asset","id":"xxxx"}
    if (itemType === 'unknown') {
      try {
        const obj = JSON.parse(result);
        if (obj.type === 'supply' || obj.type === 'supplies') {
          itemType = 'supply';
          codeOrId = obj.code || obj.id || codeOrId;
        } else if (obj.type === 'asset' || obj.type === 'assets') {
          itemType = 'asset';
          codeOrId = obj.code || obj.id || codeOrId;
        } else if (obj.code) {
          codeOrId = obj.code;
        } else if (obj.id) {
          codeOrId = obj.id;
        }
      } catch (e) {}
    }
    
    // 3. ถ้ายังไม่รู้ชนิด ให้ลองหาใน supplies ก่อน (ค้นหาด้วย code, id, หรือ name)
    if (itemType === 'unknown') {
      const foundSupply = supplies.find(s => 
        s.code === codeOrId || 
        s.id === codeOrId || 
        s.name === codeOrId ||
        s.name.includes(codeOrId) ||
        codeOrId.includes(s.name)
      );
      if (foundSupply) {
        itemType = 'supply';
        codeOrId = foundSupply.id; // ใช้ id แทน
      } else {
        // ลอง fetch asset จาก API (ค้นหาด้วย code หรือ name)
        try {
          const assetRes = await fetch(`/api/assets/code/${encodeURIComponent(codeOrId)}`);
          if (assetRes.ok) {
            const assetData = await assetRes.json();
            if (assetData.success && assetData.data) {
              itemType = 'asset';
              codeOrId = assetData.data.id || codeOrId;
            }
          } else {
            // ลองค้นหา asset ด้วย name
            const assetsRes = await fetch('/api/assets');
            if (assetsRes.ok) {
              const assetsData = await assetsRes.json();
              const foundAsset = assetsData.data?.find((a: any) => 
                a.name === codeOrId || 
                a.name.includes(codeOrId) ||
                codeOrId.includes(a.name)
              );
              if (foundAsset) {
                itemType = 'asset';
                codeOrId = foundAsset.id;
              }
            }
          }
        } catch (e) {
          console.error('Error fetching asset:', e);
        }
      }
    }
    
    // ถ้ายังไม่ login ให้ redirect ไป login พร้อมข้อมูล
    if (!session) {
      let redirectUrl = '/dashboard/supplies';
      if (itemType === 'asset') {
        redirectUrl = `/dashboard/borrow?asset=${encodeURIComponent(codeOrId)}`;
      } else if (itemType === 'supply') {
        redirectUrl = `/dashboard/supplies?supply=${encodeURIComponent(codeOrId)}`;
      }
      const from = encodeURIComponent(redirectUrl);
      router.push(`/login?from=${from}`);
      return;
    }
    
    // 4. Redirect/แสดงข้อมูลตามชนิด
    if (itemType === 'asset') {
      // Redirect ไปหน้ายืมครุภัณฑ์
      router.push(`/dashboard/borrow?asset=${encodeURIComponent(codeOrId)}`);
    } else if (itemType === 'supply') {
      // แสดง modal วัสดุสิ้นเปลือง (ค้นหาด้วย id ที่ได้จากการค้นหาข้างต้น)
      const found = supplies.find(s => s.id === codeOrId || s.code === codeOrId);
      if (found) {
        setSelectedSupply(found);
        setShowDetailModal(true);
      } else {
        setQRError('ไม่พบวัสดุที่ตรงกับ QR นี้');
      }
    } else {
      setQRError(`ไม่พบข้อมูลที่ตรงกับ QR นี้ (${codeOrId.substring(0, 50)}...)`);
    }
  };

  const handleQRError = (err: string) => {
    setQRError(err);
  };

  const fetchSupplies = async () => {
    try {
      const response = await fetch('/api/supplies');
      const result = await response.json();
      
      // Handle API response structure
      const data = result.success ? result.data : [];
      setSupplies(data);
      
      // Extract unique categories
      const uniqueCategories = Array.from(new Set(data.map((supply: Supply) => supply.category).filter(Boolean))) as string[];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching supplies:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterSupplies = () => {
    let filtered = supplies;

    if (searchTerm) {
      filtered = filtered.filter(
        (supply) =>
          supply.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          supply.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          supply.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== 'ALL') {
      filtered = filtered.filter((supply) => supply.category === categoryFilter);
    }

    if (quantityFilter !== 'ALL') {
      filtered = filtered.filter((supply) => {
        switch (quantityFilter) {
          case 'AVAILABLE':
            return supply.quantity > supply.minQuantity;
          case 'LOW':
            return supply.quantity > 0 && supply.quantity <= supply.minQuantity;
          case 'OUT_OF_STOCK':
            return supply.quantity === 0;
          default:
            return true;
        }
      });
    }

    setFilteredSupplies(filtered);
  };

  useEffect(() => {
    fetchSupplies();
  }, []);

  // ถ้ามี query supply=xxxx หลัง login ให้เปิด modal รายละเอียดวัสดุนั้นทันที
  useEffect(() => {
    const supplyCode = searchParams?.get('supply');
    if (supplyCode && supplies.length > 0) {
      const found = supplies.find(s => s.code === supplyCode || s.id === supplyCode);
      if (found) {
        setSelectedSupply(found);
        setShowDetailModal(true);
        // ลบ query ออกจาก url (optional)
        const url = new URL(window.location.href);
        url.searchParams.delete('supply');
        window.history.replaceState({}, '', url.pathname + url.search);
      }
    }
  }, [searchParams, supplies]);

  useEffect(() => {
    filterSupplies();
  }, [supplies, searchTerm, categoryFilter, quantityFilter]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-100 flex items-center justify-center">
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

  const getQuantityStatusClass = (quantity: number, minQuantity: number) => {
    if (quantity === 0) return 'text-red-600 bg-red-100 border-red-200';
    if (quantity <= minQuantity) return 'text-yellow-600 bg-yellow-100 border-yellow-200';
    return 'text-green-600 bg-green-100 border-green-200';
  };

  const getQuantityIcon = (quantity: number, minQuantity: number) => {
    if (quantity === 0) return <FaExclamationTriangle className="text-red-500" />;
    if (quantity <= minQuantity) return <FaExclamationTriangle className="text-yellow-500" />;
    return <FaCheckCircle className="text-green-500" />;
  };

  const getQuantityStatusText = (quantity: number, minQuantity: number) => {
    if (quantity === 0) return 'หมดสต็อก';
    if (quantity <= minQuantity) return 'เหลือน้อย';
    return 'พร้อมใช้งาน';
  };

  const openDetailModal = (supply: Supply) => {
    setSelectedSupply(supply);
    setShowDetailModal(true);
  };

  const openRequestModal = (supply: Supply) => {
    setSelectedSupply(supply);
    setShowRequestModal(true);
  };

  const closeRequestModal = () => {
    setShowRequestModal(false);
    setSelectedSupply(null);
  };

  const handleRequestSuccess = () => {
    closeRequestModal();
    fetchSupplies(); // Refresh supplies
  };

  if (loading) {
    return (
      <LayoutWrapper>
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-100 flex items-center justify-center">
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
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-100">
        <div className="container mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent font-kanit mb-2">
              📋 วัสดุสิ้นเปลือง
            </h1>
            <p className="text-pink-700 font-kanit text-lg">
              ดูวัสดุสิ้นเปลืองทั้งหมดที่พร้อมให้เบิก
            </p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-pink-400">
              <div className="flex items-center">
                <FaBoxes className="text-pink-500 text-2xl mr-3" />
                <div>
                  <p className="text-sm text-pink-600 font-kanit">ทั้งหมด</p>
                  <p className="text-2xl font-bold text-pink-800 font-kanit">
                    {Array.isArray(supplies) ? supplies.length : 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-400">
              <div className="flex items-center">
                <FaCheckCircle className="text-green-500 text-2xl mr-3" />
                <div>
                  <p className="text-sm text-green-600 font-kanit">พร้อมใช้</p>
                  <p className="text-2xl font-bold text-green-700 font-kanit">
                    {Array.isArray(supplies) ? supplies.filter(supply => supply.quantity > supply.minQuantity).length : 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-400">
              <div className="flex items-center">
                <FaExclamationTriangle className="text-yellow-500 text-2xl mr-3" />
                <div>
                  <p className="text-sm text-orange-600 font-kanit">เหลือน้อย</p>
                  <p className="text-2xl font-bold text-orange-700 font-kanit">
                    {Array.isArray(supplies) ? supplies.filter(supply => supply.quantity > 0 && supply.quantity <= supply.minQuantity).length : 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-400">
              <div className="flex items-center">
                <FaExclamationTriangle className="text-red-500 text-2xl mr-3" />
                <div>
                  <p className="text-sm text-red-600 font-kanit">หมดสต็อก</p>
                  <p className="text-2xl font-bold text-red-700 font-kanit">
                    {Array.isArray(supplies) ? supplies.filter(supply => supply.quantity === 0).length : 0}
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
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pink-400" />
                  <input
                    type="text"
                    placeholder="ค้นหาชื่อวัสดุหรือรหัสวัสดุ..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-20 py-3 border border-pink-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent font-kanit text-black"
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
                      onClick={filterSupplies}
                      className="bg-pink-500 hover:bg-pink-600 text-white p-1.5 rounded-md transition-colors"
                      title="ค้นหา"
                    >
                      <FaSearch className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Category Filter */}
                <div className="relative">
                  <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pink-400" />
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="pl-10 pr-8 py-3 border border-pink-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent font-kanit bg-white text-black"
                  >
                    <option value="ALL">ทุกหมวดหมู่</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                {/* Quantity Filter */}
                <div className="relative">
                  <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pink-400" />
                  <select
                    value={quantityFilter}
                    onChange={(e) => setQuantityFilter(e.target.value)}
                    className="pl-10 pr-8 py-3 border border-pink-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent font-kanit bg-white text-black"
                  >
                    <option value="ALL">ทุกสถานะ</option>
                    <option value="AVAILABLE">พร้อมใช้งาน</option>
                    <option value="LOW">เหลือน้อย</option>
                    <option value="OUT_OF_STOCK">หมดสต็อก</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (!session) {
                      // ถ้ายังไม่ login ให้ redirect ไป login ก่อน
                      const from = encodeURIComponent('/dashboard/supplies');
                      router.push(`/login?from=${from}`);
                    } else {
                      setShowQRScanner(true);
                    }
                  }}
                  className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-kanit font-semibold py-3 px-6 rounded-lg transition duration-300 flex items-center gap-2 shadow-lg"
                >
                  <FaQrcode />
                  สแกน QR
                </button>
                <button
                  onClick={() => openRequestModal({ id: '', name: '', unit: '', quantity: 0, code: '', description: '', category: '', minQuantity: 0, createdAt: '', updatedAt: '' })}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-kanit font-semibold py-3 px-6 rounded-lg transition duration-300 flex items-center gap-2 shadow-lg"
                >
                  <FaClipboard />
                  ยื่นคำขอเบิก
                </button>
              </div>
      {/* QR Scanner Modal */}
      {showQRScanner && (
        <QRScanner
          isOpen={showQRScanner}
          onClose={() => setShowQRScanner(false)}
          onScan={handleQRScan}
          onError={handleQRError}
          title="สแกน QR วัสดุสิ้นเปลือง"
          description="นำกล้องไปส่อง QR Code ของวัสดุที่ต้องการเบิก"
        />
      )}
      {/* QR Scan Error */}
      {qrError && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-sm w-full mx-4 text-center">
            <p className="text-red-600 font-kanit text-lg mb-4">{qrError}</p>
            <button
              onClick={() => setQRError(null)}
              className="px-4 py-2 bg-pink-500 text-white rounded-lg font-kanit"
            >
              ปิด
            </button>
          </div>
        </div>
      )}
            </div>

            <div className="mt-4 text-sm text-gray-600 font-kanit">
              แสดงผล {Array.isArray(filteredSupplies) ? filteredSupplies.length : 0} รายการจากทั้งหมด {Array.isArray(supplies) ? supplies.length : 0} รายการ
            </div>
          </div>

          {/* Supplies Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {!Array.isArray(filteredSupplies) || filteredSupplies.length === 0 ? (
              <div className="col-span-full bg-white rounded-xl shadow-lg p-12 text-center">
                <FaBoxes className="mx-auto text-pink-300 text-6xl mb-4" />
                <p className="text-pink-600 font-kanit text-xl">ไม่พบวัสดุสิ้นเปลือง</p>
                <p className="text-pink-400 font-kanit">
                  {searchTerm || categoryFilter !== 'ALL' || quantityFilter !== 'ALL'
                    ? 'ลองเปลี่ยนเงื่อนไขการกรองข้อมูล' 
                    : 'ไม่มีวัสดุสิ้นเปลืองในระบบ'}
                </p>
              </div>
            ) : (
              filteredSupplies.map((supply) => (
                <div key={supply.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden border border-pink-100 hover:border-pink-200">
                  {/* Supply Image */}
                  {supply.imageUrl && (
                    <div className="h-48 bg-pink-50 flex items-center justify-center relative">
                      <Image 
                        src={`${supply.imageUrl}?t=${Date.now()}`} 
                        alt={supply.name}
                        fill
                        className="object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/images/default-supply.png';
                        }}
                      />
                    </div>
                  )}
                  
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-rose-600 rounded-lg flex items-center justify-center">
                          <FaBoxes className="text-white text-xl" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-pink-800 font-kanit">
                            {supply.name}
                          </h3>
                          <p className="text-sm text-pink-600 font-kanit">
                            รหัส: {supply.code}
                          </p>
                          <p className="text-sm text-pink-700 font-kanit">
                            {supply.category}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => openDetailModal(supply)}
                        className="p-2 text-pink-500 hover:bg-pink-100 rounded-lg transition-colors"
                        title="ดูรายละเอียด"
                      >
                        <FaEye />
                      </button>
                    </div>

                    {supply.description && (
                      <p className="text-sm text-gray-600 mb-4 font-kanit line-clamp-2">
                        {supply.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        {getQuantityIcon(supply.quantity, supply.minQuantity)}
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getQuantityStatusClass(supply.quantity, supply.minQuantity)} font-kanit`}>
                          {getQuantityStatusText(supply.quantity, supply.minQuantity)}
                        </span>
                      </div>
                    </div>

                    <div className="text-center">
                      <p className="text-2xl font-bold text-pink-800 font-kanit mb-1">
                        {supply.quantity} {supply.unit}
                      </p>
                      <p className="text-sm text-pink-600 font-kanit">
                        คงเหลือ (ขั้นต่ำ: {supply.minQuantity} {supply.unit})
                      </p>
                    </div>

                    {supply.quantity > 0 && (
                      <div className="mt-4">
                        <button
                          onClick={() => openRequestModal(supply)}
                          className="w-full bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-kanit font-semibold py-2 px-4 rounded-lg transition duration-300 flex items-center justify-center gap-2"
                        >
                          <FaClipboard />
                          ยื่นคำขอเบิก
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Detail Modal */}
        {showDetailModal && selectedSupply && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-8 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
              {/* Supply Image in Modal */}
              {selectedSupply.imageUrl && (
                <div className="h-48 bg-pink-50 flex items-center justify-center relative rounded-lg mb-6">
                  <Image 
                    src={`${selectedSupply.imageUrl}?t=${Date.now()}`} 
                    alt={selectedSupply.name}
                    fill
                    className="object-contain rounded-lg"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/images/default-supply.png';
                    }}
                  />
                </div>
              )}
              
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-rose-600 rounded-xl flex items-center justify-center">
                  <FaBoxes className="text-white text-2xl" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-pink-800 font-kanit">
                    {selectedSupply.name}
                  </h2>
                  <p className="text-gray-600 font-kanit">
                    รหัส: {selectedSupply.code}
                  </p>
                  <p className="text-green-600 font-kanit">
                    หมวดหมู่: {selectedSupply.category}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {selectedSupply.description && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 font-kanit mb-2">
                      คำอธิบาย
                    </h3>
                    <p className="text-gray-600 font-kanit bg-gray-50 p-3 rounded-lg">
                      {selectedSupply.description}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 font-kanit mb-2">
                      จำนวนคงเหลือ
                    </h3>
                    <div className="flex items-center gap-2">
                      {getQuantityIcon(selectedSupply.quantity, selectedSupply.minQuantity)}
                      <span className="text-2xl font-bold text-gray-900 font-kanit">
                        {selectedSupply.quantity} {selectedSupply.unit}
                      </span>
                    </div>
                    <p className={`text-sm font-kanit mt-1 ${
                      selectedSupply.quantity === 0 ? 'text-red-600' :
                      selectedSupply.quantity <= selectedSupply.minQuantity ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {getQuantityStatusText(selectedSupply.quantity, selectedSupply.minQuantity)}
                    </p>
                    <p className="text-xs text-gray-500 font-kanit mt-1">
                      ขั้นต่ำ: {selectedSupply.minQuantity} {selectedSupply.unit}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 font-kanit mb-2">
                      อัปเดตล่าสุด
                    </h3>
                    <p className="text-gray-900 font-kanit">
                      {new Date(selectedSupply.updatedAt).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        timeZone: 'Asia/Bangkok'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="flex-1 px-4 py-3 border border-pink-300 text-pink-700 rounded-lg hover:bg-pink-100 transition-colors font-kanit"
                >
                  ปิด
                </button>
                {selectedSupply.quantity > 0 && (
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      openRequestModal(selectedSupply);
                    }}
                    className="flex-1 bg-gradient-to-r from-pink-500 to-rose-600 text-white px-4 py-3 rounded-lg hover:from-pink-600 hover:to-rose-700 transition-colors font-kanit text-center"
                  >
                    ยื่นคำขอเบิก
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Supply Request Modal */}
      {showRequestModal && selectedSupply && (
        <SupplyRequestModal
          supply={selectedSupply}
          isOpen={showRequestModal}
          onClose={closeRequestModal}
          onSuccess={handleRequestSuccess}
        />
      )}
    </LayoutWrapper>
  );
}