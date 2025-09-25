'use client';

import { useEffect } from 'react';
import { FaExclamationTriangle, FaRedo, FaHome } from 'react-icons/fa';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-rose-50 p-4">
          <div className="text-center max-w-md mx-auto">
            <div className="w-24 h-24 bg-gradient-to-r from-pink-100 to-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaExclamationTriangle className="text-4xl text-pink-600" />
            </div>
            
            <h1 className="text-3xl font-kanit font-bold text-pink-800 mb-4">
              เกิดข้อผิดพลาดร้ายแรง
            </h1>
            
            <p className="text-pink-600 font-kanit mb-6">
              เกิดข้อผิดพลาดที่ไม่คาดคิดในระบบ กรุณาลองใหม่อีกครั้ง
            </p>
            
            <div className="space-y-3">
              <button
                onClick={reset}
                className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-3 rounded-xl hover:from-pink-600 hover:to-rose-600 transition-all duration-300 font-kanit font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <FaRedo className="inline mr-2" />
                ลองใหม่อีกครั้ง
              </button>
              
              <Link 
                href="/"
                className="w-full inline-block bg-white border-2 border-pink-300 text-pink-600 px-6 py-3 rounded-xl hover:bg-pink-50 transition-all duration-300 font-kanit font-bold"
              >
                <FaHome className="inline mr-2" />
                กลับสู่หน้าแรก
              </Link>
            </div>
            
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-6 text-left">
                <summary className="text-pink-600 cursor-pointer font-kanit text-sm">
                  รายละเอียดข้อผิดพลาด (Development)
                </summary>
                <pre className="mt-4 p-4 bg-gray-100 rounded-lg text-xs text-gray-800 overflow-auto max-h-48">
                  {error.stack}
                </pre>
                {error.digest && (
                  <p className="mt-2 text-xs text-gray-600">
                    Error ID: {error.digest}
                  </p>
                )}
              </details>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}