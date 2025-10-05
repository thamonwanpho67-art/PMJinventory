import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const checkCode = searchParams.get('checkCode');

    if (checkCode) {
      const existingAsset = await prisma.asset.findUnique({
        where: { code: checkCode }
      });
      
      return NextResponse.json({ 
        exists: !!existingAsset,
        code: checkCode 
      });
    }

    const assets = await prisma.asset.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(assets);
  } catch (error) {
    console.error('Error fetching assets:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'ไม่มีสิทธิ์ในการเข้าถึง' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const code = formData.get('code') as string;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const location = formData.get('location') as string;
    const assetCode = formData.get('assetCode') as string;
    const costCenter = formData.get('costCenter') as string;
    const price = formData.get('price') as string;
    const accountingDate = formData.get('accountingDate') as string;
    const quantity = formData.get('quantity') as string;
    const status = formData.get('status') as string;
    const imageUrl = formData.get('imageUrl') as string;

    if (!code || !name) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลที่จำเป็น: รหัสครุภัณฑ์ และชื่อครุภัณฑ์' },
        { status: 400 }
      );
    }

    const validStatuses = ['AVAILABLE', 'DAMAGED', 'OUT_OF_STOCK'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'สถานะไม่ถูกต้อง ต้องเป็น AVAILABLE, DAMAGED, หรือ OUT_OF_STOCK' },
        { status: 400 }
      );
    }

    const existingAsset = await prisma.asset.findUnique({
      where: { code }
    });

    if (existingAsset) {
      return NextResponse.json(
        { error: 'รหัสครุภัณฑ์นี้มีอยู่แล้ว กรุณาใช้รหัสอื่น' },
        { status: 409 }
      );
    }

    const asset = await prisma.asset.create({
      data: {
        code,
        name,
        description: description || null,
        category: category || null,
        location: location || null,
        assetCode: assetCode || null,
        costCenter: costCenter || null,
        price: price ? parseFloat(price) : null,
        accountingDate: accountingDate ? new Date(accountingDate) : null,
        quantity: quantity ? parseInt(quantity) : 1,
        status: (status as 'AVAILABLE' | 'DAMAGED' | 'OUT_OF_STOCK') || 'AVAILABLE',
        imageUrl: imageUrl || null
      }
    });

    return NextResponse.json(asset, { status: 201 });
  } catch (error) {
    console.error('Error creating asset:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
