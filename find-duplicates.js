const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function findDuplicates() {
  try {
    // หาข้อมูลที่ซ้ำกันโดยดูจาก code
    const duplicateCodes = await prisma.asset.groupBy({
      by: ['code'],
      _count: {
        code: true
      },
      having: {
        code: {
          _count: {
            gt: 1
          }
        }
      }
    });
    
    console.log(`Found ${duplicateCodes.length} duplicate codes:`);
    
    for (const dup of duplicateCodes) {
      console.log(`\nCode: ${dup.code} (${dup._count.code} times)`);
      
      const assets = await prisma.asset.findMany({
        where: { code: dup.code },
        select: {
          id: true,
          name: true,
          code: true,
          createdAt: true
        }
      });
      
      assets.forEach((asset, index) => {
        console.log(`  ${index + 1}. ${asset.name} (ID: ${asset.id}, Created: ${asset.createdAt})`);
      });
    }
    
    // หาข้อมูลที่ซ้ำกันโดยดูจาก name + assetCode
    const duplicateNames = await prisma.asset.groupBy({
      by: ['name', 'assetCode'],
      _count: {
        name: true
      },
      having: {
        name: {
          _count: {
            gt: 1
          }
        }
      }
    });
    
    console.log(`\nFound ${duplicateNames.length} duplicate name+assetCode combinations:`);
    
    for (const dup of duplicateNames.slice(0, 5)) { // แสดงแค่ 5 รายการแรก
      console.log(`\nName: ${dup.name}, AssetCode: ${dup.assetCode} (${dup._count.name} times)`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findDuplicates();