const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

async function bulkImportAssets() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🚀 เริ่มการ Import ข้อมูลครุภัณฑ์...');
    
    // ตรวจสอบข้อมูลปัจจุบัน
    const currentCount = await prisma.asset.count();
    console.log('จำนวนปัจจุบัน:', currentCount, 'รายการ');
    
    // อ่านข้อมูลจาก JSON
    const jsonData = JSON.parse(fs.readFileSync('public/ข้อมูลทรัพย์สิน.json', 'utf8'));
    console.log('ข้อมูลใน JSON:', jsonData.length, 'รายการ');
    
    // ลบข้อมูลเก่าที่อาจจะซ้ำ (ถ้าต้องการ)
    console.log('\\n🗑️ ลบข้อมูลเก่า...');
    await prisma.asset.deleteMany({});
    console.log('ลบข้อมูลเก่าเสร็จ');
    
    // ฟังก์ชันแปลงปีพ.ศ. เป็น ค.ศ.
    function convertBuddhistToGregorian(buddhistDateStr) {
      if (!buddhistDateStr) return new Date();
      
      try {
        const [day, month, buddhistYear] = buddhistDateStr.split('/');
        const gregorianYear = parseInt(buddhistYear) - 543;
        return new Date(gregorianYear, parseInt(month) - 1, parseInt(day));
      } catch (error) {
        return new Date();
      }
    }
    
    console.log('\\n📥 เริ่ม Import ข้อมูล...');
    let imported = 0;
    let errors = 0;
    
    // Import ทีละ batch เพื่อความเร็ว
    const batchSize = 50;
    const batches = [];
    
    for (let i = 0; i < jsonData.length; i += batchSize) {
      batches.push(jsonData.slice(i, i + batchSize));
    }
    
    for (const [batchIndex, batch] of batches.entries()) {
      console.log(`Processing batch ${batchIndex + 1}/${batches.length}...`);
      
      const batchData = batch.map(item => {
        const accountingDate = convertBuddhistToGregorian(item['วันที่ซื้อ']);
        const assetCode = item['รหัสครุภัณฑ์'] || `ASSET-${item['ลำดับ']}`;
        
        return {
          name: item['ชื่อทรัพย์สิน'] || `ครุภัณฑ์ลำดับที่ ${item['ลำดับ']}`,
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
        console.error(`Error in batch ${batchIndex + 1}:`, error.message);
        errors++;
      }
    }
    
    console.log('\\n✅ Import เสร็จสิ้น!');
    console.log('- นำเข้าสำเร็จ:', imported, 'รายการ');
    console.log('- Batch ที่ Error:', errors, 'batches');
    
    const finalCount = await prisma.asset.count();
    console.log('- จำนวนรวม:', finalCount, 'รายการ');
    
    // สร้างข้อมูลตัวอย่างเพิ่ม
    console.log('\\n🎯 สร้างข้อมูลตัวอย่างเพิ่ม...');
    
    const sampleAssets = [
      {
        name: 'คอมพิวเตอร์โน๊ตบุ๊ก Dell Latitude',
        code: 'LAPTOP-001',
        description: 'คอมพิวเตอร์โน๊ตบุ๊กสำหรับงานสำนักงาน',
        category: 'เครื่องคอมพิวเตอร์',
        location: 'ห้องไอที ชั้น 2',
        status: 'AVAILABLE',
        quantity: 1,
        accountingDate: new Date('2023-01-15')
      },
      {
        name: 'เครื่องพิมพ์เลเซอร์ HP LaserJet',
        code: 'PRINTER-001',
        description: 'เครื่องพิมพ์เลเซอร์ขาวดำ',
        category: 'เครื่องพิมพ์',
        location: 'ห้องธุรการ ชั้น 1',
        status: 'AVAILABLE',
        quantity: 2,
        accountingDate: new Date('2024-03-20')
      },
      {
        name: 'โต๊ะทำงานไม้สัก',
        code: 'DESK-001',
        description: 'โต๊ะทำงานไม้สักขนาดใหญ่',
        category: 'เฟอร์นิเจอร์',
        location: 'ห้องผู้อำนวยการ',
        status: 'AVAILABLE',
        quantity: 1,
        accountingDate: new Date('2022-06-10')
      }
    ];
    
    for (const asset of sampleAssets) {
      try {
        await prisma.asset.create({ data: asset });
        console.log(\`+ เพิ่ม: \${asset.name}\`);
      } catch (error) {
        // Skip if duplicate
      }
    }
    
    const veryFinalCount = await prisma.asset.count();
    console.log('\\n🎉 เสร็จสิ้นทั้งหมด! จำนวนข้อมูล:', veryFinalCount, 'รายการ');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

bulkImportAssets();