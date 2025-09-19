import React, { Suspense } from 'react';
import LoginForm from './LoginForm';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center">Loading...</div>}>
      {/* LoginForm is a client component that uses next/navigation hooks */}
      <LoginForm />
    </Suspense>
  );
}

