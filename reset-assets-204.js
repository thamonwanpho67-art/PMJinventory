const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function resetAssetsTo204() {
  try {
    console.log('Starting asset reset process...');

    // Count current assets
    const currentCount = await prisma.asset.count();
    console.log(`Current asset count: ${currentCount}`);

    if (currentCount <= 204) {
      console.log('Asset count is already 204 or less. No reset needed.');
      return;
    }

    // Keep only the first 204 assets (delete duplicates)
    // First, get all assets ordered by creation date
    const allAssets = await prisma.asset.findMany({
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Keep first 204, delete the rest
    const assetsToKeep = allAssets.slice(0, 204);
    const assetsToDelete = allAssets.slice(204);

    console.log(`Assets to keep: ${assetsToKeep.length}`);
    console.log(`Assets to delete: ${assetsToDelete.length}`);

    if (assetsToDelete.length > 0) {
      // Delete loans associated with assets to be deleted first
      const assetIdsToDelete = assetsToDelete.map(asset => asset.id);
      
      const deletedLoans = await prisma.loan.deleteMany({
        where: {
          assetId: {
            in: assetIdsToDelete
          }
        }
      });
      console.log(`Deleted ${deletedLoans.count} loans associated with extra assets`);

      // Now delete the extra assets
      const deletedAssets = await prisma.asset.deleteMany({
        where: {
          id: {
            in: assetIdsToDelete
          }
        }
      });
      console.log(`Deleted ${deletedAssets.count} extra assets`);
    }

    // Final count check
    const finalCount = await prisma.asset.count();
    console.log(`Final asset count: ${finalCount}`);

    console.log('Asset reset completed successfully!');
    
  } catch (error) {
    console.error('Error resetting assets:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAssetsTo204();