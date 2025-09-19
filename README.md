# ระบบยืม-คืนครุภัณฑ์สำนักงาน (Office Asset Borrow-Return System)

ระบบจัดการการยืม-คืนครุภัณฑ์สำนักงานที่พัฒนาด้วย Next.js 14, Prisma ORM, และ PostgreSQL พร้อมระบบ Authentication แบบ Role-based

## 🏗️ สถาปัตยกรรมระบบ (System Architecture)

### Tech Stack
- **Frontend**: Next.js 14 (App Router) + TypeScript + TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (Neon)
- **ORM**: Prisma
- **Authentication**: NextAuth.js
- **Deployment**: Vercel

### Database Schema
```
User (users)
├── id: String (CUID)
├── email: String (Unique)
├── name: String
├── password: String (Hashed)
├── role: Enum (ADMIN, USER)
├── createdAt: DateTime
└── updatedAt: DateTime

Asset (assets)  
├── id: String (CUID)
├── code: String (Unique) 
├── name: String
├── description: String?
├── quantity: Int
├── createdAt: DateTime
└── updatedAt: DateTime

Loan (loans)
├── id: String (CUID)
├── assetId: String (FK)
├── userId: String (FK) 
├── quantity: Int
├── status: Enum (PENDING, APPROVED, RETURNED, REJECTED)
├── borrowedAt: DateTime?
├── dueAt: DateTime
├── returnedAt: DateTime?
├── note: String?
├── createdAt: DateTime
└── updatedAt: DateTime
```

## 🚀 การติดตั้งและเซ็ตอัป (Setup Instructions)

### 1. Prerequisites
- Node.js 18+ และ npm/yarn
- PostgreSQL Database (สามารถใช้ Neon หรือ local PostgreSQL)
- Git

### 2. Clone Repository
```bash
git clone <repository-url>
cd inventory
```

### 3. ติดตั้ง Dependencies
```bash
npm install
```

### 4. ตั้งค่า Environment Variables
สร้างไฟล์ `.env` จากตัวอย่าง:
```bash
cp .env.example .env
```

แก้ไขค่าต่าง ๆ ในไฟล์ `.env`:
```env
# Database
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
```

### 5. Setup Database
```bash
# Push schema ไปยัง database
npx prisma db push

# Generate Prisma Client
npx prisma generate

# Seed ข้อมูลเริ่มต้น
npx prisma db seed
```

### 6. รันโปรเจ็กต์
```bash
# Development mode
npm run dev

# Production build
npm run build
npm run start
```

เข้าใช้งานที่: http://localhost:3000

## 👤 บัญชีผู้ใช้เริ่มต้น (Default Accounts)

| Role | Email | Password | สิทธิ์การใช้งาน |
|------|-------|----------|----------------|
| ADMIN | admin@office.com | admin123 | จัดการครุภัณฑ์, อนุมัติคำขอ, ดูรายงาน |
| USER | user@office.com | user123 | ดูครุภัณฑ์, ยื่นคำขอยืม, แจ้งคืน |

## 🎯 คุณสมบัติของระบบ (Features)

### 👨‍💼 สำหรับ ADMIN
- ✅ จัดการครุภัณฑ์ (เพิ่ม/แก้ไข/ลบ)
- ✅ อนุมัติ/ปฏิเสธคำขอยืม
- ✅ บันทึกการคืนครุภัณฑ์
- ✅ ดูรายงานการยืม-คืน
- ✅ จัดการผู้ใช้งาน

### 👥 สำหรับ USER
- ✅ ดูรายการครุภัณฑ์ที่พร้อมใช้งาน
- ✅ ยื่นคำขอยืมครุภัณฑ์
- ✅ ดูสถานะคำขอของตนเอง
- ✅ แจ้งคืนครุภัณฑ์

### 🔒 ระบบความปลอดภัย
- ✅ Authentication ด้วย NextAuth.js
- ✅ Password Hashing ด้วย bcryptjs
- ✅ Role-based Access Control
- ✅ Route Protection ด้วย Middleware

## 📁 โครงสร้างโปรเจ็กต์ (Project Structure)

