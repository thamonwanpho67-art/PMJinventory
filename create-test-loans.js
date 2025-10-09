const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestLoans() {
  try {
    console.log('Creating test loan requests...');

    // Get existing users and assets
    const users = await prisma.user.findMany();
    const assets = await prisma.asset.findMany({ 
      where: { status: 'AVAILABLE' },
      take: 5 
    });

    if (users.length === 0 || assets.length === 0) {
      console.log('No users or assets found. Please run seed first.');
      return;
    }

    const regularUser = users.find(user => user.role === 'USER');
    
    if (!regularUser) {
      console.log('No regular user found.');
      return;
    }

    // Create several test loan requests
    const testLoans = [
      {
        assetId: assets[0].id,
        userId: regularUser.id,
        quantity: 1,
        borrowDate: new Date(),
        dueAt: '2025-11-10',
        costCenter: '0600200006',
        note: 'ใช้งานในการประชุมครั้งที่ 1/2025',
        status: 'PENDING'
      },
      {
        assetId: assets[1].id,
        userId: regularUser.id,
        quantity: 1,
        borrowDate: new Date('2025-10-05'),
        dueAt: '2025-10-15',
        costCenter: '0600200064',
        note: 'ใช้งานในการอบรม',
        status: 'APPROVED'
      },
      {
        assetId: assets[2].id,
        userId: regularUser.id,
        quantity: 1,
        borrowDate: new Date('2025-09-20'),
        dueAt: '2025-09-30',
        costCenter: '0600200002',
        note: 'ใช้งานในการสำรวจข้อมูล',
        status: 'RETURNED',
        returnedAt: new Date('2025-09-28')
      },
      {
        assetId: assets[3].id,
        userId: regularUser.id,
        quantity: 1,
        borrowDate: new Date('2025-09-01'),
        dueAt: '2025-09-15',
        costCenter: '0600200010',
        note: 'ใช้งานในการจัดทำโครงการ',
        status: 'REJECTED'
      }
    ];

    for (const loanData of testLoans) {
      await prisma.loan.create({
        data: loanData
      });
      console.log(`Created loan for asset: ${assets.find(a => a.id === loanData.assetId)?.name}`);
    }

    console.log('Test loan requests created successfully!');
    
  } catch (error) {
    console.error('Error creating test loans:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestLoans();