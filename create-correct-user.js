const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createCorrectUser() {
  try {
    console.log('Creating user with correct ID...');

    const targetUserId = 'cmgf14vlx0000sv7km1kkoprj';

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { id: targetUserId }
    });

    if (existingUser) {
      console.log('User already exists:', existingUser.email);
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('123456', 10);

    // Create user with specific ID
    const user = await prisma.user.create({
      data: {
        id: targetUserId,
        email: 'ert@gmail.com',
        name: 'Test User',
        password: hashedPassword,
        phone: '0812345678',
        role: 'USER'
      }
    });

    console.log('User created:', user.email, user.id);

    // Get some assets
    const assets = await prisma.asset.findMany({ 
      where: { status: 'AVAILABLE' },
      take: 4 
    });

    console.log('Found assets:', assets.length);

    if (assets.length === 0) {
      console.log('No assets found');
      return;
    }

    // Create test loans
    const testLoans = [
      {
        assetId: assets[0].id,
        userId: targetUserId,
        quantity: 1,
        borrowDate: new Date(),
        dueAt: '2025-11-15',
        costCenter: '0600200006',
        note: 'ใช้งานในการประชุมประจำเดือน',
        status: 'PENDING'
      },
      {
        assetId: assets[1].id,
        userId: targetUserId,
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
        userId: targetUserId,
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
        userId: targetUserId,
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

    console.log('✅ User and loans created successfully!');
    
    // Verify
    const totalLoans = await prisma.loan.count({
      where: { userId: targetUserId }
    });
    console.log(`Total loans for user: ${totalLoans}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createCorrectUser();