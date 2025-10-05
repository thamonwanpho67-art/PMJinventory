import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-utils';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'ไม่มีสิทธิ์ในการเข้าถึง' },
        { status: 403 }
      );
    }

    const { assets } = await request.json();

    if (!Array.isArray(assets)) {
      return NextResponse.json(
        { error: 'ข้อมูลต้องเป็น array ของ assets' },
        { status: 400 }
      );
    }

    const results = [];
    const errors = [];

    for (const assetData of assets) {
      try {
        // ตรวจสอบว่า code ซ้ำหรือไม่
        const existingAsset = await prisma.asset.findUnique({
          where: { code: assetData.code }
        });

        if (existingAsset) {
          errors.push({
            code: assetData.code,
            error: 'รหัสครุภัณฑ์นี้มีอยู่แล้ว'
          });
          continue;
        }

        const asset = await prisma.asset.create({
          data: {
            code: assetData.code,
            name: assetData.name,
            description: assetData.description || null,
            category: assetData.category || null,
            location: assetData.location || null,
            assetCode: assetData.assetCode || null,
            costCenter: assetData.costCenter || null,
            price: assetData.price ? parseFloat(assetData.price.toString().replace(/,/g, '')) : null,
            accountingDate: assetData.accountingDate ? new Date(assetData.accountingDate) : null,
            quantity: assetData.quantity ? parseInt(assetData.quantity.toString()) : 1,
            status: (assetData.status as 'AVAILABLE' | 'DAMAGED' | 'OUT_OF_STOCK') || 'AVAILABLE',
            imageUrl: assetData.imageUrl || null
          }
        });

        results.push(asset);
      } catch (error) {
        console.error('Error creating asset:', assetData.code, error);
        errors.push({
          code: assetData.code,
          error: 'เกิดข้อผิดพลาดในการสร้างครุภัณฑ์'
        });
      }
    }

    return NextResponse.json({
      success: true,
      created: results.length,
      errorCount: errors.length,
      results,
      errors
    }, { status: 201 });

  } catch (error) {
    console.error('Bulk import error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' },
      { status: 500 }
    );
  }
}