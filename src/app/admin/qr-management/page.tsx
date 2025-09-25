'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import LoadingSpinner from '@/components/LoadingSpinner';
import { FaBars, FaDownload, FaQrcode, FaSearch, FaFilter, FaEye, FaPrint } from 'react-icons/fa';
import QRCode from 'react-qr-code';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import * as QRCodeLib from 'qrcode';

type Asset = {
  id: string;
  code: string;
  name: string;
  category?: string;
  status: string;
  description?: string;
  createdAt: string;
};

export default function QRManagementPage() {
  const { data: session, status } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [categories, setCategories] = useState<string[]>([]);

  // Authentication check
  if (status === 'loading') {
    return <LoadingSpinner fullScreen color="pink" text="กำลังตรวจสอบสิทธิ์..." size="xl" />;
  }

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/dashboard');
    return null;
  }

  // Fetch assets data
  useEffect(() => {
    const fetchAssets = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/assets');
        if (response.ok) {
          const data = await response.json();
          setAssets(data.data || []);
          
          // Extract unique categories
          const uniqueCategories = [...new Set(data.data?.map((asset: Asset) => asset.category).filter(Boolean))] as string[];
          setCategories(uniqueCategories);
        } else {
          throw new Error('Failed to fetch assets');
        }
      } catch (error) {
        console.error('Error fetching assets:', error);
        setError('ไม่สามารถโหลดข้อมูลได้');
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, []);

  // Filter assets
  useEffect(() => {
    let filtered = assets;

    if (searchTerm) {
      filtered = filtered.filter(asset => 
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.description?.toLowerCase().includes(searchTerm.toLowerCase())
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

  // Download single QR Code as PNG
  const downloadQRCode = async (asset: Asset) => {
    try {
      const qrUrl = generateQRUrl(asset.id);
      
      // Create canvas element
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size
      canvas.width = 300;
      canvas.height = 350; // Extra space for text

      // Fill white background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Create QR code SVG
      const qrSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      qrSvg.setAttribute('width', '250');
      qrSvg.setAttribute('height', '250');
      
      const qrCodeElement = document.createElement('div');
      qrCodeElement.style.position = 'absolute';
      qrCodeElement.style.left = '-9999px';
      document.body.appendChild(qrCodeElement);

      // Generate QR code and convert to image
      const qrDataUrl = await QRCodeLib.toDataURL(qrUrl, { width: 250, margin: 2 });
      
      const img = new Image();
      img.onload = () => {
        // Draw QR code
        ctx.drawImage(img, 25, 25, 250, 250);
        
        // Add text labels
        ctx.fillStyle = 'black';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        
        // Asset name
        ctx.fillText(asset.name, canvas.width / 2, 295);
        
        // Asset code
        ctx.font = '14px Arial';
        ctx.fillText(`รหัส: ${asset.code}`, canvas.width / 2, 315);
        
        // Convert canvas to blob and download
        canvas.toBlob((blob) => {
          if (blob) {
            saveAs(blob, `QR_${asset.code}_${asset.name}.png`);
          }
        });
      };
      img.src = qrDataUrl;
      
      document.body.removeChild(qrCodeElement);
    } catch (error) {
      console.error('Error downloading QR code:', error);
      alert('เกิดข้อผิดพลาดในการดาวน์โหลด QR Code');
    }
  };

  // Download all filtered QR Codes as ZIP
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
        
        // Create canvas for each QR code
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;

        canvas.width = 300;
        canvas.height = 350;

        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Generate QR code
        const qrDataUrl = await QRCodeLib.toDataURL(qrUrl, { width: 250, margin: 2 });
        
        await new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            // Draw QR code
            ctx.drawImage(img, 25, 25, 250, 250);
            
            // Add labels
            ctx.fillStyle = 'black';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(asset.name, canvas.width / 2, 295);
            
            ctx.font = '14px Arial';
            ctx.fillText(`รหัส: ${asset.code}`, canvas.width / 2, 315);
            
            // Add to ZIP
            canvas.toBlob((blob) => {
              if (blob) {
                zip.file(`QR_${asset.code}_${asset.name}.png`, blob);
              }
              resolve(null);
            });
          };
          img.src = qrDataUrl;
        });
      }

      // Generate and download ZIP
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `QR_Codes_${new Date().toISOString().split('T')[0]}.zip`);
      
    } catch (error) {
      console.error('Error downloading all QR codes:', error);
      alert('เกิดข้อผิดพลาดในการดาวน์โหลด QR Codes');
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-rose-50">
        <div className="text-center">
          <p className="text-red-600 font-kanit text-lg">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600"
          >
            ลองใหม่อีกครั้ง
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <div className={`transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : ''}`}>
        {/* Mobile hamburger menu */}
        <div className="md:hidden p-4 bg-white shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex items-center gap-2 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FaBars className="text-xl" />
            <span className="font-kanit font-medium">เมนู</span>
          </button>
        </div>

        <div className="p-6">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl flex items-center justify-center">
                  <FaQrcode className="text-white text-xl" />
                </div>
                <div>
                  <h1 className="text-2xl font-kanit font-bold text-gray-900">จัดการ QR Code</h1>
                  <p className="text-gray-600 font-kanit">สร้างและดาวน์โหลด QR Code สำหรับครุภัณฑ์</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={downloadAllQRCodes}
                  disabled={filteredAssets.length === 0 || loading}
                  className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-2 rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-kanit font-medium"
                >
                  <FaDownload className="text-sm" />
                  ดาวน์โหลดทั้งหมด ({filteredAssets.length})
                </button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="ค้นหาครุภัณฑ์..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 font-kanit"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 font-kanit"
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

              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 font-kanit"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">ทุกสถานะ</option>
                <option value="AVAILABLE">พร้อมใช้งาน</option>
                <option value="MAINTENANCE">ซ่อมบำรุง</option>
                <option value="OUT_OF_ORDER">เสียหาย</option>
              </select>

              <div className="text-sm text-gray-600 font-kanit flex items-center">
                <FaFilter className="mr-2" />
                ทั้งหมด: {filteredAssets.length} รายการ
              </div>
            </div>
          </div>

          {/* QR Code Table */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" color="pink" text="กำลังโหลดข้อมูล..." />
              </div>
            ) : (
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

                {filteredAssets.length === 0 && !loading && (
                  <div className="text-center py-12">
                    <FaQrcode className="mx-auto text-4xl text-gray-300 mb-4" />
                    <p className="text-gray-500 font-kanit">ไม่พบข้อมูลครุภัณฑ์</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}