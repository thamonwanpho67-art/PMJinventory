import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';

export async function POST(request: NextRequest) {
  try {
    const { assetId, type = 'asset' } = await request.json();

    if (!assetId) {
      return NextResponse.json(
        { error: 'Asset ID is required' },
        { status: 400 }
      );
    }

    // สร้าง QR Code data object
    const qrData = {
      assetId,
      type, // 'asset', 'borrow', 'inventory', 'public'
      timestamp: new Date().toISOString(),
      baseUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000'
    };

    // สร้าง QR Code string
    const qrCodeString = await QRCode.toDataURL(JSON.stringify(qrData), {
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
      data: qrData
    });

  } catch (error) {
    console.error('QR Code generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate QR Code' },
      { status: 500 }
    );
  }
}