'use client';

import { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { FaQrcode, FaPrint, FaDownload, FaTimes, FaSpinner } from 'react-icons/fa';

interface QRDisplayProps {
  assetId: string;
  assetName: string;
  assetCode: string;
  type?: 'asset' | 'borrow' | 'inventory' | 'public';
  isOpen: boolean;
  onClose: () => void;
}

export default function QRDisplay({ 
  assetId, 
  assetName, 
  assetCode, 
  type = 'asset', 
  isOpen, 
  onClose 
}: QRDisplayProps) {
  const [qrCode, setQrCode] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen && assetId) {
      generateQRCode();
    }
  }, [isOpen, assetId, type]);

  const generateQRCode = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/qr/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assetId,
          type
        }),
      });

      const data = await response.json();

      if (data.success) {
        setQrCode(data.qrCode);
      } else {
        setError(data.error || 'ไม่สามารถสร้าง QR Code ได้');
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการสร้าง QR Code');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>QR Code - ${assetName}</title>
            <style>
              body { 
                font-family: 'Kanit', Arial, sans-serif; 
                text-align: center; 
                padding: 20px;
                margin: 0;
              }
              .qr-container {
                border: 2px solid #e5e7eb;
                border-radius: 12px;
                padding: 20px;
                max-width: 400px;
                margin: 0 auto;
                background: white;
              }
              .qr-code {
                margin: 20px 0;
              }
              h1 { 
                color: #1f2937; 
                margin-bottom: 10px;
                font-size: 24px;
              }
              .code { 
                color: #6b7280; 
                font-size: 16px;
                margin-bottom: 20px;
              }
              .footer {
                margin-top: 20px;
                font-size: 12px;
                color: #9ca3af;
              }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <h1>${assetName}</h1>
              <p class="code">รหัส: ${assetCode}</p>
              <div class="qr-code">
                <img src="${qrCode}" alt="QR Code" style="width: 200px; height: 200px;" />
              </div>
              <div class="footer">
                <p>สแกน QR Code เพื่อดูข้อมูลครุภัณฑ์</p>
                <p>ระบบจัดการครุภัณฑ์</p>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleDownload = () => {
    if (qrCode) {
      const link = document.createElement('a');
      link.href = qrCode;
      link.download = `qr-code-${assetCode}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full mx-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <FaQrcode className="text-2xl text-pink-600" />
            <div>
              <h3 className="text-lg font-kanit font-bold text-gray-900">QR Code</h3>
              <p className="text-sm text-gray-600 font-kanit">{assetName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          {loading ? (
            <div className="py-12">
              <FaSpinner className="text-4xl text-pink-600 mx-auto mb-4 animate-spin" />
              <p className="text-gray-600 font-kanit">กำลังสร้าง QR Code...</p>
            </div>
          ) : error ? (
            <div className="py-12">
              <FaQrcode className="text-4xl text-gray-300 mx-auto mb-4" />
              <p className="text-red-600 font-kanit mb-4">{error}</p>
              <button
                onClick={generateQRCode}
                className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-kanit"
              >
                ลองใหม่อีกครั้ง
              </button>
            </div>
          ) : qrCode ? (
            <div>
              {/* Asset Info */}
              <div className="mb-4">
                <h4 className="text-xl font-kanit font-bold text-gray-900 mb-1">{assetName}</h4>
                <p className="text-gray-600 font-kanit">รหัส: {assetCode}</p>
              </div>

              {/* QR Code */}
              <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block mb-6">
                <img 
                  src={qrCode} 
                  alt="QR Code" 
                  className="w-48 h-48 mx-auto"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-center space-x-3">
                <button
                  onClick={handlePrint}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-kanit"
                >
                  <FaPrint />
                  <span>พิมพ์</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center space-x-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-kanit"
                >
                  <FaDownload />
                  <span>ดาวน์โหลด</span>
                </button>
              </div>

              {/* Instructions */}
              <div className="mt-6 bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600 font-kanit">
                  สแกน QR Code นี้เพื่อเข้าถึงข้อมูลครุภัณฑ์อย่างรวดเร็ว
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}