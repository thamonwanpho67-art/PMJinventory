'use client';'use client';



import { useState, useEffect } from 'react';import { useState, useEffect } from 'react';

import { useSession } from 'next-auth/react';import { useSession } from 'next-auth/react';

import { redirect } from 'next/navigation';import { redirect } from 'next/navigation';

import { useRouter } from 'next/navigation';import { useRouter } from 'next/navigation';

import LayoutWrapper from '@/components/LayoutWrapper';import LayoutWrapper from '@/components/LayoutWrapper';

import { FaDownload, FaQrcode, FaSearch, FaEye, FaArrowLeft, FaFileExcel } from 'react-icons/fa';import { FaDownload, FaQrcode, FaSearch, FaEye, FaArrowLeft, FaFileExcel } from 'react-icons/fa';

import QRCode from 'react-qr-code';import QRCode from 'react-qr-code';

import { saveAs } from 'file-saver';import { saveAs } from 'file-saver';

import JSZip from 'jszip';import JSZip from 'jszip';

import * as QRCodeLib from 'qrcode';import * as QRCodeLib from 'qrcode';

import * as XLSX from 'xlsx';import * as XLSX from 'xlsx';

import ExcelJS from 'exceljs';import ExcelJS from 'exceljs';



interface Asset {interface Asset {

  id: string;  id: string;

  code: string;  code: string;

  name: string;  name: string;

  description: string | null;  description: string | null;

  category: string | null;  category: string | null;

  status: string;  status: string;

  createdAt: string;  createdAt: string;

}}



