'use client';

import { useState, useEffect } from 'react';
import { FaTimes, FaQrcode, FaBox, FaCalendar, FaTag, FaInfoCircle, FaHandHoldingHeart, FaSpinner } from 'react-icons/fa';
import BorrowForm from './BorrowForm';

interface Asset {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  quantity: number;
  availableQuantity: number;
  price?: number | null;
  costCenter?: string | null;
  accountingDate?: string | null;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AssetDetailModalProps {
  assetCode?: string;
  asset?: Asset;
  isOpen: boolean;
  onClose: () => void;
  onBorrow?: (asset: Asset) => void;
  showBorrowButton?: boolean;
}

export default function AssetDetailModal({ 
  assetCode, 
  asset: providedAsset,
  isOpen, 
  onClose, 
  onBorrow,
  showBorrowButton = true 
}: AssetDetailModalProps) {
  const [asset, setAsset] = useState<Asset | null>(providedAsset || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showBorrowForm, setShowBorrowForm] = useState(false);

  useEffect(() => {
    if (isOpen && assetCode && !providedAsset) {
      fetchAssetByCode(assetCode);
    } else if (providedAsset) {
      setAsset(providedAsset);
    }
  }, [isOpen, assetCode, providedAsset]);

  const fetchAssetByCode = async (code: string) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/assets/code/${code}`);
      const data = await response.json();
      
      if (data.success) {
        setAsset(data.data);
      } else {
        setError(data.error || 'ไม่พบข้อมูลครุภัณฑ์');
      }
    } catch (error) {
      console.error('Error fetching asset:', error);
      setError('เกิดข้อผิดพลาดในการดึงข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const handleBorrow = () => {
    if (asset) {
      if (onBorrow) {
        onBorrow(asset);
      } else {
        setShowBorrowForm(true);
      }
    }
  };

  const handleCloseBorrowForm = () => {
    setShowBorrowForm(false);
  };

  const handleBorrowSuccess = () => {
    setShowBorrowForm(false);
    onClose();
  };

  const getImageUrl = (asset: Asset) => {
    if (asset.imageUrl) {
      return `${asset.imageUrl}?t=${Date.now()}`;
    }
    return 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=300&fit=crop';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(price);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-2xl w-full mx-auto shadow-2xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <FaBox className="text-2xl text-pink-600" />
              <div>
                <h3 className="text-xl font-kanit font-bold text-gray-900">รายละเอียดครุภัณฑ์</h3>
                <p className="text-sm text-gray-600 font-kanit">ข้อมูลของครุภัณฑ์ในระบบ</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <FaSpinner className="text-4xl text-pink-600 mx-auto mb-4 animate-spin" />
                <p className="text-gray-600 font-kanit">กำลังโหลดข้อมูล...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <FaInfoCircle className="text-4xl text-red-500 mx-auto mb-4" />
                <p className="text-red-600 font-kanit mb-4">{error}</p>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-kanit"
                >
                  ปิด
                </button>
              </div>
            ) : asset ? (
              <div className="space-y-6">
                {/* Asset Image */}
                <div className="text-center">
                  <img
                    src={getImageUrl(asset)}
                    alt={asset.name}
                    className="w-64 h-48 object-cover rounded-lg mx-auto shadow-md"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=300&fit=crop';
                    }}
                  />
                </div>

                {/* Asset Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 font-kanit mb-1">
                        <FaQrcode className="inline mr-2" />
                        รหัสครุภัณฑ์
                      </label>
                      <p className="text-lg font-semibold text-gray-900 font-kanit bg-gray-50 p-2 rounded">{asset.code}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 font-kanit mb-1">
                        <FaBox className="inline mr-2" />
                        ชื่อครุภัณฑ์
                      </label>
                      <p className="text-lg text-gray-900 font-kanit">{asset.name}</p>
                    </div>

                    {asset.description && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 font-kanit mb-1">
                          <FaInfoCircle className="inline mr-2" />
                          รายละเอียด
                        </label>
                        <p className="text-gray-700 font-kanit">{asset.description}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 font-kanit mb-1">จำนวนทั้งหมด</label>
                        <p className="text-lg font-semibold text-gray-900 font-kanit">{asset.quantity} ชิ้น</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 font-kanit mb-1">ใช้งานได้</label>
                        <p className={`text-lg font-semibold font-kanit ${asset.availableQuantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {asset.availableQuantity} ชิ้น
                        </p>
                      </div>
                    </div>

                    {asset.price && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 font-kanit mb-1">
                          <FaTag className="inline mr-2" />
                          ราคา
                        </label>
                        <p className="text-lg font-semibold text-green-600 font-kanit">{formatPrice(asset.price)}</p>
                      </div>
                    )}

                    {asset.costCenter && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 font-kanit mb-1">หน่วยงาน</label>
                        <p className="text-gray-900 font-kanit">{asset.costCenter}</p>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 font-kanit mb-1">
                        <FaCalendar className="inline mr-2" />
                        วันที่เพิ่มเข้าระบบ
                      </label>
                      <p className="text-gray-700 font-kanit">{formatDate(asset.createdAt)}</p>
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex justify-center">
                  <span className={`px-4 py-2 rounded-full text-sm font-kanit font-medium ${
                    asset.availableQuantity > 0 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {asset.availableQuantity > 0 ? 'พร้อมให้ยืม' : 'ไม่สามารถยืมได้'}
                  </span>
                </div>

                {/* Action Buttons */}
                {showBorrowButton && (
                  <div className="flex justify-center space-x-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={onClose}
                      className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-kanit"
                    >
                      ปิด
                    </button>
                    {asset.availableQuantity > 0 && (
                      <button
                        onClick={handleBorrow}
                        className="px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-kanit flex items-center space-x-2"
                      >
                        <FaHandHoldingHeart />
                        <span>ยืมครุภัณฑ์นี้</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Borrow Form Modal */}
      {showBorrowForm && asset && (
        <BorrowForm
          selectedAsset={asset}
          onClose={handleCloseBorrowForm}
          onSuccess={handleBorrowSuccess}
        />
      )}
    </>
  );
}