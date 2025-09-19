'use client';

import { useState, useEffect } from 'react';
import { FaGem, FaTimesCircle, FaCheckCircle, FaQrcode } from 'react-icons/fa';
import QRDisplay from './QRDisplay';

type Asset = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  quantity: number;
  availableQuantity?: number;
  createdAt: string;
  updatedAt: string;
};

type AssetListProps = {
  onSelectAsset?: (asset: Asset) => void;
  showBorrowButton?: boolean;
};

export default function AssetList({ onSelectAsset, showBorrowButton = true }: AssetListProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAssetForQR, setSelectedAssetForQR] = useState<Asset | null>(null);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const response = await fetch('/api/assets');
      if (response.ok) {
        const data = await response.json();
        setAssets(data);
      } else {
        setError('Failed to fetch assets');
      }
    } catch (err) {
      setError('Error loading assets');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-pink-200 border-t-pink-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 rounded-lg p-4">
        <p className="text-rose-600 font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center p-6 bg-gradient-to-r from-pink-50 to-rose-50 rounded-2xl border border-pink-200">
        <div className="flex items-center space-x-3">
          <FaGem className="text-pink-600 text-2xl" />
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent font-kanit">รายการครุภัณฑ์</h2>
            <p className="text-pink-600 font-medium">จัดการและค้นหาครุภัณฑ์</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">{assets.length}</p>
          <p className="text-pink-600 text-sm font-medium">รายการทั้งหมด</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {assets.map((asset) => (
          <div
            key={asset.id}
            className="bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 hover:border-pink-300"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 font-kanit">{asset.name}</h3>
                <p className="text-sm text-pink-600 font-medium">รหัส: {asset.code}</p>
              </div>
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                asset.quantity > 0 
                  ? 'bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800' 
                  : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600'
              }`}>
                คงเหลือ: {asset.quantity}
              </span>
            </div>

            {asset.description && (
              <p className="text-gray-600 text-sm mb-4 font-kanit leading-relaxed">{asset.description}</p>
            )}

            <div className="flex justify-between items-center">
              <div className="text-xs text-pink-500 font-medium">
                อัพเดต: {new Date(asset.updatedAt).toLocaleDateString('th-TH')}
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setSelectedAssetForQR(asset)}
                  className="p-2 text-pink-600 hover:text-pink-700 hover:bg-pink-50 rounded-lg transition-colors"
                  title="แสดง QR Code"
                >
                  <FaQrcode className="text-lg" />
                </button>
                
                {showBorrowButton && (
                  <button
                    onClick={() => onSelectAsset?.(asset)}
                    disabled={asset.quantity <= 0}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                      asset.quantity > 0
                        ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600 hover:shadow-lg transform hover:-translate-y-0.5'
                        : 'bg-gradient-to-r from-gray-200 to-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {asset.quantity > 0 ? (
                      <>
                        ขอยืม
                      </>
                    ) : (
                      <>
                        <FaTimesCircle className="mr-1" />
                        ไม่พร้อมใช้งาน
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {assets.length === 0 && (
        <div className="text-center py-16 bg-gradient-to-r from-pink-50 to-rose-50 rounded-2xl border border-pink-200">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-3 font-kanit">ไม่มีครุภัณฑ์</h3>
          <p className="text-pink-600 font-medium">ยังไม่มีครุภัณฑ์ในระบบ กรุณาติดต่อผู้ดูแลระบบ</p>
        </div>
      )}

      {/* QR Code Display Modal */}
      {selectedAssetForQR && (
        <QRDisplay
          assetId={selectedAssetForQR.id}
          assetName={selectedAssetForQR.name}
          assetCode={selectedAssetForQR.code}
          type="asset"
          isOpen={!!selectedAssetForQR}
          onClose={() => setSelectedAssetForQR(null)}
        />
      )}
    </div>
  );
}

