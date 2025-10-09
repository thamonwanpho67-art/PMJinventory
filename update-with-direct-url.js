const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateWithDirectImageUrl() {
  try {
    console.log('🔄 อัปเดตด้วยรูปภาพตู้เหล็กจาก URL โดยตรง...');

    // ใช้รูปภาพจาก source อื่น
    const directImageUrl = 'https://cdn.pixabay.com/photo/2017/02/14/12/36/filing-cabinet-2066474_1280.jpg';

    const result = await prisma.asset.updateMany({
      where: {
        name: {
          contains: 'ตู้เหล็ก',
          mode: 'insensitive'
        }
      },
      data: {
        imageUrl: directImageUrl
      }
    });

    console.log(`✅ อัปเดตรูปภาพสำเร็จ: ${result.count} รายการ`);
    console.log(`🔗 URL ใหม่: ${directImageUrl}`);

    // ตรวจสอบผลลัพธ์
    const updatedAssets = await prisma.asset.findMany({
      where: {
        name: {
          contains: 'ตู้เหล็ก',
          mode: 'insensitive'
        },
        imageUrl: directImageUrl
      },
      select: {
        name: true,
        code: true,
        imageUrl: true
      }
    });

    console.log(`✅ ยืนยัน: ${updatedAssets.length} รายการได้รับการอัปเดต`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateWithDirectImageUrl();