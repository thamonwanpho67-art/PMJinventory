const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkNotificationUpdates() {
  console.log('🔔 ตรวจสอบการแจ้งเตือนหลังการแก้ไข...\n');
  
  try {
    // ตรวจสอบการแจ้งเตือนทั้งหมด
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('📊 สถิติการแจ้งเตือน:');
    console.log('- ทั้งหมด:', notifications.length);
    console.log('- ยังไม่อ่าน:', notifications.filter(n => !n.isRead).length);
    console.log('- อ่านแล้ว:', notifications.filter(n => n.isRead).length);
    
    console.log('\n📋 รายการแจ้งเตือนล่าสุด:');
    notifications.forEach((notification, i) => {
      console.log(`${i+1}. ${notification.title}`);
      console.log(`   ข้อความ: ${notification.message}`);
      console.log(`   ประเภท: ${notification.type}`);
      console.log(`   สถานะ: ${notification.isRead ? 'อ่านแล้ว' : 'ยังไม่อ่าน'}`);
      console.log(`   วันที่: ${notification.createdAt}`);
      console.log('');
    });
    
    // ตรวจสอบสถานะ loans ปัจจุบัน
    const loans = await prisma.loan.findMany({
      include: {
        asset: { select: { name: true, code: true } },
        user: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('📊 สถิติ loans หลังการแก้ไข:');
    console.log('- ทั้งหมด:', loans.length);
    console.log('- PENDING:', loans.filter(l => l.status === 'PENDING').length);
    console.log('- APPROVED:', loans.filter(l => l.status === 'APPROVED').length);
    console.log('- RETURNED:', loans.filter(l => l.status === 'RETURNED').length);
    console.log('- REJECTED:', loans.filter(l => l.status === 'REJECTED').length);
    
    console.log('\n📋 รายละเอียด loans:');
    loans.forEach((loan, i) => {
      console.log(`${i+1}. ${loan.asset.name}`);
      console.log(`   ผู้ยืม: ${loan.user.name || loan.user.email}`);
      console.log(`   สถานะ: ${loan.status}`);
      console.log(`   วันที่ยื่นคำขอ: ${new Date(loan.createdAt).toLocaleString('th-TH')}`);
      console.log(`   วันที่อนุมัติ: ${loan.borrowedAt ? new Date(loan.borrowedAt).toLocaleString('th-TH') : 'ยังไม่อนุมัติ'}`);
      console.log(`   วันที่คืน: ${loan.returnedAt ? new Date(loan.returnedAt).toLocaleString('th-TH') : 'ยังไม่คืน'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkNotificationUpdates().catch(console.error);