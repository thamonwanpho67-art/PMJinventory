const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// URL รูปภาพตู้เหล็กที่ได้รับจากผู้ใช้
const steelCabinetImageUrl = 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop';

async function updateSteelCabinetImages() {
  try {
    console.log('🔍 ค้นหาครุภัณฑ์ที่มีคำว่า "ตู้เหล็ก"...');

    // ค้นหา assets ที่มีคำว่า "ตู้เหล็ก" ในชื่อ
    const steelCabinets = await prisma.asset.findMany({
      where: {
        name: {
          contains: 'ตู้เหล็ก',
          mode: 'insensitive' // Case insensitive search
        }
      }
    });

    console.log(`พบครุภัณฑ์ตู้เหล็ก: ${steelCabinets.length} รายการ`);

    if (steelCabinets.length === 0) {
      console.log('❌ ไม่พบครุภัณฑ์ที่มีคำว่า "ตู้เหล็ก"');
      return;
    }

    // แสดงรายการที่จะอัปเดต
    console.log('\n📝 รายการที่จะอัปเดต:');
    steelCabinets.forEach((asset, index) => {
      console.log(`${index + 1}. ${asset.name} (${asset.code})`);
    });

    console.log('\n🖼️ เริ่มอัปเดตรูปภาพ...');

    let updated = 0;

    // อัปเดตรูปภาพทีละรายการ
    for (const asset of steelCabinets) {
      try {
        await prisma.asset.update({
          where: { id: asset.id },
          data: { imageUrl: steelCabinetImageUrl }
        });

        updated++;
        console.log(`✅ อัปเดต: ${asset.name} (${asset.code})`);

      } catch (error) {
        console.error(`❌ Error updating asset ${asset.id}:`, error);
      }
    }

    console.log(`\n🎉 เสร็จสิ้น! อัปเดตรูปภาพตู้เหล็กแล้ว ${updated}/${steelCabinets.length} รายการ`);

    // ตรวจสอบผลลัพธ์
    const updatedAssets = await prisma.asset.findMany({
      where: {
        name: {
          contains: 'ตู้เหล็ก',
          mode: 'insensitive'
        },
        imageUrl: steelCabinetImageUrl
      }
    });

    console.log(`✅ ยืนยัน: ${updatedAssets.length} รายการได้รับการอัปเดตรูปภาพแล้ว`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateSteelCabinetImages();