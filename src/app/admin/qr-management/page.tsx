'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useRouter } from 'next/navigation';
import LayoutWrapper from '@/components/LayoutWrapper';
import { FaDownload, FaQrcode, FaSearch, FaEye, FaArrowLeft, FaFileExcel } from 'react-icons/fa';
import QRCode from 'react-qr-code';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import * as QRCodeLib from 'qrcode';
import * as XLSX from 'xlsx';

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

  const categories = [...new Set(assets.map(asset => asset.category).filter(Boolean))];

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'ADMIN') {
      redirect('/login');
      return;
    }
    fetchAssets();
  }, [session, status]);

  useEffect(() => {
    filterAssets();
  }, [assets, searchTerm, selectedCategory, selectedStatus]);

  const fetchAssets = async () => {
    try {
      const response = await fetch('/api/assets');
      if (response.ok) {
        const data = await response.json();
        setAssets(data);
      }
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAssets = () => {
    let filtered = assets;

    if (searchTerm) {
      filtered = filtered.filter(asset =>
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (asset.description && asset.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(asset => asset.category === selectedCategory);
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(asset => asset.status === selectedStatus);
    }

    setFilteredAssets(filtered);
  };

  const generateQRUrl = (assetId: string) => {
    return `${window.location.origin}/public/asset/${assetId}`;
  };

  const downloadQRCode = async (asset: Asset) => {
    try {
      const url = generateQRUrl(asset.id);
      
      // สร้าง canvas ขนาดใหญ่สำหรับ QR + ข้อความ
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      canvas.width = 300;
      canvas.height = 350;
      
      // วาดพื้นหลังสีขาว
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // สร้าง QR Code
      const qrCanvas = await QRCodeLib.toCanvas(url, { width: 200, margin: 1 });
      
      // วาง QR Code ตรงกลาง (ด้านบน)
      const qrX = (canvas.width - 200) / 2;
      ctx.drawImage(qrCanvas, qrX, 20, 200, 200);
      
      // เพิ่มข้อความ
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';
      
      // ข้อความอธิบายภาษาไทย
      ctx.font = '14px Arial';
      const thaiText = 'สแกนเพื่อดูรายละเอียดครุภัณฑ์';
      ctx.fillText(thaiText, canvas.width / 2, 250);
      
      // ชื่อครุภัณฑ์
      ctx.font = 'bold 16px Arial';
      const maxWidth = 280;
      const assetName = `${asset.code} - ${asset.name}`;
      
      if (ctx.measureText(assetName).width > maxWidth) {
        // ถ้าข้อความยาวเกินไป ให้ตัดและขึ้นบรรทัดใหม่
        const words = assetName.split(' ');
        let line = '';
        let y = 280;
        
        for (let i = 0; i < words.length; i++) {
          const testLine = line + words[i] + ' ';
          if (ctx.measureText(testLine).width > maxWidth && i > 0) {
            ctx.fillText(line, canvas.width / 2, y);
            line = words[i] + ' ';
            y += 25;
            if (y > 330) break; // จำกัดไม่เกิน 3 บรรทัด
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, canvas.width / 2, y);
      } else {
        ctx.fillText(assetName, canvas.width / 2, 280);
      }
      
      canvas.toBlob((blob) => {
        if (blob) {
          saveAs(blob, `QR_${asset.code}_${asset.name.substring(0, 15).replace(/[^a-zA-Z0-9ก-๙]/g, '_')}.png`);
        }
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const exportToExcel = async () => {
    if (filteredAssets.length === 0) {
      alert('ไม่มีข้อมูลสำหรับส่งออก');
      return;
    }

    try {
      setLoading(true);
      
      const workbook = XLSX.utils.book_new();
      const mainData: any[] = [];
      mainData.push([
        'QR Code URL',
        'รหัสครุภัณฑ์',
        'ชื่อครุภัณฑ์', 
        'รายละเอียด',
        'หมวดหมู่',
        'สถานะ',
        'วันที่สร้าง',
        'หมายเหตุ'
      ]);

      for (const asset of filteredAssets) {
        const qrUrl = generateQRUrl(asset.id);
        const statusText = asset.status === 'AVAILABLE' ? 'พร้อมใช้งาน' :
                          asset.status === 'MAINTENANCE' ? 'ซ่อมบำรุง' : 'เสียหาย';
        
        mainData.push([
          qrUrl,
          asset.code,
          asset.name,
          asset.description || '',
          asset.category || 'ไม่ระบุ',
          statusText,
          new Date(asset.createdAt).toLocaleDateString('th-TH'),
          'สแกน QR Code เพื่อดูข้อมูลครุภัณฑ์'
        ]);
      }

      const mainSheet = XLSX.utils.aoa_to_sheet(mainData);
      mainSheet['!cols'] = [
        { wch: 50 }, { wch: 15 }, { wch: 25 }, { wch: 30 }, 
        { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 30 }
      ];

      XLSX.utils.book_append_sheet(workbook, mainSheet, 'QR Codes & ข้อมูล');

      const filename = `QR_Codes_Excel_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, filename);
      
      alert('📊 ส่งออก Excel เรียบร้อย! ' + filename + ' (' + filteredAssets.length + ' QR Codes)');
      
    } catch (error) {
      console.error('Error exporting Excel:', error);
      alert('❌ เกิดข้อผิดพลาดในการส่งออกข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const downloadAllQRCodes = async () => {
    if (filteredAssets.length === 0) {
      alert('ไม่มีข้อมูลสำหรับดาวน์โหลด');
      return;
    }

    try {
      setLoading(true);
      const zip = new JSZip();

      for (const asset of filteredAssets) {
        try {
          const url = generateQRUrl(asset.id);
          
          // สร้าง canvas สำหรับ QR + ข้อความ
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) continue;
          
          canvas.width = 300;
          canvas.height = 350;
          
          // วาดพื้นหลังสีขาว
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // สร้าง QR Code
          const qrCanvas = await QRCodeLib.toCanvas(url, { width: 200, margin: 1 });
          
          // วาง QR Code ตรงกลาง (ด้านบน)
          const qrX = (canvas.width - 200) / 2;
          ctx.drawImage(qrCanvas, qrX, 20, 200, 200);
          
          // เพิ่มข้อความ
          ctx.fillStyle = '#000000';
          ctx.textAlign = 'center';
          
          // ข้อความอธิบายภาษาไทย
          ctx.font = '14px Arial';
          const thaiText = 'สแกนเพื่อดูรายละเอียดครุภัณฑ์';
          ctx.fillText(thaiText, canvas.width / 2, 250);
          
          // ชื่อครุภัณฑ์
          ctx.font = 'bold 16px Arial';
          const maxWidth = 280;
          const assetName = `${asset.code} - ${asset.name}`;
          
          if (ctx.measureText(assetName).width > maxWidth) {
            // ถ้าข้อความยาวเกินไป ให้ตัดและขึ้นบรรทัดใหม่
            const words = assetName.split(' ');
            let line = '';
            let y = 280;
            
            for (let i = 0; i < words.length; i++) {
              const testLine = line + words[i] + ' ';
              if (ctx.measureText(testLine).width > maxWidth && i > 0) {
                ctx.fillText(line, canvas.width / 2, y);
                line = words[i] + ' ';
                y += 25;
                if (y > 330) break; // จำกัดไม่เกิน 3 บรรทัด
              } else {
                line = testLine;
              }
            }
            ctx.fillText(line, canvas.width / 2, y);
          } else {
            ctx.fillText(assetName, canvas.width / 2, 280);
          }
          
          // แปลงเป็น base64 และเพิ่มลง ZIP
          const dataUrl = canvas.toDataURL('image/png');
          const base64Data = dataUrl.split(',')[1];
          const filename = `QR_${asset.code}_${asset.name.substring(0, 15).replace(/[^a-zA-Z0-9ก-๙]/g, '_')}.png`;
          zip.file(filename, base64Data, { base64: true });
        } catch (error) {
          console.error(`Error generating QR for ${asset.code}:`, error);
        }
      }

      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `QR_Codes_Clean_${new Date().toISOString().split('T')[0]}.zip`);
      alert(`🎉 ดาวน์โหลด ZIP เรียบร้อย! (${filteredAssets.length} ไฟล์ QR แบบสะอาด)`);
    } catch (error) {
      console.error('Error creating ZIP file:', error);
      alert('❌ เกิดข้อผิดพลาดในการสร้างไฟล์ ZIP');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || !session || session.user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-500 mx-auto"></div>
          <p className="text-pink-600 mt-4 font-kanit text-lg">กำลังโหลด...</p>
        </div>
      </div>
    );
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

          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative flex-1">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="ค้นหาครุภัณฑ์..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent font-kanit text-gray-900"
                  />
                </div>

                <select
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 font-kanit text-gray-900"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="all">ทุกหมวดหมู่</option>
                  {categories.map((category) => (
                    <option key={category} value={category || ''}>
                      {category}
                    </option>
                  ))}
                </select>

                <select
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 font-kanit text-gray-900"
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
                  onClick={exportToExcel}
                  disabled={filteredAssets.length === 0 || loading}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-kanit font-medium py-3 px-6 rounded-lg transition duration-300 flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaFileExcel />
                  {loading ? 'กำลังสร้าง...' : `Excel+ลิงก์ QR (${filteredAssets.length})`}
                </button>
                <button
                  onClick={downloadAllQRCodes}
                  disabled={filteredAssets.length === 0 || loading}
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-kanit font-medium py-3 px-6 rounded-lg transition duration-300 flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaDownload />
                  ZIP QR สะอาด
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="text-sm text-gray-600 font-kanit">
                แสดงผล {filteredAssets.length} รายการจากทั้งหมด {assets.length} รายการ
              </div>
              <div className="text-xs text-gray-500 font-kanit">
                💚 Excel+ลิงก์ QR: Excel พร้อมลิงก์ QR Code |
                🟢 ZIP QR สะอาด: QR Code แบบสะอาด (ไม่มี URL)
              </div>
            </div>
          </div>

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
                        <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
                          <div className="w-16 h-16 mx-auto mb-2 flex items-center justify-center">
                            <QRCode
                              value={generateQRUrl(asset.id)}
                              size={60}
                              level="M"
                            />
                          </div>
                          <div className="text-xs font-kanit text-gray-700 font-medium truncate">
                            {asset.code}
                          </div>
                          <div className="text-xs font-kanit text-gray-600 truncate mt-1">
                            {asset.name.length > 20 ? asset.name.substring(0, 20) + '...' : asset.name}
                          </div>
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