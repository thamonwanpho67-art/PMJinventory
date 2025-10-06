import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

// GET - ดึงการแจ้งเตือนสำหรับ Admin
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    // ใช้ dynamic import เพื่อหลีกเลี่ยง compile error
    const { prisma } = await import('@/lib/prisma');
    
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');

    try {
      // ลองใช้ raw query ถ้า notification property ไม่ทำงาน
      const notifications = await (prisma as any).notification.findMany({
        where: {
          targetRole: 'ADMIN',
          ...(unreadOnly && { isRead: false })
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit
      });

      // นับจำนวนที่ยังไม่อ่าน
      const unreadCount = await (prisma as any).notification.count({
        where: {
          targetRole: 'ADMIN',
          isRead: false
        }
      });

      return NextResponse.json({
        notifications,
        unreadCount
      });
    } catch (prismaError) {
      console.error('Prisma error:', prismaError);
      // ถ้า notification table ยังไม่พร้อม ให้ return ข้อมูลเปล่า
      return NextResponse.json({
        notifications: [],
        unreadCount: 0
      });
    }

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// POST - สร้างการแจ้งเตือนใหม่
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { prisma } = await import('@/lib/prisma');
    const body = await request.json();
    const { title, message, type, relatedId, relatedType, targetRole = 'ADMIN' } = body;

    try {
      const notification = await (prisma as any).notification.create({
        data: {
          title,
          message,
          type,
          targetRole,
          relatedId,
          relatedType
        }
      });

      return NextResponse.json(notification, { status: 201 });
    } catch (prismaError) {
      console.error('Prisma error:', prismaError);
      return NextResponse.json(
        { error: 'Failed to create notification - database not ready' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}

// PUT - อัปเดตสถานะการอ่าน
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { prisma } = await import('@/lib/prisma');
    const body = await request.json();
    const { ids, markAsRead = true } = body;

    try {
      if (ids && Array.isArray(ids)) {
        // อัปเดตหลายรายการ
        await (prisma as any).notification.updateMany({
          where: {
            id: { in: ids },
            targetRole: 'ADMIN'
          },
          data: {
            isRead: markAsRead
          }
        });
      } else {
        // อัปเดตทั้งหมด
        await (prisma as any).notification.updateMany({
          where: {
            targetRole: 'ADMIN',
            isRead: false
          },
          data: {
            isRead: true
          }
        });
      }

      return NextResponse.json({ success: true });
    } catch (prismaError) {
      console.error('Prisma error:', prismaError);
      return NextResponse.json(
        { error: 'Failed to update notifications - database not ready' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}