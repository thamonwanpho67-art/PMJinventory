const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function removeDuplicates() {
  try {
    console.log('🔍 กำลังตรวจสอบข้อมูลซ้ำ...');
    
    const totalBefore = await prisma.asset.count();
    console.log(`📊 ข้อมูลทั้งหมดก่อนลบ: ${totalBefore} รายการ`);
    
    // หาข้อมูลที่ซ้ำกันโดยใช้ combination ของ name + assetCode + costCenter
    const duplicateGroups = await prisma.asset.groupBy({
      by: ['name', 'assetCode', 'costCenter'],
      _count: {
        id: true
      },
      having: {
        id: {
          _count: {
            gt: 1
          }
        }
      }
    });
    
    console.log(`🎯 พบกลุ่มข้อมูลซ้ำ: ${duplicateGroups.length} กลุ่ม`);
    
    let deletedCount = 0;
    
    for (const group of duplicateGroups) {
      // หาข้อมูลทั้งหมดในกลุ่มนี้
      const duplicates = await prisma.asset.findMany({
        where: {
          name: group.name,
          assetCode: group.assetCode,
          costCenter: group.costCenter
        },
        orderBy: {
          createdAt: 'asc' // เก็บรายการที่สร้างก่อน
        }
      });
      
      // ลบทุกรายการยกเว้นรายการแรก
      const toDelete = duplicates.slice(1); // เอาทุกรายการยกเว้นรายการแรก
      
      if (toDelete.length > 0) {
        console.log(`\n🗑️ ลบข้อมูลซ้ำ: ${group.name}`);
        console.log(`   จำนวนที่ลบ: ${toDelete.length} รายการ`);
        
        for (const item of toDelete) {
          await prisma.asset.delete({
            where: { id: item.id }
          });
          deletedCount++;
        }
      }
    }
    
    const totalAfter = await prisma.asset.count();
    console.log(`\n✅ เสร็จสิ้น!`);
    console.log(`📊 ข้อมูลทั้งหมดหลังลบ: ${totalAfter} รายการ`);
    console.log(`🗑️ ลบไปทั้งหมด: ${deletedCount} รายการ`);
    console.log(`📈 ข้อมูลคงเหลือ: ${totalAfter} รายการ`);
    
    if (totalAfter === 204) {
      console.log('🎉 ข้อมูลกลับมาเป็น 204 รายการแล้ว!');
    } else {
      console.log(`⚠️ ข้อมูลยังไม่ใช่ 204 รายการ (มี ${totalAfter} รายการ)`);
    }
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  } finally {
    await prisma.$disconnect();
  }
}

removeDuplicates();