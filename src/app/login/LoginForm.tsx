"use client";

import { signIn, getSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

import Alert from '@/lib/alert';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('from') || '/dashboard';
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') ?? '');
    const password = String(formData.get('password') ?? '');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        // Handle specific NextAuth errors
        if (result.error === 'CredentialsSignin') {
          await Alert.error('เข้าสู่ระบบไม่สำเร็จ', 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
        } else if (result.error === 'ClientFetchError') {
          await Alert.error('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'กรุณาลองใหม่อีกครั้ง');
        } else {
          await Alert.error('เกิดข้อผิดพลาด', result.error);
        }
        return;
      }

      // Show success message
      await Alert.success_messages.loggedIn();

      // Get the updated session to check role
      const session = await getSession();
      if (session?.user?.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
      router.refresh();
    } catch (err) {
      console.error('Login error:', err);
      // Handle network errors and other exceptions
      await Alert.error('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตและลองใหม่');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 via-rose-100 to-purple-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white/80 backdrop-blur-sm shadow-2xl rounded-2xl p-8 border border-pink-200">
          <div className="text-center mb-8">
            <div className="mx-auto h-16 w-16 bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <h2 className="text-3xl font-kanit font-black bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                ระบบยืม-คืนครุภัณฑ์
              </h2>
            </div>
            <p className="text-pink-700 mt-2 font-kanit font-medium">เข้าสู่ระบบเพื่อดำเนินการ</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-rose-50 border border-rose-300 text-rose-700 px-4 py-3 rounded-xl text-sm font-medium">
                {error}
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-kanit font-bold text-pink-700 mb-1">
                อีเมล
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full px-4 py-3 border border-pink-300 rounded-xl shadow-sm placeholder-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-pink-50/50 text-gray-800 font-medium"
                placeholder="your.email@office.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-kanit font-bold text-pink-700 mb-1">
                รหัสผ่าน
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  className="w-full px-4 py-3 pr-12 border border-pink-300 rounded-xl shadow-sm placeholder-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-pink-50/50 font-kanit text-gray-800 font-medium"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-pink-500 hover:text-pink-700 transition-colors"
                >
                  {showPassword ? (
                    <FaEyeSlash className="h-5 w-5" />
                  ) : (
                    <FaEye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-kanit font-bold text-white bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <div className="flex items-center font-kanit">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                  กำลังเข้าสู่ระบบ...
                </div>
              ) : (
                'เข้าสู่ระบบ'
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 font-kanit">
              ยังไม่มีบัญชี?{' '}
              <Link
                href="/register"
                className="font-medium text-pink-600 hover:text-pink-500 transition-colors font-kanit"
              >
                สมัครสมาชิก
              </Link>
            </p>
          </div>


        </div>
      </div>
    </div>
  );
}

