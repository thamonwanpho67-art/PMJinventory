'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useRouter } from 'next/navigation';
import LayoutWrapper from '@/components/LayoutWrapper';
import { FaDownload, FaQrcode, FaSearch, FaEye, FaArrowLeft } from 'react-icons/fa';
import QRCode from 'react-qr-code';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import * as QRCodeLib from 'qrcode';

interface Asset {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string | null;
  status: string;
  createdAt: string;
}

export default function QRManagementPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [categories, setCategories] = useState<string[]>([]);

  // Authentication check
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || session.user.role !== 'ADMIN') {
      redirect('/admin');
      return;
    }
  }, [session, status]);

  // Fetch assets data
  useEffect(() => {
    if (status === 'loading' || !session || session.user.role !== 'ADMIN') return;
    
    const fetchAssets = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/assets');
        if (response.ok) {
          const data = await response.json();
          setAssets(data);
          
          const uniqueCategories = [...new Set(data?.map((asset: Asset) => asset.category).filter(Boolean))] as string[];
          setCategories(uniqueCategories);
        }
      } catch (error) {
        console.error('Error fetching assets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, [session, status]);

  // Filter assets
  useEffect(() => {
    let filtered = assets;

    if (searchTerm) {
      filtered = filtered.filter(asset => 
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(asset => asset.category === selectedCategory);
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(asset => asset.status === selectedStatus);
    }

    setFilteredAssets(filtered);
  }, [assets, searchTerm, selectedCategory, selectedStatus]);

  // Generate QR Code URL
  const generateQRUrl = (assetId: string) => {
    return `${window.location.origin}/public/asset/${assetId}`;
  };

  // Download single QR Code
  const downloadQRCode = async (asset: Asset) => {
    try {
      const qrUrl = generateQRUrl(asset.id);
      const qrDataUrl = await QRCodeLib.toDataURL(qrUrl, { width: 250, margin: 2 });
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = 300;
      canvas.height = 350;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 25, 25, 250, 250);
        ctx.fillStyle = 'black';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(asset.name, canvas.width / 2, 295);
        ctx.font = '14px Arial';
        ctx.fillText(`รหัส: ${asset.code}`, canvas.width / 2, 315);
        
        canvas.toBlob((blob) => {
          if (blob) {
            saveAs(blob, `QR_${asset.code}_${asset.name}.png`);
          }
        });
      };
      img.src = qrDataUrl;
    } catch (error) {
      console.error('Error downloading QR code:', error);
      alert('เกิดข้อผิดพลาดในการดาวน์โหลด QR Code');
    }
  };

  // Download all QR Codes as ZIP
  const downloadAllQRCodes = async () => {
    if (filteredAssets.length === 0) {
      alert('ไม่มีข้อมูลสำหรับสร้าง QR Code');
      return;
    }

    try {
      const zip = new JSZip();
      setLoading(true);
      
      for (const asset of filteredAssets) {
        const qrUrl = generateQRUrl(asset.id);
        const qrDataUrl = await QRCodeLib.toDataURL(qrUrl, { width: 250, margin: 2 });
        
        await new Promise<void>((resolve) => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve();
            return;
          }

          canvas.width = 300;
          canvas.height = 350;
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 25, 25, 250, 250);
            ctx.fillStyle = 'black';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(asset.name, canvas.width / 2, 295);
            ctx.font = '14px Arial';
            ctx.fillText(`รหัส: ${asset.code}`, canvas.width / 2, 315);
            
            canvas.toBlob((blob) => {
              if (blob) {
                zip.file(`QR_${asset.code}_${asset.name}.png`, blob);
              }
              resolve();
            });
          };
          img.src = qrDataUrl;
        });
      }

      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `QR_Codes_${new Date().toISOString().split('T')[0]}.zip`);
      
    } catch (error) {
      console.error('Error downloading all QR codes:', error);
      alert('เกิดข้อผิดพลาดในการดาวน์โหลด QR Codes');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-500 mx-auto"></div>
          <p className="text-pink-600 mt-4 font-kanit text-lg">กำลังตรวจสอบสิทธิ์...</p>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== 'ADMIN') {
    return null;
  }

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
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => router.push('/admin')}
                className="p-2 text-pink-600 hover:text-pink-800 hover:bg-pink-50 rounded-lg transition-colors"
              >
                <FaArrowLeft className="text-xl" />
              </button>
              <div>
                <h1 className="text-4xl font-bold text-gray-900 font-kanit flex items-center">
                  <FaQrcode className="mr-3 text-pink-500" />
                  จัดการ QR Code
                </h1>
                <p className="text-gray-600 font-kanit text-lg font-light">
                  สร้างและดาวน์โหลด QR Code สำหรับครุภัณฑ์
                </p>
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
                    placeholder="ค้นหาครุภัณฑ์..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent font-kanit"
                  />
                </div>

                {/* Category Filter */}
                <select
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 font-kanit"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="all">ทุกหมวดหมู่</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>

                {/* Status Filter */}
                <select
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 font-kanit"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="all">ทุกสถานะ</option>
                  <option value="AVAILABLE">พร้อมใช้งาน</option>
                  <option value="MAINTENANCE">ซ่อมบำรุง</option>
                  <option value="OUT_OF_ORDER">เสียหาย</option>
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={downloadAllQRCodes}
                  disabled={filteredAssets.length === 0 || loading}
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-kanit font-medium py-3 px-6 rounded-lg transition duration-300 flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaDownload />
                  ดาวน์โหลดทั้งหมด ({filteredAssets.length})
                </button>
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-600 font-kanit">
              แสดงผล {filteredAssets.length} รายการจากทั้งหมด {assets.length} รายการ
            </div>
          </div>

          {/* QR Code Table */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-pink-50 to-rose-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-kanit font-bold text-gray-900">QR Code</th>
                    <th className="px-6 py-4 text-left text-sm font-kanit font-bold text-gray-900">รหัสครุภัณฑ์</th>
                    <th className="px-6 py-4 text-left text-sm font-kanit font-bold text-gray-900">ชื่อครุภัณฑ์</th>
                    <th className="px-6 py-4 text-left text-sm font-kanit font-bold text-gray-900">หมวดหมู่</th>
                    <th className="px-6 py-4 text-left text-sm font-kanit font-bold text-gray-900">สถานะ</th>
                    <th className="px-6 py-4 text-center text-sm font-kanit font-bold text-gray-900">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredAssets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="w-16 h-16 bg-white border border-gray-200 rounded-lg flex items-center justify-center">
                          <QRCode
                            value={generateQRUrl(asset.id)}
                            size={60}
                            level="M"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-kanit font-bold text-gray-900">{asset.code}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-kanit font-medium text-gray-900">{asset.name}</p>
                          {asset.description && (
                            <p className="text-xs font-kanit text-gray-500 mt-1">{asset.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-kanit font-medium bg-blue-100 text-blue-800">
                          {asset.category || 'ไม่ระบุ'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-kanit font-medium ${
                          asset.status === 'AVAILABLE' ? 'bg-green-100 text-green-800' :
                          asset.status === 'MAINTENANCE' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {asset.status === 'AVAILABLE' ? 'พร้อมใช้งาน' :
                           asset.status === 'MAINTENANCE' ? 'ซ่อมบำรุง' : 'เสียหาย'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => downloadQRCode(asset)}
                            className="p-2 text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
                            title="ดาวน์โหลด QR Code"
                          >
                            <FaDownload />
                          </button>
                          <a
                            href={generateQRUrl(asset.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="ดูหน้าข้อมูลครุภัณฑ์"
                          >
                            <FaEye />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredAssets.length === 0 && (
                <div className="text-center py-12">
                  <FaQrcode className="mx-auto text-4xl text-gray-300 mb-4" />
                  <p className="text-gray-500 font-kanit">ไม่พบข้อมูลครุภัณฑ์</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </LayoutWrapper>
  );
}