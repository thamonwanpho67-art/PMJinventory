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

async function importAll204Assets() {
  try {
    console.log('🚀 เริ่มนำเข้าครุภัณฑ์ทั้งหมด 204 รายการ\n');
    
    // ตรวจสอบข้อมูลปัจจุบัน
    const currentCount = await prisma.asset.count();
    console.log('📊 จำนวนครุภัณฑ์ปัจจุบัน:', currentCount);
    
    // โหลดข้อมูลจาก JSON
    console.log('\n📁 กำลังโหลดข้อมูลจาก JSON...');
    const jsonData = fs.readFileSync('./public/ข้อมูลทรัพย์สิน.json', 'utf8');
    const allAssets = JSON.parse(jsonData);
    
    console.log('📦 ข้อมูลในไฟล์ JSON:', allAssets.length, 'รายการ');
    
    if (allAssets.length === 0) {
      console.log('❌ ไม่พบข้อมูลในไฟล์ JSON');
      return;
    }
    
    // ลบข้อมูลเก่าที่ไม่ใช่ sample
    console.log('\n🧹 กำลังลบข้อมูลเก่า...');
    await prisma.asset.deleteMany({
      where: {
        code: {
          notIn: ['NB001', 'PRJ001', 'MIC001', 'CAM001', 'TAB001']
        }
      }
    });
    console.log('✅ ลบข้อมูลเก่าเสร็จสิ้น');
    
    console.log('\n⬆️ กำลังนำเข้าข้อมูลใหม่...');
    
    let imported = 0;
    let skipped = 0;
    
    // นำเข้าทีละรายการเพื่อหลีกเลี่ยงปัญหา duplicate
    for (let i = 0; i < allAssets.length; i++) {
      const item = allAssets[i];
      
      try {
        const accountingDate = convertBuddhistToGregorian(item['วันที่ซื้อ']);
        const assetCode = item['รหัสครุภัณฑ์'] && item['รหัสครุภัณฑ์'] !== 'nan' 
          ? item['รหัสครุภัณฑ์'] 
          : `ASSET-${item['ลำดับ']}-${Date.now()}`;
        
        const assetData = {
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
        
        // ตรวจสอบว่ามี code ซ้ำหรือไม่
        const existing = await prisma.asset.findUnique({
          where: { code: assetCode }
        });
        
        if (!existing) {
          await prisma.asset.create({
            data: assetData
          });
          imported++;
          
          // แสดงความคืบหน้าทุก 20 รายการ
          if (imported % 20 === 0) {
            console.log(`📈 นำเข้าแล้ว: ${imported}/${allAssets.length} รายการ`);
          }
        } else {
          skipped++;
        }
        
      } catch (error) {
        console.error(`❌ Error importing item ${item['ลำดับ']}:`, error.message);
        skipped++;
      }
    }
    
    const finalCount = await prisma.asset.count();
    
    console.log('\n🎉 การนำเข้าข้อมูลเสร็จสิ้น!');
    console.log('📊 สรุปผลลัพธ์:');
    console.log(`- ข้อมูลใน JSON: ${allAssets.length} รายการ`);
    console.log(`- นำเข้าสำเร็จ: ${imported} รายการ`);
    console.log(`- ข้ามไป (ซ้ำ): ${skipped} รายการ`);
    console.log(`- รวมในฐานข้อมูล: ${finalCount} รายการ`);
    
    if (finalCount >= 200) {
      console.log('\n✅ สำเร็จ! ข้อมูลครุภัณฑ์ครบถ้วนแล้ว');
    } else {
      console.log('\n⚠️ ข้อมูลยังไม่ครบ - กรุณาตรวจสอบไฟล์ JSON');
    }
    
    console.log('\n📝 ตัวอย่างข้อมูลล่าสุด:');
    const latestAssets = await prisma.asset.findMany({
      take: 5,
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
      console.log(`${index + 1}. ${asset.name} (ปี: ${year})`);
    });
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importAll204Assets();