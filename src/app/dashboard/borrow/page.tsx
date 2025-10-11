'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import LayoutWrapper from '@/components/LayoutWrapper';
import ClientOnly from '@/components/ClientOnly';
import LoadingSpinner from '@/components/LoadingSpinner';
import AssetList from '@/components/AssetList';
import BorrowForm from '@/components/BorrowForm';
import { FaStar, FaClipboardList } from 'react-icons/fa';

type Asset = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  quantity: number;
  createdAt: string;
  updatedAt: string;
};

export default function BorrowPage() {
  const { data: session, status } = useSession();
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showBorrowForm, setShowBorrowForm] = useState(false);

  if (status === 'loading') {
    return <LoadingSpinner fullScreen color="pink" text="กำลังโหลดข้อมูล..." />;
  }

  if (status === 'unauthenticated') {
    redirect('/login');
  }

  const handleSelectAsset = (asset: Asset) => {
    setSelectedAsset(asset);
    setShowBorrowForm(true);
  };

  const handleCloseBorrowForm = () => {
    setShowBorrowForm(false);
    setSelectedAsset(null);
  };

  const handleBorrowSuccess = () => {
    setShowBorrowForm(false);
    setSelectedAsset(null);
    // อาจจะเพิ่มการแจ้งเตือนสำเร็จที่นี่
  };

  return (
    <LayoutWrapper>
      <div className="p-6 space-y-8">
        {/* Header Section */}
        <div className="text-center py-12 bg-gradient-to-r from-pink-50 to-rose-50 rounded-3xl border border-pink-200 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-100/50 to-rose-100/50"></div>
          <div className="relative z-10">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent font-kanit mb-4">
              ยืมครุภัณฑ์
            </h1>
            <p className="text-lg text-pink-700 font-medium max-w-2xl mx-auto">
              เลือกครุภัณฑ์ที่ต้องการยืมและกรอกข้อมูลการยืม ระบบจะส่งคำขออนุมัติให้ผู้ดูแลระบบ
            </p>
          </div>
        </div>

        {/* How to Borrow Section */}
        <div className="bg-gradient-to-r from-white to-pink-50 rounded-2xl border border-pink-200 p-6">
          <div className="flex items-center space-x-2 mb-6">
            <FaStar className="text-pink-600 text-2xl" />
            <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent font-kanit">
              ขั้นตอนการยืมครุภัณฑ์
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl border border-pink-100">
              <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">1</div>
              <h3 className="font-bold text-pink-700 mb-2">เลือกครุภัณฑ์</h3>
              <p className="text-pink-600 text-sm">เลือกครุภัณฑ์ที่ต้องการยืมจากรายการด้านล่าง</p>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl border border-pink-100">
              <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">2</div>
              <h3 className="font-bold text-pink-700 mb-2">กรอกข้อมูล</h3>
              <p className="text-pink-600 text-sm">กรอกจำนวน วันที่คืน และเหตุผลในการยืม</p>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl border border-pink-100">
              <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">3</div>
              <h3 className="font-bold text-pink-700 mb-2">รอการอนุมัติ</h3>
              <p className="text-pink-600 text-sm">รอผู้ดูแลระบบอนุมัติคำขอยืมของคุณ</p>
            </div>
          </div>
        </div>

        {/* Asset List Section */}
        <div className="bg-gradient-to-r from-white to-pink-50 rounded-2xl border border-pink-200 p-6">
          <AssetList 
            onSelectAsset={handleSelectAsset}
            showBorrowButton={true}
          />
        </div>

        {/* Important Notes */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6">
          <div className="flex items-center space-x-2 mb-4">
            <FaClipboardList className="text-amber-600 text-xl" />
            <h3 className="text-xl font-bold text-amber-700 font-kanit">หมายเหตุสำคัญ</h3>
          </div>
          <div className="space-y-3 text-amber-700">
            <div className="flex items-start space-x-3">
              <span className="text-amber-600 font-bold">•</span>
              <p>กรุณาคืนครุภัณฑ์ตามวันที่กำหนด หากเกินกำหนดอาจมีผลต่อการยืมครั้งต่อไป</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-amber-600 font-bold">•</span>
              <p>ผู้ยืมต้องรับผิดชอบในการดูแลครุภัณฑ์ให้อยู่ในสภาพเดิม</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-amber-600 font-bold">•</span>
              <p>หากครุภัณฑ์เสียหายหรือสูญหาย ผู้ยืมต้องรับผิดชอบในการชดใช้</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-amber-600 font-bold">•</span>
              <p>คำขอยืมจะได้รับการพิจารณาภายใน 1-2 วันทำการ</p>
            </div>
          </div>
        </div>
      </div>

      {/* Borrow Form Modal */}
      {showBorrowForm && (
        <BorrowForm
          selectedAsset={selectedAsset}
          onClose={handleCloseBorrowForm}
          onSuccess={handleBorrowSuccess}
        />
      )}


    </LayoutWrapper>
  );
}

