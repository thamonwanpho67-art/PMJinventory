# ข้อมูลสำคัญสำหรับ Knowledge Transfer

## 🎯 ภาพรวมของระบบ

ระบบยืม-คืนครุภัณฑ์สำนักงานนี้เป็น Full-stack Application ที่พัฒนาด้วย **Next.js 14** และมีการออกแบบ Architecture แบบ Modern Web Development

### เทคโนโลยีหลักที่ใช้
- **Frontend**: Next.js 14 (App Router) + TypeScript + TailwindCSS
- **Backend**: Next.js API Routes + Prisma ORM
- **Database**: PostgreSQL (Neon Cloud)
- **Authentication**: NextAuth.js
- **Styling**: TailwindCSS + Responsive Design

## 📁 โครงสร้างโปรเจค

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes (Backend)
│   │   ├── assets/        # Asset management endpoints
│   │   ├── loans/         # Loan management endpoints
│   │   └── auth/          # NextAuth endpoints
│   ├── dashboard/         # User interface
│   ├── admin/             # Admin interface
│   └── login/             # Authentication pages
├── components/            # Reusable React components
├── lib/                   # Utility functions
│   ├── auth.ts           # NextAuth configuration
│   ├── auth-utils.ts     # Authentication helpers
│   └── prisma.ts         # Database connection
└── types/                # TypeScript type definitions

prisma/
├── schema.prisma         # Database schema
└── seed.ts              # Sample data for development
```

## 🗄️ Database Design

### ER Diagram (Conceptual)
```
User (ผู้ใช้)
├── id: String (Primary Key)
├── email: String (Unique)
├── name: String
├── password: String (Hashed)
└── role: Role (ADMIN/USER)

Asset (ครุภัณฑ์)
├── id: String (Primary Key)
├── name: String
├── description: String
├── quantity: Int
└── available: Int (Calculated)

Loan (การยืม)
├── id: String (Primary Key)
├── userId: String (Foreign Key → User)
├── assetId: String (Foreign Key → Asset)
├── quantity: Int
├── status: LoanStatus
├── requestDate: DateTime
├── approvedDate: DateTime?
└── returnedDate: DateTime?
```

### Business Rules
1. **User Roles**: ADMIN สามารถจัดการทุกอย่าง, USER ยืม-คืนเท่านั้น
2. **Loan Status Flow**: PENDING → APPROVED → RETURNED
3. **Quantity Control**: ระบบตรวจสอบ available quantity ก่อนอนุมัติ
4. **Authentication**: Protected routes ด้วย NextAuth.js

## 🔧 การติดตั้งและ Setup

### ข้อกำหนดระบบ
- Node.js 18+ 
- PostgreSQL Database (Neon recommended)
- npm/yarn package manager

### ขั้นตอนการ Setup
```bash
# 1. Clone และ install dependencies
npm install

# 2. Setup environment variables
cp .env.example .env
# แก้ไข DATABASE_URL และ NEXTAUTH_SECRET

# 3. Setup database
npx prisma generate
npx prisma db push
npx prisma db seed

# 4. Run development server
npm run dev
```

### Environment Variables
```bash
DATABASE_URL="postgresql://..."  # Neon Database URL
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="random-secret-key"
```

## 👥 การใช้งานระบบ

### Default Accounts (จาก seed data)
- **Admin**: admin@company.com / password123
- **User**: user@company.com / password123

### User Workflows
1. **ผู้ใช้ทั่วไป**: Login → Browse Assets → Borrow → Check Status
2. **ผู้ดูแล**: Login → Manage Assets → Approve Loans → Monitor System

### API Endpoints
- `GET /api/assets` - ดึงรายการครุภัณฑ์
- `POST /api/assets` - เพิ่มครุภัณฑ์ใหม่ (Admin only)
- `GET /api/loans` - ดึงรายการการยืม
- `POST /api/loans` - สร้างคำขอยืมใหม่

## 🚀 การ Deploy

### Vercel Deployment
1. **Connect Repository**: เชื่อม GitHub repo กับ Vercel
2. **Environment Variables**: ตั้งค่า ENV ใน Vercel dashboard
3. **Database**: ใช้ Neon PostgreSQL (production-ready)
4. **Build Commands**: ใช้ default Next.js build

### Production Checklist
- [ ] Environment variables configured
- [ ] Database URL updated to production
- [ ] NEXTAUTH_SECRET generated securely
- [ ] Domain configured in NextAuth
- [ ] Database seeded with admin account

## 🛠️ Troubleshooting

### ปัญหาที่พบบ่อย
1. **Prisma Client Error**: Run `npx prisma generate`
2. **Database Connection**: ตรวจสอบ DATABASE_URL
3. **Authentication Issues**: ตรวจสอบ NEXTAUTH_SECRET
4. **TypeScript Errors**: Run `npm run type-check`

### Database Issues
```bash
# Reset database (development only)
npx prisma db push --force-reset
npx prisma db seed

# Regenerate Prisma client
npx prisma generate
```

### Performance Optimization
- Database indexing on frequently queried fields
- Image optimization with Next.js Image component
- API response caching where appropriate
- Database connection pooling

## 📈 การพัฒนาต่อ

### Recommended Improvements
1. **Email Notifications**: การแจ้งเตือนผ่าน email
2. **Advanced Search**: การค้นหาแบบละเอียด
3. **Reports**: Dashboard แสดงสถิติการใช้งาน
4. **Mobile App**: พัฒนา mobile application
5. **Barcode Integration**: ระบบสแกน barcode

### Code Quality
- ESLint configured สำหรับ code standards
- TypeScript สำหรับ type safety
- Prisma ORM สำหรับ database type safety
- Component-based architecture

### Security Considerations
- Password hashing ด้วย bcryptjs
- SQL injection protection ด้วย Prisma
- XSS protection ด้วย Next.js built-in features
- CSRF protection ด้วย NextAuth.js

---

## 📞 Support & Maintenance

### การดูแลระบบ
- **Database Backup**: ตั้งค่า automated backup ใน Neon
- **Monitoring**: ติดตาม application performance
- **Updates**: อัพเดท dependencies เป็นประจำ

### หากต้องการความช่วยเหลือ
1. ตรวจสอบ error logs ใน Vercel dashboard
2. ดู database logs ใน Neon console  
3. ติดต่อ development team พร้อมรายละเอียดข้อผิดพลาด

---

*เอกสารนี้จัดทำเพื่อการ Knowledge Transfer และการดูแลระบบในระยะยาว*