```
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts            # Seed data script
├── src/
│   ├── app/
│   │   ├── api/           # API Routes
│   │   │   ├── auth/      # NextAuth endpoints
│   │   │   ├── assets/    # Asset CRUD APIs
│   │   │   └── loans/     # Loan management APIs
│   │   ├── dashboard/     # User dashboard
│   │   ├── admin/         # Admin panel
│   │   └── login/         # Login page
│   ├── components/        # React Components
│   │   ├── AssetList.tsx
│   │   └── BorrowForm.tsx
│   ├── lib/              # Utility libraries
│   │   ├── prisma.ts     # Prisma client
│   │   ├── auth.ts       # NextAuth config
│   │   └── auth-utils.ts # Auth helpers
│   ├── types/            # TypeScript types
│   └── middleware.ts     # Route protection
├── package.json
└── README.md
```

## 🔧 การพัฒนาเพิ่มเติม (Development Guide)

### การเพิ่ม Features ใหม่

1. **เพิ่ม Database Model**
   ```bash
   # แก้ไข prisma/schema.prisma
   npx prisma db push
   npx prisma generate
   ```

2. **สร้าง API Route**
   ```typescript
   // src/app/api/new-feature/route.ts
   import { NextRequest, NextResponse } from 'next/server';
   import { prisma } from '@/lib/prisma';
   import { getCurrentUser } from '@/lib/auth-utils';

   export async function GET() {
     // Implementation
   }
   ```

3. **สร้าง Component**
   ```typescript
   // src/components/NewComponent.tsx
   'use client';
   import { useState } from 'react';
   
   export default function NewComponent() {
     // Implementation
   }
   ```

### Database Management

```bash
# ดู database ด้วย Prisma Studio
npx prisma studio

# Reset database (ลบข้อมูลทั้งหมด)
npx prisma migrate reset

# Backup database
pg_dump $DATABASE_URL > backup.sql
```

### Code Quality

```bash
# Linting
npm run lint

# Type checking  
npm run build

# Testing
npm run test
```

## 🚀 การ Deploy (Deployment)

### Deploy บน Vercel

1. **Push โค้ดไปยัง GitHub**
2. **เชื่อมต่อ Vercel กับ Repository**
3. **ตั้งค่า Environment Variables ใน Vercel Dashboard:**
   - `DATABASE_URL`
   - `NEXTAUTH_URL` 
   - `NEXTAUTH_SECRET`
4. **Deploy และทดสอบ**

### Database Setup บน Neon
1. สร้าง Database ใน [Neon Console](https://neon.tech/)
2. คัดลอก Connection String
3. อัพเดต `DATABASE_URL` ใน `.env`
4. Run migrations:
   ```bash
   npx prisma db push
   npx prisma db seed
   ```

## 🐛 Troubleshooting

### ปัญหาที่พบบ่อย

**1. Prisma Client Generation Error**
```bash
npx prisma generate
```

**2. Database Connection Issues**
- ตรวจสอบ `DATABASE_URL` ใน `.env`
- ตรวจสอบ Network connection
- ตรวจสอบ Database credentials

**3. Authentication Issues**
- ตรวจสอบ `NEXTAUTH_SECRET` และ `NEXTAUTH_URL`
- Clear browser cookies
- ตรวจสอบ User data ใน database

**4. Build Errors**
```bash
# ลบ .next และ node_modules แล้วติดตั้งใหม่
rm -rf .next node_modules
npm install
npm run build
```

## 📋 TODO / Roadmap

### Phase 1 - Core Features ✅
- [x] User Authentication & Authorization
- [x] Asset Management (CRUD)
- [x] Loan Request System
- [x] Admin Dashboard
- [x] User Dashboard

### Phase 2 - Enhanced Features
- [ ] Loan Approval Workflow
- [ ] Return Management
- [ ] Notification System
- [ ] Reports & Analytics
- [ ] Asset Categories
- [ ] Loan History

### Phase 3 - Advanced Features  
- [ ] Email Notifications
- [ ] File Upload (Asset Images)
- [ ] Barcode/QR Code Integration
- [ ] Mobile App
- [ ] API Documentation
- [ ] Unit Tests

## 📞 การสนับสนุน (Support)

### Knowledge Transfer (KT) Session
1. **Database Design & Prisma ORM** (30 นาที)
2. **NextAuth.js & Security** (20 นาที) 
3. **API Routes & Frontend Integration** (30 นาที)
4. **Deployment & DevOps** (20 นาที)

### เอกสารเพิ่มเติม
- [Prisma Documentation](https://www.prisma.io/docs/)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Next.js Documentation](https://nextjs.org/docs)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)

---

**พัฒนาโดย**: Senior Fullstack Developer  
**วันที่**: September 2025  
**เวอร์ชั่น**: 1.0.0
