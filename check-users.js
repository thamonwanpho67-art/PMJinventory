const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('=== ตรวจสอบผู้ใช้ในฐานข้อมูล ===\n');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        password: true // เพื่อตรวจสอบ hash
      }
    });
    
    console.log('จำนวนผู้ใช้ทั้งหมด:', users.length);
    
    if (users.length === 0) {
      console.log('❌ ไม่พบผู้ใช้ในฐานข้อมูล - ต้องรัน seed ก่อน');
      return;
    }
    
    console.log('\n📝 รายชื่อผู้ใช้:');
    for (const user of users) {
      console.log(`\n👤 ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log(`   Password Hash: ${user.password.substring(0, 20)}...`);
      
      // ทดสอบรหัสผ่าน
      if (user.email === 'admin@office.com') {
        const isValid = await bcrypt.compare('admin123', user.password);
        console.log(`   ✅ Password 'admin123' valid: ${isValid}`);
      }
      
      if (user.email === 'user@office.com') {
        const isValid = await bcrypt.compare('user123', user.password);
        console.log(`   ✅ Password 'user123' valid: ${isValid}`);
      }
    }
    
    console.log('\n🔐 ข้อมูลสำหรับทดสอบ:');
    console.log('Admin: admin@office.com / admin123');
    console.log('User: user@office.com / user123');
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();