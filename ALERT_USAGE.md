# Alert Service Usage Guide

Alert service สำหรับแสดงการแจ้งเตือนแบบสวยงามด้วย SweetAlert2 ในทุกหน้าของระบบ

## การติดตั้ง

```typescript
import Alert from '@/lib/alert';
```

## การใช้งานพื้นฐาน

### 1. แจ้งเตือนพื้นฐาน

```typescript
// Success
await Alert.success('สำเร็จ!', 'ข้อมูลได้ถูกบันทึกแล้ว');

// Error
await Alert.error('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกข้อมูลได้');

// Warning
await Alert.warning('คำเตือน', 'กรุณาตรวจสอบข้อมูลให้ถูกต้อง');

// Info
await Alert.info('ข้อมูล', 'การดำเนินการเสร็จสิ้น');
```

### 2. การยืนยัน

```typescript
const result = await Alert.confirm('ยืนยันการลบ', 'คุณต้องการลบรายการนี้หรือไม่?');
if (result.isConfirmed) {
  // ดำเนินการลบ
}
```

### 3. Loading

```typescript
await Alert.loading('กำลังบันทึกข้อมูล...');
// ทำงานบางอย่าง
await Alert.close(); // ปิด loading
```

## ข้อความพร้อมใช้

### Validation Messages

```typescript
// ข้อมูลไม่ครบ
await Alert.validation.required();
await Alert.validation.required('ชื่อ-นามสกุล');

// รูปแบบไม่ถูกต้อง
await Alert.validation.invalidFormat('อีเมล', 'example@email.com');

// รหัสผ่าน
await Alert.validation.passwordMismatch();
await Alert.validation.passwordTooShort(8);
```

### Success Messages

```typescript
await Alert.success_messages.created('ครุภัณฑ์');
await Alert.success_messages.updated('ข้อมูลผู้ใช้');
await Alert.success_messages.deleted('รายการ');
await Alert.success_messages.registered();
await Alert.success_messages.loggedIn();
```

### Error Messages

```typescript
await Alert.error_messages.networkError();
await Alert.error_messages.unauthorized();
await Alert.error_messages.serverError();
await Alert.error_messages.notFound('ครุภัณฑ์');
await Alert.error_messages.duplicateEmail();
```

### Confirmation Messages

```typescript
const result = await Alert.confirmations.delete('ครุภัณฑ์นี้');
const result = await Alert.confirmations.logout();
const result = await Alert.confirmations.unsavedChanges();
```

## ตัวอย่างการใช้งานในแต่ละหน้า

### หน้าสมัครสมาชิก
```typescript
// Form validation
if (!formData.name.trim()) {
  await Alert.validation.required();
  return false;
}

// Success registration
await Alert.success_messages.registered();
router.push('/login');
```

### หน้าเข้าสู่ระบบ
```typescript
// Login error
if (result?.error) {
  await Alert.error('เข้าสู่ระบบไม่สำเร็จ', 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
  return;
}

// Login success
await Alert.success_messages.loggedIn();
```

### หน้าจัดการครุภัณฑ์
```typescript
// Create asset
await Alert.success_messages.created('ครุภัณฑ์');

// Delete confirmation
const result = await Alert.confirmations.delete('ครุภัณฑ์นี้');
if (result.isConfirmed) {
  await deleteAsset();
  await Alert.success_messages.deleted('ครุภัณฑ์');
}
```

### หน้าจัดการผู้ใช้
```typescript
// Update user
try {
  await updateUser(userData);
  await Alert.success_messages.updated('ข้อมูลผู้ใช้');
} catch (error) {
  await Alert.error_messages.serverError();
}
```

## การปรับแต่งเพิ่มเติม

```typescript
// Custom configuration
await Alert.success('สำเร็จ!', 'ข้อมูลได้ถูกบันทึกแล้ว', {
  timer: 5000,
  timerProgressBar: true,
  showConfirmButton: false
});

// Custom buttons
await Alert.confirm('ยืนยันการดำเนินการ', 'คุณแน่ใจหรือไม่?', {
  confirmButtonText: 'ดำเนินการ',
  cancelButtonText: 'ยกเลิก',
  confirmButtonColor: '#10b981'
});
```

## Features

- ✅ Dynamic import - โหลดเฉพาะเมื่อต้องการใช้
- ✅ TypeScript support
- ✅ Consistent styling ตามธีมสีชมพู
- ✅ ข้อความภาษาไทย
- ✅ Reusable ในทุกหน้า
- ✅ Pre-built messages สำหรับกรณีใช้งานทั่วไป
- ✅ Animation effects
- ✅ Responsive design