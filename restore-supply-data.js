const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function restoreSupplyData() {
  try {
    console.log('🔄 กำลังคืนข้อมูลวัสดุสิ้นเปลือง...\n');

    // ตรวจสอบว่ามีข้อมูลอยู่แล้วหรือไม่
    const existingSupplies = await prisma.supply.count();
    
    if (existingSupplies > 0) {
      console.log(`ℹ️  มีข้อมูลวัสดุสิ้นเปลืองอยู่แล้ว ${existingSupplies} รายการ`);
      return;
    }

    // สร้างข้อมูลวัสดุสิ้นเปลืองใหม่
    const supplies = [
      {
        name: 'กระดาษ A4',
        description: 'กระดาษ A4 80 แกรม',
        category: 'อุปกรณ์สำนักงาน',
        unit: 'รีม',
        quantity: 100,
        minStock: 10,
      },
      {
        name: 'ปากกาลูกลื่น',
        description: 'ปากกาลูกลื่น สีน้ำเงิน',
        category: 'อุปกรณ์สำนักงาน',
        unit: 'ด้าม',
        quantity: 200,
        minStock: 20,
      },
      {
        name: 'แฟ้มเจาะสัน',
        description: 'แฟ้มเจาะสัน 2 นิ้ว',
        category: 'อุปกรณ์สำนักงาน',
        unit: 'เล่ม',
        quantity: 50,
        minStock: 10,
      },
      {
        name: 'คลิปหนีบกระดาษ',
        description: 'คลิปหนีบกระดาษ เบอร์ 3',
        category: 'อุปกรณ์สำนักงาน',
        unit: 'กล่อง',
        quantity: 30,
        minStock: 5,
      },
      {
        name: 'กาวลาเทกซ์',
        description: 'กาวลาเทกซ์ขนาด 100 กรัม',
        category: 'อุปกรณ์สำนักงาน',
        unit: 'ขวด',
        quantity: 15,
        minStock: 5,
      },
      {
        name: 'ซองเอกสาร A4',
        description: 'ซองเอกสาร A4 สีน้ำตาล',
        category: 'อุปกรณ์สำนักงาน',
        unit: 'แพ็ค',
        quantity: 40,
        minStock: 10,
      }
    ];

    for (const supply of supplies) {
      await prisma.supply.create({
        data: supply
      });
    }

    console.log(`✅ คืนข้อมูลวัสดุสิ้นเปลือง: ${supplies.length} รายการ`);
    console.log('\n✨ คืนข้อมูลเสร็จสิ้น!');

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreSupplyData();
