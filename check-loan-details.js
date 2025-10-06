const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLoanDetails() {
  console.log('🔍 ตรวจสอบข้อมูลการยืม-คืนแบบละเอียด...\n');
  
  try {
    const loans = await prisma.loan.findMany({
      include: {
        asset: { select: { name: true, code: true } },
        user: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('📊 สถิติการยืม:');
    console.log('- ทั้งหมด:', loans.length);
    console.log('- PENDING:', loans.filter(l => l.status === 'PENDING').length);
    console.log('- APPROVED:', loans.filter(l => l.status === 'APPROVED').length);
    console.log('- RETURNED:', loans.filter(l => l.status === 'RETURNED').length);
    console.log('- REJECTED:', loans.filter(l => l.status === 'REJECTED').length);
    
    console.log('\n📋 รายละเอียดการยืมทั้งหมด:');
    loans.forEach((loan, i) => {
      console.log(`\n${i+1}. ${loan.asset.name} (${loan.asset.code})`);
      console.log(`   ผู้ยืม: ${loan.user.name || loan.user.email}`);
      console.log(`   สถานะ: ${loan.status}`);
      console.log(`   วันที่ยื่นคำขอ: ${loan.createdAt}`);
      console.log(`   กำหนดคืน: ${loan.dueDate || loan.dueAt || 'ไม่ระบุ'}`);
      console.log(`   วันที่อนุมัติ: ${loan.borrowedAt || 'ยังไม่อนุมัติ'}`);
      console.log(`   วันที่คืน: ${loan.returnedAt || 'ยังไม่คืน'}`);
      console.log(`   หมายเหตุ: ${loan.note || 'ไม่มี'}`);
    });
    
    console.log('\n🔍 ตรวจสอบปัญหาเฉพาะ:');
    
    // ตรวจสอบรายการที่มีสถานะ RETURNED แต่ไม่มี returnedAt
    const returnedButNoDate = loans.filter(l => l.status === 'RETURNED' && !l.returnedAt);
    if (returnedButNoDate.length === 0) {
      console.log('✅ ไม่มีปัญหา - รายการ RETURNED ทั้งหมดมี returnedAt');
    } else {
      console.log('❌ พบปัญหา - รายการ RETURNED ที่ไม่มี returnedAt:');
      returnedButNoDate.forEach((loan, i) => {
        console.log(`   ${i+1}. ${loan.asset.name} - ID: ${loan.id}`);
      });
    }
    
    // ตรวจสอบรายการที่มี returnedAt แต่สถานะไม่ใช่ RETURNED
    const hasDateButNotReturned = loans.filter(l => l.returnedAt && l.status !== 'RETURNED');
    if (hasDateButNotReturned.length === 0) {
      console.log('✅ ไม่มีปัญหา - รายการที่มี returnedAt ทั้งหมดเป็นสถานะ RETURNED');
    } else {
      console.log('❌ พบปัญหา - รายการที่มี returnedAt แต่สถานะไม่ใช่ RETURNED:');
      hasDateButNotReturned.forEach((loan, i) => {
        console.log(`   ${i+1}. ${loan.asset.name} - Status: ${loan.status} - returnedAt: ${loan.returnedAt}`);
      });
    }

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLoanDetails().catch(console.error);