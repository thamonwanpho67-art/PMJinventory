// รายการแผนก
export const DEPARTMENTS = [
  'นโยบายและวิชาการ',
  'การพัฒนาสังคมและสวัสดิการ',
  'บริหารงานทั่วไป',
  'ศูนย์บริการคนพิการ'
] as const;

export type Department = typeof DEPARTMENTS[number];