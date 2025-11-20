const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearTestData() {
  try {
    console.log('🧹 กำลังเคลียร์ข้อมูลทดสอบ...\n');

    // ลบ Notifications
    const deletedNotifications = await prisma.notification.deleteMany({});
    console.log(`✅ ลบการแจ้งเตือน: ${deletedNotifications.count} รายการ`);

    // ลบ Supply Transactions (ประวัติการเบิก-นำเข้า)
    const deletedSupplyTransactions = await prisma.supplyTransaction.deleteMany({});
    console.log(`✅ ลบประวัติการเบิก-นำเข้าวัสดุ: ${deletedSupplyTransactions.count} รายการ`);

    // ลบ Supply Requests
    const deletedSupplyRequests = await prisma.supplyRequest.deleteMany({});
    console.log(`✅ ลบคำขอเบิกวัสดุ: ${deletedSupplyRequests.count} รายการ`);

    // ลบ Loans
    const deletedLoans = await prisma.loan.deleteMany({});
    console.log(`✅ ลบคำขอยืมครุภัณฑ์: ${deletedLoans.count} รายการ`);

    // ลบ Supply Department Inventory ทั้งหมด
    const deletedDeptInventory = await prisma.supplyDepartmentInventory.deleteMany({});
    console.log(`✅ ลบข้อมูลวัสดุแยกตามแผนก: ${deletedDeptInventory.count} รายการ`);

    console.log('\n✨ เคลียร์ข้อมูลทดสอบเสร็จสิ้น!');
    console.log('ℹ️  ข้อมูล Assets และ Supplies ยังคงอยู่ในระบบ');

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearTestData();
