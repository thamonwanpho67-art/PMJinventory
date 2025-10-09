const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createLoansForCurrentUser() {
  try {
    console.log('Creating loans for current user...');

    // Find the current user (ert@gmail.com)
    const currentUser = await prisma.user.findUnique({
      where: { email: 'ert@gmail.com' }
    });

    if (!currentUser) {
      console.log('Current user not found');
      return;
    }

    console.log('Found user:', currentUser.email, currentUser.id);

    // Get some assets
    const assets = await prisma.asset.findMany({ 
      where: { status: 'AVAILABLE' },
      take: 3 
    });

    if (assets.length === 0) {
      console.log('No assets found');
      return;
    }

    // Create test loans for this user
    const testLoans = [
      {
        assetId: assets[0].id,
        userId: currentUser.id,
        quantity: 1,
        borrowDate: new Date(),
        dueAt: '2025-11-15',
        costCenter: '0600200006',
        note: 'ใช้งานในการประชุมประจำเดือน',
        status: 'PENDING'
      },
      {
        assetId: assets[1].id,
        userId: currentUser.id,
        quantity: 1,
        borrowDate: new Date('2025-10-01'),
        dueAt: '2025-10-20',
        costCenter: '0600200064',
        note: 'ใช้งานในการอบรมพนักงาน',
        status: 'APPROVED',
        borrowedAt: new Date('2025-10-02')
      }
    ];

    if (assets[2]) {
      testLoans.push({
        assetId: assets[2].id,
        userId: currentUser.id,
        quantity: 1,
        borrowDate: new Date('2025-09-15'),
        dueAt: '2025-09-30',
        costCenter: '0600200002',
        note: 'ใช้งานในการตรวจสอบข้อมูล',
        status: 'RETURNED',
        borrowedAt: new Date('2025-09-16'),
        returnedAt: new Date('2025-09-28')
      });
    }

    for (const loanData of testLoans) {
      await prisma.loan.create({
        data: loanData
      });
      console.log(`Created loan for asset: ${assets.find(a => a.id === loanData.assetId)?.name}`);
    }

    console.log('Test loans created successfully for current user!');
    
  } catch (error) {
    console.error('Error creating loans:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createLoansForCurrentUser();