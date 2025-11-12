'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import LayoutWrapper from '@/components/LayoutWrapper';
import AlertService from '@/lib/alert';
import { FaBuilding, FaBox, FaPlus, FaEdit, FaSave, FaTimes } from 'react-icons/fa';

type Supply = {
  id: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  departmentInventory: {
    id: string;
    department: string;
    quantity: number;
  }[];
};

const DEPARTMENTS = [
  'นโยบายและวิชาการ',
  'การพัฒนาสังคมและสวัสดิการ',
  'บริหารงานทั่วไป',
  'ศูนย์บริการคนพิการ'
];

export default function SupplyDepartmentsPage() {
  const { data: session, status } = useSession();
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState<{ [key: string]: boolean }>({});
  const [editValues, setEditValues] = useState<{ [key: string]: number | string }>({});

  const fetchSupplies = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/supplies');
      if (response.ok) {
        const data = await response.json();
        setSupplies(data.data || []);
      } else {
        await AlertService.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      }
    } catch (error) {
      console.error('Error fetching supplies:', error);
      await AlertService.error('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupplies();
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-rose-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-200 border-t-pink-600 mx-auto mb-4"></div>
          <p className="text-pink-600 font-medium">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated' || session?.user?.role !== 'ADMIN') {
    redirect('/login');
  }

  const handleEditClick = (supplyId: string, department: string) => {
    const key = `${supplyId}-${department}`;
    setEditMode({ ...editMode, [key]: true });
    
    const supply = supplies.find(s => s.id === supplyId);
    const deptInventory = supply?.departmentInventory?.find(d => d.department === department);
    const currentQty = deptInventory?.quantity || 0;
    // ถ้าเป็น 0 ให้แสดงช่องว่าง ไม่แสดง 0
    setEditValues({ ...editValues, [key]: currentQty > 0 ? currentQty : '' as any });
  };

  const handleSaveClick = async (supplyId: string, department: string) => {
    const key = `${supplyId}-${department}`;
    const quantity = editValues[key] || 0;

    try {
      const response = await fetch('/api/supply-departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplyId, department, quantity })
      });

      if (response.ok) {
        await AlertService.success('บันทึกข้อมูลสำเร็จ');
        setEditMode({ ...editMode, [key]: false });
        fetchSupplies();
      } else {
        await AlertService.error('เกิดข้อผิดพลาดในการบันทึก');
      }
    } catch (error) {
      console.error('Error saving:', error);
      await AlertService.error('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
  };

  const handleCancelClick = (supplyId: string, department: string) => {
    const key = `${supplyId}-${department}`;
    setEditMode({ ...editMode, [key]: false });
  };

  const getDepartmentQuantity = (supply: Supply, department: string) => {
    const deptInventory = supply.departmentInventory?.find(d => d.department === department);
    return deptInventory?.quantity || 0;
  };

  return (
    <LayoutWrapper>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-kanit font-black bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
            จัดการวัสดุสิ้นเปลืองแยกตามแผนก
          </h1>
          <p className="text-pink-700 font-kanit mt-2">
            ระบุจำนวนวัสดุที่เหลืออยู่ในแต่ละแผนก
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-200 border-t-pink-600"></div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg border border-pink-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-pink-50 to-rose-50">
                  <tr>
                    <th className="px-6 py-4 text-left font-kanit font-bold text-pink-800 sticky left-0 bg-gradient-to-r from-pink-50 to-rose-50">
                      วัสดุ
                    </th>
                    <th className="px-6 py-4 text-center font-kanit font-bold text-pink-800">
                      ทั้งหมด
                    </th>
                    {DEPARTMENTS.map((dept) => (
                      <th key={dept} className="px-6 py-4 text-center font-kanit font-bold text-pink-800">
                        <div className="flex items-center justify-center gap-2">
                          <FaBuilding className="text-pink-600" />
                          <span>{dept}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {supplies.map((supply) => (
                    <tr key={supply.id} className="border-t border-pink-100 hover:bg-pink-25">
                      <td className="px-6 py-4 sticky left-0 bg-white">
                        <div>
                          <div className="font-kanit font-semibold text-gray-900">{supply.name}</div>
                          <div className="text-sm text-gray-600 font-kanit">{supply.category}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-kanit font-bold text-gray-900 text-lg">
                          {supply.quantity} {supply.unit}
                        </span>
                      </td>
                      {DEPARTMENTS.map((dept) => {
                        const key = `${supply.id}-${dept}`;
                        const isEditing = editMode[key];
                        const quantity = getDepartmentQuantity(supply, dept);

                        return (
                          <td key={dept} className="px-6 py-4 text-center">
                            {isEditing ? (
                              <div className="flex items-center justify-center gap-2">
                                <input
                                  type="number"
                                  min="0"
                                  value={editValues[key] || ''}
                                  onChange={(e) => setEditValues({ ...editValues, [key]: parseInt(e.target.value) || 0 })}
                                  placeholder="0"
                                  className="w-20 px-2 py-1 border border-pink-300 rounded-lg text-center font-kanit font-bold text-gray-900 focus:ring-2 focus:ring-pink-500"
                                />
                                <button
                                  onClick={() => handleSaveClick(supply.id, dept)}
                                  className="p-1 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"
                                  title="บันทึก"
                                >
                                  <FaSave />
                                </button>
                                <button
                                  onClick={() => handleCancelClick(supply.id, dept)}
                                  className="p-1 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                                  title="ยกเลิก"
                                >
                                  <FaTimes />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-2">
                                <span className="font-kanit font-bold text-gray-900 text-base">
                                  {quantity > 0 ? `${quantity} ${supply.unit}` : '-'}
                                </span>
                                <button
                                  onClick={() => handleEditClick(supply.id, dept)}
                                  className="p-1 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
                                  title="แก้ไข"
                                >
                                  <FaEdit />
                                </button>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {supplies.length === 0 && (
              <div className="text-center py-12">
                <FaBox className="mx-auto text-gray-400 text-5xl mb-4" />
                <p className="text-gray-500 font-kanit">ไม่มีข้อมูลวัสดุสิ้นเปลือง</p>
              </div>
            )}
          </div>
        )}
      </div>
    </LayoutWrapper>
  );
}
