// สคริปต์สำหรับนำเข้าข้อมูลครุภัณฑ์จากไฟล์ JSON
// Import script for asset data from JSON file

async function importAssetsFromFile() {
  try {
    // อ่านไฟล์ JSON
    const response = await fetch('/ข้อมูลทรัพย์สิน.json');
    if (!response.ok) {
      throw new Error('ไม่สามารถอ่านไฟล์ JSON ได้');
    }
    
    const jsonData = await response.json();
    console.log(`พบข้อมูล ${jsonData.length} รายการ`);

    // แปลงข้อมูลให้ตรงกับ format ของระบบ
    const assets = jsonData.map((item, index) => {
      // จัดการรหัสครุภัณฑ์
      let code = item['รหัสสินทรัพย์(GFMIS)#S. No.'] || `ASSET-${index + 1}`;
      if (code.startsWith('#')) {
        code = `ITEM-${item['ลำดับ']}-${code.replace('#', '')}`;
      }

      // จัดการรหัสครุภัณฑ์
      let assetCode = item['รหัสครุภัณฑ์'];
      if (assetCode === 'nan' || !assetCode) {
        assetCode = null;
      }

      // แปลงวันที่
      let accountingDate = null;
      if (item['วันที่ลงบัญชี'] && item['วันที่ลงบัญชี'] !== 'nan') {
        const dateStr = item['วันที่ลงบัญชี'].split(' ')[0]; // เอาแค่ส่วนวันที่
        // แปลงจาก พ.ศ. เป็น ค.ศ.
        const [year, month, day] = dateStr.split('-');
        if (year && year.length === 4) {
          const christianYear = parseInt(year) > 2400 ? parseInt(year) - 543 : parseInt(year);
          accountingDate = `${christianYear}-${month}-${day}`;
        }
      }

      // กำหนดหมวดหมู่ตามชื่อ
      let category = 'อุปกรณ์ทั่วไป';
      const name = item['ชื่อทรัพย์สิน'] || '';
      if (name.includes('คอมพิวเตอร์') || name.includes('เครื่องพิมพ์') || name.includes('สแกนเนอร์')) {
        category = 'อุปกรณ์คอมพิวเตอร์';
      } else if (name.includes('ตู้') || name.includes('โต๊ะ') || name.includes('เก้าอี้')) {
        category = 'เฟอร์นิเจอร์';
      } else if (name.includes('รถ')) {
        category = 'ยานพาหนะ';
      } else if (name.includes('เครื่องปรับอากาศ')) {
        category = 'เครื่องใช้ไฟฟ้า';
      }

      return {
        code: code,
        name: item['ชื่อทรัพย์สิน'] || 'ไม่ระบุชื่อ',
        assetCode: assetCode,
        price: item['ราคา'] ? parseFloat(item['ราคา'].toString().replace(/,/g, '')) : 0,
        costCenter: item['ศูนย์ต้นทุน'] || null,
        accountingDate: accountingDate,
        category: category,
        description: `นำเข้าจากไฟล์ JSON ลำดับที่ ${item['ลำดับ']}`,
        quantity: 1,
        status: 'AVAILABLE'
      };
    });

    console.log('ข้อมูลที่เตรียมนำเข้า:', assets.slice(0, 3)); // แสดง 3 รายการแรก

    // เรียก API เพื่อนำเข้าข้อมูล
    const importResponse = await fetch('/api/assets/bulk-import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ assets })
    });

    const result = await importResponse.json();
    
    if (importResponse.ok) {
      console.log(`✅ สำเร็จ! เพิ่มครุภัณฑ์ได้ ${result.created} รายการ`);
      alert(`✅ สำเร็จ! เพิ่มครุภัณฑ์ได้ ${result.created} รายการ`);
      
      if (result.errorCount > 0) {
        console.log(`⚠️  มีข้อผิดพลาด ${result.errorCount} รายการ:`);
        result.errors.slice(0, 10).forEach(error => {
          console.log(`   - ${error.code}: ${error.error}`);
        });
        if (result.errors.length > 10) {
          console.log(`   ... และอีก ${result.errors.length - 10} รายการ`);
        }
        alert(`⚠️ มีข้อผิดพลาด ${result.errorCount} รายการ กรุณาดูรายละเอียดใน Console`);
      }
      
      // Refresh หน้าเว็บเพื่อแสดงข้อมูลใหม่
      if (window.location.pathname.includes('/admin/assets')) {
        window.location.reload();
      }
    } else {
      const errorMessage = result.error || 'เกิดข้อผิดพลาดไม่ทราบสาเหตุ';
      console.error('❌ เกิดข้อผิดพลาด:', errorMessage);
      alert('❌ เกิดข้อผิดพลาด: ' + errorMessage);
    }
  } catch (error) {
    let errorMessage = 'เกิดข้อผิดพลาดในการนำเข้าข้อมูล';
    
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error === 'object' && error.toString) {
      errorMessage = error.toString();
    }
    
    console.error('❌ เกิดข้อผิดพลาดในการนำเข้าข้อมูล:', error);
    alert('เกิดข้อผิดพลาด: ' + errorMessage);
  }
}

// ฟังก์ชันสำหรับคัดลอกไฟล์ JSON ไปยัง public folder
async function setupJSONFile() {
  console.log('📁 กรุณาคัดลอกไฟล์ "ข้อมูลทรัพย์สิน.json" ไปไว้ที่ public/ข้อมูลทรัพย์สิน.json');
  console.log('แล้วรันคำสั่ง importAssetsFromFile() อีกครั้ง');
}

// Export สำหรับใช้ใน browser console
if (typeof window !== 'undefined') {
  window.importAssetsFromFile = importAssetsFromFile;
  window.setupJSONFile = setupJSONFile;
}

console.log('🚀 สคริปต์นำเข้าข้อมูลพร้อมใช้งาน');
console.log('📋 ให้รันคำสั่ง: importAssetsFromFile()');