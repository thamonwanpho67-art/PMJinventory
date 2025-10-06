const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkNotificationSystem() {
  try {
    console.log('🔍 ตรวจสอบระบบการแจ้งเตือน\n');
    
    // ตรวจสอบ table Notification
    try {
      const notificationCount = await prisma.notification.count();
      console.log('📊 จำนวนการแจ้งเตือนในระบบ:', notificationCount);
      
      if (notificationCount > 0) {
        const notifications = await prisma.notification.findMany({
          orderBy: { createdAt: 'desc' },
          take: 5
        });
        
        console.log('\n📋 การแจ้งเตือนล่าสุด:');
        notifications.forEach((notif, index) => {
          console.log(`${index + 1}. ${notif.title} - ${notif.type} (${notif.isRead ? 'อ่านแล้ว' : 'ยังไม่อ่าน'})`);
        });
      } else {
        console.log('⚠️ ไม่มีการแจ้งเตือนในระบบ');
      }
    } catch (error) {
      console.log('❌ ไม่สามารถเข้าถึง Notification table:', error.message);
    }
    
    // ตรวจสอบ Loan requests
    try {
      const loanCount = await prisma.loan.count();
      console.log('\n📊 จำนวนคำขอยืมทั้งหมด:', loanCount);
      
      if (loanCount > 0) {
        const loans = await prisma.loan.findMany({
          include: {
            user: { select: { name: true, email: true } },
            asset: { select: { name: true, code: true } }
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        });
        
        console.log('\n📋 คำขอยืมล่าสุด:');
        loans.forEach((loan, index) => {
          console.log(`${index + 1}. ${loan.user.name} ยืม ${loan.asset.name} - สถานะ: ${loan.status}`);
        });
      } else {
        console.log('⚠️ ไม่มีคำขอยืมในระบบ');
        console.log('💡 ลองทำการยืมครุภัณฑ์เพื่อทดสอบการแจ้งเตือน');
      }
    } catch (error) {
      console.log('❌ ไม่สามารถเข้าถึง Loan table:', error.message);
    }
    
    // สร้างการแจ้งเตือนทดสอบ
    console.log('\n🧪 สร้างการแจ้งเตือนทดสอบ...');
    try {
      const testNotification = await prisma.notification.create({
        data: {
          title: 'ทดสอบระบบการแจ้งเตือน',
          message: 'นี่คือการแจ้งเตือนทดสอบระบบ',
          type: 'LOAN_REQUEST',
          targetRole: 'ADMIN',
          isRead: false
        }
      });
      
      console.log('✅ สร้างการแจ้งเตือนทดสอบสำเร็จ:', testNotification.id);
    } catch (error) {
      console.log('❌ ไม่สามารถสร้างการแจ้งเตือนทดสอบ:', error.message);
    }
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkNotificationSystem();