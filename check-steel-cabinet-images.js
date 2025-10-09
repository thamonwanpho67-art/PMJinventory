const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSteelCabinetImages() {
  try {
    console.log('🔍 ตรวจสอบรูปภาพตู้เหล็กในฐานข้อมูล...');

    // ตรวจสอบ assets ที่มีคำว่า "ตู้เหล็ก"
    const steelCabinets = await prisma.asset.findMany({
      where: {
        name: {
          contains: 'ตู้เหล็ก',
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        name: true,
        code: true,
        imageUrl: true
      }
    });

    console.log(`พบครุภัณฑ์ตู้เหล็ก: ${steelCabinets.length} รายการ\n`);

    // แสดงรายการและ URL รูปภาพ
    steelCabinets.forEach((asset, index) => {
      console.log(`${index + 1}. ${asset.name}`);
      console.log(`   Code: ${asset.code}`);
      console.log(`   Image URL: ${asset.imageUrl || 'ไม่มีรูปภาพ'}\n`);
    });

    // นับจำนวนที่มี URL ตรงกัน
    const expectedUrl = 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop';
    const correctImages = steelCabinets.filter(asset => asset.imageUrl === expectedUrl);
    
    console.log(`📊 สถิติ:`);
    console.log(`   ครุภัณฑ์ตู้เหล็กทั้งหมด: ${steelCabinets.length}`);
    console.log(`   มีรูปภาพถูกต้อง: ${correctImages.length}`);
    console.log(`   ไม่มีรูปภาพ: ${steelCabinets.filter(a => !a.imageUrl).length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSteelCabinetImages();