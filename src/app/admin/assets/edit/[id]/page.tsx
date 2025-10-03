'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { FaEdit, FaTimes, FaBox, FaUpload, FaSpinner } from 'react-icons/fa';
import LayoutWrapper from '@/components/LayoutWrapper';

interface Asset {
  id: string;
  name: string;
  code: string;
  description: string | null;
  category: string | null;
  location: string | null;
  assetCode: string | null;
  costCenter: string | null;
  price: number | null;
  accountingDate: string | null;
  status: 'AVAILABLE' | 'DAMAGED' | 'OUT_OF_STOCK';
  imageUrl: string | null;
}

export default function EditAssetPage() {
  const router = useRouter();
  const params = useParams();
  const assetId = params.id as string;
  
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState('');
  const [asset, setAsset] = useState<Asset | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    category: '',
    location: '',
    assetCode: '',
    costCenter: '',
    price: '',
    accountingDate: '',
    status: 'AVAILABLE' as const,
    imageUrl: ''
  });

  useEffect(() => {
    fetchAsset();
  }, [assetId]);

  const fetchAsset = async () => {
    try {
      const response = await fetch(`/api/assets/${assetId}`);
      if (!response.ok) {
        throw new Error('Asset not found');
      }
      const assetData = await response.json();
      setAsset(assetData);
      setFormData({
        name: assetData.name,
        code: assetData.code,
        description: assetData.description || '',
        category: assetData.category || '',
        location: assetData.location || '',
        assetCode: assetData.assetCode || '',
        costCenter: assetData.costCenter || '',
        price: assetData.price ? assetData.price.toString() : '',
        accountingDate: assetData.accountingDate ? new Date(assetData.accountingDate).toISOString().split('T')[0] : '',
        status: assetData.status,
        imageUrl: assetData.imageUrl || ''
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch asset');
    } finally {
      setIsFetching(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
      const response = await fetch(`/api/assets/${assetId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update asset');
      }

      router.push('/admin/assets');
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <LayoutWrapper>
        <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 py-8 flex items-center justify-center">
          <div className="flex items-center space-x-3 text-pink-600">
            <FaSpinner className="animate-spin text-2xl" />
            <span className="text-lg font-kanit">กำลังโหลดข้อมูล...</span>
          </div>
        </div>
      </LayoutWrapper>
    );
  }

  if (!asset) {
    return (
      <LayoutWrapper>
        <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 py-8 flex items-center justify-center">
          <div className="text-center">
            <FaBox className="text-6xl text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-700 font-kanit mb-2">ไม่พบข้อมูลครุภัณฑ์</h2>
            <p className="text-gray-600 font-kanit mb-4">รายการที่คุณค้นหาไม่มีอยู่ในระบบ</p>
            <button
              onClick={() => router.push('/admin/assets')}
              className="px-6 py-3 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg hover:from-pink-600 hover:to-pink-700 transition-colors font-kanit font-medium"
            >
              กลับไปหน้าหลัก
            </button>
          </div>
        </div>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl flex items-center justify-center mr-4">
                  <FaEdit className="text-white text-xl" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 font-kanit">แก้ไขข้อมูลครุภัณฑ์</h1>
                  <p className="text-gray-600 font-kanit">แก้ไขรายละเอียดของ {asset.name}</p>
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent font-kanit text-gray-900"
                    placeholder="เช่น Notebook Dell Inspiron"
                  />
                </div>

                {/* Asset Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 font-kanit mb-2">
                    รหัสครุภัณฑ์ *
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent font-kanit text-gray-900"
                    placeholder="เช่น NB001"
                  />
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

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 font-kanit mb-2">
                    สถานที่
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent font-kanit text-gray-900"
                    placeholder="เช่น ห้องทำงาน"
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

                {/* Asset Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 font-kanit mb-2">
                    รหัสทรัพย์สิน
                  </label>
                  <input
                    type="text"
                    name="assetCode"
                    value={formData.assetCode}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent font-kanit text-gray-900"
                    placeholder="เช่น PMJ-IT-001"
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
                    placeholder="เช่น IT-DEP"
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
                    placeholder="0.00"
                    min="0"
                    step="0.01"
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
                            {uploadLoading ? 'กำลังอัปโหลด...' : 'เลือกไฟล์รูปภาพใหม่'}
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent font-kanit"
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
                        target.parentElement!.innerHTML = '<div class="text-gray-400 text-2xl">📦</div>';
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
                      <FaEdit className="mr-2" />
                      บันทึกการเปลี่ยนแปลง
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