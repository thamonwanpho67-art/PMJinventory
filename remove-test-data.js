const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function removeTestData() {
  try {
    console.log('🗑️ กำลังลบ test data...\n');
    
    const totalBefore = await prisma.asset.count();
    console.log(`📊 ข้อมูลทั้งหมดก่อนลบ: ${totalBefore} รายการ`);
    
    // หาข้อมูลที่มี assetCode ขึ้นต้นด้วย "#"
    const testDataAssets = await prisma.asset.findMany({
      where: {
        assetCode: {
          startsWith: '#'
        }
      },
      select: {
        id: true,
        name: true,
        assetCode: true
      }
    });
    
    console.log(`🎯 พบ test data ที่จะลบ: ${testDataAssets.length} รายการ`);
    
    if (testDataAssets.length > 0) {
      console.log('\n📋 รายการที่จะลบ (แสดง 10 รายการแรก):');
      testDataAssets.slice(0, 10).forEach((asset, index) => {
        console.log(`${index + 1}. ${asset.name} (${asset.assetCode})`);
      });
      
      if (testDataAssets.length > 10) {
        console.log(`... และอีก ${testDataAssets.length - 10} รายการ`);
      }
      
      console.log('\n🗑️ กำลังลบข้อมูล...');
      
      // ลบข้อมูลทีละชุด
      let deletedCount = 0;
      for (const asset of testDataAssets) {
        try {
          await prisma.asset.delete({
            where: { id: asset.id }
          });
          deletedCount++;
          
          if (deletedCount % 10 === 0) {
            console.log(`   ลบไปแล้ว: ${deletedCount}/${testDataAssets.length} รายการ`);
          }
        } catch (error) {
          console.log(`   ❌ ไม่สามารถลบ ${asset.name}: ${error.message}`);
        }
      }
      
      const totalAfter = await prisma.asset.count();
      
      console.log('\n✅ เสร็จสิ้น!');
      console.log(`📊 ข้อมูลทั้งหมดก่อนลบ: ${totalBefore} รายการ`);
      console.log(`📊 ข้อมูลทั้งหมดหลังลบ: ${totalAfter} รายการ`);
      console.log(`🗑️ ลบไปทั้งหมด: ${deletedCount} รายการ`);
      
      if (totalAfter === 204) {
        console.log('🎉 ได้จำนวน 204 รายการที่ต้องการแล้ว!');
      } else if (totalAfter < 204) {
        console.log(`⚠️ ข้อมูลน้อยกว่า 204 รายการ (ขาด ${204 - totalAfter} รายการ)`);
      } else {
        console.log(`⚠️ ข้อมูลยังเกิน 204 รายการ (เกิน ${totalAfter - 204} รายการ)`);
      }
      
    } else {
      console.log('ไม่พบ test data ที่จะลบ');
    }
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  } finally {
    await prisma.$disconnect();
  }
}

removeTestData();