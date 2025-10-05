import { NextRequest, NextResponse } from 'next/server';import { NextRequest, NextResponse } from 'next/server';impo// GET /api/assets - ดูรายการครุภัณฑ์ทั้งหมด หรือตรวจสอบรหัสซ้ำ

import { prisma } from '@/lib/prisma';

import { getCurrentUser } from '@/lib/auth-utils';import { prisma } from '@/lib/prisma';export async function GET(request: NextRequest) {



// GET /api/assets - ดูรายการครุภัณฑ์ทั้งหมด หรือตรวจสอบรหัสซ้ำimport { getCurrentUser } from '@/lib/auth-utils';  try {

export async function GET(request: NextRequest) {

  try {    const { searchParams } = new URL(request.url);

    const { searchParams } = new URL(request.url);

    const checkCode = searchParams.get('checkCode');// GET /api/assets - ดูรายการครุภัณฑ์ทั้งหมด หรือตรวจสอบรหัสซ้ำ    const checkCode = searchParams.get('checkCode');



    // ถ้าเป็นการตรวจสอบรหัสซ้ำexport async function GET(request: NextRequest) {

    if (checkCode) {

      const existingAsset = await prisma.asset.findUnique({  try {    // ถ้าเป็นการตรวจสอบรหัสซ้ำ

        where: { code: checkCode }

      });    const { searchParams } = new URL(request.url);    if (checkCode) {

      

      return NextResponse.json({     const checkCode = searchParams.get('checkCode');      const existingAsset = await prisma.asset.findUnique({

        exists: !!existingAsset,

        code: checkCode         where: { code: checkCode }

      });

    }    // ถ้าเป็นการตรวจสอบรหัสซ้ำ      });



    // ดูรายการครุภัณฑ์ทั้งหมด    if (checkCode) {      

    const assets = await prisma.asset.findMany({

      orderBy: {      const existingAsset = await prisma.asset.findUnique({      return NextResponse.json({ 

        createdAt: 'desc'

      }        where: { code: checkCode }        exists: !!existingAsset,

    });

      });        code: checkCode 

    return NextResponse.json(assets);

  } catch (error) {            });

    console.error('Error fetching assets:', error);

    return NextResponse.json(      return NextResponse.json({     }

      { error: 'เกิดข้อผิดพลาดภายในระบบ' },

      { status: 500 }        exists: !!existingAsset,

    );

  }        code: checkCode     // ดูรายการครุภัณฑ์ทั้งหมด

}

      });    const assets = await prisma.asset.findMany({

// POST /api/assets - เพิ่มครุภัณฑ์ใหม่ (ADMIN เท่านั้น)

export async function POST(request: NextRequest) {    }      orderBy: {

  try {

    const user = await getCurrentUser();        createdAt: 'desc'

    

    if (!user || user.role !== 'ADMIN') {    // ดูรายการครุภัณฑ์ทั้งหมด      }

      return NextResponse.json(

        { error: 'ไม่มีสิทธิ์เข้าถึง' },    const assets = await prisma.asset.findMany({    });

        { status: 403 }

      );      orderBy: {

    }

        createdAt: 'desc'    return NextResponse.json(assets);

    const formData = await request.formData();

    const code = formData.get('code') as string;      }  } catch (error) {

    const name = formData.get('name') as string;

    const description = formData.get('description') as string;    });    console.error('Error fetching assets:', error);

    const category = formData.get('category') as string;

    const location = formData.get('location') as string;    return NextResponse.json(

    const assetCode = formData.get('assetCode') as string;

    const costCenter = formData.get('costCenter') as string;    return NextResponse.json(assets);      { error: 'Internal server error' },

    const price = formData.get('price') as string;

    const accountingDate = formData.get('accountingDate') as string;  } catch (error) {      { status: 500 }

    const quantity = formData.get('quantity') as string;

    const status = formData.get('status') as string;    console.error('Error fetching assets:', error);    );

    const imageFile = formData.get('image') as File;

    return NextResponse.json(  }

    // Validation

    if (!code || !name) {      { error: 'เกิดข้อผิดพลาดภายในระบบ' },}NextResponse } from 'next/server';

      return NextResponse.json(

        { error: 'กรุณากรอกข้อมูลที่จำเป็น: รหัสครุภัณฑ์ และชื่ออุปกรณ์' },      { status: 500 }import { prisma } from '@/lib/prisma';

        { status: 400 }

      );    );import { getCurrentUser } from '@/lib/auth-utils';

    }

  }

    // Validate status

    const validStatuses = ['AVAILABLE', 'DAMAGED', 'OUT_OF_STOCK'];}// GET /api/assets - ดูรายการครุภัณฑ์ทั้งหมด

    if (status && !validStatuses.includes(status)) {

      return NextResponse.json(export async function GET() {

        { error: 'สถานะไม่ถูกต้อง กรุณาเลือก: ว่าง, ชำรุด, หรือ หมด' },

        { status: 400 }// POST /api/assets - เพิ่มครุภัณฑ์ใหม่ (ADMIN เท่านั้น)  try {

      );

    }export async function POST(request: NextRequest) {    const assets = await prisma.asset.findMany({



    // ตรวจสอบว่า code ซ้ำหรือไม่  try {      orderBy: {

    const existingAsset = await prisma.asset.findUnique({

      where: { code }    const user = await getCurrentUser();        createdAt: 'desc'

    });

          }

    if (existingAsset) {

      return NextResponse.json(    if (!user || user.role !== 'ADMIN') {    });

        { error: `รหัสครุภัณฑ์ "${code}" มีอยู่ในระบบแล้ว กรุณาใช้รหัสอื่น` },

        { status: 409 }      return NextResponse.json(

      );

    }        { error: 'ไม่มีสิทธิ์เข้าถึง' },    return NextResponse.json(assets);



    let imageUrl = null;        { status: 403 }  } catch (error) {

    if (imageFile && imageFile.size > 0) {

      // Handle file upload here - you'll need to implement this based on your storage solution      );    console.error('Error fetching assets:', error);

      // For now, we'll just skip the image upload functionality

    }    }    return NextResponse.json(



    const asset = await prisma.asset.create({      { error: 'เกิดข้อผิดพลาดภายในระบบ' },

      data: {

        code,    const formData = await request.formData();      { status: 500 }

        name,

        description: description || null,    const code = formData.get('code') as string;    );

        category: category || null,

        location: location || null,    const name = formData.get('name') as string;  }

        assetCode: assetCode || null,

        costCenter: costCenter || null,    const description = formData.get('description') as string;}

        price: price ? parseFloat(price) : null,

        accountingDate: accountingDate ? new Date(accountingDate) : null,    const category = formData.get('category') as string;

        quantity: quantity ? parseInt(quantity) : 1,

        status: (status as any) || 'AVAILABLE',    const location = formData.get('location') as string;// POST /api/assets - เพิ่มครุภัณฑ์ใหม่ (ADMIN เท่านั้น)

        imageUrl: imageUrl || null

      }    const assetCode = formData.get('assetCode') as string;export async function POST(request: NextRequest) {

    });

    const costCenter = formData.get('costCenter') as string;  try {

    return NextResponse.json(asset, { status: 201 });

  } catch (error) {    const price = formData.get('price') as string;    const user = await getCurrentUser();

    console.error('Error creating asset:', error);

    return NextResponse.json(    const accountingDate = formData.get('accountingDate') as string;    

      { error: 'เกิดข้อผิดพลาดในการสร้างครุภัณฑ์' },

      { status: 500 }    const quantity = formData.get('quantity') as string;    if (!user || user.role !== 'ADMIN') {

    );

  }    const status = formData.get('status') as string;      return NextResponse.json(

}
    const imageFile = formData.get('image') as File;        { error: 'Unauthorized' },

        { status: 403 }

    // Validation      );

    if (!code || !name) {    }

      return NextResponse.json(

        { error: 'กรุณากรอกข้อมูลที่จำเป็น: รหัสครุภัณฑ์ และชื่ออุปกรณ์' },    const formData = await request.formData();

        { status: 400 }    const code = formData.get('code') as string;

      );    const name = formData.get('name') as string;

    }    const description = formData.get('description') as string;

    const category = formData.get('category') as string;

    // Validate status    const location = formData.get('location') as string;

    const validStatuses = ['AVAILABLE', 'DAMAGED', 'OUT_OF_STOCK'];    const assetCode = formData.get('assetCode') as string;

    if (status && !validStatuses.includes(status)) {    const costCenter = formData.get('costCenter') as string;

      return NextResponse.json(    const price = formData.get('price') as string;

        { error: 'สถานะไม่ถูกต้อง กรุณาเลือก: ว่าง, ชำรุด, หรือ หมด' },    const accountingDate = formData.get('accountingDate') as string;

        { status: 400 }    const quantity = formData.get('quantity') as string;

      );    const status = formData.get('status') as string;

    }    const imageFile = formData.get('image') as File;



    // ตรวจสอบว่า code ซ้ำหรือไม่    // Validation

    const existingAsset = await prisma.asset.findUnique({    if (!code || !name) {

      where: { code }      return NextResponse.json(

    });        { error: 'กรุณากรอกข้อมูลที่จำเป็น: รหัสครุภัณฑ์ และชื่ออุปกรณ์' },

        { status: 400 }

    if (existingAsset) {      );

      return NextResponse.json(    }

        { error: `รหัสครุภัณฑ์ "${code}" มีอยู่ในระบบแล้ว กรุณาใช้รหัสอื่น` },

        { status: 409 }    // Validate status

      );    const validStatuses = ['AVAILABLE', 'DAMAGED', 'OUT_OF_STOCK'];

    }    if (status && !validStatuses.includes(status)) {

      return NextResponse.json(

    let imageUrl = null;        { error: 'สถานะไม่ถูกต้อง กรุณาเลือก: ว่าง, ชำรุด, หรือ หมด' },

    if (imageFile && imageFile.size > 0) {        { status: 400 }

      // Handle file upload here - you'll need to implement this based on your storage solution      );

      // For now, we'll just skip the image upload functionality    }

    }

    // ตรวจสอบว่า code ซ้ำหรือไม่

    const asset = await prisma.asset.create({    const existingAsset = await prisma.asset.findUnique({

      data: {      where: { code }

        code,    });

        name,

        description: description || null,    if (existingAsset) {

        category: category || null,      return NextResponse.json(

        location: location || null,        { error: 'รหัสครุภัณฑ์นี้มีอยู่ในระบบแล้ว กรุณาใช้รหัสอื่น' },

        assetCode: assetCode || null,        { status: 409 }

        costCenter: costCenter || null,      );

        price: price ? parseFloat(price) : null,    }

        accountingDate: accountingDate ? new Date(accountingDate) : null,

        quantity: quantity ? parseInt(quantity) : 1,    let imageUrl = null;

        status: (status as any) || 'AVAILABLE',    if (imageFile && imageFile.size > 0) {

        imageUrl: imageUrl || null      // Handle file upload here - you'll need to implement this based on your storage solution

      }      // For now, we'll just skip the image upload functionality

    });    }



    return NextResponse.json(asset, { status: 201 });    const asset = await prisma.asset.create({

  } catch (error) {      data: {

    console.error('Error creating asset:', error);        code,

    return NextResponse.json(        name,

      { error: 'เกิดข้อผิดพลาดในการสร้างครุภัณฑ์' },        description: description || null,

      { status: 500 }        category: category || null,

    );        location: location || null,

  }        assetCode: assetCode || null,

}        costCenter: costCenter || null,
        price: price ? parseFloat(price) : null,
        accountingDate: accountingDate ? new Date(accountingDate) : null,
        quantity: quantity ? parseInt(quantity) : 1,
        status: (status as any) || 'AVAILABLE',
        imageUrl: imageUrl || null
      }
    });

    return NextResponse.json(asset, { status: 201 });
  } catch (error) {
    console.error('Error creating asset:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการสร้างครุภัณฑ์' },
      { status: 500 }
    );
  }
}