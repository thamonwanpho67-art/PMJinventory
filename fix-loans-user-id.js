const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createLoansForCorrectUser() {
  try {
    console.log('Creating loans for correct user ID...');

    // Use the correct user ID from debug message
    const userId = 'cmgf14vlx0000sv7km1kkoprj';

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      console.log('User not found with ID:', userId);
      return;
    }

    console.log('Found user:', user.email, user.id);

    // Get some assets
    const assets = await prisma.asset.findMany({ 
      where: { status: 'AVAILABLE' },
      take: 4 
    });

    if (assets.length === 0) {
      console.log('No assets found');
      return;
    }

    console.log('Found assets:', assets.length);

    // Delete existing loans for this user first
    const deletedLoans = await prisma.loan.deleteMany({
      where: { userId: userId }
    });
    console.log('Deleted existing loans:', deletedLoans.count);

    // Create test loans for this user
    const testLoans = [
      {
        assetId: assets[0].id,
        userId: userId,
        quantity: 1,
        borrowDate: new Date(),
        dueAt: '2025-11-15',
        costCenter: '0600200006',
        note: 'ใช้งานในการประชุมประจำเดือน',
        status: 'PENDING'
      },
      {
        assetId: assets[1].id,
        userId: userId,
        quantity: 1,
        borrowDate: new Date('2025-10-01'),
        dueAt: '2025-10-20',
        costCenter: '0600200064',
        note: 'ใช้งานในการอบรมพนักงาน',
        status: 'APPROVED',
        borrowedAt: new Date('2025-10-02')
      },
      {
        assetId: assets[2].id,
        userId: userId,
        quantity: 1,
        borrowDate: new Date('2025-09-15'),
        dueAt: '2025-09-30',
        costCenter: '0600200002',
        note: 'ใช้งานในการตรวจสอบข้อมูล',
        status: 'RETURNED',
        borrowedAt: new Date('2025-09-16'),
        returnedAt: new Date('2025-09-28')
      }
    ];

    if (assets[3]) {
      testLoans.push({
        assetId: assets[3].id,
        userId: userId,
        quantity: 1,
        borrowDate: new Date('2025-08-20'),
        dueAt: '2025-09-05',
        costCenter: '0600200010',
        note: 'ใช้งานในการจัดทำรายงาน',
        status: 'REJECTED'
      });
    }

    for (const loanData of testLoans) {
      await prisma.loan.create({
        data: loanData
      });
      console.log(`Created loan for asset: ${assets.find(a => a.id === loanData.assetId)?.name} - Status: ${loanData.status}`);
    }

    console.log('Test loans created successfully for the correct user!');
    
    // Verify by counting loans
    const totalLoans = await prisma.loan.count({
      where: { userId: userId }
    });
    console.log(`Total loans for user ${userId}: ${totalLoans}`);
    
  } catch (error) {
    console.error('Error creating loans:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createLoansForCorrectUser();