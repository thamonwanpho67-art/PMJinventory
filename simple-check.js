const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function simpleCheck() {
  try {
    const total = await prisma.asset.count();
    console.log(`📊 ข้อมูลปัจจุบัน: ${total} รายการ`);
    console.log(`🎯 ต้องการ: 204 รายการ`);
    console.log(`➕ เกิน: ${total - 204} รายการ`);
    
    // ดูรายการล่าสุด 25 รายการที่อาจเป็นข้อมูลเกิน
    const latestAssets = await prisma.asset.findMany({
      orderBy: { createdAt: 'desc' },
      take: 25,
      select: {
        id: true,
        name: true,
        code: true,
        createdAt: true,
        category: true,
        assetCode: true
      }
    });
    
    console.log('\n📋 รายการล่าสุด 25 รายการ (อาจเป็นข้อมูลที่เกิน):');
    latestAssets.forEach((asset, index) => {
      const date = new Date(asset.createdAt).toLocaleDateString('th-TH');
      console.log(`${index + 1}. ${asset.name}`);
      console.log(`   Code: ${asset.code}, AssetCode: ${asset.assetCode}`);
      console.log(`   Category: ${asset.category}, Created: ${date}`);
      console.log('');
    });
    
    // นับตาม category อีกครั้ง
    const categoryStats = await prisma.asset.groupBy({
      by: ['category'],
      _count: { category: true },
      orderBy: { _count: { category: 'desc' } }
    });
    
    console.log('📊 สถิติตาม category:');
    categoryStats.forEach(cat => {
      console.log(`  ${cat.category}: ${cat._count.category} รายการ`);
    });
    
    const total2 = categoryStats.reduce((sum, cat) => sum + cat._count.category, 0);
    console.log(`\n🧮 รวมตาม category: ${total2} รายการ`);
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  } finally {
    await prisma.$disconnect();
  }
}

simpleCheck();