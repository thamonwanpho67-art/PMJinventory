import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';

export async function POST(request: NextRequest) {
  try {
    const { assetId, supplyId, type = 'asset' } = await request.json();

    const itemId = assetId || supplyId;
    if (!itemId) {
      return NextResponse.json(
        { error: 'Asset ID or Supply ID is required' },
        { status: 400 }
      );
    }

    // สร้าง URL สำหรับ QR Code (ไปที่หน้า public)
    const baseUrl = process.env.NEXTAUTH_URL || process.env.AUTH_URL || 'http://localhost:3000';
    const itemType = supplyId ? 'supply' : 'asset';
    const qrUrl = `${baseUrl}/public/${itemType}/${itemId}`;

    // สร้าง QR Code จาก URL โดยตรง
    const qrCodeString = await QRCode.toDataURL(qrUrl, {
      errorCorrectionLevel: 'M',
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 256
    });

    return NextResponse.json({
      success: true,
      qrCode: qrCodeString,
      url: qrUrl,
      data: {
        itemId,
        type: itemType,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('QR Code generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate QR Code' },
      { status: 500 }
    );
  }
}