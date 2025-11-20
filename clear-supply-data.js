const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearSupplyData() {
  try {
    console.log('🧹 กำลังเคลียร์ข้อมูลวัสดุสิ้นเปลือง...\n');

    // ลบ Supply Department Inventory
    const deletedDeptInventory = await prisma.supplyDepartmentInventory.deleteMany({});
    console.log(`✅ ลบข้อมูลวัสดุแยกตามแผนก: ${deletedDeptInventory.count} รายการ`);

    // ลบ Supply Transactions
    const deletedTransactions = await prisma.supplyTransaction.deleteMany({});
    console.log(`✅ ลบประวัติการเบิก-นำเข้า: ${deletedTransactions.count} รายการ`);

    // ลบ Supply Requests
    const deletedRequests = await prisma.supplyRequest.deleteMany({});
    console.log(`✅ ลบคำขอเบิก: ${deletedRequests.count} รายการ`);

    // ลบ Supplies ทั้งหมด
    const deletedSupplies = await prisma.supply.deleteMany({});
    console.log(`✅ ลบวัสดุสิ้นเปลือง: ${deletedSupplies.count} รายการ`);

    console.log('\n✨ เคลียร์ข้อมูลวัสดุสิ้นเปลืองทั้งหมดเสร็จสิ้น!');

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearSupplyData();
