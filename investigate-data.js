const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

async function investigateData() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 ตรวจสอบข้อมูลครุภัณฑ์อย่างละเอียด...\n');
    
    // 1. นับข้อมูลปัจจุบัน
    const currentCount = await prisma.asset.count();
    console.log('📊 จำนวนข้อมูลปัจจุบัน:', currentCount, 'รายการ');
    
    // 2. ตรวจสอบข้อมูลจาก JSON file
    const jsonData = JSON.parse(fs.readFileSync('public/ข้อมูลทรัพย์สิน.json', 'utf8'));
    console.log('📋 ข้อมูลใน JSON file:', jsonData.length, 'รายการ');
    
    // 3. ตรวจสอบ asset codes ที่มีอยู่
    const existingCodes = await prisma.asset.findMany({
      select: { code: true },
      orderBy: { code: 'asc' }
    });
    
    console.log('\n🏷️ รหัสครุภัณฑ์ที่มีอยู่ (10 รายการแรก):');
    existingCodes.slice(0, 10).forEach((asset, index) => {
      console.log(`${index + 1}. ${asset.code}`);
    });
    
    // 4. ตรวจสอบการกระจายตามวันที่สร้าง
    const assetsGroupedByDate = await prisma.asset.groupBy({
      by: ['createdAt'],
      _count: {
        id: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log('\n📅 การกระจายตามวันที่สร้าง:');
    assetsGroupedByDate.forEach(group => {
      const date = new Date(group.createdAt).toLocaleDateString('th-TH');
      console.log(`${date}: ${group._count.id} รายการ`);
    });
    
    // 5. ตรวจสอบข้อมูลใน JSON vs Database
    console.log('\n🔄 เปรียบเทียบข้อมูล JSON vs Database:');
    
    const jsonCodes = jsonData.map(item => 
      item['รหัสครุภัณฑ์'] || `ASSET-${item['ลำดับ']}`
    );
    
    const dbCodes = existingCodes.map(asset => asset.code);
    
    const missingCodes = jsonCodes.filter(code => !dbCodes.includes(code));
    console.log('❌ ข้อมูลที่หายไป:', missingCodes.length, 'รายการ');
    
    if (missingCodes.length > 0) {
      console.log('🔍 ตัวอย่างรหัสที่หายไป (5 รายการแรก):');
      missingCodes.slice(0, 5).forEach((code, index) => {
        console.log(`${index + 1}. ${code}`);
      });
    }
    
    // 6. ตรวจสอบสาเหตุที่เป็นไปได้
    console.log('\n🚨 วิเคราะห์สาเหตุ:');
    
    if (currentCount === 70) {
      console.log('💡 สาเหตุที่เป็นไปได้:');
      console.log('  1. Database ถูก reset ตอน migrate notifications');
      console.log('  2. Seed script ทำงานแค่บางส่วน (70 รายการจาก seed.ts)');
      console.log('  3. ข้อมูล 204 รายการไม่ได้ถูก import กลับมา');
    }
    
    // 7. แนะนำวิธีแก้ไข
    console.log('\n🔧 วิธีแก้ไข:');
    console.log('  1. รัน bulk import ใหม่');
    console.log('  2. หรือใช้ API import ผ่านเว็บ');
    console.log('  3. หรือรัน seed script ที่มีข้อมูลครบ');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

investigateData();