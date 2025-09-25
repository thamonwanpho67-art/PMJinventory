'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import LayoutWrapper from '@/components/LayoutWrapper';
import { FaKey, FaLock, FaEye, FaEyeSlash, FaShieldAlt, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

export default function ChangePasswordPage() {
  const { data: session, status } = useSession();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-rose-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-200 border-t-pink-600 mx-auto mb-4"></div>
          <p className="text-pink-600 font-medium">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    redirect('/login');
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
    setSuccess(false);
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validateForm = () => {
    if (!formData.currentPassword) {
      setError('กรุณาใส่รหัสผ่านปัจจุบัน');
      return false;
    }
    if (!formData.newPassword) {
      setError('กรุณาใส่รหัสผ่านใหม่');
      return false;
    }
    if (formData.newPassword.length < 6) {
      setError('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return false;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      setError('รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน');
      return false;
    }
    if (formData.currentPassword === formData.newPassword) {
      setError('รหัสผ่านใหม่ต้องแตกต่างจากรหัสผ่านปัจจุบัน');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        setError(data.message || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน');
      }
    } catch {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LayoutWrapper>
      <div className="p-6 max-w-2xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="text-center py-12 bg-gradient-to-r from-pink-50 to-rose-50 rounded-3xl border border-pink-200 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-100/50 to-rose-100/50"></div>
          <div className="relative z-10">
            <FaShieldAlt className="text-6xl mb-6 text-pink-500 mx-auto" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent font-kanit mb-4">
              เปลี่ยนรหัสผ่าน
            </h1>
            <p className="text-lg text-pink-700 font-medium max-w-2xl mx-auto">
              เปลี่ยนรหัสผ่านของคุณเพื่อความปลอดภัยของบัญชี
            </p>
          </div>
        </div>

        {/* Security Tips */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
          <div className="flex items-center space-x-2 mb-4">
            <FaShieldAlt className="text-blue-600 text-xl" />
            <h2 className="text-xl font-bold text-blue-700 font-kanit">ข้อแนะนำด้านความปลอดภัย</h2>
          </div>
          <div className="space-y-2 text-blue-700 text-sm">
            <div className="flex items-start space-x-2">
              <span className="text-blue-600 font-bold">•</span>
              <p>ใช้รหัสผ่านที่มีความยาวอย่างน้อย 8 ตัวอักษร</p>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-blue-600 font-bold">•</span>
              <p>ผสมผสานตัวอักษรพิมพ์เล็ก พิมพ์ใหญ่ ตัวเลข และสัญลักษณ์พิเศษ</p>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-blue-600 font-bold">•</span>
              <p>หลีกเลี่ยงการใช้ข้อมูลส่วนบุคคล เช่น ชื่อ วันเกิด</p>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-blue-600 font-bold">•</span>
              <p>อย่าใช้รหัสผ่านเดียวกันกับเว็บไซต์อื่น</p>
            </div>
          </div>
        </div>

        {/* Change Password Form */}
        <div className="bg-gradient-to-r from-white to-pink-50 rounded-2xl border border-pink-200 p-8">
          <div className="flex items-center space-x-2 mb-6">
            <FaKey className="text-pink-600 text-2xl" />
            <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent font-kanit">
              เปลี่ยนรหัสผ่าน
            </h2>
          </div>

          {success && (
            <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl flex items-center space-x-2">
              <FaCheckCircle className="text-green-600 text-lg" />
              <p className="text-green-700 font-medium">เปลี่ยนรหัสผ่านสำเร็จแล้ว</p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl">
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-kanit font-bold text-pink-700 mb-2">
                รหัสผ่านปัจจุบัน
              </label>
              <div className="relative">
                <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pink-400" />
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-12 py-3 border border-pink-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-pink-50/30 text-gray-800 font-medium"
                  placeholder="ใส่รหัสผ่านปัจจุบัน"
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('current')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-pink-400 hover:text-pink-600"
                >
                  {showPasswords.current ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-kanit font-bold text-pink-700 mb-2">
                รหัสผ่านใหม่
              </label>
              <div className="relative">
                <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pink-400" />
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-12 py-3 border border-pink-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-pink-50/30 text-gray-800 font-medium"
                  placeholder="ใส่รหัสผ่านใหม่"
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('new')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-pink-400 hover:text-pink-600"
                >
                  {showPasswords.new ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {formData.newPassword && (
                <div className="mt-2">
                  <div className="flex items-center space-x-2">
                    <div className={`h-2 flex-1 rounded-full ${
                      formData.newPassword.length < 6 ? 'bg-red-200' :
                      formData.newPassword.length < 8 ? 'bg-yellow-200' :
                      'bg-green-200'
                    }`}>
                      <div className={`h-2 rounded-full transition-all ${
                        formData.newPassword.length < 6 ? 'w-1/3 bg-red-500' :
                        formData.newPassword.length < 8 ? 'w-2/3 bg-yellow-500' :
                        'w-full bg-green-500'
                      }`}></div>
                    </div>
                    <span className={`text-xs font-medium ${
                      formData.newPassword.length < 6 ? 'text-red-600' :
                      formData.newPassword.length < 8 ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {formData.newPassword.length < 6 ? 'อ่อน' :
                       formData.newPassword.length < 8 ? 'ปานกลาง' :
                       'แข็งแรง'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-kanit font-bold text-pink-700 mb-2">
                ยืนยันรหัสผ่านใหม่
              </label>
              <div className="relative">
                <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pink-400" />
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-12 py-3 border border-pink-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-pink-50/30 text-gray-800 font-medium"
                  placeholder="ยืนยันรหัสผ่านใหม่"
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirm')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-pink-400 hover:text-pink-600"
                >
                  {showPasswords.confirm ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {formData.confirmPassword && (
                <div className="mt-2 flex items-center space-x-2">
                  {formData.newPassword === formData.confirmPassword ? (
                    <>
                      <FaCheckCircle className="text-green-500 text-sm" />
                      <span className="text-green-600 text-sm font-medium">รหัสผ่านตรงกัน</span>
                    </>
                  ) : (
                    <>
                      <FaTimesCircle className="text-red-500 text-sm" />
                      <span className="text-red-600 text-sm font-medium">รหัสผ่านไม่ตรงกัน</span>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                  });
                  setError('');
                  setSuccess(false);
                }}
                className="flex-1 px-6 py-3 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg hover:from-pink-600 hover:to-rose-600 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>กำลังบันทึก...</span>
                  </div>
                ) : (
                  'เปลี่ยนรหัสผ่าน'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </LayoutWrapper>
  );
}

