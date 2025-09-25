'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ChunkErrorHandler() {
  const router = useRouter();

  useEffect(() => {
    const handleChunkError = (event: ErrorEvent) => {
      const target = event.target as HTMLScriptElement;
      
      if (target && target.src && target.src.includes('/_next/static/chunks/')) {
        console.warn('Chunk loading failed, attempting to reload:', target.src);
        
        // Show user-friendly message
        const shouldReload = confirm(
          'เกิดปัญหาในการโหลดข้อมูล ต้องการรีโหลดหน้าเว็บหรือไม่?'
        );
        
        if (shouldReload) {
          window.location.reload();
        }
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason;
      
      if (error && error.message && error.message.includes('Loading chunk')) {
        console.warn('Chunk loading promise rejection:', error);
        event.preventDefault();
        
        // Attempt navigation refresh
        setTimeout(() => {
          router.refresh();
        }, 1000);
      }
    };

    // Add event listeners
    window.addEventListener('error', handleChunkError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleChunkError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [router]);

  return null; // This component doesn't render anything
}