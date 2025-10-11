'use client';

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { FaQrcode, FaTimes, FaCamera, FaSpinner } from 'react-icons/fa';

// Dynamically import Html5QrcodeScanner to avoid SSR issues
let Html5QrcodeScanner: any = null;
let Html5QrcodeScanType: any = null;

if (typeof window !== 'undefined') {
  import('html5-qrcode').then((module) => {
    Html5QrcodeScanner = module.Html5QrcodeScanner;
    Html5QrcodeScanType = module.Html5QrcodeScanType;
  });
}

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
  const [isLibraryLoaded, setIsLibraryLoaded] = useState(false);
  const scannerRef = useRef<any>(null);
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
    // Load library only on client side
    if (typeof window !== 'undefined' && !isLibraryLoaded) {
      import('html5-qrcode').then((module) => {
        Html5QrcodeScanner = module.Html5QrcodeScanner;
        Html5QrcodeScanType = module.Html5QrcodeScanType;
        setIsLibraryLoaded(true);
      }).catch((err) => {
        console.error('Failed to load QR scanner library:', err);
        setError('ไม่สามารถโหลด QR Scanner ได้');
      });
    }
  }, []);

  useEffect(() => {
    if (isLibraryLoaded && Html5QrcodeScanner && isOpen) {
      // รอให้ DOM element พร้อมก่อนเริ่ม scanner
      const timer = setTimeout(() => {
        const scannerElement = document.getElementById(scannerElementId);
        if (scannerElement) {
          startScanner();
        } else {
          console.warn('Scanner element not found, retrying...');
          // ลองอีกครั้งหลังจาก 500ms
          setTimeout(() => {
            if (document.getElementById(scannerElementId)) {
              startScanner();
            }
          }, 500);
        }
      }, 100);

      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    }
    
    return () => {
      stopScanner();
    };
  }, [isLibraryLoaded, isOpen]);

  const startScanner = async () => {
    if (!Html5QrcodeScanner || !Html5QrcodeScanType) {
      setError('QR Scanner ยังไม่พร้อมใช้งาน กรุณารอสักครู่');
      setIsScanning(false);
      return;
    }

    // ตรวจสอบว่า DOM element พร้อมหรือไม่
    const scannerElement = document.getElementById(scannerElementId);
    if (!scannerElement) {
      console.error('Scanner element not found:', scannerElementId);
      setError('ไม่พบ Scanner element กรุณาลองใหม่อีกครั้ง');
      setIsScanning(false);
      return;
    }

    try {
      setError('');
      setIsScanning(true);

      // ตรวจสอบความเข้ากันได้ของเบราว์เซอร์
      const compatibilityError = checkBrowserCompatibility();
      if (compatibilityError) {
        throw new Error(compatibilityError);
      }

      // ล้าง scanner element ก่อนเริ่มใหม่
      scannerElement.innerHTML = '';

      const scanner = new Html5QrcodeScanner(
        scannerElementId,
        {
          fps: 10,
          qrbox: { width: 200, height: 200 },
          aspectRatio: 1.0,
          supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
          showTorchButtonIfSupported: true,
          showZoomSliderIfSupported: false, // ปิดเพื่อประหยัดพื้นที่
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
        const currentScannerElement = document.getElementById(scannerElementId);
        if (currentScannerElement && currentScannerElement.children.length === 0) {
          setError('ไม่สามารถเริ่มกล้องได้ กรุณาลองใหม่อีกครั้ง');
          setIsScanning(false);
        }
      }, 5000);

    } catch (err: any) {
      console.error('Scanner error:', err);
      let errorMsg = 'ไม่สามารถเปิดกล้องได้';
      
      if (err.message) {
        if (err.message.includes('HTML Element with id=')) {
          errorMsg = 'ไม่พบ Scanner element กรุณาลองใหม่อีกครั้ง';
        } else {
          errorMsg = err.message;
        }
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
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-2">
      <div className="bg-white rounded-lg max-w-sm w-full mx-auto shadow-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <FaQrcode className="text-lg text-pink-600" />
            <div>
              <h3 className="text-base font-kanit font-bold text-gray-900">{title}</h3>
              <p className="text-xs text-gray-600 font-kanit">{description}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <FaTimes className="text-lg" />
          </button>
        </div>

        {/* Scanner Content */}
        <div className="p-3 overflow-y-auto max-h-[70vh]">
          {!isLibraryLoaded ? (
            <div className="text-center py-6">
              <FaSpinner className="text-3xl text-pink-600 mx-auto mb-3 animate-spin" />
              <p className="text-pink-600 font-kanit text-sm">กำลังโหลด QR Scanner...</p>
            </div>
          ) : error ? (
            <div className="text-center py-6">
              <FaCamera className="text-3xl text-gray-300 mx-auto mb-3" />
              <p className="text-red-600 font-kanit mb-3 text-sm">{error}</p>
              <div className="space-y-2">
                <button
                  onClick={startScanner}
                  className="w-full px-3 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-kanit text-sm"
                >
                  ลองใหม่อีกครั้ง
                </button>
                <button
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.location.reload();
                    }
                  }}
                  className="w-full px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-kanit text-sm"
                >
                  รีเฟรชหน้า
                </button>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                  <p className="text-xs text-yellow-800 font-kanit mb-1">💡 คำแนะนำ:</p>
                  <ul className="text-xs text-yellow-700 font-kanit space-y-0.5 text-left">
                    <li>• อนุญาตการใช้งานกล้องในเบราว์เซอร์</li>
                    <li>• ตรวจสอบว่าไม่มีแอปอื่นใช้กล้องอยู่</li>
                    <li>• ลองเปิดใน Chrome หรือ Safari</li>
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
                <div className="text-center mt-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-600 mx-auto mb-2"></div>
                  <p className="text-xs text-gray-600 font-kanit mb-1">
                    กำลังเริ่มกล้อง...
                  </p>
                  <div className="flex items-center justify-center space-x-1 text-pink-600">
                    <FaQrcode className="animate-pulse text-sm" />
                    <span className="text-xs font-kanit">เตรียมพร้อม</span>
                  </div>
                  <p className="text-xs text-gray-500 font-kanit mt-1">
                    หากไม่เห็นกล้อง ลองกดปุ่ม "Allow"
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-3 pb-3">
          <div className="bg-pink-50 rounded-lg p-2">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center space-x-3 text-xs text-pink-600">
                <div className="flex items-center space-x-1">
                  <FaCamera className="text-pink-600 text-sm" />
                  <span className="font-kanit">กล้อง</span>
                </div>
                <div className="w-px h-3 bg-pink-300"></div>
                <div className="flex items-center space-x-1">
                  <FaQrcode className="text-pink-600 text-sm" />
                  <span className="font-kanit">QR Code</span>
                </div>
              </div>
              <p className="text-xs text-pink-600 font-kanit">
                📱 หันกล้องหลังไปที่ QR Code
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