const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteSampleAssets() {
  try {
    console.log('🗑️ เริ่มลบ Sample Assets ที่ไม่เกี่ยวข้อง\n');
    
    // ตรวจสอบข้อมูลปัจจุบัน
    const currentCount = await prisma.asset.count();
    console.log('📊 จำนวนครุภัณฑ์ปัจจุบัน:', currentCount);
    
    const sampleCodes = ['NB001', 'PRJ001', 'MIC001', 'CAM001', 'TAB001'];
    
    console.log('\n📋 Sample Assets ที่จะลบ:');
    
    // แสดงรายละเอียดก่อนลบ
    const sampleAssets = await prisma.asset.findMany({
      where: {
        code: {
          in: sampleCodes
        }
      }
    });
    
    sampleAssets.forEach((asset, index) => {
      console.log(`${index + 1}. ${asset.name} (${asset.code})`);
    });
    
    console.log(`\n🗑️ กำลังลบ ${sampleAssets.length} รายการ...`);
    
    let totalDeleted = 0;
    for (const code of sampleCodes) {
      const deleted = await prisma.asset.deleteMany({
        where: { code }
      });
      console.log(`- ลบ ${deleted.count} รายการ code: ${code}`);
      totalDeleted += deleted.count;
    }
    
    const finalCount = await prisma.asset.count();
    
    console.log('\n✅ การลบเสร็จสิ้น!');
    console.log(`- ลบออกทั้งหมด: ${totalDeleted} รายการ`);
    console.log(`- เหลือในระบบ: ${finalCount} รายการ`);
    
    if (finalCount === 204) {
      console.log('\n🎯 สมบูรณ์! ตอนนี้มีข้อมูลครุภัณฑ์จริง 204 รายการ');
    }
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteSampleAssets();