// ข้อมูลศูนย์ต้นทุนสำหรับระบบจัดการครุภัณฑ์
export const costCenters = [
  {
    code: '0600200001',
    name: 'นโยบายและวิชาการ',
    description: 'กลุ่มงานนโยบายและวิชาการ'
  },
  {
    code: '0600200002',
    name: 'การพัฒนาสังคมและสวัสดิการ',
    description: 'กลุ่มงานการพัฒนาสังคมและสวัสดิการ'
  },
  {
    code: '0600200003',
    name: 'บริหารงานทั่วไป',
    description: 'กลุ่มงานบริหารงานทั่วไป'
  },
  {
    code: '0600200004',
    name: 'ศูนย์บริการคนพิการ',
    description: 'ศูนย์บริการคนพิการ จังหวัดพะเยา'
  }
];

// ฟังก์ชันสำหรับค้นหาชื่อศูนย์ต้นทุนจากรหัส
export const getCostCenterName = (code: string): string => {
  const costCenter = costCenters.find(cc => cc.code === code);
  return costCenter ? costCenter.name : code;
};

// ฟังก์ชันสำหรับค้นหาข้อมูลศูนย์ต้นทุนจากรหัส
export const getCostCenterInfo = (code: string) => {
  return costCenters.find(cc => cc.code === code);
};