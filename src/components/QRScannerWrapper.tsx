'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { FaSpinner } from 'react-icons/fa';

// Dynamic import to avoid SSR issues
const QRScannerComponent = dynamic(() => import('./QRScanner'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full mx-auto shadow-2xl p-8">
        <div className="text-center">
          <FaSpinner className="text-4xl text-pink-600 mx-auto mb-4 animate-spin" />
          <p className="text-pink-600 font-kanit">กำลังโหลด QR Scanner...</p>
        </div>
      </div>
    </div>
  )
});

interface QRScannerWrapperProps {
  onScan?: (result: string) => void;
  onScanResult?: (result: string) => void;
  onError?: (error: string) => void;
  onClose: () => void;
  isOpen?: boolean;
  title?: string;
  description?: string;
}

export default function QRScannerWrapper(props: QRScannerWrapperProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || !props.isOpen) {
    return null;
  }

  return <QRScannerComponent {...props} />;
}