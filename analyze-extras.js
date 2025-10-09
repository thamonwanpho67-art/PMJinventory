const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function analyzeExtraAssets() {
  try {
    const total = await prisma.asset.count();
    console.log(`📊 ข้อมูลทั้งหมด: ${total} รายการ`);
    console.log(`🎯 ต้องการ: 204 รายการ`);
    console.log(`➕ เกิน: ${total - 204} รายการ`);
    
    // ดูข้อมูลที่สร้างล่าสุด 25 รายการ
    const latestAssets = await prisma.asset.findMany({
      orderBy: { createdAt: 'desc' },
      take: 25,
      select: {
        id: true,
        name: true,
        code: true,
        createdAt: true,
        category: true
      }
    });
    
    console.log('\n🕐 ข้อมูลที่สร้างล่าสุด 25 รายการ:');
    latestAssets.forEach((asset, index) => {
      const date = new Date(asset.createdAt).toLocaleString('th-TH');
      console.log(`${index + 1}. ${asset.name} (${asset.category}) - ${date}`);
    });
    
    // ดูข้อมูลที่สร้างเก่าที่สุด 10 รายการ
    const oldestAssets = await prisma.asset.findMany({
      orderBy: { createdAt: 'asc' },
      take: 10,
      select: {
        id: true,
        name: true,
        code: true,
        createdAt: true,
        category: true
      }
    });
    
    console.log('\n🕑 ข้อมูลที่สร้างเก่าที่สุด 10 รายการ:');
    oldestAssets.forEach((asset, index) => {
      const date = new Date(asset.createdAt).toLocaleString('th-TH');
      console.log(`${index + 1}. ${asset.name} (${asset.category}) - ${date}`);
    });
    
    // ดูการกระจายตามวันที่สร้าง
    const dateGroups = await prisma.asset.groupBy({
      by: ['createdAt'],
      _count: { id: true },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    console.log('\n📅 การกระจายตามวันที่สร้าง (10 วันล่าสุด):');
    dateGroups.forEach(group => {
      const date = new Date(group.createdAt).toLocaleDateString('th-TH');
      console.log(`${date}: ${group._count.id} รายการ`);
    });
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeExtraAssets();