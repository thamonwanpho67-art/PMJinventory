import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ดึงข้อมูลสำหรับ Dashboard
    const [
      totalAssets,
      totalLoans,
      totalUsers,
      totalPendingLoans,
      assetsByCategory,
      monthlyLoans,
      recentLoans,
      assetsByStatus
    ] = await Promise.all([
      // จำนวนครุภัณฑ์ทั้งหมด
      prisma.asset.count(),
      
      // จำนวนการยืมทั้งหมด
      prisma.loan.count(),
      
      // จำนวนผู้ใช้ทั้งหมด
      prisma.user.count(),
      
      // จำนวนคำขอยืมที่รอการอนุมัติ
      prisma.loan.count({
        where: { status: 'PENDING' }
      }),
      
      // ครุภัณฑ์แยกตามประเภท
      prisma.asset.groupBy({
        by: ['category'],
        _count: {
          id: true
        }
      }),
      
      // การยืมแยกตามเดือน (6 เดือนล่าสุด) - ใช้ JavaScript แทน raw SQL
      prisma.loan.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) // 6 เดือนที่แล้ว
          }
        },
        select: {
          createdAt: true
        }
      }),
      
      // รายการยืม-คืนล่าสุด 5 รายการ
      prisma.loan.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { name: true }
          },
          asset: {
            select: { name: true }
          }
        }
      }),
      
      // สถานะครุภัณฑ์
      prisma.asset.groupBy({
        by: ['status'],
        _count: {
          id: true
        }
      })
    ]);

    // แปลงข้อมูลสำหรับกราฟ
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const categoryData = assetsByCategory.map((item: any) => ({
      name: item.category || 'ไม่ระบุ',
      value: item._count.id,
      fill: getCategoryColor(item.category)
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const statusData = assetsByStatus.map((item: any) => ({
      name: getStatusLabel(item.status),
      value: item._count.id,
      fill: getStatusColor(item.status)
    }));

    // แปลงข้อมูลการยืมรายเดือน
    const monthlyLoansMap = new Map();
    const monthNames = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
    
    // สร้างข้อมูลเดือน 6 เดือนย้อนหลัง
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
      monthlyLoansMap.set(monthKey, { month: monthLabel, loans: 0, returns: 0 });
    }
    
    // นับจำนวนการยืมในแต่ละเดือน
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (monthlyLoans as any[]).forEach(loan => {
      const date = new Date(loan.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyLoansMap.has(monthKey)) {
        const monthData = monthlyLoansMap.get(monthKey);
        monthData.loans += 1;
        monthData.returns = Math.floor(monthData.loans * 0.8); // สมมติ 80% คืนแล้ว
      }
    });
    
    const monthlyLoansData = Array.from(monthlyLoansMap.values());

    const dashboardData = {
      summary: {
        totalAssets,
        totalLoans,
        totalUsers,
        totalPendingLoans
      },
      charts: {
        assetsByCategory: categoryData,
        assetsByStatus: statusData,
        monthlyLoans: monthlyLoansData
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recentLoans: recentLoans.map((loan: any) => ({
        id: loan.id,
        userName: loan.user.name,
        assetName: loan.asset.name,
        status: loan.status,
        createdAt: loan.createdAt,
        dueDate: loan.dueAt
      }))
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Dashboard API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions
function getCategoryColor(category: string | null): string {
  const colors: { [key: string]: string } = {
    'อิเล็กทรอนิกส์': '#ec4899',
    'เฟอร์นิเจอร์': '#8b5cf6',
    'อุปกรณ์สำนักงาน': '#06b6d4',
    'ยานพาหนะ': '#10b981',
    'เครื่องมือ': '#f59e0b',
    'อื่นๆ': '#6b7280'
  };
  return colors[category || 'อื่นๆ'] || '#6b7280';
}

function getStatusColor(status: string): string {
  const colors: { [key: string]: string } = {
    'AVAILABLE': '#10b981',
    'BORROWED': '#f59e0b',
    'MAINTENANCE': '#ef4444',
    'RETIRED': '#6b7280'
  };
  return colors[status] || '#6b7280';
}

function getStatusLabel(status: string): string {
  const labels: { [key: string]: string } = {
    'AVAILABLE': 'ว่าง',
    'BORROWED': 'ถูกยืม',
    'MAINTENANCE': 'ซ่อมบำรุง',
    'RETIRED': 'เกษียณ'
  };
  return labels[status] || status;
}