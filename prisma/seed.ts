import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

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

  // Create sample assets
  const assets = await Promise.all([
    prisma.asset.upsert({
      where: { code: 'NB001' },
      update: {},
      create: {
        code: 'NB001',
        name: 'Notebook Laptop Dell Inspiron',
        description: 'Laptop Dell Inspiron 15 3000 Series',
        category: 'คอมพิวเตอร์',
        location: 'ห้องทำงาน',
        status: 'AVAILABLE',
        imageUrl: '/images/laptop.jpg',
      },
    }),
    prisma.asset.upsert({
      where: { code: 'PRJ001' },
      update: {},
      create: {
        code: 'PRJ001',
        name: 'Projector Epson EB-S41',
        description: 'โปรเจ็คเตอร์ Epson EB-S41 3300 ANSI Lumens',
        category: 'อุปกรณ์นำเสนอ',
        location: 'ห้องประชุม',
        status: 'AVAILABLE',
        imageUrl: '/images/projector.jpg',
      },
    }),
    prisma.asset.upsert({
      where: { code: 'MIC001' },
      update: {},
      create: {
        code: 'MIC001',
        name: 'Microphone Wireless',
        description: 'ไมโครโฟนไร้สาย แบบมือถือ',
        category: 'อุปกรณ์เสียง',
        location: 'ห้องประชุม',
        status: 'DAMAGED',
        imageUrl: '/images/microphone.jpg',
      },
    }),
    prisma.asset.upsert({
      where: { code: 'CAM001' },
      update: {},
      create: {
        code: 'CAM001',
        name: 'Digital Camera Canon EOS',
        description: 'กล้องดิจิทัล Canon EOS 1500D',
        category: 'อุปกรณ์ถ่ายภาพ',
        location: 'ห้องสื่อ',
        status: 'OUT_OF_STOCK',
        imageUrl: '/images/camera.jpg',
      },
    }),
    prisma.asset.upsert({
      where: { code: 'TAB001' },
      update: {},
      create: {
        code: 'TAB001',
        name: 'Tablet iPad Air',
        description: 'Tablet iPad Air 10.9 inch',
        category: 'แท็บเล็ต',
        location: 'ห้องทำงาน',
        status: 'AVAILABLE',
        imageUrl: '/images/tablet.jpg',
      },
    }),
  ]);

  console.log('Created assets:', assets.length);

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
