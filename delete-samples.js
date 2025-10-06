const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteSampleAssets() {
  try {
    const sampleCodes = ['NB001', 'PRJ001', 'MIC001', 'CAM001', 'TAB001'];
    
    for (const code of sampleCodes) {
      const deleted = await prisma.asset.deleteMany({
        where: { code }
      });
      console.log(`Deleted ${deleted.count} assets with code: ${code}`);
    }
    
    console.log('✅ Successfully deleted all sample assets');
  } catch (error) {
    console.error('Error deleting sample assets:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteSampleAssets();