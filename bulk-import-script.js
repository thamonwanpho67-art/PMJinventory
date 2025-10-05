// Script to bulk import assets from the provided data
// รันสคริปต์นี้เพื่อเพิ่มข้อมูลครุภัณฑ์ทั้งหมด

const assetsData = [
  {
    code: "100000025629",
    assetCode: "พม/พมจ-พล/13-01-03/115/2561",
    name: "เครื่องคอมพิวเตอร์สำหรับงานประมวลผล แบบที่ 1 พร้อมระบบปฏิบัติการ",
    price: "19800.00",
    costCenter: "0600200006",
    accountingDate: "2018-08-14"
  },
  {
    code: "100000024073#37",
    assetCode: "พม/สป-ศทส/13-01-26/037/2561",
    name: "เครื่องคอมพิวเตอร์โน้ตบุ๊กสำหรับงานประมวลผล",
    price: "24717.00",
    costCenter: "0600200006",
    accountingDate: "2018-04-17"
  },
  {
    code: "100000023942#58",
    assetCode: "พม/สป-ศทส/13-01-03/058/2561",
    name: "เครื่องคอมพิวเตอร์สำหรับงานประมวลผล แบบที่ 1",
    price: "25680.00",
    costCenter: "0600200006",
    accountingDate: "2018-04-17"
  },
  {
    code: "100000022126#1",
    assetCode: "พม/พมจ-พล/04-07-01/001/2560",
    name: "เครื่องปรับอากาศชนิดแขวน ยี่ห้อ เซ็นทรัลแอร์ SF41-FA/SC44-CD(A)(2FAN) ขนาด 40000บีทียู",
    price: "49000.00",
    costCenter: "0600200064",
    accountingDate: "2016-12-06"
  },
  {
    code: "100000023394#8",
    assetCode: "พม/สป-ศทส/13-01-26/008/2560",
    name: "เครื่องคอมพิวเตอร์ โน้ตบุ๊ก สำหรับงานสำนักงาน",
    price: "19800.00",
    costCenter: "0600200006",
    accountingDate: "2017-01-31"
  },
  {
    code: "100000023386#14",
    assetCode: "พม/สป-ศทส/13-01-03/014/2560",
    name: "เครื่องคอมพิวเตอร์สำหรับงานสำนักงาน พร้อมชุดโปรแกรมระบบปฏิบัติการ",
    price: "19046.00",
    costCenter: "0600200006",
    accountingDate: "2017-01-20"
  },
  {
    code: "100000023385#13",
    assetCode: "พม/สป-ศทส/13-01-03/013/2560",
    name: "เครื่องคอมพิวเตอร์สำหรับงานสำนักงาน พร้อมชุดโปรแกรมระบบปฏิบัติการ",
    price: "19046.00",
    costCenter: "0600200006",
    accountingDate: "2017-01-20"
  },
  {
    code: "100000021900#34",
    assetCode: "พม/สป-ศทส/13-01-41/034/2560",
    name: "อุปกรณ์กระจายสัญญาณ (L2 Switch) ขนาด 24 ช่อง",
    price: "6382.00",
    costCenter: "0600200006",
    accountingDate: "2016-12-09"
  },
  {
    code: "100000021829#34",
    assetCode: "พม/สป-ศทส/13-01-34/034/2560",
    name: "เครื่องคอมพิวเตอร์แม่ข่ายพร้อมระบบปฏิบัติการ Windows Server 2012 R2 Standard",
    price: "89238.00",
    costCenter: "0600200006",
    accountingDate: "2016-12-09"
  },
  {
    code: "100000021739#48",
    assetCode: "พม/สป-ศทส/13-01-19/048/2560",
    name: "เครื่องสแกนเนอร์สำหรับงานเก็บเอกสารระดับศูนย์บริการแบบที่ 1",
    price: "12840.00",
    costCenter: "0600200006",
    accountingDate: "2016-12-09"
  },
  {
    code: "100000015575",
    assetCode: "",
    name: "ตู้เหล็ก",
    price: "5500.00",
    costCenter: "0600200064",
    accountingDate: null
  },
  {
    code: "100000015574",
    assetCode: "",
    name: "ตู้เหล็ก",
    price: "5500.00",
    costCenter: "0600200064",
    accountingDate: null
  },
  {
    code: "100000015573",
    assetCode: "",
    name: "ตู้เหล็ก",
    price: "5500.00",
    costCenter: "0600200064",
    accountingDate: null
  },
  {
    code: "100000015572",
    assetCode: "",
    name: "ตู้เหล็ก",
    price: "5500.00",
    costCenter: "0600200064",
    accountingDate: null
  },
  {
    code: "100000020914#35",
    assetCode: "พม/สป-ศทส/13-01-60/035/2559",
    name: "อุปกรณ์รักษาความปลอดภัยระบบเครือข่าย (UMT Firewall) ยี่ห้อ Zyxel รุ่น USG1100 พร้อมอุปกรณ์ Wireless Access Point ยี่ห้อ Zyxel รุ่น NWA5123-NI และเครื่องสำรองไฟขนาด 2KVA ยี่ห้อ Syndome รุ่น SZ-2001",
    price: "127014.00",
    costCenter: "0600200006",
    accountingDate: "2016-04-01"
  },
  {
    code: "100000019197#1",
    assetCode: "พม/พมจ-พล/04-02-02/001/2558",
    name: "โต๊ะทำงาน ขนาด 160 cm. รุ่น AMBER ยี่ห้อโกเด้นสตาร์",
    price: "16500.00",
    costCenter: "0600200064",
    accountingDate: "2015-08-14"
  },
  {
    code: "100000019627#1",
    assetCode: "พม/พมจ-พล/04-09-25/001/2558",
    name: "เครื่องทำลายเอกสาร แบบทำลาย 20 แผ่น ยี่ห้อ HSM",
    price: "32000.00",
    costCenter: "0600200064",
    accountingDate: "2015-08-14"
  },
  {
    code: "100000017015#1",
    assetCode: "พม/พมจ-พล/07-01-15/001/2558",
    name: "กล้องถ่ายภาพนิ่ง ระบบดิจิตอล ความละเอียด 18 ล้านพิกเซล ยี่ห้อ Cannon",
    price: "10000.00",
    costCenter: "0600200064",
    accountingDate: "2015-08-14"
  },
  {
    code: "100000016418#44",
    assetCode: "พม/สป-ศทส/13-01-06/044/2558",
    name: "เครื่องพิมพ์แบบเลเซอร์/ชนิด LED ขาวดำ ยี่ห้อ OKI รุ่น B411DN",
    price: "10700.00",
    costCenter: "0600200006",
    accountingDate: "2015-03-11"
  },
  {
    code: "100000016395#176",
    assetCode: "พม/สป-ศทส/13-01-03/176/2558",
    name: "เครื่องคอมพิวเตอร์สำนักงานประมวลผลแบบที่ 2 จอภาพไม่น้อยกว่า 18 นิ้ว พร้อมชุดโปรแกรมระบบปฏิบัติการ",
    price: "35203.00",
    costCenter: "0600200006",
    accountingDate: "2015-03-11"
  },
  {
    code: "100000015446#23",
    assetCode: "พม/สป-ศทส/06-02-22/023/2556",
    name: "ชุดไมโครโฟนพร้อมลำโพง Yamaha รุ่น PJP-20UR หมายเลขเครื่อง SPK043282",
    price: "16371.00",
    costCenter: "0600200006",
    accountingDate: "2013-09-06"
  },
  {
    code: "100000014626#1",
    assetCode: "พม/พมจ-พล/13-01-03/001/2556",
    name: "เครื่องคอมพิวเตอร์ HP 1435 L จอ18.5",
    price: "31000.00",
    costCenter: "0600200064",
    accountingDate: "2013-05-03"
  },
  {
    code: "100000015052#134",
    assetCode: "พม/สป-ศทส/13-01-03/134/2556",
    name: "เครื่องคอมพิวเตอร์สำนักงานประมวลผลแบบที่ 2 พร้อมระบบปฏิบัติการ ยี่ห้อ acer รุ่น Veriton M2610G S/N UDVDKST591P32130206865",
    price: "36600.00",
    costCenter: "0600200006",
    accountingDate: "2013-07-01"
  },
  {
    code: "100000015051#133",
    assetCode: "พม/สป-ศทส/13-01-03/133/2556",
    name: "เครื่องคอมพิวเตอร์สำนักงานประมวลผลแบบที่ 2 พร้อมระบบปฏิบัติการ ยี่ห้อ acer รุ่น Veriton M2610G S/N UDVDKST591P32130206898",
    price: "36600.00",
    costCenter: "0600200006",
    accountingDate: "2013-07-01"
  },
  {
    code: "SCANNER-2",
    assetCode: "",
    name: "เครื่องสแกนเนอร์ ขนาด A4 ยี่ห้อ Cannon รุ่น LiDe 700F",
    price: "4000.00",
    costCenter: "0600200006",
    accountingDate: "2013-05-01"
  },
  {
    code: "CABINET-2DRAWER-1",
    assetCode: "พม/กพบ/04-01-02/001/2555",
    name: "ตู้เหล็กเก็บเอกสาร 2 ลิ้นชัก รุ่น DF-2A",
    price: "3050.00",
    costCenter: "0600200002",
    accountingDate: "2012-09-26"
  },
  {
    code: "CABINET-4DRAWER-2",
    assetCode: "พม/กพบ/04-01-04/002/2555",
    name: "ตู้เหล็กเก็บเอกสาร 4 ลิ้นชัก รุ่น DF-4 มอก.",
    price: "4950.00",
    costCenter: "0600200002",
    accountingDate: "2012-09-26"
  },
  {
    code: "CABINET-4DRAWER-1",
    assetCode: "พม/กพบ/04-01-04/001/2555",
    name: "ตู้เหล็กเก็บเอกสาร 4 ลิ้นชัก รุ่น DF-4 มอก.",
    price: "4950.00",
    costCenter: "0600200002",
    accountingDate: "2012-09-26"
  },
  {
    code: "CABINET-2DOOR-1",
    assetCode: "พม/กพบ/04-01-01/001/2555",
    name: "ตู้เหล็กเก็บเอกสาร 2 บาน เปิด รุ่น CD-01 มอก.",
    price: "4800.00",
    costCenter: "0600200002",
    accountingDate: "2012-09-26"
  },
  {
    code: "CHAIR-4",
    assetCode: "พม/กพบ/04-03-24/004/2555",
    name: "เก้าอี้พนักพิง รุ่น NP302 (หนังเทียม)",
    price: "2500.00",
    costCenter: "0600200002",
    accountingDate: "2012-09-26"
  },
  {
    code: "CHAIR-2",
    assetCode: "พม/กพบ/04-03-24/002/2555",
    name: "เก้าอี้พนักพิง รุ่น NP302 (หนังเทียม)",
    price: "2500.00",
    costCenter: "0600200002",
    accountingDate: "2012-09-26"
  },
  {
    code: "DRAWER-3-1",
    assetCode: "พม/กพบ/04-01-03/001/2550",
    name: "ตู้เหล็ก 3 ลิ้นชัก ขนาด 18x24x40 นิ้ว (สีเทา)",
    price: "2846.00",
    costCenter: "0600200002",
    accountingDate: "2007-06-25"
  },
  {
    code: "GLASS-CABINET-5",
    assetCode: "พม/กพบ/04-01-32/004/2551",
    name: "ตู้กระจกบานเลื่อน ขนาดกว้าง 1792 ลึก 406 สูง 876 มม.(สีเทา)",
    price: "4680.00",
    costCenter: "0600200002",
    accountingDate: "2008-06-06"
  },
  {
    code: "SOLID-CABINET-4",
    assetCode: "พม/กพบ/04-01-11/001/2551",
    name: "ตู้บานเลื่อนทึบ ขนาดกว้าง 1182 ลึก 406 สูง 876 มม.(สีเทา)",
    price: "3050.00",
    costCenter: "0600200002",
    accountingDate: "2008-06-06"
  },
  {
    code: "GLASS-CABINET-1",
    assetCode: "พม/กพบ/04-01-32/001/2551",
    name: "ตู้กระจกบานเลื่อน ขนาดกว้าง 1182 ลึก 406 สูง 876 มม.(สีเทา) มีฐานตู้",
    price: "3650.00",
    costCenter: "0600200002",
    accountingDate: "2008-06-06"
  },
  {
    code: "100000012343#145",
    assetCode: "พม/สป-ศทส/13-01-03/145/2554",
    name: "เครื่องคอมพิวเตอร์สำหรับงานสำนักงาน ยี่ห้อ ACER",
    price: "18900.00",
    costCenter: "0600200006",
    accountingDate: "2011-06-16"
  },
  {
    code: "100000011564#1",
    assetCode: "พม/พมจ-พล/05-01-04/001/2554",
    name: "รถยนต์ขับเคลื่อน 4 ล้อ ดับเบิ้ลแคป(ดีเซล)",
    price: "795000.00",
    costCenter: "0600200064",
    accountingDate: "2011-02-17"
  },
  {
    code: "100000010668#1",
    assetCode: "พม/พมจ-พล/13-01-06/001/2554",
    name: "เครื่องปริ๊นเตอร์ ยี่ห้อ HP",
    price: "15563.00",
    costCenter: "0600200064",
    accountingDate: "2011-01-31"
  },
  {
    code: "100000009994#1",
    assetCode: "พม/พมจ-พล/05-01-03/001/2553",
    name: "รถยนต์ตู้",
    price: "1100000.00",
    costCenter: "0600200064",
    accountingDate: "2010-01-18"
  },
  {
    code: "100000009415#1",
    assetCode: "พม/พมจ-พล/13-01-03/001/2552",
    name: "เครื่องคอมพิวเตอร์ PC ตั้งโต๊ะ",
    price: "20000.00",
    costCenter: "0600200064",
    accountingDate: "2009-09-08"
  }
];

async function bulkImportAssets() {
  try {
    const response = await fetch('/api/assets/bulk-import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ assets: assetsData })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log(`✅ สำเร็จ! เพิ่มครุภัณฑ์ได้ ${result.created} รายการ`);
      if (result.errorCount > 0) {
        console.log(`⚠️  มีข้อผิดพลาด ${result.errorCount} รายการ:`);
        result.errors.forEach(error => {
          console.log(`   - ${error.code}: ${error.error}`);
        });
      }
    } else {
      console.error('❌ เกิดข้อผิดพลาด:', result.error);
    }
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการเชื่อมต่อ:', error);
  }
}

// Export สำหรับใช้ในหน้าเว็บ
if (typeof window !== 'undefined') {
  window.bulkImportAssets = bulkImportAssets;
}

export { assetsData, bulkImportAssets };