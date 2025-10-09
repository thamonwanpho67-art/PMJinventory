const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function forceUpdateSteelCabinetImages() {
  try {
    console.log('🔄 บังคับอัปเดตรูปภาพตู้เหล็กด้วย URL ใหม่...');

    // URL ใหม่ที่มี timestamp เพื่อบังคับ cache refresh
    const timestamp = Date.now();
    const newImageUrl = `https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop&t=${timestamp}`;

    // อัปเดตทุกตู้เหล็ก
    const result = await prisma.asset.updateMany({
      where: {
        name: {
          contains: 'ตู้เหล็ก',
          mode: 'insensitive'
        }
      },
      data: {
        imageUrl: newImageUrl
      }
    });

    console.log(`✅ อัปเดตรูปภาพสำเร็จ: ${result.count} รายการ`);
    console.log(`🔗 URL ใหม่: ${newImageUrl}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

forceUpdateSteelCabinetImages();