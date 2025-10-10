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

  // ตรวจสอบความเข้ากันได้ของเบราว์เซอร์
  const checkBrowserCompatibility = () => {
    const userAgent = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
    const isChrome = /Chrome/.test(userAgent);
    
    if (isIOS && !isSafari && !isChrome) {
      return 'สำหรับ iOS กรุณาใช้ Safari หรือ Chrome';
    }
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return 'เบราว์เซอร์ไม่รองรับการใช้งานกล้อง';
    }
    
    return null;
  };

  useEffect(() => {
    startScanner();
    
    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async () => {
    try {
      setError('');
      setIsScanning(true);

      // ตรวจสอบความเข้ากันได้ของเบราว์เซอร์
      const compatibilityError = checkBrowserCompatibility();
      if (compatibilityError) {
        throw new Error(compatibilityError);
      }

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
          // ปรับการตั้งค่าสำหรับมือถือ
          rememberLastUsedCamera: true,
          // เพิ่มการตั้งค่าที่เข้ากันได้กับมือถือมากขึ้น
          formatsToSupport: undefined, // รองรับทุกรูปแบบ
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
          // ไม่แสดง error ที่ไม่จำเป็น
          if (errorMessage && !errorMessage.includes('NotFoundException')) {
            console.log('Scan error:', errorMessage);
          }
        }
      );

      scannerRef.current = scanner;

      // ตั้ง timeout เพื่อตรวจสอบว่า scanner เริ่มทำงานหรือไม่
      setTimeout(() => {
        const scannerElement = document.getElementById(scannerElementId);
        if (scannerElement && scannerElement.children.length === 0) {
          setError('ไม่สามารถเริ่มกล้องได้ กรุณาลองใหม่อีกครั้ง');
          setIsScanning(false);
        }
      }, 5000);

    } catch (err: any) {
      console.error('Scanner error:', err);
      let errorMsg = 'ไม่สามารถเปิดกล้องได้';
      
      if (err.message) {
        errorMsg = err.message;
      } else if (err.name === 'NotAllowedError') {
        errorMsg = 'กรุณาอนุญาตการใช้งานกล้องในเบราว์เซอร์';
      } else if (err.name === 'NotFoundError') {
        errorMsg = 'ไม่พบกล้องในอุปกรณ์นี้';
      } else if (err.name === 'NotSupportedError') {
        errorMsg = 'เบราว์เซอร์ไม่รองรับการใช้งานกล้อง';
      } else if (err.name === 'NotReadableError') {
        errorMsg = 'กล้องกำลังถูกใช้งานโดยแอปพลิเคชันอื่น';
      }
      
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
              <div className="space-y-3">
                <button
                  onClick={startScanner}
                  className="w-full px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-kanit"
                >
                  ลองใหม่อีกครั้ง
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-kanit"
                >
                  รีเฟรชหน้า
                </button>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800 font-kanit mb-2">💡 คำแนะนำ:</p>
                  <ul className="text-xs text-yellow-700 font-kanit space-y-1 text-left">
                    <li>• อนุญาตการใช้งานกล้องในเบราว์เซอร์</li>
                    <li>• ตรวจสอบว่าไม่มีแอปอื่นใช้กล้องอยู่</li>
                    <li>• ลองเปิดใน Chrome หรือ Safari</li>
                    <li>• ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต</li>
                    <li>• กดปุ่ม "Allow" เมื่อขออนุญาตกล้อง</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div>
              {/* Scanner Container */}
              <div id={scannerElementId} className="w-full"></div>
              
              {isScanning && (
                <div className="text-center mt-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600 font-kanit mb-2">
                    กำลังเริ่มกล้อง...
                  </p>
                  <div className="flex items-center justify-center space-x-2 text-pink-600">
                    <FaQrcode className="animate-pulse" />
                    <span className="text-sm font-kanit">เตรียมพร้อม</span>
                  </div>
                  <p className="text-xs text-gray-500 font-kanit mt-2">
                    หากไม่เห็นกล้อง ลองกดปุ่ม "Allow" หรือรีเฟรชหน้า
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 pb-4">
          <div className="bg-pink-50 rounded-lg p-3">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center space-x-4 text-sm text-pink-600">
                <div className="flex items-center space-x-1">
                  <FaCamera className="text-pink-600" />
                  <span className="font-kanit">กล้อง</span>
                </div>
                <div className="w-px h-4 bg-pink-300"></div>
                <div className="flex items-center space-x-1">
                  <FaQrcode className="text-pink-600" />
                  <span className="font-kanit">QR Code</span>
                </div>
              </div>
              <p className="text-xs text-pink-600 font-kanit">
                📱 สำหรับมือถือ: หันกล้องหลังไปที่ QR Code
              </p>
              {!isScanning && !error && (
                <button
                  onClick={startScanner}
                  className="w-full mt-2 px-3 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-kanit text-sm"
                >
                  เริ่มกล้อง
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}