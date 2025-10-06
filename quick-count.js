const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function quickCount() {
  try {
    const assetCount = await prisma.asset.count();
    const userCount = await prisma.user.count();
    
    console.log('=== สถิติข้อมูลปัจจุบัน ===');
    console.log('👥 ผู้ใช้:', userCount, 'คน');
    console.log('📦 ครุภัณฑ์:', assetCount, 'รายการ');
    
    if (assetCount < 200) {
      console.log('⚠️ ข้อมูลครุภัณฑ์ยังไม่ครบ - ควรมี 204+ รายการ');
      console.log('💡 รัน: node restore-all-assets.js');
    } else {
      console.log('✅ ข้อมูลครบถ้วนแล้ว!');
    }
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  } finally {
    await prisma.$disconnect();
  }
}

quickCount();