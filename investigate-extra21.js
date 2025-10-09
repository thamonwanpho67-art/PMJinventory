const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function investigateExtra21() {
  try {
    const total = await prisma.asset.count();
    console.log(`📊 ข้อมูลปัจจุบัน: ${total} รายการ`);
    console.log(`🎯 ต้องการ: 204 รายการ`);
    console.log(`➕ เกิน: ${total - 204} รายการ`);
    
    // หาข้อมูลที่อาจจะเป็น test data หรือข้อมูลที่ไม่จำเป็น
    console.log('\n🔍 ตรวจสอบข้อมูลที่อาจเป็น test data:');
    
    // 1. หาข้อมูลที่ไม่มี code (อาจเป็น test data)
    const noCodeAssets = await prisma.asset.findMany({
      where: {
        OR: [
          { code: { equals: null } },
          { code: { equals: '' } },
          { code: { contains: 'test', mode: 'insensitive' } },
          { name: { contains: 'test', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        code: true,
        createdAt: true,
        category: true
      }
    });
    
    console.log(`📄 ข้อมูลที่ไม่มี code หรือมี 'test': ${noCodeAssets.length} รายการ`);
    noCodeAssets.forEach((asset, index) => {
      console.log(`  ${index + 1}. ${asset.name} (code: ${asset.code || 'null'})`);
    });
    
    // 2. หาข้อมูลที่มี name ที่ซ้ำกัน แต่ code ต่างกัน
    const duplicateNames = await prisma.asset.groupBy({
      by: ['name'],
      _count: { name: true },
      having: {
        name: { _count: { gt: 1 } }
      }
    });
    
    console.log(`\n📝 ชื่อที่ซ้ำกัน: ${duplicateNames.length} ชื่อ`);
    
    for (const dup of duplicateNames.slice(0, 10)) {
      console.log(`\n"${dup.name}" มี ${dup._count.name} รายการ:`);
      const assets = await prisma.asset.findMany({
        where: { name: dup.name },
        select: { id: true, code: true, assetCode: true, createdAt: true }
      });
      
      assets.forEach((asset, index) => {
        const date = new Date(asset.createdAt).toLocaleDateString('th-TH');
        console.log(`  ${index + 1}. Code: ${asset.code}, AssetCode: ${asset.assetCode}, Created: ${date}`);
      });
    }
    
    // 3. หา category ที่มีจำนวนผิดปกติ
    const categoryStats = await prisma.asset.groupBy({
      by: ['category'],
      _count: { category: true },
      orderBy: { _count: { category: 'desc' } }
    });
    
    console.log('\n📊 สถิติตาม category:');
    categoryStats.forEach(cat => {
      console.log(`  ${cat.category}: ${cat._count.category} รายการ`);
    });
    
    // 4. หาข้อมูลที่สร้างในช่วงเวลาใกล้เคียงกัน (อาจเป็น bulk import ที่ผิดพลาด)
    const recentBulkImports = await prisma.asset.groupBy({
      by: ['createdAt'],
      _count: { id: true },
      having: {
        id: { _count: { gte: 5 } } // มากกว่า 5 รายการในเวลาเดียวกัน
      },
      orderBy: { _count: { id: 'desc' } }
    });
    
    console.log('\n⚡ Bulk imports ที่อาจมีปัญหา:');
    for (const bulk of recentBulkImports) {
      const date = new Date(bulk.createdAt).toLocaleString('th-TH');
      console.log(`${date}: ${bulk._count.id} รายการ`);
      
      if (bulk._count.id > 10) {
        const assets = await prisma.asset.findMany({
          where: { createdAt: bulk.createdAt },
          select: { name: true, code: true },
          take: 5
        });
        
        console.log('  ตัวอย่าง:');
        assets.forEach((asset, index) => {
          console.log(`    ${index + 1}. ${asset.name} (${asset.code})`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  } finally {
    await prisma.$disconnect();
  }
}

investigateExtra21();