export default function QRManagementPage() {export default function QRManagementPage() {

  const router = useRouter();  const router = useRouter();

  const { data: session, status } = useSession();  const { data: session, status } = useSession();

  const [assets, setAssets] = useState<Asset[]>([]);  const [assets, setAssets] = useState<Asset[]>([]);

  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);

  const [loading, setLoading] = useState(true);  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');  const [searchTerm, setSearchTerm] = useState('');

  const [selectedCategory, setSelectedCategory] = useState('all');  const [selectedCategory, setSelectedCategory] = useState('all');

  const [selectedStatus, setSelectedStatus] = useState('all');  const [selectedStatus, setSelectedStatus] = useState('all');

  const [categories, setCategories] = useState<string[]>([]);

  // Get unique categories

  const categories = [...new Set(assets.map(asset => asset.category).filter(Boolean))];  // Authentication check

  useEffect(() => {

  useEffect(() => {    if (status === 'loading') return;

    if (status === 'loading') return;    

    if (!session || session.user.role !== 'ADMIN') {    if (!session || session.user.role !== 'ADMIN') {

      redirect('/login');      redirect('/admin');

      return;      return;

    }    }

    fetchAssets();  }, [session, status]);

  }, [session, status]);

  // Fetch assets data

  useEffect(() => {  useEffect(() => {

    filterAssets();    if (status === 'loading' || !session || session.user.role !== 'ADMIN') return;

  }, [assets, searchTerm, selectedCategory, selectedStatus]);    

    const fetchAssets = async () => {

  const fetchAssets = async () => {      try {

    try {        setLoading(true);

      const response = await fetch('/api/assets');        const response = await fetch('/api/assets');

      if (response.ok) {        if (response.ok) {

        const data = await response.json();          const data = await response.json();

        setAssets(data);          setAssets(data);

      }          

    } catch (error) {          const uniqueCategories = [...new Set(data?.map((asset: Asset) => asset.category).filter(Boolean))] as string[];

      console.error('Error fetching assets:', error);          setCategories(uniqueCategories);

    } finally {        }

      setLoading(false);      } catch (error) {

    }        console.error('Error fetching assets:', error);

  };      } finally {

        setLoading(false);

  const filterAssets = () => {      }

    let filtered = assets;    };



    if (searchTerm) {    fetchAssets();

      filtered = filtered.filter(asset =>  }, [session, status]);

        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||

        asset.code.toLowerCase().includes(searchTerm.toLowerCase()) ||  // Filter assets

        (asset.description && asset.description.toLowerCase().includes(searchTerm.toLowerCase()))  useEffect(() => {

      );    let filtered = assets;

    }

    if (searchTerm) {

    if (selectedCategory !== 'all') {      filtered = filtered.filter(asset => 

      filtered = filtered.filter(asset => asset.category === selectedCategory);        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||

    }        asset.code.toLowerCase().includes(searchTerm.toLowerCase())

      );

    if (selectedStatus !== 'all') {    }

      filtered = filtered.filter(asset => asset.status === selectedStatus);

    }    if (selectedCategory !== 'all') {

      filtered = filtered.filter(asset => asset.category === selectedCategory);

    setFilteredAssets(filtered);    }

  };

    if (selectedStatus !== 'all') {

  const generateQRUrl = (assetId: string) => {      filtered = filtered.filter(asset => asset.status === selectedStatus);

    return `${window.location.origin}/public/asset/${assetId}`;    }

  };

    setFilteredAssets(filtered);

  const downloadQRCode = async (asset: Asset) => {  }, [assets, searchTerm, selectedCategory, selectedStatus]);

    try {

      const url = generateQRUrl(asset.id);  // Generate QR Code URL

      const canvas = await QRCodeLib.toCanvas(url, { width: 256 });  const generateQRUrl = (assetId: string) => {

      canvas.toBlob((blob) => {    return `${window.location.origin}/public/asset/${assetId}`;

        if (blob) {  };

          saveAs(blob, `QR_${asset.code}.png`);

        }  // Download single QR Code

      });  const downloadQRCode = async (asset: Asset) => {

    } catch (error) {    try {

      console.error('Error generating QR code:', error);      const qrUrl = generateQRUrl(asset.id);

    }      const qrDataUrl = await QRCodeLib.toDataURL(qrUrl, { width: 250, margin: 2 });

  };      

      const canvas = document.createElement('canvas');

  // Export to Excel with embedded QR Code images using ExcelJS      const ctx = canvas.getContext('2d');

  const exportToExcel = async () => {      if (!ctx) return;

    if (filteredAssets.length === 0) {

      alert('ไม่มีข้อมูลสำหรับส่งออก');      canvas.width = 300;

      return;      canvas.height = 350;

    }      ctx.fillStyle = 'white';

      ctx.fillRect(0, 0, canvas.width, canvas.height);

    try {

      setLoading(true);      const img = new Image();

            img.onload = () => {

      // Create workbook with ExcelJS        ctx.drawImage(img, 25, 25, 250, 250);

      const workbook = new ExcelJS.Workbook();        ctx.fillStyle = 'black';

      workbook.creator = session?.user?.name || 'QR Management System';        ctx.font = 'bold 16px Arial';

      workbook.created = new Date();        ctx.textAlign = 'center';

              ctx.fillText(asset.name, canvas.width / 2, 295);

      // Main sheet with QR images        ctx.font = '14px Arial';

      const mainSheet = workbook.addWorksheet('QR Codes & ข้อมูล');        ctx.fillText(`รหัส: ${asset.code}`, canvas.width / 2, 315);

              

      // Add header row        canvas.toBlob((blob) => {

      const headerRow = mainSheet.addRow([          if (blob) {

        'QR Code',            saveAs(blob, `QR_${asset.code}_${asset.name}.png`);

        'รหัสครุภัณฑ์',           }

        'ชื่อครุภัณฑ์',        });

        'รายละเอียด',      };

        'หมวดหมู่',      img.src = qrDataUrl;

        'สถานะ',    } catch (error) {

        'วันที่สร้าง'      console.error('Error downloading QR code:', error);

      ]);      alert('เกิดข้อผิดพลาดในการดาวน์โหลด QR Code');

          }

      // Style header  };

      headerRow.eachCell((cell) => {

        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };  // Export comprehensive report with QR images

        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEC4899' } };  const exportComprehensiveReport = async () => {

        cell.alignment = { horizontal: 'center', vertical: 'middle' };    if (filteredAssets.length === 0) {

        cell.border = {      alert('ไม่มีข้อมูลสำหรับส่งออก');

          top: { style: 'thin' }, left: { style: 'thin' },      return;

          bottom: { style: 'thin' }, right: { style: 'thin' }    }

        };

      });    try {

            setLoading(true);

      // Set column widths      

      mainSheet.columns = [      // Create ZIP file that contains Excel + all QR images

        { width: 20 }, // QR Code      const zip = new JSZip();

        { width: 15 }, // รหัส      

        { width: 25 }, // ชื่อ      // 1. Create Excel file

        { width: 30 }, // รายละเอียด      const workbook = XLSX.utils.book_new();

        { width: 15 }, // หมวดหมู่      

        { width: 12 }, // สถานะ      // Main data sheet

        { width: 15 }  // วันที่      const mainData: any[] = [];

      ];      mainData.push([

              'รหัสครุภัณฑ์', 'ชื่อครุภัณฑ์', 'รายละเอียด', 'หมวดหมู่', 

      // Process each asset        'สถานะ', 'QR Code URL', 'ไฟล์ QR Code', 'วันที่สร้าง'

      for (let i = 0; i < filteredAssets.length; i++) {      ]);

        const asset = filteredAssets[i];

        const qrUrl = generateQRUrl(asset.id);      for (const asset of filteredAssets) {

        const statusText = asset.status === 'AVAILABLE' ? 'พร้อมใช้งาน' :        const qrUrl = generateQRUrl(asset.id);

                          asset.status === 'MAINTENANCE' ? 'ซ่อมบำรุง' : 'เสียหาย';        const statusText = asset.status === 'AVAILABLE' ? 'พร้อมใช้งาน' :

                                  asset.status === 'MAINTENANCE' ? 'ซ่อมบำรุง' : 'เสียหาย';

        try {        

          // Generate QR code as buffer        mainData.push([

          const qrBuffer = await QRCodeLib.toBuffer(qrUrl, {           asset.code,

            width: 150,           asset.name,

            margin: 1,          asset.description || '',

            color: { dark: '#000000', light: '#FFFFFF' }          asset.category || 'ไม่ระบุ',

          });          statusText,

                    qrUrl,

          // Add QR image to workbook          `QR_Images/QR_${asset.code}_${asset.name.replace(/[^a-zA-Z0-9]/g, '_')}.png`,

          const imageId = workbook.addImage({          new Date(asset.createdAt).toLocaleDateString('th-TH')

            buffer: qrBuffer,        ]);

            extension: 'png',      }

          });

                const mainSheet = XLSX.utils.aoa_to_sheet(mainData);

          // Add data row      mainSheet['!cols'] = [

          const dataRow = mainSheet.addRow([        { wch: 15 }, { wch: 25 }, { wch: 30 }, { wch: 15 },

            '', // QR Code cell (will contain image)        { wch: 12 }, { wch: 45 }, { wch: 35 }, { wch: 15 }

            asset.code,      ];

            asset.name,      XLSX.utils.book_append_sheet(workbook, mainSheet, 'ข้อมูลครุภัณฑ์');

            asset.description || '',

            asset.category || 'ไม่ระบุ',      // 2. Generate QR codes and add to ZIP

            statusText,      const qrImagesFolder = zip.folder("QR_Images");

            new Date(asset.createdAt).toLocaleDateString('th-TH')      const printData: any[] = [];

          ]);      printData.push(['หน้า', 'ตำแหน่ง', 'รหัส', 'ชื่อครุภัณฑ์', 'ไฟล์รูป']);

          

          // Set row height for QR image      let currentPage = 1;

          dataRow.height = 120;      let positionOnPage = 1;

                

          // Add image to cell A(rowNumber)      for (let i = 0; i < filteredAssets.length; i++) {

          const rowNumber = i + 2; // +2 because header is row 1, data starts at row 2        const asset = filteredAssets[i];

          mainSheet.addImage(imageId, {        const qrUrl = generateQRUrl(asset.id);

            tl: { col: 0, row: rowNumber - 1 }, // Top-left corner        

            ext: { width: 150, height: 150 }     // Image size        try {

          });          // Generate QR code

                    const qrDataUrl = await QRCodeLib.toDataURL(qrUrl, { 

          // Style data cells            width: 300, 

          dataRow.eachCell((cell, colNumber) => {            margin: 2,

            if (colNumber > 1) { // Skip QR cell            color: { dark: '#000000', light: '#FFFFFF' }

              cell.alignment = { horizontal: 'left', vertical: 'middle' };          });

              cell.border = {          

                top: { style: 'thin' }, left: { style: 'thin' },          // Create canvas with asset info

                bottom: { style: 'thin' }, right: { style: 'thin' }          const canvas = document.createElement('canvas');

              };          const ctx = canvas.getContext('2d');

            }          if (ctx) {

          });            canvas.width = 350;

                      canvas.height = 420;

          // Style QR cell            

          const qrCell = dataRow.getCell(1);            // White background

          qrCell.border = {            ctx.fillStyle = 'white';

            top: { style: 'thin' }, left: { style: 'thin' },            ctx.fillRect(0, 0, canvas.width, canvas.height);

            bottom: { style: 'thin' }, right: { style: 'thin' }            

          };            // Border

                      ctx.strokeStyle = '#000000';

        } catch (error) {            ctx.lineWidth = 2;

          console.error(`Error generating QR for ${asset.code}:`, error);            ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);

          // Add row without image if QR generation fails

          const errorRow = mainSheet.addRow([            const img = new Image();

            'QR Error',            await new Promise<void>((resolve) => {

            asset.code,              img.onload = () => {

            asset.name,                // Draw QR code

            asset.description || '',                ctx.drawImage(img, 25, 25, 300, 300);

            asset.category || 'ไม่ระบุ',                

            statusText,                // Draw text

            new Date(asset.createdAt).toLocaleDateString('th-TH')                ctx.fillStyle = 'black';

          ]);                ctx.textAlign = 'center';

                          

          errorRow.eachCell((cell) => {                // Asset name (bold, larger)

            cell.alignment = { horizontal: 'left', vertical: 'middle' };                ctx.font = 'bold 18px Arial';

            cell.border = {                const nameLines = wrapText(ctx, asset.name, canvas.width - 40);

              top: { style: 'thin' }, left: { style: 'thin' },                let yPos = 350;

              bottom: { style: 'thin' }, right: { style: 'thin' }                nameLines.forEach(line => {

            };                  ctx.fillText(line, canvas.width / 2, yPos);

          });                  yPos += 22;

        }                });

      }                

                      // Asset code

      // URL References sheet                ctx.font = 'bold 14px Arial';

      const urlSheet = workbook.addWorksheet('URL References');                ctx.fillText(`รหัส: ${asset.code}`, canvas.width / 2, yPos + 10);

      const urlHeaderRow = urlSheet.addRow([                

        'รหัส', 'ชื่อครุภัณฑ์', 'QR Code URL', 'หมายเหตุ'                // Category

      ]);                ctx.font = '12px Arial';

                      ctx.fillText(`หมวดหมู่: ${asset.category || 'ไม่ระบุ'}`, canvas.width / 2, yPos + 30);

      urlHeaderRow.eachCell((cell) => {                

        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };                resolve();

        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEC4899' } };              };

        cell.alignment = { horizontal: 'center', vertical: 'middle' };              img.src = qrDataUrl;

        cell.border = {            });

          top: { style: 'thin' }, left: { style: 'thin' },

          bottom: { style: 'thin' }, right: { style: 'thin' }            // Convert to blob and add to ZIP

        };            const blob = await new Promise<Blob>((resolve) => {

      });              canvas.toBlob((blob) => {

                      if (blob) resolve(blob);

      urlSheet.columns = [              }, 'image/png', 1.0);

        { width: 15 }, { width: 30 }, { width: 50 }, { width: 30 }            });

      ];

                  const fileName = `QR_${asset.code}_${asset.name.replace(/[^a-zA-Z0-9]/g, '_')}.png`;

      for (const asset of filteredAssets) {            qrImagesFolder?.file(fileName, blob);

        const qrUrl = generateQRUrl(asset.id);            

        const urlRow = urlSheet.addRow([            // Add to print layout data

          asset.code,            printData.push([

          asset.name,              currentPage,

          qrUrl,              positionOnPage,

          'สแกน QR Code เพื่อดูข้อมูลครุภัณฑ์'              asset.code,

        ]);              asset.name,

                      `QR_Images/${fileName}`

        urlRow.eachCell((cell) => {            ]);

          cell.alignment = { horizontal: 'left', vertical: 'middle' };            

          cell.border = {            positionOnPage++;

            top: { style: 'thin' }, left: { style: 'thin' },            if (positionOnPage > 6) { // 6 QR codes per page

            bottom: { style: 'thin' }, right: { style: 'thin' }              currentPage++;

          };              positionOnPage = 1;

        });            }

      }          }

              } catch (error) {

      // Generate and save file          console.error(`Error generating QR for ${asset.code}:`, error);

      const currentDate = new Date();        }

      const dateString = currentDate.toISOString().split('T')[0];      }

      const timeString = currentDate.toTimeString().split(' ')[0].replace(/:/g, '-');

      const filename = `QR_Codes_Images_${dateString}_${timeString}.xlsx`;      // 3. Add print layout sheet

            const printSheet = XLSX.utils.aoa_to_sheet(printData);

      // Write file      printSheet['!cols'] = [{ wch: 8 }, { wch: 10 }, { wch: 15 }, { wch: 30 }, { wch: 40 }];

      const buffer = await workbook.xlsx.writeBuffer();      XLSX.utils.book_append_sheet(workbook, printSheet, 'รูปแบบการพิมพ์');

      const blob = new Blob([buffer], { 

        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'       // 4. Add statistics sheet

      });      const stats = {

      saveAs(blob, filename);        total: filteredAssets.length,

              available: filteredAssets.filter(a => a.status === 'AVAILABLE').length,

      const stats = {        maintenance: filteredAssets.filter(a => a.status === 'MAINTENANCE').length,

        totalAssets: filteredAssets.length,        broken: filteredAssets.filter(a => a.status === 'OUT_OF_ORDER').length,

        availableAssets: filteredAssets.filter(a => a.status === 'AVAILABLE').length,        categories: [...new Set(filteredAssets.map(a => a.category).filter(Boolean))].length,

        pages: Math.ceil(filteredAssets.length / 6)        pages: Math.ceil(filteredAssets.length / 6)

      };      };

      

      alert(`🎉 ส่งออก Excel พร้อมรูป QR Code เรียบร้อย!\n\n📊 รายการ: ${stats.totalAssets} QR Codes\n📁 ไฟล์: ${filename}\n📄 หน้าพิมพ์: ${stats.pages} หน้า\n\n✨ ฟีเจอร์ใหม่:\n• รูป QR Code แสดงเป็นรูปภาพจริงใน Excel!\n• ข้อมูลครบถ้วนทุกรายการ\n• สามารถปรับขนาดรูปใน Excel ได้\n• รูปแบบมาตรฐานสำหรับพิมพ์`);      const statsData = [

              ['รายงานการจัดการ QR Code ครุภัณฑ์', ''],

    } catch (error) {        ['', ''],

      console.error('Error exporting Excel with images:', error);        ['สถิติทั่วไป', 'จำนวน'],

      alert('❌ เกิดข้อผิดพลาดในการส่งออกข้อมูล\nกรุณาลองใหม่อีกครั้ง');        ['ครุภัณฑ์ทั้งหมด', stats.total],

    } finally {        ['- พร้อมใช้งาน', stats.available],

      setLoading(false);        ['- ซ่อมบำรุง', stats.maintenance],

    }        ['- เสียหาย', stats.broken],

  };        ['หมวดหมู่ทั้งหมด', stats.categories],

        ['จำนวนหน้าสำหรับพิมพ์', stats.pages],

  // Download all QR Codes as ZIP        ['', ''],

  const downloadAllQRCodes = async () => {        ['ข้อมูลการสร้างรายงาน', ''],

    if (filteredAssets.length === 0) {        ['วันที่สร้าง', new Date().toLocaleString('th-TH')],

      alert('ไม่มีข้อมูลสำหรับดาวน์โหลด');        ['ผู้สร้าง', session?.user?.name || 'ไม่ระบุ'],

      return;        ['จำนวนไฟล์ QR Code', stats.total],

    }        ['', ''],

        ['คำแนะนำการใช้งาน', ''],

    try {        ['1. ไฟล์ Excel นี้มีข้อมูลครุภัณฑ์ทั้งหมด', ''],

      setLoading(true);        ['2. โฟลเดอร์ QR_Images มีรูป QR Code ทั้งหมด', ''],

      const zip = new JSZip();        ['3. ใช้แท็บ "รูปแบบการพิมพ์" สำหรับจัดรูปแบบ', ''],

        ['4. QR Code แต่ละอันสามารถสแกนดูข้อมูลได้', ''],

      for (const asset of filteredAssets) {        ['5. รูป QR Code ขนาด 350x420 พิกเซล เหมาะสำหรับพิมพ์', '']

        try {      ];

          const url = generateQRUrl(asset.id);

          const qrDataUrl = await QRCodeLib.toDataURL(url, { width: 256 });      const statsSheet = XLSX.utils.aoa_to_sheet(statsData);

          const base64Data = qrDataUrl.split(',')[1];      statsSheet['!cols'] = [{ wch: 45 }, { wch: 20 }];

          zip.file(`QR_${asset.code}.png`, base64Data, { base64: true });      XLSX.utils.book_append_sheet(workbook, statsSheet, 'สถิติและคำแนะนำ');

        } catch (error) {

          console.error(`Error generating QR for ${asset.code}:`, error);      // 5. Style all sheets

        }      const headerStyle = {

      }        font: { bold: true, color: { rgb: "FFFFFF" } },

        fill: { fgColor: { rgb: "EC4899" } },

      const content = await zip.generateAsync({ type: 'blob' });        alignment: { horizontal: "center", vertical: "center" }

      saveAs(content, `QR_Codes_${new Date().toISOString().split('T')[0]}.zip`);      };

      alert(`ดาวน์โหลด ZIP เรียบร้อย! (${filteredAssets.length} ไฟล์)`);

    } catch (error) {      Object.keys(workbook.Sheets).forEach(sheetName => {

      console.error('Error creating ZIP file:', error);        const ws = workbook.Sheets[sheetName];

      alert('เกิดข้อผิดพลาดในการสร้างไฟล์ ZIP');        if (ws['!ref']) {

    } finally {          const range = XLSX.utils.decode_range(ws['!ref']);

      setLoading(false);          for (let col = range.s.c; col <= range.e.c; col++) {

    }            const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });

  };            if (ws[cellAddress]) {

              ws[cellAddress].s = headerStyle;

  // Export comprehensive report (ZIP with Excel + individual QR images)            }

  const exportComprehensiveReport = async () => {          }

    if (filteredAssets.length === 0) {        }

      alert('ไม่มีข้อมูลสำหรับส่งออก');      });

      return;

    }      // 6. Convert Excel to blob and add to ZIP

      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

    try {      const excelBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      setLoading(true);      

      const zip = new JSZip();      const currentDate = new Date();

      const dateString = currentDate.toISOString().split('T')[0];

      // Create Excel report using XLSX (fallback)      const timeString = currentDate.toTimeString().split(' ')[0].replace(/:/g, '-');

      const workbook = XLSX.utils.book_new();      

      const data = [      zip.file(`QR_Management_Complete_${dateString}_${timeString}.xlsx`, excelBlob);

        ['รหัสครุภัณฑ์', 'ชื่อครุภัณฑ์', 'รายละเอียด', 'หมวดหมู่', 'สถานะ', 'QR Code URL', 'วันที่สร้าง']

      ];      // 7. Add README file

      const readmeContent = `🔖 รายงานการจัดการ QR Code ครุภัณฑ์

      for (const asset of filteredAssets) {=========================================

        const qrUrl = generateQRUrl(asset.id);

        const statusText = asset.status === 'AVAILABLE' ? 'พร้อมใช้งาน' :📅 สร้างเมื่อ: ${new Date().toLocaleString('th-TH')}

                          asset.status === 'MAINTENANCE' ? 'ซ่อมบำรุง' : 'เสียหาย';👤 ผู้สร้าง: ${session?.user?.name || 'ไม่ระบุ'}

        📊 จำนวนครุภัณฑ์: ${stats.total} รายการ

        data.push([

          asset.code,📁 ไฟล์ในแพ็คเกจนี้:

          asset.name,├── QR_Management_Complete_${dateString}_${timeString}.xlsx (ไฟล์ข้อมูลหลัก)

          asset.description || '',└── QR_Images/ (โฟลเดอร์รูป QR Code)

          asset.category || 'ไม่ระบุ',    ├── QR_[รหัส]_[ชื่อ].png (${stats.total} ไฟล์)

          statusText,

          qrUrl,📋 แท็บใน Excel:

          new Date(asset.createdAt).toLocaleDateString('th-TH')• ข้อมูลครุภัณฑ์ - ข้อมูลโดยละเอียดทั้งหมด

        ]);• รูปแบบการพิมพ์ - จัดเรียงสำหรับพิมพ์ (6 รายการต่อหน้า)

• สถิติและคำแนะนำ - สรุปข้อมูลและวิธีใช้

        // Generate individual QR images

        try {🖨️ การพิมพ์ QR Code:

          const qrDataUrl = await QRCodeLib.toDataURL(qrUrl, { width: 256 });1. เปิดโฟลเดอร์ QR_Images

          const base64Data = qrDataUrl.split(',')[1];2. เลือกรูปที่ต้องการพิมพ์

          zip.file(`QR_Images/QR_${asset.code}.png`, base64Data, { base64: true });3. ขนาดที่แนะนำ: 5x6 ซม. (2x2.4 นิ้ว)

        } catch (error) {4. คุณภาพ: 300 DPI ขึ้นไป

          console.error(`Error generating QR for ${asset.code}:`, error);

        }📱 การใช้งาน QR Code:

      }• สแกนด้วยแอปกล้องมือถือ

• จะเปิดหน้าข้อมูลครุภัณฑ์โดยตรง

      const worksheet = XLSX.utils.aoa_to_sheet(data);• ไม่ต้องติดตั้งแอปพิเศษ

      XLSX.utils.book_append_sheet(workbook, worksheet, 'QR Code Report');

      ⚠️ หมายเหตุ:

      const excelBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });• เก็บไฟล์นี้ไว้สำหรับการอ้างอิง

      zip.file('QR_Report.xlsx', excelBuffer);• สำรองข้อมูลเป็นประจำ

• ตรวจสอบการทำงานของ QR Code ก่อนนำไปใช้

      const content = await zip.generateAsync({ type: 'blob' });

      const filename = `QR_Complete_Package_${new Date().toISOString().split('T')[0]}.zip`;📞 ติดต่อสอบถาม: ฝ่ายไอที

      saveAs(content, filename);`;

      

      alert(`🎉 ส่งออกแพ็คเกจครบชุดเรียบร้อย!\n\n📦 ไฟล์: ${filename}\n📊 รายการ: ${filteredAssets.length} QR Codes\n📁 ประกอบด้วย:\n• Excel Report\n• รูป QR Code แยกไฟล์ทั้งหมด`);      zip.file("📖_คำแนะนำการใช้งาน.txt", readmeContent);

      

    } catch (error) {      // 8. Generate and download ZIP

      console.error('Error creating comprehensive report:', error);      const zipBlob = await zip.generateAsync({ type: 'blob' });

      alert('❌ เกิดข้อผิดพลาดในการสร้างรายงาน');      const zipFileName = `QR_Management_Complete_Package_${dateString}_${timeString}.zip`;

    } finally {      saveAs(zipBlob, zipFileName);

      setLoading(false);

    }      alert(`🎉 สร้างแพ็คเกจสมบูรณ์เรียบร้อย!\n\n📦 ไฟล์: ${zipFileName}\n📊 ครุภัณฑ์: ${stats.total} รายการ\n🖼️ QR Code: ${stats.total} รูป\n📄 หน้าพิมพ์: ${stats.pages} หน้า\n\n💡 แพ็คเกจประกอบด้วย:\n• ไฟล์ Excel ข้อมูลครบถ้วน\n• รูป QR Code ทุกรายการ\n• คำแนะนำการใช้งาน`);

  };

    } catch (error) {

  if (status === 'loading') {      console.error('Error creating comprehensive report:', error);

    return (      alert('❌ เกิดข้อผิดพลาดในการสร้างรายงาน\nกรุณาลองใหม่อีกครั้ง');

      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-100 flex items-center justify-center">    } finally {

        <div className="text-center">      setLoading(false);

          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-500 mx-auto"></div>    }

          <p className="text-pink-600 mt-4 font-kanit text-lg">กำลังตรวจสอบสิทธิ์...</p>  };

        </div>

      </div>  // Helper function to wrap text

    );  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) => {

  }    const words = text.split(' ');

    const lines: string[] = [];

  if (!session || session.user.role !== 'ADMIN') {    let currentLine = words[0];

    return null;

  }    for (let i = 1; i < words.length; i++) {

      const word = words[i];

  if (loading) {      const width = ctx.measureText(currentLine + " " + word).width;

    return (      if (width < maxWidth) {

      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-100 flex items-center justify-center">        currentLine += " " + word;

        <div className="text-center">      } else {

          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-500 mx-auto"></div>        lines.push(currentLine);

          <p className="text-pink-600 mt-4 font-kanit text-lg">กำลังโหลดข้อมูล...</p>        currentLine = word;

        </div>      }

      </div>    }

    );    lines.push(currentLine);

  }    return lines;

  };

  return (

    <LayoutWrapper>  // Export to Excel with embedded QR Code images using ExcelJS

      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-100">  const exportToExcel = async () => {

        <div className="container mx-auto px-6 py-8">    if (filteredAssets.length === 0) {

          {/* Header */}      alert('ไม่มีข้อมูลสำหรับส่งออก');

          <div className="mb-8">      return;

            <div className="flex items-center gap-4 mb-4">    }

              <button

                onClick={() => router.push('/admin')}    try {

                className="p-2 text-pink-600 hover:text-pink-800 hover:bg-pink-50 rounded-lg transition-colors"      setLoading(true);

              >      

                <FaArrowLeft className="text-xl" />      // Create workbook with ExcelJS

              </button>      const workbook = new ExcelJS.Workbook();

              <div>      workbook.creator = session?.user?.name || 'QR Management System';

                <h1 className="text-4xl font-bold text-gray-900 font-kanit flex items-center">      workbook.created = new Date();

                  <FaQrcode className="mr-3 text-pink-500" />      

                  จัดการ QR Code      // Main sheet with QR images

                </h1>      const mainSheet = workbook.addWorksheet('QR Codes & ข้อมูล');

                <p className="text-gray-600 font-kanit text-lg font-light">      

                  สร้างและดาวน์โหลด QR Code สำหรับครุภัณฑ์      // Add header row

                </p>      const headerRow = mainSheet.addRow([

              </div>        'QR Code',

            </div>        'รหัสครุภัณฑ์', 

          </div>        'ชื่อครุภัณฑ์',

        'รายละเอียด',

          {/* Actions Bar */}        'หมวดหมู่',

          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">        'สถานะ',

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">        'วันที่สร้าง'

              <div className="flex flex-col sm:flex-row gap-4 flex-1">      ]);

                {/* Search */}      

                <div className="relative flex-1">      // Style header

                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />      headerRow.eachCell((cell) => {

                  <input        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };

                    type="text"        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEC4899' } };

                    placeholder="ค้นหาครุภัณฑ์..."        cell.alignment = { horizontal: 'center', vertical: 'middle' };

                    value={searchTerm}        cell.border = {

                    onChange={(e) => setSearchTerm(e.target.value)}          top: { style: 'thin' }, left: { style: 'thin' },

                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent font-kanit text-gray-900"          bottom: { style: 'thin' }, right: { style: 'thin' }

                  />        };

                </div>      });

      

                {/* Category Filter */}      // Set column widths

                <select      mainSheet.columns = [

                  className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 font-kanit text-gray-900"        { width: 20 }, // QR Code

                  value={selectedCategory}        { width: 15 }, // รหัส

                  onChange={(e) => setSelectedCategory(e.target.value)}        { width: 25 }, // ชื่อ

                >        { width: 30 }, // รายละเอียด

                  <option value="all">ทุกหมวดหมู่</option>        { width: 15 }, // หมวดหมู่

                  {categories.map((category) => (        { width: 12 }, // สถานะ

                    <option key={category} value={category}>        { width: 15 }  // วันที่

                      {category}      ];

                    </option>      

                  ))}      // Process each asset

                </select>      for (let i = 0; i < filteredAssets.length; i++) {

        const asset = filteredAssets[i];

                {/* Status Filter */}        const qrUrl = generateQRUrl(asset.id);

                <select        const statusText = asset.status === 'AVAILABLE' ? 'พร้อมใช้งาน' :

                  className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 font-kanit text-gray-900"                          asset.status === 'MAINTENANCE' ? 'ซ่อมบำรุง' : 'เสียหาย';

                  value={selectedStatus}        

                  onChange={(e) => setSelectedStatus(e.target.value)}        try {

                >          // Generate QR code as buffer

                  <option value="all">ทุกสถานะ</option>          const qrBuffer = await QRCodeLib.toBuffer(qrUrl, { 

                  <option value="AVAILABLE">พร้อมใช้งาน</option>            width: 150, 

                  <option value="MAINTENANCE">ซ่อมบำรุง</option>            margin: 1,

                  <option value="OUT_OF_ORDER">เสียหาย</option>            color: { dark: '#000000', light: '#FFFFFF' }

                </select>          });

              </div>          

          // Add QR image to workbook

              <div className="flex gap-3">          const imageId = workbook.addImage({

                <button            buffer: qrBuffer,

                  onClick={exportComprehensiveReport}            extension: 'png',

                  disabled={filteredAssets.length === 0 || loading}          });

                  className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-kanit font-medium py-3 px-6 rounded-lg transition duration-300 flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"          

                >          // Add data row

                  <FaFileExcel />          const dataRow = mainSheet.addRow([

                  {loading ? 'กำลังสร้าง...' : `แพ็คเกจ ZIP+Excel (${filteredAssets.length})`}            '', // QR Code cell (will contain image)

                </button>            asset.code,

                <button            asset.name,

                  onClick={exportToExcel}            asset.description || '',

                  disabled={filteredAssets.length === 0 || loading}            asset.category || 'ไม่ระบุ',

                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-kanit font-medium py-3 px-6 rounded-lg transition duration-300 flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"            statusText,

                >            new Date(asset.createdAt).toLocaleDateString('th-TH')

                  <FaFileExcel />          ]);

                  {loading ? 'กำลังสร้าง...' : `Excel+รูป QR (${filteredAssets.length})`}          

                </button>          // Set row height for QR image

                <button          dataRow.height = 120;

                  onClick={downloadAllQRCodes}          

                  disabled={filteredAssets.length === 0 || loading}          // Add image to cell A(rowNumber)

                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-kanit font-medium py-3 px-6 rounded-lg transition duration-300 flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"          const rowNumber = i + 2; // +2 because header is row 1, data starts at row 2

                >          mainSheet.addImage(imageId, {

                  <FaDownload />            tl: { col: 0, row: rowNumber - 1 }, // Top-left corner

                  ZIP รูปภาพอย่างเดียว            ext: { width: 150, height: 150 }     // Image size

                </button>          });

              </div>          

            </div>          // Style data cells

          dataRow.eachCell((cell, colNumber) => {

            <div className="mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">            if (colNumber > 1) { // Skip QR cell

              <div className="text-sm text-gray-600 font-kanit">              cell.alignment = { horizontal: 'left', vertical: 'middle' };

                แสดงผล {filteredAssets.length} รายการจากทั้งหมด {assets.length} รายการ              cell.border = {

              </div>                top: { style: 'thin' }, left: { style: 'thin' },

              <div className="text-xs text-gray-500 font-kanit">                bottom: { style: 'thin' }, right: { style: 'thin' }

                💜 แพ็คเกจ ZIP+Excel: ZIP ไฟล์ที่มี Excel + รูป QR แยกไฟล์ |              };

                💚 Excel+รูป QR: รูป QR ฝังใน Excel โดยตรง |            }

                🟢 ZIP รูปภาพ: เฉพาะไฟล์รูป PNG          });

              </div>          

            </div>          // Style QR cell

          </div>          const qrCell = dataRow.getCell(1);

          qrCell.border = {

          {/* QR Code Table */}            top: { style: 'thin' }, left: { style: 'thin' },

          <div className="bg-white rounded-xl shadow-lg overflow-hidden">            bottom: { style: 'thin' }, right: { style: 'thin' }

            <div className="overflow-x-auto">          };

              <table className="w-full">          

                <thead className="bg-gradient-to-r from-pink-50 to-rose-50">        } catch (error) {

                  <tr>          console.error(`Error generating QR for ${asset.code}:`, error);

                    <th className="px-6 py-4 text-left text-sm font-kanit font-bold text-gray-900">QR Code</th>          // Add row without image if QR generation fails

                    <th className="px-6 py-4 text-left text-sm font-kanit font-bold text-gray-900">รหัสครุภัณฑ์</th>          const errorRow = mainSheet.addRow([

                    <th className="px-6 py-4 text-left text-sm font-kanit font-bold text-gray-900">ชื่อครุภัณฑ์</th>            'QR Error',

                    <th className="px-6 py-4 text-left text-sm font-kanit font-bold text-gray-900">หมวดหมู่</th>            asset.code,

                    <th className="px-6 py-4 text-left text-sm font-kanit font-bold text-gray-900">สถานะ</th>            asset.name,

                    <th className="px-6 py-4 text-center text-sm font-kanit font-bold text-gray-900">การจัดการ</th>            asset.description || '',

                  </tr>            asset.category || 'ไม่ระบุ',

                </thead>            statusText,

                <tbody className="divide-y divide-gray-200">            new Date(asset.createdAt).toLocaleDateString('th-TH')

                  {filteredAssets.map((asset) => (          ]);

                    <tr key={asset.id} className="hover:bg-gray-50 transition-colors">          

                      <td className="px-6 py-4">          errorRow.eachCell((cell) => {

                        <div className="w-16 h-16 bg-white border border-gray-200 rounded-lg flex items-center justify-center">            cell.alignment = { horizontal: 'left', vertical: 'middle' };

                          <QRCode            cell.border = {

                            value={generateQRUrl(asset.id)}              top: { style: 'thin' }, left: { style: 'thin' },

                            size={60}              bottom: { style: 'thin' }, right: { style: 'thin' }

                            level="M"            };

                          />          });

                        </div>        }

                      </td>      }

                      <td className="px-6 py-4">      

                        <span className="text-sm font-kanit font-bold text-gray-900">{asset.code}</span>      // URL References sheet

                      </td>      const urlSheet = workbook.addWorksheet('URL References');

                      <td className="px-6 py-4">      const urlHeaderRow = urlSheet.addRow([

                        <div>        'รหัส', 'ชื่อครุภัณฑ์', 'QR Code URL', 'หมายเหตุ'

                          <p className="text-sm font-kanit font-medium text-gray-900">{asset.name}</p>      ]);

                          {asset.description && (      

                            <p className="text-xs font-kanit text-gray-500 mt-1">{asset.description}</p>      urlHeaderRow.eachCell((cell) => {

                          )}        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };

                        </div>        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEC4899' } };

                      </td>        cell.alignment = { horizontal: 'center', vertical: 'middle' };

                      <td className="px-6 py-4">        cell.border = {

                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-kanit font-medium bg-blue-100 text-blue-800">          top: { style: 'thin' }, left: { style: 'thin' },

                          {asset.category || 'ไม่ระบุ'}          bottom: { style: 'thin' }, right: { style: 'thin' }

                        </span>        };

                      </td>      });

                      <td className="px-6 py-4">      

                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-kanit font-medium ${      urlSheet.columns = [

                          asset.status === 'AVAILABLE' ? 'bg-green-100 text-green-800' :        { width: 15 }, { width: 30 }, { width: 50 }, { width: 30 }

                          asset.status === 'MAINTENANCE' ? 'bg-yellow-100 text-yellow-800' :      ];

                          'bg-red-100 text-red-800'      

                        }`}>      for (const asset of filteredAssets) {

                          {asset.status === 'AVAILABLE' ? 'พร้อมใช้งาน' :        const qrUrl = generateQRUrl(asset.id);

                           asset.status === 'MAINTENANCE' ? 'ซ่อมบำรุง' : 'เสียหาย'}        const urlRow = urlSheet.addRow([

                        </span>          asset.code,

                      </td>          asset.name,

                      <td className="px-6 py-4 text-center">          qrUrl,

                        <div className="flex items-center justify-center gap-2">          'สแกน QR Code เพื่อดูข้อมูลครุภัณฑ์'

                          <button        ]);

                            onClick={() => downloadQRCode(asset)}        

                            className="p-2 text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"        urlRow.eachCell((cell) => {

                            title="ดาวน์โหลด QR Code"          cell.alignment = { horizontal: 'left', vertical: 'middle' };

                          >          cell.border = {

                            <FaDownload />            top: { style: 'thin' }, left: { style: 'thin' },

                          </button>            bottom: { style: 'thin' }, right: { style: 'thin' }

                          <a          };

                            href={generateQRUrl(asset.id)}        });

                            target="_blank"      }

                            rel="noopener noreferrer"      

                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"      // Generate and save file

                            title="ดูหน้าข้อมูลครุภัณฑ์"      const currentDate = new Date();

                          >      const dateString = currentDate.toISOString().split('T')[0];

                            <FaEye />      const timeString = currentDate.toTimeString().split(' ')[0].replace(/:/g, '-');

                          </a>      const filename = `QR_Codes_Images_${dateString}_${timeString}.xlsx`;

                        </div>      

                      </td>      // Write file

                    </tr>      const buffer = await workbook.xlsx.writeBuffer();

                  ))}      const blob = new Blob([buffer], { 

                </tbody>        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 

              </table>      });

      saveAs(blob, filename);

              {filteredAssets.length === 0 && (      

                <div className="text-center py-12">      const stats = {

                  <FaQrcode className="mx-auto text-4xl text-gray-300 mb-4" />        totalAssets: filteredAssets.length,

                  <p className="text-gray-500 font-kanit">ไม่พบข้อมูลครุภัณฑ์</p>        availableAssets: filteredAssets.filter(a => a.status === 'AVAILABLE').length,

                </div>        pages: Math.ceil(filteredAssets.length / 6)

              )}      };

            </div>      

          </div>      alert(`🎉 ส่งออก Excel พร้อมรูป QR Code เรียบร้อย!\n\n📊 รายการ: ${stats.totalAssets} QR Codes\n📁 ไฟล์: ${filename}\n📄 หน้าพิมพ์: ${stats.pages} หน้า\n\n✨ ฟีเจอร์ใหม่:\n• รูป QR Code แสดงเป็นรูปภาพจริงใน Excel!\n• ข้อมูลครบถ้วนทุกรายการ\n• สามารถปรับขนาดรูปใน Excel ได้\n• รูปแบบมาตรฐานสำหรับพิมพ์`);

        </div>      

      </div>    } catch (error) {

    </LayoutWrapper>      console.error('Error exporting Excel with images:', error);

  );      alert('❌ เกิดข้อผิดพลาดในการส่งออกข้อมูล\nกรุณาลองใหม่อีกครั้ง');

}    } finally {
      setLoading(false);
    }
  };

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