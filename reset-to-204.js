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

async function resetTo204Assets() {
  try {
    console.log('🔄 กำลังรีเซ็ตข้อมูลให้เป็น 204 รายการเท่านั้น\n');
    
    // ลบข้อมูลทั้งหมด
    console.log('🗑️ ลบข้อมูลเก่าทั้งหมด...');
    await prisma.asset.deleteMany();
    console.log('✅ ลบเสร็จสิ้น');
    
    // โหลดข้อมูลจาก JSON
    console.log('\n📁 กำลังโหลดข้อมูลจาก JSON...');
    const jsonData = fs.readFileSync('./public/ข้อมูลทรัพย์สิน.json', 'utf8');
    const allAssets = JSON.parse(jsonData);
    
    console.log('📈 ข้อมูลในไฟล์ JSON:', allAssets.length, 'รายการ');
    
    if (allAssets.length !== 204) {
      console.log('⚠️ ข้อมูลใน JSON ไม่ใช่ 204 รายการ');
    }
    
    console.log('\n⬆️ กำลังนำเข้าข้อมูลใหม่...');
    
    let imported = 0;
    let skipped = 0;
    
    for (let i = 0; i < allAssets.length; i++) {
      const item = allAssets[i];
      
      try {
        const accountingDate = convertBuddhistToGregorian(item['วันที่ซื้อ']);
        
        // สร้าง unique code
        const baseCode = item['รหัสครุภัณฑ์'] || `ASSET-${i + 1}`;
        const uniqueCode = `${baseCode}-${Date.now()}-${i}`;
        
        const assetData = {
          name: item['ชื่อทรัพย์สิน'] || `ครุภัณฑ์ลำดับที่ ${i + 1}`,
          code: uniqueCode,
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
        
        if (imported % 20 === 0) {
          console.log(`📈 นำเข้าแล้ว: ${imported}/${allAssets.length} รายการ`);
        }
        
      } catch (error) {
        console.error(`❌ Error importing item ${i + 1}:`, error.message);
        skipped++;
      }
    }
    
    const finalCount = await prisma.asset.count();
    
    console.log('\n🎉 การรีเซ็ตข้อมูลเสร็จสิ้น!');
    console.log('📊 สรุป:');
    console.log('- ข้อมูลใน JSON:', allAssets.length, 'รายการ');
    console.log('- นำเข้าสำเร็จ:', imported, 'รายการ');
    console.log('- ข้ามไป:', skipped, 'รายการ');
    console.log('- รวมในฐานข้อมูล:', finalCount, 'รายการ');
    
    if (finalCount === 204) {
      console.log('🎯 ได้จำนวน 204 รายการที่ต้องการแล้ว!');
    } else {
      console.log('⚠️ จำนวนไม่ตรงกับ 204 รายการ');
    }
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetTo204Assets();