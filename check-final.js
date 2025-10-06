const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAssets() {
  try {
    console.log('=== ตรวจสอบข้อมูลครุภัณฑ์ในระบบ ===\n');
    
    // จำนวนรวม
    const totalCount = await prisma.asset.count();
    console.log('📊 จำนวนครุภัณฑ์ทั้งหมด:', totalCount, 'รายการ');
    
    // สถานะ
    const availableCount = await prisma.asset.count({ where: { status: 'AVAILABLE' } });
    const damagedCount = await prisma.asset.count({ where: { status: 'DAMAGED' } });
    const outOfStockCount = await prisma.asset.count({ where: { status: 'OUT_OF_STOCK' } });
    
    console.log('\n📈 สถิติตามสถานะ:');
    console.log('- พร้อมใช้งาน (AVAILABLE):', availableCount, 'รายการ');
    console.log('- ชำรุด (DAMAGED):', damagedCount, 'รายการ');
    console.log('- หมด (OUT_OF_STOCK):', outOfStockCount, 'รายการ');
    
    // การยืม
    const loanCount = await prisma.loan.count();
    const pendingLoans = await prisma.loan.count({ where: { status: 'PENDING' } });
    const approvedLoans = await prisma.loan.count({ where: { status: 'APPROVED' } });
    
    console.log('\n📋 สถิติการยืม:');
    console.log('- คำขอยืมทั้งหมด:', loanCount, 'รายการ');
    console.log('- รออนุมัติ:', pendingLoans, 'รายการ');
    console.log('- อนุมัติแล้ว:', approvedLoans, 'รายการ');
    
    // อายุครุภัณฑ์
    const currentDate = new Date();
    const sevenYearsAgo = new Date(currentDate.getFullYear() - 7, currentDate.getMonth(), currentDate.getDate());
    
    const oldAssets = await prisma.asset.count({
      where: {
        accountingDate: {
          lt: sevenYearsAgo
        }
      }
    });
    
    const newAssets = totalCount - oldAssets;
    
    console.log('\n📅 อายุครุภัณฑ์:');
    console.log('- เก่ากว่า 7 ปี:', oldAssets, 'รายการ');
    console.log('- ใหม่กว่า 7 ปี:', newAssets, 'รายการ');
    
    // ตัวอย่างข้อมูลล่าสุด
    console.log('\n📝 ตัวอย่างครุภัณฑ์ล่าสุด (5 รายการ):');
    const latestAssets = await prisma.asset.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        name: true,
        code: true,
        category: true,
        status: true,
        accountingDate: true
      }
    });
    
    latestAssets.forEach((asset, index) => {
      const accountingYear = asset.accountingDate ? asset.accountingDate.getFullYear() : 'ไม่ระบุ';
      console.log(`${index + 1}. ${asset.name}`);
      console.log(`   รหัส: ${asset.code} | ประเภท: ${asset.category} | สถานะ: ${asset.status} | ปี: ${accountingYear}`);
    });
    
    console.log('\n✅ การตรวจสอบเสร็จสิ้น');
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAssets();