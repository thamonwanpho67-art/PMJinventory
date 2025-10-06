const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testNotificationSystem() {
  try {
    console.log('🧪 ทดสอบระบบการแจ้งเตือน\n');
    
    // ตรวจสอบ table และ count ปัจจุบัน
    console.log('📊 สถิติปัจจุบัน:');
    const notificationCount = await prisma.notification.count();
    const loanCount = await prisma.loan.count();
    console.log(`- Notifications: ${notificationCount} รายการ`);
    console.log(`- Loans: ${loanCount} รายการ`);
    
    // สร้างการแจ้งเตือนทดสอบหลายประเภท
    console.log('\n🔔 สร้างการแจ้งเตือนทดสอบ:');
    
    const testNotifications = [
      {
        title: 'คำขอยืมใหม่',
        message: 'ผู้ใช้ทดสอบ ขอยืม Notebook Dell Inspiron',
        type: 'LOAN_REQUEST',
        targetRole: 'ADMIN'
      },
      {
        title: 'คำขอยืมได้รับอนุมัติ',
        message: 'คำขอยืม Projector ของคุณได้รับอนุมัติแล้ว',
        type: 'LOAN_APPROVED',
        targetRole: 'USER'
      },
      {
        title: 'ครุภัณฑ์ถูกส่งคืน',
        message: 'นาย A ส่งคืน Microphone ไร้สาย แล้ว',
        type: 'LOAN_RETURNED',
        targetRole: 'ADMIN'
      }
    ];
    
    for (let i = 0; i < testNotifications.length; i++) {
      const notif = testNotifications[i];
      try {
        const created = await prisma.notification.create({
          data: notif
        });
        console.log(`✅ ${i + 1}. สร้าง: ${notif.title} (ID: ${created.id})`);
      } catch (error) {
        console.log(`❌ ${i + 1}. ล้มเหลว: ${notif.title} - ${error.message}`);
      }
    }
    
    // แสดงผลลัพธ์
    console.log('\n📋 การแจ้งเตือนทั้งหมด:');
    const allNotifications = await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    allNotifications.forEach((notif, index) => {
      const status = notif.isRead ? '✅ อ่านแล้ว' : '🔴 ยังไม่อ่าน';
      const time = new Date(notif.createdAt).toLocaleString('th-TH');
      console.log(`${index + 1}. ${notif.title} - ${notif.type} ${status} (${time})`);
    });
    
    console.log(`\n📊 สรุป: มีการแจ้งเตือน ${allNotifications.length} รายการ`);
    const unreadCount = allNotifications.filter(n => !n.isRead).length;
    console.log(`🔴 ยังไม่อ่าน: ${unreadCount} รายการ`);
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testNotificationSystem();