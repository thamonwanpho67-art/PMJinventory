const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLoanFields() {
  console.log('🔍 ตรวจสอบ field ที่ใช้ในข้อมูลจริง...\n');
  
  try {
    const loans = await prisma.loan.findMany({
      select: {
        id: true,
        dueAt: true,
        createdAt: true,
        asset: { select: { name: true, code: true } },
        user: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('📋 ข้อมูล field ที่มีอยู่:');
    loans.forEach((loan, i) => {
      console.log(`${i+1}. ${loan.asset.name}`);
      console.log(`   dueAt: ${loan.dueAt}`);
      console.log(`   dueAt (formatted): ${new Date(loan.dueAt).toLocaleDateString('th-TH')}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLoanFields().catch(console.error);