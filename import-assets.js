const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

// ฟังก์ชันแปลงปี พ.ศ. เป็น ค.ศ.
function convertBuddhistToGregorian(buddhistDateStr) {
  if (!buddhistDateStr) return null;
  
  try {
    const dateStr = buddhistDateStr.toString();
    const parts = dateStr.split('/');
    
    if (parts.length !== 3) return null;
    
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    const buddhistYear = parseInt(parts[2]);
    
    if (isNaN(day) || isNaN(month) || isNaN(buddhistYear)) return null;
    
    const gregorianYear = buddhistYear - 543;
    
    return new Date(gregorianYear, month - 1, day);
  } catch (error) {
    console.error('Date conversion error:', error);
    return null;
  }
}

async function importAssets() {
  try {
    console.log('กำลังโหลดข้อมูลจาก JSON...');
    const jsonData = fs.readFileSync('./public/ข้อมูลทรัพย์สิน.json', 'utf8');
    const assets = JSON.parse(jsonData);
    
    console.log('จำนวนข้อมูลที่พบ:', assets.length);
    
    // ตรวจสอบข้อมูลในฐานข้อมูลปัจจุบัน
    const currentCount = await prisma.asset.count();
    console.log('จำนวนข้อมูลปัจจุบันในฐานข้อมูล:', currentCount);
    
    if (assets.length === 0) {
      console.log('ไม่พบข้อมูลสำหรับนำเข้า');
      return;
    }
    
    console.log('กำลังเริ่มนำเข้าข้อมูล...');
    
    let imported = 0;
    let errors = 0;
    
    // แบ่งข้อมูลออกเป็น batch
    const batchSize = 10;
    const batches = [];
    for (let i = 0; i < assets.length; i += batchSize) {
      batches.push(assets.slice(i, i + batchSize));
    }
    
    console.log('จำนวน batch:', batches.length);
    
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      console.log('Processing batch ' + (batchIndex + 1) + '/' + batches.length + '...');
      
      const batchData = batch.map(item => {
        const accountingDate = convertBuddhistToGregorian(item['วันที่ซื้อ']);
        const assetCode = item['รหัสครุภัณฑ์'] || 'ASSET-' + item['ลำดับ'];
        
        return {
          name: item['ชื่อทรัพย์สิน'] || 'ครุภัณฑ์ลำดับที่ ' + item['ลำดับ'],
          code: assetCode,
          description: item['รายละเอียด'] || null,
          category: item['ประเภท'] || 'ครุภัณฑ์ทั่วไป',
          location: item['สถานที่ตั้ง'] || null,
          assetCode: item['รหัสสินทรัพย์(GFMIS)#S. No.'] || null,
          price: item['ราคา'] ? parseFloat(item['ราคา']) : null,
          accountingDate: accountingDate,
          status: 'AVAILABLE',
          quantity: 1
        };
      });
      
      try {
        await prisma.asset.createMany({
          data: batchData,
          skipDuplicates: true
        });
        imported += batchData.length;
      } catch (error) {
        console.error('Error in batch ' + (batchIndex + 1) + ':', error.message);
        errors++;
      }
    }
    
    const finalCount = await prisma.asset.count();
    
    console.log('\n=== การนำเข้าข้อมูลเสร็จสิ้น ===');
    console.log('รวม:', assets.length, 'รายการ');
    console.log('นำเข้าสำเร็จ:', imported, 'รายการ');
    console.log('ข้อผิดพลาด:', errors, 'รายการ');
    console.log('จำนวนข้อมูลรวมในฐานข้อมูล:', finalCount);
    
    console.log('\n=== ตัวอย่างข้อมูลล่าสุด ===');
    const sampleAssets = await prisma.asset.findMany({
      take: 5,
      orderBy: { id: 'desc' }
    });
    
    sampleAssets.forEach(asset => {
      console.log('+ เพิ่ม:', asset.name);
    });
    
    console.log('\n=== สถิติการใช้งาน ===');
    const availableCount = await prisma.asset.count({ where: { status: 'AVAILABLE' } });
    const borrowedCount = await prisma.asset.count({ where: { status: 'BORROWED' } });
    
    console.log('พร้อมใช้งาน:', availableCount, 'รายการ');
    console.log('อยู่ระหว่างการยืม:', borrowedCount, 'รายการ');
    
  } catch (error) {
    console.error('เกิดข้อผิดพลาด:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importAssets();