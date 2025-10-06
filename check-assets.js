const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAssets() {
  try {
    const totalAssets = await prisma.asset.count();
    console.log(`Total assets in database: ${totalAssets}`);
    
    const sampleAsset = await prisma.asset.findFirst({
      orderBy: { createdAt: 'asc' }
    });
    
    console.log('First asset:', JSON.stringify(sampleAsset, null, 2));
    
    // Count by category
    const categories = await prisma.asset.groupBy({
      by: ['category'],
      _count: {
        category: true
      }
    });
    
    console.log('Assets by category:');
    categories.forEach(cat => {
      console.log(`  ${cat.category}: ${cat._count.category}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAssets();