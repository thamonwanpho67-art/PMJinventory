const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAssetCount() {
  try {
    const assetCount = await prisma.asset.count();
    console.log(`Current asset count: ${assetCount}`);
    
    const userCount = await prisma.user.count();
    console.log(`Current user count: ${userCount}`);
    
    const loanCount = await prisma.loan.count();
    console.log(`Current loan count: ${loanCount}`);
    
  } catch (error) {
    console.error('Error checking counts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAssetCount();