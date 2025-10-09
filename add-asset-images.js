const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// รูปภาพ sample สำหรับประเภทครุภัณฑ์ต่างๆ
const assetImages = {
  // เครื่องใช้สำนักงาน
  'office': [
    'https://images.unsplash.com/photo-1541746972996-4e0b0f93e586?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=400&h=300&fit=crop'
  ],
  // เครื่องคอมพิวเตอร์
  'computer': [
    'https://images.unsplash.com/photo-1547082299-de196ea013d6?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1585792180666-f7347c490ee2?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=300&fit=crop'
  ],
  // เครื่องใช้ไฟฟ้า
  'electronic': [
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1609662357450-5c6fb05f5067?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop'
  ],
  // โต๊ะ เก้าอี้
  'furniture': [
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1550226891-ef816aed4a98?w=400&h=300&fit=crop'
  ],
  // เครื่องจักร
  'machine': [
    'https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1553406830-ef2513450d76?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop'
  ],
  // อุปกรณ์ทั่วไป
  'general': [
    'https://images.unsplash.com/photo-1604754742629-3e5728249d73?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1560472355-536de3962603?w=400&h=300&fit=crop'
  ]
};

// กำหนดประเภทของครุภัณฑ์ตามชื่อ
function getAssetType(assetName) {
  const name = assetName.toLowerCase();
  
  if (name.includes('computer') || name.includes('คอมพิวเตอร์') || name.includes('laptop') || name.includes('โน๊ตบุ๊ค') || name.includes('monitor') || name.includes('จอ')) {
    return 'computer';
  }
  if (name.includes('chair') || name.includes('เก้าอี้') || name.includes('table') || name.includes('โต๊ะ') || name.includes('desk') || name.includes('ตู้')) {
    return 'furniture';
  }
  if (name.includes('printer') || name.includes('เครื่องพิมพ์') || name.includes('scanner') || name.includes('phone') || name.includes('โทรศัพท์') || name.includes('air') || name.includes('แอร์')) {
    return 'electronic';
  }
  if (name.includes('machine') || name.includes('เครื่องจักร') || name.includes('engine') || name.includes('motor')) {
    return 'machine';
  }
  if (name.includes('office') || name.includes('สำนักงาน') || name.includes('file') || name.includes('แฟ้ม') || name.includes('pen') || name.includes('ปากกา')) {
    return 'office';
  }
  
  return 'general';
}

// สุ่มรูปภาพ
function getRandomImage(assetType) {
  const images = assetImages[assetType] || assetImages.general;
  return images[Math.floor(Math.random() * images.length)];
}

async function addImagesToAssets() {
  try {
    console.log('🖼️  เริ่มเพิ่มรูปภาพให้กับครุภัณฑ์...');
    
    // ดึง assets ทั้งหมดที่ยังไม่มีรูป
    const assets = await prisma.asset.findMany({
      where: {
        OR: [
          { imageUrl: null },
          { imageUrl: '' }
        ]
      }
    });
    
    console.log(`พบครุภัณฑ์ที่ต้องเพิ่มรูป: ${assets.length} รายการ`);
    
    let updated = 0;
    
    for (const asset of assets) {
      try {
        const assetType = getAssetType(asset.name);
        const imageUrl = getRandomImage(assetType);
        
        await prisma.asset.update({
          where: { id: asset.id },
          data: { imageUrl: imageUrl }
        });
        
        updated++;
        
        if (updated % 10 === 0) {
          console.log(`✅ อัปเดตแล้ว ${updated}/${assets.length} รายการ`);
        }
        
        // หน่วงเวลาเล็กน้อยเพื่อไม่ให้ระบบเกิด overload
        await new Promise(resolve => setTimeout(resolve, 50));
        
      } catch (error) {
        console.error(`❌ Error updating asset ${asset.id}:`, error);
      }
    }
    
    console.log(`🎉 เสร็จสิ้น! อัปเดตรูปภาพให้กับครุภัณฑ์แล้ว ${updated} รายการ`);
    
    // ตรวจสอบผลลัพธ์
    const assetsWithImages = await prisma.asset.count({
      where: {
        AND: [
          { imageUrl: { not: null } },
          { imageUrl: { not: '' } }
        ]
      }
    });
    
    const totalAssets = await prisma.asset.count();
    
    console.log(`📊 สถิติ: ${assetsWithImages}/${totalAssets} รายการมีรูปภาพแล้ว`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addImagesToAssets();