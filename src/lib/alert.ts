// Alert types for consistent styling
export type AlertType = 'success' | 'error' | 'warning' | 'info' | 'question';

// Interface for SweetAlert2 options
interface SwalOptions {
  icon?: 'success' | 'error' | 'warning' | 'info' | 'question';
  title?: string;
  text?: string;
  html?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  showCancelButton?: boolean;
  allowOutsideClick?: boolean;
  allowEscapeKey?: boolean;
  showConfirmButton?: boolean;
  timer?: number;
  timerProgressBar?: boolean;
  confirmButtonColor?: string;
  cancelButtonColor?: string;
  didOpen?: () => void;
  [key: string]: unknown;
}

// Common alert configurations
const commonConfig = {
  confirmButtonColor: '#ec4899',
  cancelButtonColor: '#6b7280',
  showClass: {
    popup: 'animate__animated animate__fadeInDown'
  },
  hideClass: {
    popup: 'animate__animated animate__fadeOutUp'
  }
};

// Alert service class
class AlertService {
  private async getSwal() {
    const Swal = (await import('sweetalert2')).default;
    return Swal;
  }

  // Show basic alert
  async show(config: SwalOptions) {
    const Swal = await this.getSwal();
    return Swal.fire({
      ...commonConfig,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...config as any
    });
  }

  // Success alert
  async success(title: string, text?: string, options?: SwalOptions) {
    return this.show({
      icon: 'success',
      title,
      text,
      confirmButtonText: 'ตกลง',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...options as any
    });
  }

  // Error alert
  async error(title: string, text?: string, options?: SwalOptions) {
    return this.show({
      icon: 'error',
      title,
      text,
      confirmButtonText: 'ตกลง',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...options as any
    });
  }

  // Warning alert
  async warning(title: string, text?: string, options?: SwalOptions) {
    return this.show({
      icon: 'warning',
      title,
      text,
      confirmButtonText: 'ตกลง',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...options as any
    });
  }

  // Info alert
  async info(title: string, text?: string, options?: SwalOptions) {
    return this.show({
      icon: 'info',
      title,
      text,
      confirmButtonText: 'ตกลง',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...options as any
    });
  }

  // Confirmation dialog
  async confirm(title: string, text?: string, options?: SwalOptions) {
    return this.show({
      icon: 'question',
      title,
      text,
      showCancelButton: true,
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...options as any
    });
  }

  // Loading alert
  async loading(title: string = 'กำลังดำเนินการ...', text?: string) {
    return this.show({
      title,
      text,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: async () => {
        const Swal = await this.getSwal();
        Swal.showLoading();
      }
    });
  }

  // Close alert
  async close() {
    const Swal = await this.getSwal();
    Swal.close();
  }

  // Common validation messages
  validation = {
    required: (fieldName?: string) => this.warning(
      'กรุณากรอกข้อมูลให้ครบถ้วน',
      fieldName ? `กรุณากรอก${fieldName}` : undefined
    ),
    invalidFormat: (fieldName: string, example?: string) => this.error(
      `${fieldName}ไม่ถูกต้อง`,
      example ? `กรุณากรอกให้ถูกต้อง เช่น ${example}` : undefined
    ),
    passwordMismatch: () => this.error(
      'รหัสผ่านไม่ตรงกัน',
      'กรุณากรอกรหัสผ่านให้ตรงกัน'
    ),
    passwordTooShort: (minLength: number = 6) => this.error(
      'รหัสผ่านไม่ถูกต้อง',
      `รหัสผ่านต้องมีอย่างน้อย ${minLength} ตัวอักษร`
    )
  };

  // Common success messages
  success_messages = {
    created: (itemName: string = 'ข้อมูล') => this.success(
      'สร้างสำเร็จ!',
      `${itemName}ได้ถูกสร้างเรียบร้อยแล้ว`
    ),
    updated: (itemName: string = 'ข้อมูล') => this.success(
      'อัพเดทสำเร็จ!',
      `${itemName}ได้ถูกอัพเดทเรียบร้อยแล้ว`
    ),
    deleted: (itemName: string = 'ข้อมูล') => this.success(
      'ลบสำเร็จ!',
      `${itemName}ได้ถูกลบเรียบร้อยแล้ว`
    ),
    registered: () => this.success(
      'สมัครสมาชิกสำเร็จ!',
      'บัญชีของคุณได้ถูกสร้างเรียบร้อยแล้ว',
      {
        timer: 3000,
        timerProgressBar: true,
        confirmButtonText: 'เข้าสู่ระบบ'
      }
    ),
    loggedIn: () => this.success(
      'เข้าสู่ระบบสำเร็จ!',
      'ยินดีต้อนรับเข้าสู่ระบบ',
      {
        timer: 2000,
        timerProgressBar: true
      }
    )
  };

  // Common error messages  
  error_messages = {
    networkError: () => this.error(
      'เกิดข้อผิดพลาด',
      'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง'
    ),
    unauthorized: () => this.error(
      'ไม่มีสิทธิ์เข้าถึง',
      'กรุณาเข้าสู่ระบบใหม่อีกครั้ง'
    ),
    serverError: () => this.error(
      'เกิดข้อผิดพลาดในระบบ',
      'กรุณาลองใหม่อีกครั้ง หรือติดต่อผู้ดูแลระบบ'
    ),
    notFound: (itemName: string = 'ข้อมูล') => this.error(
      'ไม่พบข้อมูล',
      `ไม่พบ${itemName}ที่คุณต้องการ`
    ),
    duplicateEmail: () => this.error(
      'อีเมลนี้ถูกใช้แล้ว',
      'กรุณาใช้อีเมลอื่น หรือเข้าสู่ระบบด้วยบัญชีที่มีอยู่'
    )
  };

  // Common confirmation messages
  confirmations = {
    delete: (itemName: string = 'รายการนี้') => this.confirm(
      'ยืนยันการลบ',
      `คุณต้องการลบ${itemName}หรือไม่? การดำเนินการนี้ไม่สามารถยกเลิกได้`,
      {
        confirmButtonText: 'ลบ',
        cancelButtonText: 'ยกเลิก',
        confirmButtonColor: '#dc2626'
      }
    ),
    logout: () => this.confirm(
      'ออกจากระบบ',
      'คุณต้องการออกจากระบบหรือไม่?',
      {
        confirmButtonText: 'ออกจากระบบ',
        cancelButtonText: 'ยกเลิก'
      }
    ),
    unsavedChanges: () => this.confirm(
      'มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก',
      'คุณต้องการออกโดยไม่บันทึกการเปลี่ยนแปลงหรือไม่?',
      {
        confirmButtonText: 'ออกโดยไม่บันทึก',
        cancelButtonText: 'ยกเลิก',
        confirmButtonColor: '#dc2626'
      }
    )
  };
}

// Export singleton instance
export const Alert = new AlertService();

// Export default for easier imports
export default Alert;