'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaPlus, FaTimes, FaBox, FaUpload } from 'react-icons/fa';
import LayoutWrapper from '@/components/LayoutWrapper';

export default function AddAssetPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [isCheckingCode, setIsCheckingCode] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    assetCode: '',
    description: '',
    category: '',
    price: '',
    costCenter: '',
    accountingDate: '',
    quantity: '1',
    status: 'AVAILABLE',
    imageUrl: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // ตรวจสอบรหัสครุภัณฑ์แบบ real-time
    if (name === 'code' && value.trim()) {
      checkAssetCode(value.trim());
    } else if (name === 'code') {
      setCodeError('');
    }
  };

  // ฟังก์ชันตรวจสอบรหัสครุภัณฑ์ซ้ำ
  const checkAssetCode = async (code: string) => {
    if (!code) return;
    
    setIsCheckingCode(true);
    setCodeError('');
    
    try {
      const response = await fetch(`/api/assets?checkCode=${encodeURIComponent(code)}`);
      const data = await response.json();
      
      if (data.exists) {
        setCodeError(`รหัสครุภัณฑ์ "${code}" มีอยู่ในระบบแล้ว`);
      }
    } catch (error) {
      console.error('Error checking asset code:', error);
    } finally {
      setIsCheckingCode(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadLoading(true);
    setError('');

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload file');
      }

      setFormData(prev => ({
        ...prev,
        imageUrl: data.url
      }));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred during upload');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const submitFormData = new FormData();
      submitFormData.append('name', formData.name);
      submitFormData.append('code', formData.code);
      submitFormData.append('assetCode', formData.assetCode);
      submitFormData.append('description', formData.description);
      submitFormData.append('category', formData.category);
      submitFormData.append('price', formData.price);
      submitFormData.append('costCenter', formData.costCenter);
      submitFormData.append('accountingDate', formData.accountingDate);
      submitFormData.append('quantity', formData.quantity);
      submitFormData.append('status', formData.status);
      submitFormData.append('imageUrl', formData.imageUrl);

      const response = await fetch('/api/assets', {
        method: 'POST',
        body: submitFormData,
      });

      const data = await response.json();

      if (!response.ok) {
        // ปรับปรุงข้อความแสดงข้อผิดพลาด
        let errorMessage = data.error || 'เกิดข้อผิดพลาดในการสร้างครุภัณฑ์';
        
        // แปลข้อความภาษาอังกฤษเป็นไทย
        if (errorMessage.includes('Asset code already exists')) {
          errorMessage = `รหัสครุภัณฑ์ "${formData.code}" มีอยู่ในระบบแล้ว กรุณาใช้รหัสอื่น`;
        } else if (errorMessage.includes('Missing required fields')) {
          errorMessage = 'กรุณากรอกข้อมูลที่จำเป็น: รหัสครุภัณฑ์ และชื่ออุปกรณ์';
        } else if (errorMessage.includes('Invalid status')) {
          errorMessage = 'สถานะไม่ถูกต้อง กรุณาเลือก: ว่าง, ชำรุด, หรือ หมด';
        } else if (errorMessage.includes('Unauthorized')) {
          errorMessage = 'ไม่มีสิทธิ์เข้าถึง กรุณาเข้าสู่ระบบใหม่';
        }
        
        throw new Error(errorMessage);
      }

      router.push('/admin/assets');
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LayoutWrapper>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl flex items-center justify-center mr-4">
                  <FaPlus className="text-white text-xl" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 font-kanit">เพิ่มรายการครุภัณฑ์</h1>
                  <p className="text-gray-600 font-kanit">สร้างรายการครุภัณฑ์ใหม่ในระบบ</p>
                </div>
              </div>
              <button
                onClick={() => router.push('/admin/assets')}
                className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors font-kanit"
              >
                <FaTimes className="mr-2" />
                ยกเลิก
              </button>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800 font-kanit">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Asset Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 font-kanit mb-2">
                    ชื่ออุปกรณ์ *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent font-kanit text-black"
                    placeholder="เช่น Notebook Dell Inspiron"
                  />
                </div>

                {/* Asset Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 font-kanit mb-2">
                    รหัสครุภัณฑ์ (ถ้ามี)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      required
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent font-kanit text-black ${
                        codeError 
                          ? 'border-red-300 focus:ring-red-500' 
                          : 'border-gray-300 focus:ring-pink-500'
                      }`}
                      placeholder="เช่น NB001"
                    />
                    {isCheckingCode && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-pink-500"></div>
                      </div>
                    )}
                  </div>
                  {codeError && (
                    <p className="text-red-600 text-sm font-kanit mt-1 flex items-center">
                      <span className="mr-1">⚠️</span>
                      {codeError}
                    </p>
                  )}
                  {formData.code && !codeError && !isCheckingCode && (
                    <p className="text-green-600 text-sm font-kanit mt-1 flex items-center">
                      <span className="mr-1">✅</span>
                      รหัสครุภัณฑ์นี้ใช้ได้
                    </p>
                  )}
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 font-kanit mb-2">
                    หมวดหมู่
                  </label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent font-kanit text-gray-900"
                    placeholder="เช่น คอมพิวเตอร์"
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 font-kanit mb-2">
                    ราคา (บาท)
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent font-kanit text-gray-900"
                    placeholder="เช่น 25000"
                    min="0"
                    step="0.01"
                  />
                </div>

                {/* Asset Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 font-kanit mb-2">
                    รหัสสินทรัพย์ (ถ้ามี)
                  </label>
                  <input
                    type="text"
                    name="assetCode"
                    value={formData.assetCode}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent font-kanit text-gray-900"
                    placeholder="เช่น AS-2025-001 (ไม่บังคับ)"
                  />
                </div>

                {/* Cost Center */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 font-kanit mb-2">
                    ศูนย์ต้นทุน
                  </label>
                  <input
                    type="text"
                    name="costCenter"
                    value={formData.costCenter}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent font-kanit text-gray-900"
                    placeholder="เช่น CC-IT-001"
                  />
                </div>

                {/* Accounting Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 font-kanit mb-2">
                    วันที่ลงบัญชี
                  </label>
                  <input
                    type="date"
                    name="accountingDate"
                    value={formData.accountingDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent font-kanit text-gray-900"
                    min="2005-01-01" 
                    max="2032-12-31"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 font-kanit mb-2">
                    สถานะ *
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent font-kanit bg-white text-gray-900"
                  >
                    <option value="AVAILABLE">ว่าง</option>
                    <option value="DAMAGED">ชำรุด</option>
                    <option value="OUT_OF_STOCK">หมด</option>
                  </select>
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 font-kanit mb-2">
                    จำนวนคงเหลือ *
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent font-kanit text-gray-900"
                    placeholder="1"
                    min="0"
                    step="1"
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 font-kanit mb-2">
                    รูปภาพ
                  </label>
                  <div className="space-y-3">
                    {/* File Upload */}
                    <div className="flex items-center">
                      <label className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                          disabled={uploadLoading}
                        />
                        <div className="flex cursor-pointer">
                          <div className="flex-1 px-4 py-3 border border-gray-300 rounded-l-lg bg-gray-50 text-gray-500 font-kanit">
                            {uploadLoading ? 'กำลังอัปโหลด...' : 'เลือกไฟล์รูปภาพ'}
                          </div>
                          <div className="px-4 py-3 bg-pink-500 hover:bg-pink-600 border border-pink-500 rounded-r-lg transition-colors text-white">
                            {uploadLoading ? (
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            ) : (
                              <FaUpload />
                            )}
                          </div>
                        </div>
                      </label>
                    </div>
                    {/* Manual URL Input */}
                    <div className="text-center text-sm text-gray-500 font-kanit">หรือ</div>
                    <input
                      type="url"
                      name="imageUrl"
                      value={formData.imageUrl}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent font-kanit text-gray-900"
                      placeholder="หรือใส่ URL รูปภาพ"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 font-kanit mb-2">
                  คำอธิบาย
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent font-kanit text-gray-900"
                  placeholder="รายละเอียดเพิ่มเติมเกี่ยวกับครุภัณฑ์..."
                />
              </div>

              {/* Image Preview */}
              {formData.imageUrl && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 font-kanit mb-2">
                    ตัวอย่างรูปภาพ
                  </label>
                  <div className="w-32 h-32 border border-gray-300 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                    <img
                      src={formData.imageUrl}
                      alt="Asset preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement!.innerHTML = '<FaBox className="text-gray-400 text-2xl" />';
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => router.push('/admin/assets')}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-kanit font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-3 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg hover:from-pink-600 hover:to-pink-700 transition-colors font-kanit font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      กำลังบันทึก...
                    </>
                  ) : (
                    <>
                      <FaPlus className="mr-2" />
                      เพิ่มรายการ
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </LayoutWrapper>
  );
}

