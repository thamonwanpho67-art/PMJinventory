const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUserAssetImages() {
  try {
    console.log('=== ตรวจสอบรูปภาพสำหรับ User Assets ===\n');

    // ดึงข้อมูลอุปกรณ์ทั้งหมดที่มีรูปภาพ
    const assets = await prisma.asset.findMany({
      where: {
        imageUrl: {
          not: null
        }
      },
      select: {
        id: true,
        name: true,
        category: true,
        imageUrl: true,
        quantity: true,
        status: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log(`พบอุปกรณ์ที่มีรูปภาพ: ${assets.length} รายการ\n`);

    // แสดงรายละเอียดของแต่ละอุปกรณ์
    assets.forEach((asset, index) => {
      console.log(`${index + 1}. ${asset.name}`);
      console.log(`   หมวดหมู่: ${asset.category || 'ไม่ระบุ'}`);
      console.log(`   จำนวน: ${asset.quantity} ชิ้น`);
      console.log(`   สถานะ: ${asset.status}`);
      console.log(`   รูปภาพ: ${asset.imageUrl}`);
      console.log('');
    });

    // ตรวจสอบสถิติ
    const totalAssets = await prisma.asset.count();
    const assetsWithImages = assets.length;
    const percentage = ((assetsWithImages / totalAssets) * 100).toFixed(1);

    console.log(`=== สถิติรูปภาพ ===`);
    console.log(`อุปกรณ์ทั้งหมด: ${totalAssets} รายการ`);
    console.log(`มีรูปภาพ: ${assetsWithImages} รายการ (${percentage}%)`);
    console.log(`ไม่มีรูปภาพ: ${totalAssets - assetsWithImages} รายการ`);

    // ตรวจสอบหมวดหมู่ที่มีรูปภาพ
    const categoriesWithImages = [...new Set(assets.map(asset => asset.category || 'ไม่ระบุ'))];
    console.log(`\nหมวดหมู่ที่มีรูปภาพ: ${categoriesWithImages.length} หมวดหมู่`);
    categoriesWithImages.forEach(category => {
      const count = assets.filter(asset => (asset.category || 'ไม่ระบุ') === category).length;
      console.log(`- ${category}: ${count} รายการ`);
    });

  } catch (error) {
    console.error('เกิดข้อผิดพลาด:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserAssetImages();