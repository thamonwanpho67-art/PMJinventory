const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearTestData() {
  try {
    console.log('🧹 กำลังเคลียร์ข้อมูลทดสอบ...\n');

    // ลบ Notifications
    const deletedNotifications = await prisma.notification.deleteMany({});
    console.log(`✅ ลบการแจ้งเตือน: ${deletedNotifications.count} รายการ`);

    // ลบ Supply Transactions
    const deletedSupplyTransactions = await prisma.supplyTransaction.deleteMany({});
    console.log(`✅ ลบประวัติการเบิกวัสดุ: ${deletedSupplyTransactions.count} รายการ`);

    // ลบ Supply Requests
    const deletedSupplyRequests = await prisma.supplyRequest.deleteMany({});
    console.log(`✅ ลบคำขอเบิกวัสดุ: ${deletedSupplyRequests.count} รายการ`);

    // ลบ Loans
    const deletedLoans = await prisma.loan.deleteMany({});
    console.log(`✅ ลบคำขอยืมครุภัณฑ์: ${deletedLoans.count} รายการ`);

    // รีเซ็ต Supply Department Inventory (ไม่ลบ แต่รีเซ็ตเป็น 0)
    const resetDeptInventory = await prisma.supplyDepartmentInventory.updateMany({
      data: {
        quantity: 0
      }
    });
    console.log(`✅ รีเซ็ตจำนวนวัสดุแยกตามแผนก: ${resetDeptInventory.count} รายการ`);

    console.log('\n✨ เคลียร์ข้อมูลทดสอบเสร็จสิ้น!');
    console.log('ℹ️  ข้อมูล Assets และ Supplies ยังคงอยู่ในระบบ');

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearTestData();
