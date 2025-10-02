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

  // Export comprehensive report with QR images
  const exportComprehensiveReport = async () => {
    if (filteredAssets.length === 0) {
      alert('ไม่มีข้อมูลสำหรับส่งออก');
      return;
    }

    try {
      setLoading(true);
      
      // Create ZIP file that contains Excel + all QR images
      const zip = new JSZip();
      
      // 1. Create Excel file
      const workbook = XLSX.utils.book_new();
      
      // Main data sheet
      const mainData: any[] = [];
      mainData.push([
        'รหัสครุภัณฑ์', 'ชื่อครุภัณฑ์', 'รายละเอียด', 'หมวดหมู่', 
        'สถานะ', 'QR Code URL', 'ไฟล์ QR Code', 'วันที่สร้าง'
      ]);

      for (const asset of filteredAssets) {
        const qrUrl = generateQRUrl(asset.id);
        const statusText = asset.status === 'AVAILABLE' ? 'พร้อมใช้งาน' :
                          asset.status === 'MAINTENANCE' ? 'ซ่อมบำรุง' : 'เสียหาย';
        
        mainData.push([
          asset.code,
          asset.name,
          asset.description || '',
          asset.category || 'ไม่ระบุ',
          statusText,
          qrUrl,
          `QR_Images/QR_${asset.code}_${asset.name.replace(/[^a-zA-Z0-9]/g, '_')}.png`,
          new Date(asset.createdAt).toLocaleDateString('th-TH')
        ]);
      }

      const mainSheet = XLSX.utils.aoa_to_sheet(mainData);
      mainSheet['!cols'] = [
        { wch: 15 }, { wch: 25 }, { wch: 30 }, { wch: 15 },
        { wch: 12 }, { wch: 45 }, { wch: 35 }, { wch: 15 }
      ];
      XLSX.utils.book_append_sheet(workbook, mainSheet, 'ข้อมูลครุภัณฑ์');

      // 2. Generate QR codes and add to ZIP
      const qrImagesFolder = zip.folder("QR_Images");
      const printData: any[] = [];
      printData.push(['หน้า', 'ตำแหน่ง', 'รหัส', 'ชื่อครุภัณฑ์', 'ไฟล์รูป']);

      let currentPage = 1;
      let positionOnPage = 1;
      
      for (let i = 0; i < filteredAssets.length; i++) {
        const asset = filteredAssets[i];
        const qrUrl = generateQRUrl(asset.id);
        
        try {
          // Generate QR code
          const qrDataUrl = await QRCodeLib.toDataURL(qrUrl, { 
            width: 300, 
            margin: 2,
            color: { dark: '#000000', light: '#FFFFFF' }
          });
          
          // Create canvas with asset info
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (ctx) {
            canvas.width = 350;
            canvas.height = 420;
            
            // White background
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Border
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);

            const img = new Image();
            await new Promise<void>((resolve) => {
              img.onload = () => {
                // Draw QR code
                ctx.drawImage(img, 25, 25, 300, 300);
                
                // Draw text
                ctx.fillStyle = 'black';
                ctx.textAlign = 'center';
                
                // Asset name (bold, larger)
                ctx.font = 'bold 18px Arial';
                const nameLines = wrapText(ctx, asset.name, canvas.width - 40);
                let yPos = 350;
                nameLines.forEach(line => {
                  ctx.fillText(line, canvas.width / 2, yPos);
                  yPos += 22;
                });
                
                // Asset code
                ctx.font = 'bold 14px Arial';
                ctx.fillText(`รหัส: ${asset.code}`, canvas.width / 2, yPos + 10);
                
                // Category
                ctx.font = '12px Arial';
                ctx.fillText(`หมวดหมู่: ${asset.category || 'ไม่ระบุ'}`, canvas.width / 2, yPos + 30);
                
                resolve();
              };
              img.src = qrDataUrl;
            });

            // Convert to blob and add to ZIP
            const blob = await new Promise<Blob>((resolve) => {
              canvas.toBlob((blob) => {
                if (blob) resolve(blob);
              }, 'image/png', 1.0);
            });

            const fileName = `QR_${asset.code}_${asset.name.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
            qrImagesFolder?.file(fileName, blob);
            
            // Add to print layout data
            printData.push([
              currentPage,
              positionOnPage,
              asset.code,
              asset.name,
              `QR_Images/${fileName}`
            ]);
            
            positionOnPage++;
            if (positionOnPage > 6) { // 6 QR codes per page
              currentPage++;
              positionOnPage = 1;
            }
          }
        } catch (error) {
          console.error(`Error generating QR for ${asset.code}:`, error);
        }
      }

      // 3. Add print layout sheet
      const printSheet = XLSX.utils.aoa_to_sheet(printData);
      printSheet['!cols'] = [{ wch: 8 }, { wch: 10 }, { wch: 15 }, { wch: 30 }, { wch: 40 }];
      XLSX.utils.book_append_sheet(workbook, printSheet, 'รูปแบบการพิมพ์');

      // 4. Add statistics sheet
      const stats = {
        total: filteredAssets.length,
        available: filteredAssets.filter(a => a.status === 'AVAILABLE').length,
        maintenance: filteredAssets.filter(a => a.status === 'MAINTENANCE').length,
        broken: filteredAssets.filter(a => a.status === 'OUT_OF_ORDER').length,
        categories: [...new Set(filteredAssets.map(a => a.category).filter(Boolean))].length,
        pages: Math.ceil(filteredAssets.length / 6)
      };

      const statsData = [
        ['รายงานการจัดการ QR Code ครุภัณฑ์', ''],
        ['', ''],
        ['สถิติทั่วไป', 'จำนวน'],
        ['ครุภัณฑ์ทั้งหมด', stats.total],
        ['- พร้อมใช้งาน', stats.available],
        ['- ซ่อมบำรุง', stats.maintenance],
        ['- เสียหาย', stats.broken],
        ['หมวดหมู่ทั้งหมด', stats.categories],
        ['จำนวนหน้าสำหรับพิมพ์', stats.pages],
        ['', ''],
        ['ข้อมูลการสร้างรายงาน', ''],
        ['วันที่สร้าง', new Date().toLocaleString('th-TH')],
        ['ผู้สร้าง', session?.user?.name || 'ไม่ระบุ'],
        ['จำนวนไฟล์ QR Code', stats.total],
        ['', ''],
        ['คำแนะนำการใช้งาน', ''],
        ['1. ไฟล์ Excel นี้มีข้อมูลครุภัณฑ์ทั้งหมด', ''],
        ['2. โฟลเดอร์ QR_Images มีรูป QR Code ทั้งหมด', ''],
        ['3. ใช้แท็บ "รูปแบบการพิมพ์" สำหรับจัดรูปแบบ', ''],
        ['4. QR Code แต่ละอันสามารถสแกนดูข้อมูลได้', ''],
        ['5. รูป QR Code ขนาด 350x420 พิกเซล เหมาะสำหรับพิมพ์', '']
      ];

      const statsSheet = XLSX.utils.aoa_to_sheet(statsData);
      statsSheet['!cols'] = [{ wch: 45 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(workbook, statsSheet, 'สถิติและคำแนะนำ');

      // 5. Style all sheets
      const headerStyle = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "EC4899" } },
        alignment: { horizontal: "center", vertical: "center" }
      };

      Object.keys(workbook.Sheets).forEach(sheetName => {
        const ws = workbook.Sheets[sheetName];
        if (ws['!ref']) {
          const range = XLSX.utils.decode_range(ws['!ref']);
          for (let col = range.s.c; col <= range.e.c; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
            if (ws[cellAddress]) {
              ws[cellAddress].s = headerStyle;
            }
          }
        }
      });

      // 6. Convert Excel to blob and add to ZIP
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const excelBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      const currentDate = new Date();
      const dateString = currentDate.toISOString().split('T')[0];
      const timeString = currentDate.toTimeString().split(' ')[0].replace(/:/g, '-');
      
      zip.file(`QR_Management_Complete_${dateString}_${timeString}.xlsx`, excelBlob);

      // 7. Add README file
      const readmeContent = `🔖 รายงานการจัดการ QR Code ครุภัณฑ์
=========================================

📅 สร้างเมื่อ: ${new Date().toLocaleString('th-TH')}
👤 ผู้สร้าง: ${session?.user?.name || 'ไม่ระบุ'}
📊 จำนวนครุภัณฑ์: ${stats.total} รายการ

📁 ไฟล์ในแพ็คเกจนี้:
├── QR_Management_Complete_${dateString}_${timeString}.xlsx (ไฟล์ข้อมูลหลัก)
└── QR_Images/ (โฟลเดอร์รูป QR Code)
    ├── QR_[รหัส]_[ชื่อ].png (${stats.total} ไฟล์)

📋 แท็บใน Excel:
• ข้อมูลครุภัณฑ์ - ข้อมูลโดยละเอียดทั้งหมด
• รูปแบบการพิมพ์ - จัดเรียงสำหรับพิมพ์ (6 รายการต่อหน้า)
• สถิติและคำแนะนำ - สรุปข้อมูลและวิธีใช้

🖨️ การพิมพ์ QR Code:
1. เปิดโฟลเดอร์ QR_Images
2. เลือกรูปที่ต้องการพิมพ์
3. ขนาดที่แนะนำ: 5x6 ซม. (2x2.4 นิ้ว)
4. คุณภาพ: 300 DPI ขึ้นไป

📱 การใช้งาน QR Code:
• สแกนด้วยแอปกล้องมือถือ
• จะเปิดหน้าข้อมูลครุภัณฑ์โดยตรง
• ไม่ต้องติดตั้งแอปพิเศษ

⚠️ หมายเหตุ:
• เก็บไฟล์นี้ไว้สำหรับการอ้างอิง
• สำรองข้อมูลเป็นประจำ
• ตรวจสอบการทำงานของ QR Code ก่อนนำไปใช้

📞 ติดต่อสอบถาม: ฝ่ายไอที
`;

      zip.file("📖_คำแนะนำการใช้งาน.txt", readmeContent);

      // 8. Generate and download ZIP
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipFileName = `QR_Management_Complete_Package_${dateString}_${timeString}.zip`;
      saveAs(zipBlob, zipFileName);

      alert(`🎉 สร้างแพ็คเกจสมบูรณ์เรียบร้อย!\n\n📦 ไฟล์: ${zipFileName}\n📊 ครุภัณฑ์: ${stats.total} รายการ\n🖼️ QR Code: ${stats.total} รูป\n📄 หน้าพิมพ์: ${stats.pages} หน้า\n\n💡 แพ็คเกจประกอบด้วย:\n• ไฟล์ Excel ข้อมูลครบถ้วน\n• รูป QR Code ทุกรายการ\n• คำแนะนำการใช้งาน`);

    } catch (error) {
      console.error('Error creating comprehensive report:', error);
      alert('❌ เกิดข้อผิดพลาดในการสร้างรายงาน\nกรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to wrap text
  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + " " + word).width;
      if (width < maxWidth) {
        currentLine += " " + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
    return lines;
  };

  // Export to Excel with embedded QR Code images
  const exportToExcel = async () => {
    if (filteredAssets.length === 0) {
      alert('ไม่มีข้อมูลสำหรับส่งออก');
      return;
    }

    try {
      setLoading(true);
      
      // Create workbook
      const workbook = XLSX.utils.book_new();
      
      // First Sheet: Asset Data with QR Images
      const mainData: any[] = [];
      mainData.push([
        'QR Code',
        'รหัสครุภัณฑ์',
        'ชื่อครุภัณฑ์', 
        'รายละเอียด',
        'หมวดหมู่',
        'สถานะ',
        'วันที่สร้าง'
      ]);

      // Generate QR codes and create data
      for (let i = 0; i < filteredAssets.length; i++) {
        const asset = filteredAssets[i];
        const qrUrl = generateQRUrl(asset.id);
        const statusText = asset.status === 'AVAILABLE' ? 'พร้อมใช้งาน' :
                          asset.status === 'MAINTENANCE' ? 'ซ่อมบำรุง' : 'เสียหาย';
        
        try {
          // Generate QR code as base64
          const qrDataUrl = await QRCodeLib.toDataURL(qrUrl, { 
            width: 150, 
            margin: 1,
            color: { dark: '#000000', light: '#FFFFFF' }
          });
          
          // Add row with base64 image data
          mainData.push([
            qrDataUrl, // Base64 image data
            asset.code,
            asset.name,
            asset.description || '',
            asset.category || 'ไม่ระบุ',
            statusText,
            new Date(asset.createdAt).toLocaleDateString('th-TH')
          ]);
        } catch (error) {
          console.error(`Error generating QR for ${asset.code}:`, error);
          mainData.push([
            'Error generating QR',
            asset.code,
            asset.name,
            asset.description || '',
            asset.category || 'ไม่ระบุ',
            statusText,
            new Date(asset.createdAt).toLocaleDateString('th-TH')
          ]);
        }
      }

      const mainSheet = XLSX.utils.aoa_to_sheet(mainData);
      
      // Set column widths and row heights
      mainSheet['!cols'] = [
        { wch: 20 }, // QR Code column (wider for image)
        { wch: 15 }, // รหัสครุภัณฑ์
        { wch: 25 }, // ชื่อครุภัณฑ์
        { wch: 30 }, // รายละเอียด
        { wch: 15 }, // หมวดหมู่
        { wch: 12 }, // สถานะ
        { wch: 15 }  // วันที่สร้าง
      ];

      // Set row heights for QR codes
      const rowHeights: any[] = [{ hpt: 25 }]; // Header row
      for (let i = 1; i <= filteredAssets.length; i++) {
        rowHeights.push({ hpt: 120 }); // QR code rows (120 points ≈ 160px)
      }
      mainSheet['!rows'] = rowHeights;

      XLSX.utils.book_append_sheet(workbook, mainSheet, 'QR Codes & ข้อมูล');

      // Second Sheet: Print Layout (3x2 per page)
      const printData: any[] = [];
      printData.push(['หน้าที่', 'ตำแหน่ง', 'QR Code', 'รหัส', 'ชื่อครุภัณฑ์', 'หมวดหมู่']);

      let currentPage = 1;
      let positionOnPage = 1;
      
      for (let i = 0; i < filteredAssets.length; i++) {
        const asset = filteredAssets[i];
        const qrUrl = generateQRUrl(asset.id);
        
        try {
          // Generate larger QR code for printing
          const qrDataUrl = await QRCodeLib.toDataURL(qrUrl, { 
            width: 200, 
            margin: 2,
            color: { dark: '#000000', light: '#FFFFFF' }
          });
          
          printData.push([
            currentPage,
            positionOnPage,
            qrDataUrl,
            asset.code,
            asset.name,
            asset.category || 'ไม่ระบุ'
          ]);
          
          positionOnPage++;
          if (positionOnPage > 6) { // 6 QR codes per page (3x2)
            currentPage++;
            positionOnPage = 1;
          }
        } catch (error) {
          console.error(`Error generating print QR for ${asset.code}:`, error);
          printData.push([
            currentPage,
            positionOnPage,
            'Error',
            asset.code,
            asset.name,
            asset.category || 'ไม่ระบุ'
          ]);
        }
      }

      const printSheet = XLSX.utils.aoa_to_sheet(printData);
      printSheet['!cols'] = [
        { wch: 8 },  // หน้าที่
        { wch: 10 }, // ตำแหน่ง
        { wch: 25 }, // QR Code (image)
        { wch: 15 }, // รหัส
        { wch: 25 }, // ชื่อครุภัณฑ์
        { wch: 15 }  // หมวดหมู่
      ];

      // Set row heights for print layout
      const printRowHeights: any[] = [{ hpt: 25 }]; // Header
      for (let i = 1; i <= printData.length - 1; i++) {
        printRowHeights.push({ hpt: 150 }); // Print QR rows
      }
      printSheet['!rows'] = printRowHeights;

      XLSX.utils.book_append_sheet(workbook, printSheet, 'รูปแบบพิมพ์');

      // Third Sheet: URL References
      const urlData: any[] = [];
      urlData.push(['รหัส', 'ชื่อครุภัณฑ์', 'QR Code URL', 'หมายเหตุ']);

      for (const asset of filteredAssets) {
        const qrUrl = generateQRUrl(asset.id);
        urlData.push([
          asset.code,
          asset.name,
          qrUrl,
          'สแกน QR Code เพื่อดูข้อมูลครุภัณฑ์'
        ]);
      }

      const urlSheet = XLSX.utils.aoa_to_sheet(urlData);
      urlSheet['!cols'] = [
        { wch: 15 }, { wch: 30 }, { wch: 50 }, { wch: 30 }
      ];

      XLSX.utils.book_append_sheet(workbook, urlSheet, 'URL References');

      // Fourth Sheet: Statistics
      const stats = {
        totalAssets: filteredAssets.length,
        availableAssets: filteredAssets.filter(a => a.status === 'AVAILABLE').length,
        maintenanceAssets: filteredAssets.filter(a => a.status === 'MAINTENANCE').length,
        brokenAssets: filteredAssets.filter(a => a.status === 'OUT_OF_ORDER').length,
        categories: [...new Set(filteredAssets.map(a => a.category).filter(Boolean))].length,
        pages: Math.ceil(filteredAssets.length / 6)
      };

      const statsData = [
        ['รายงาน QR Code ครุภัณฑ์', ''],
        ['สร้างเมื่อ: ' + new Date().toLocaleString('th-TH'), ''],
        ['ผู้สร้าง: ' + (session?.user?.name || 'ไม่ระบุ'), ''],
        ['', ''],
        ['สถิติทั่วไป', 'จำนวน'],
        ['ครุภัณฑ์ทั้งหมด', stats.totalAssets],
        ['- พร้อมใช้งาน', stats.availableAssets],
        ['- ซ่อมบำรุง', stats.maintenanceAssets], 
        ['- เสียหาย', stats.brokenAssets],
        ['หมวดหมู่ทั้งหมด', stats.categories],
        ['หน้าสำหรับพิมพ์', stats.pages],
        ['', ''],
        ['คำแนะนำการใช้งาน', ''],
        ['1. แท็บ "QR Codes & ข้อมูล" - ดูข้อมูลพร้อมรูป QR', ''],
        ['2. แท็บ "รูปแบบพิมพ์" - จัดเรียงสำหรับพิมพ์', ''],
        ['3. แท็บ "URL References" - ลิงก์สำหรับอ้างอิง', ''],
        ['4. รูป QR Code แสดงในเซลล์โดยตรง', ''],
        ['5. สามารถปรับขนาดรูปได้ใน Excel', '']
      ];

      const statsSheet = XLSX.utils.aoa_to_sheet(statsData);
      statsSheet['!cols'] = [{ wch: 40 }, { wch: 20 }];

      XLSX.utils.book_append_sheet(workbook, statsSheet, 'สถิติและคำแนะนำ');

      // Style headers for all sheets
      const headerStyle = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "EC4899" } },
        alignment: { horizontal: "center", vertical: "center" }
      };

      // Apply header styling to all sheets
      const sheets = ['QR Codes & ข้อมูล', 'รูปแบบพิมพ์', 'URL References', 'สถิติและคำแนะนำ'];
      sheets.forEach(sheetName => {
        const ws = workbook.Sheets[sheetName];
        if (ws && ws['!ref']) {
          const range = XLSX.utils.decode_range(ws['!ref']);
          for (let col = range.s.c; col <= range.e.c; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
            if (ws[cellAddress]) {
              ws[cellAddress].s = headerStyle;
            }
          }
        }
      });

      // Generate filename
      const currentDate = new Date();
      const dateString = currentDate.toISOString().split('T')[0];
      const timeString = currentDate.toTimeString().split(' ')[0].replace(/:/g, '-');
      const filename = `QR_Codes_Images_${dateString}_${timeString}.xlsx`;

      // Write file
      XLSX.writeFile(workbook, filename);
      
      alert(`🎉 ส่งออก Excel พร้อมรูป QR Code เรียบร้อย!\n\n📊 รายการ: ${stats.totalAssets} QR Codes\n📁 ไฟล์: ${filename}\n� หน้าพิมพ์: ${stats.pages} หน้า\n\n✨ ฟีเจอร์พิเศษ:\n• รูป QR Code แสดงในเซลล์โดยตรง\n• จัดเรียงสำหรับพิมพ์ 6 รายการต่อหน้า\n• ข้อมูลครบถ้วนทุกรายการ\n• สามารถปรับขนาดรูปใน Excel ได้`);
      
    } catch (error) {
      console.error('Error exporting Excel with images:', error);
      alert('❌ เกิดข้อผิดพลาดในการส่งออกข้อมูล\nกรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
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
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent font-kanit text-gray-900"
                  />
                </div>

                {/* Category Filter */}
                <select
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 font-kanit text-gray-900"
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
                  onClick={exportComprehensiveReport}
                  disabled={filteredAssets.length === 0 || loading}
                  className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-kanit font-medium py-3 px-6 rounded-lg transition duration-300 flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaFileExcel />
                  {loading ? 'กำลังสร้าง...' : `แพ็คเกจ ZIP+Excel (${filteredAssets.length})`}
                </button>
                <button
                  onClick={exportToExcel}
                  disabled={filteredAssets.length === 0 || loading}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-kanit font-medium py-3 px-6 rounded-lg transition duration-300 flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaFileExcel />
                  {loading ? 'กำลังสร้าง...' : `Excel+รูป QR (${filteredAssets.length})`}
                </button>
                <button
                  onClick={downloadAllQRCodes}
                  disabled={filteredAssets.length === 0 || loading}
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-kanit font-medium py-3 px-6 rounded-lg transition duration-300 flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaDownload />
                  ZIP รูปภาพอย่างเดียว
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="text-sm text-gray-600 font-kanit">
                แสดงผล {filteredAssets.length} รายการจากทั้งหมด {assets.length} รายการ
              </div>
              <div className="text-xs text-gray-500 font-kanit">
                💜 แพ็คเกจ ZIP+Excel: ZIP ไฟล์ที่มี Excel + รูป QR แยกไฟล์ | 
                💚 Excel+รูป QR: รูป QR ฝังใน Excel โดยตรง | 
                🟢 ZIP รูปภาพ: เฉพาะไฟล์รูป PNG
              </div>
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