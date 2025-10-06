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

async function restoreAllAssets() {
  try {
    console.log('=== การกู้คืนข้อมูลครุภัณฑ์ทั้งหมด ===\n');
    
    // ตรวจสอบข้อมูลปัจจุบัน
    const currentAssets = await prisma.asset.count();
    console.log('📊 จำนวนครุภัณฑ์ปัจจุบัน:', currentAssets);
    
    // โหลดข้อมูลจาก JSON
    console.log('\n📁 กำลังโหลดข้อมูลจาก JSON...');
    const jsonData = fs.readFileSync('./public/ข้อมูลทรัพย์สิน.json', 'utf8');
    const allAssets = JSON.parse(jsonData);
    
    console.log('📈 ข้อมูลในไฟล์ JSON:', allAssets.length, 'รายการ');
    
    if (allAssets.length === 0) {
      console.log('❌ ไม่พบข้อมูลในไฟล์ JSON');
      return;
    }
    
    console.log('\n🔄 กำลังลบข้อมูลเก่า...');
    // ลบครุภัณฑ์เก่าทั้งหมด (เว้น sample data)
    await prisma.asset.deleteMany({
      where: {
        code: {
          not: {
            in: ['NB001', 'PRJ001', 'MIC001', 'CAM001', 'TAB001']
          }
        }
      }
    });
    
    console.log('✅ ลบข้อมูลเก่าเสร็จสิ้น');
    
    console.log('\n⬆️ กำลังนำเข้าข้อมูลใหม่...');
    
    let imported = 0;
    let skipped = 0;
    
    // แบ่งข้อมูลออกเป็น batch เล็กๆ
    const batchSize = 5;
    const batches = [];
    for (let i = 0; i < allAssets.length; i += batchSize) {
      batches.push(allAssets.slice(i, i + batchSize));
    }
    
    console.log('🔢 แบ่งเป็น', batches.length, 'batch');
    
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      console.log('⚙️ Processing batch', (batchIndex + 1) + '/' + batches.length + '...');
      
      for (const item of batch) {
        try {
          const accountingDate = convertBuddhistToGregorian(item['วันที่ซื้อ']);
          const assetCode = item['รหัสครุภัณฑ์'] || 'ASSET-' + item['ลำดับ'];
          
          const assetData = {
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
          
          await prisma.asset.create({
            data: assetData
          });
          
          imported++;
          
        } catch (error) {
          console.error('❌ Error importing item ' + item['ลำดับ'] + ':', error.message);
          skipped++;
        }
      }
      
      // แสดงความคืบหน้า
      if (batchIndex % 5 === 0 || batchIndex === batches.length - 1) {
        console.log('📈 Progress: ' + imported + ' imported, ' + skipped + ' skipped');
      }
    }
    
    const finalCount = await prisma.asset.count();
    
    console.log('\n🎉 การกู้คืนข้อมูลเสร็จสิ้น!');
    console.log('📊 สรุป:');
    console.log('- ข้อมูลใน JSON:', allAssets.length, 'รายการ');
    console.log('- นำเข้าสำเร็จ:', imported, 'รายการ');
    console.log('- ข้ามไป:', skipped, 'รายการ');
    console.log('- รวมในฐานข้อมูล:', finalCount, 'รายการ');
    
    console.log('\n📝 ตัวอย่างข้อมูลล่าสุด:');
    const latestAssets = await prisma.asset.findMany({
      take: 3,
      orderBy: { id: 'desc' },
      select: {
        name: true,
        code: true,
        category: true,
        accountingDate: true
      }
    });
    
    latestAssets.forEach((asset, index) => {
      const year = asset.accountingDate ? asset.accountingDate.getFullYear() : 'ไม่ระบุ';
      console.log((index + 1) + '. ' + asset.name + ' (ปี: ' + year + ')');
    });
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreAllAssets();