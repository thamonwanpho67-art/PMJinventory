'use client';

import { useState, useRef, useEffect } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { FaQrcode, FaTimes, FaCamera, FaUpload } from 'react-icons/fa';

interface QRScannerProps {
  onScan?: (result: string) => void;
  onScanResult?: (result: string) => void;
  onError?: (error: string) => void;
  onClose: () => void;
  isOpen?: boolean;
  title?: string;
  description?: string;
}

export default function QRScanner({ 
  onScan, 
  onScanResult,
  onError, 
  onClose, 
  isOpen = true,
  title = "สแกน QR Code", 
  description = "วางกล้องให้ QR Code อยู่ในกรอบ" 
}: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const scannerElementId = 'qr-scanner';

  useEffect(() => {
    startScanner();
    
    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = () => {
    try {
      setError('');
      setIsScanning(true);

      const scanner = new Html5QrcodeScanner(
        scannerElementId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
          showTorchButtonIfSupported: true,
          showZoomSliderIfSupported: true,
          defaultZoomValueIfSupported: 2,
        },
        false
      );

      scanner.render(
        (decodedText: string) => {
          // QR Code สแกนสำเร็จ
          console.log('QR Code scanned:', decodedText);
          if (onScan) onScan(decodedText);
          if (onScanResult) onScanResult(decodedText);
          stopScanner();
        },
        (errorMessage: string) => {
          // Error แต่ไม่ต้องแสดงเพราะจะ spam
          // console.log('Scan error:', errorMessage);
        }
      );

      scannerRef.current = scanner;

    } catch (err) {
      const errorMsg = 'ไม่สามารถเปิดกล้องได้ กรุณาอนุญาตการใช้งานกล้อง';
      setError(errorMsg);
      setIsScanning(false);
      if (onError) onError(errorMsg);
    }
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      try {
        scannerRef.current.clear();
        scannerRef.current = null;
      } catch (err) {
        console.log('Error stopping scanner:', err);
      }
    }
    setIsScanning(false);
  };

  const handleClose = () => {
    stopScanner();
    onClose();
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
              <h3 className="text-lg font-kanit font-bold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-600 font-kanit">{description}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        {/* Scanner Content */}
        <div className="p-4">
          {error ? (
            <div className="text-center py-8">
              <FaCamera className="text-4xl text-gray-300 mx-auto mb-4" />
              <p className="text-red-600 font-kanit mb-4">{error}</p>
              <button
                onClick={startScanner}
                className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-kanit"
              >
                ลองใหม่อีกครั้ง
              </button>
            </div>
          ) : (
            <div>
              {/* Scanner Container */}
              <div id={scannerElementId} className="w-full"></div>
              
              {isScanning && (
                <div className="text-center mt-4">
                  <p className="text-sm text-gray-600 font-kanit mb-2">
                    กำลังสแกน QR Code...
                  </p>
                  <div className="flex items-center justify-center space-x-2 text-pink-600">
                    <FaQrcode className="animate-pulse" />
                    <span className="text-sm font-kanit">เตรียมพร้อม</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 pb-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <FaCamera className="text-pink-600" />
                <span className="font-kanit">กล้อง</span>
              </div>
              <div className="w-px h-4 bg-gray-300"></div>
              <div className="flex items-center space-x-1">
                <FaQrcode className="text-pink-600" />
                <span className="font-kanit">QR Code</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}