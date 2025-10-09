const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createCurrentUser() {
  try {
    console.log('Creating current user...');

    // Create the user ert@gmail.com
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    const user = await prisma.user.upsert({
      where: { email: 'ert@gmail.com' },
      update: {},
      create: {
        email: 'ert@gmail.com',
        name: 'Test User',
        password: hashedPassword,
        role: 'USER',
      },
    });

    console.log('Created/Updated user:', user.email, user.id);

    // Now create loans for this user
    const assets = await prisma.asset.findMany({ 
      where: { status: 'AVAILABLE' },
      take: 3 
    });

    if (assets.length === 0) {
      console.log('No assets found');
      return;
    }

    // Create test loans
    const testLoans = [
      {
        assetId: assets[0].id,
        userId: user.id,
        quantity: 1,
        borrowDate: new Date(),
        dueAt: '2025-11-15',
        costCenter: '0600200006',
        note: 'ใช้งานในการประชุมประจำเดือน',
        status: 'PENDING'
      },
      {
        assetId: assets[1].id,
        userId: user.id,
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
        userId: user.id,
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

    console.log('User and test loans created successfully!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createCurrentUser();