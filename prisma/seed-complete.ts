import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@office.com' },
    update: {},
    create: {
      email: 'admin@office.com',
      name: 'Admin User',
      password: hashedPassword,
      role: Role.ADMIN,
    },
  });

  console.log('Created admin user:', adminUser);

  // Create regular user
  const userPassword = await bcrypt.hash('user123', 10);
  
  const regularUser = await prisma.user.upsert({
    where: { email: 'user@office.com' },
    update: {},
    create: {
      email: 'user@office.com',
      name: 'Regular User',
      password: userPassword,
      role: Role.USER,
    },
  });

  console.log('Created regular user:', regularUser);

  // Helper function to convert Buddhist Era date to Gregorian date
  function convertBuddhistToGregorian(buddhistDateStr: string): Date | null {
    if (!buddhistDateStr || buddhistDateStr === 'nan') return null;
    
    try {
      const date = new Date(buddhistDateStr);
      if (isNaN(date.getTime())) return null;
      
      // Convert Buddhist year to Gregorian year (subtract 543)
      const gregorianYear = date.getFullYear() - 543;
      return new Date(gregorianYear, date.getMonth(), date.getDate());
    } catch {
      return null;
    }
  }

  // Function to categorize assets based on name
  function categorizeAsset(name: string): string {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('คอมพิวเตอร์') || lowerName.includes('computer')) return 'คอมพิวเตอร์';
    if (lowerName.includes('ไมโครโฟน') || lowerName.includes('microphone') || lowerName.includes('ลำโพง')) return 'อุปกรณ์เสียง';
    if (lowerName.includes('ตู้') || lowerName.includes('cabinet')) return 'เฟอร์นิเจอร์';
    if (lowerName.includes('เก้าอี้') || lowerName.includes('chair')) return 'เฟอร์นิเจอร์';
    if (lowerName.includes('โต๊ะ') || lowerName.includes('table') || lowerName.includes('desk')) return 'เฟอร์นิเจอร์';
    if (lowerName.includes('รถ') || lowerName.includes('vehicle')) return 'ยานพาหนะ';
    if (lowerName.includes('เครื่องปรับอากาศ') || lowerName.includes('air')) return 'เครื่องใช้ไฟฟ้า';
    if (lowerName.includes('สแกน') || lowerName.includes('scanner')) return 'อุปกรณ์สำนักงาน';
    if (lowerName.includes('ปริ๊น') || lowerName.includes('printer')) return 'อุปกรณ์สำนักงาน';
    if (lowerName.includes('โปรเจค') || lowerName.includes('projector')) return 'อุปกรณ์นำเสนอ';
    if (lowerName.includes('จอ') || lowerName.includes('screen')) return 'อุปกรณ์นำเสนอ';
    if (lowerName.includes('เครื่องฉาย')) return 'อุปกรณ์นำเสนอ';
    if (lowerName.includes('เครื่องขยายเสียง') || lowerName.includes('ขาไมโครโฟน')) return 'อุปกรณ์เสียง';
    if (lowerName.includes('พิมพ์ดีด') || lowerName.includes('typewriter')) return 'อุปกรณ์สำนักงาน';
    if (lowerName.includes('เรือ') || lowerName.includes('boat')) return 'ยานพาหนะ';
    if (lowerName.includes('จักรยานยนต์') || lowerName.includes('motorcycle')) return 'ยานพาหนะ';
    if (lowerName.includes('บอร์ดประชาสัมพันธ์') || lowerName.includes('board')) return 'อุปกรณ์นำเสนอ';
    return 'อื่นๆ';
  }

  // Function to determine location based on cost center
  function determineLocation(costCenter: string): string {
    if (costCenter === '0600200006') return 'สำนักงานข้อมูลสารสนเทศ';
    if (costCenter === '0600200064') return 'สำนักงานพัฒนาจังหวัดพะเยา';
    if (costCenter === '0600200002') return 'สำนักงานกลุ่มงานบริหาร';
    if (costCenter === '0600200010') return 'สำนักงานแผนงานโครงการ';
    if (costCenter === '0600200003') return 'สำนักงานกิจการพิเศษ';
    return 'สำนักงานทั่วไป';
  }

  // Read and import all asset data from JSON
  try {
    const jsonPath = path.join(process.cwd(), 'public', 'ข้อมูลทรัพย์สิน.json');
    const jsonData = fs.readFileSync(jsonPath, 'utf8');
    const assetData = JSON.parse(jsonData);

    console.log(`Found ${assetData.length} assets in JSON file`);
    console.log('Creating assets from JSON data...');
    
    let createdCount = 0;
    let skippedCount = 0;
    
    for (const item of assetData) {
      try {
        const assetCode = item['รหัสครุภัณฑ์'] && item['รหัสครุภัณฑ์'] !== 'nan' ? item['รหัสครุภัณฑ์'] : null;
        const gfmisCode = item['รหัสสินทรัพย์(GFMIS)#S. No.'] && !item['รหัสสินทรัพย์(GFMIS)#S. No.'].startsWith('#') && item['รหัสสินทรัพย์(GFMIS)#S. No.'] !== 'nan' 
          ? item['รหัสสินทรัพย์(GFMIS)#S. No.'] 
          : `ASSET-${item['ลำดับ']}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const price = parseFloat(item['ราคา']) || 0;
        const accountingDate = convertBuddhistToGregorian(item['วันที่ลงบัญชี']);
        
        // Check if asset already exists
        const existing = await prisma.asset.findUnique({
          where: { code: gfmisCode }
        });

        if (existing) {
          skippedCount++;
          continue;
        }
        
        await prisma.asset.create({
          data: {
            code: gfmisCode,
            name: item['ชื่อทรัพย์สิน'],
            assetCode: assetCode,
            category: categorizeAsset(item['ชื่อทรัพย์สิน']),
            location: determineLocation(item['ศูนย์ต้นทุน']),
            costCenter: item['ศูนย์ต้นทุน'],
            price: price,
            accountingDate: accountingDate,
            status: 'AVAILABLE',
          },
        });
        
        createdCount++;
        
        if (createdCount % 50 === 0) {
          console.log(`Created ${createdCount} assets...`);
        }
      } catch (error) {
        console.error(`Error creating asset ${item['ลำดับ']}:`, error);
        skippedCount++;
      }
    }

    console.log(`✅ Successfully created ${createdCount} assets`);
    console.log(`⚠️  Skipped ${skippedCount} assets (duplicates or errors)`);
    
  } catch (error) {
    console.error('Error reading or processing JSON file:', error);
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });