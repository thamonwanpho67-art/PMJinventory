const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function findSuspiciousData() {
  try {
    console.log('🔍 ค้นหาข้อมูลที่น่าสงสัย...\n');
    
    // 1. หาข้อมูลที่มี assetCode เป็น #1, #2, #3 ฯลฯ (น่าจะเป็น test data)
    const hashAssets = await prisma.asset.findMany({
      where: {
        assetCode: {
          startsWith: '#'
        }
      },
      select: {
        id: true,
        name: true,
        code: true,
        assetCode: true,
        category: true
      }
    });
    
    console.log(`🎯 ข้อมูลที่มี assetCode ขึ้นต้นด้วย "#": ${hashAssets.length} รายการ`);
    console.log('(น่าจะเป็น test data หรือข้อมูลจำลอง)\n');
    
    if (hashAssets.length > 0) {
      console.log('📋 รายการที่น่าสงสัย:');
      hashAssets.slice(0, 10).forEach((asset, index) => {
        console.log(`${index + 1}. ${asset.name} (${asset.assetCode}) - ${asset.category}`);
      });
      
      if (hashAssets.length > 10) {
        console.log(`... และอีก ${hashAssets.length - 10} รายการ\n`);
      }
      
      // สร้างสคริปต์เพื่อลบข้อมูลเหล่านี้
      console.log('💡 คำแนะนำ: ข้อมูลเหล่านี้น่าจะเป็น test data');
      console.log('🗑️ สามารถลบได้เพื่อให้เหลือ 204 รายการ');
      
      const remainingAfterDelete = 225 - hashAssets.length;
      console.log(`📊 หากลบข้อมูลเหล่านี้จะเหลือ: ${remainingAfterDelete} รายการ`);
      
      if (remainingAfterDelete <= 204) {
        console.log('✅ จำนวนจะลดลงใกล้เคียง 204 รายการแล้ว!');
      } else {
        console.log(`⚠️ ยังเกินอยู่ ${remainingAfterDelete - 204} รายการ`);
      }
    }
    
    // 2. หาข้อมูลที่มี code pattern ที่แปลก
    const weirdCodeAssets = await prisma.asset.findMany({
      where: {
        OR: [
          { code: { contains: 'พม/พมจ-พล/' } }, // pattern ที่ดูแปลก
          { code: { contains: 'test' } },
          { code: { contains: 'Test' } }
        ]
      },
      select: {
        id: true,
        name: true,
        code: true
      }
    });
    
    console.log(`\n🔍 ข้อมูลที่มี code pattern แปลก: ${weirdCodeAssets.length} รายการ`);
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findSuspiciousData();