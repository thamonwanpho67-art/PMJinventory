'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FaUsers, 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaUserShield, 
  FaUser,
  FaSearch,
  FaFilter,
  FaSpinner
} from 'react-icons/fa';
import LayoutWrapper from '@/components/LayoutWrapper';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
  createdAt: string;
  updatedAt: string;
  _count: {
    loans: number;
  };
}

export default function UsersManagementPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    role: 'USER' as 'ADMIN' | 'USER'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (user: User) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleEdit = async (user: User) => {
    setUserToEdit(user);
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role
    });
    setShowEditModal(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/users/${userToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setUsers(users.filter(u => u.id !== userToDelete.id));
        setShowDeleteModal(false);
        setUserToDelete(null);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete user');
      }
    } catch (error) {
      alert('Error deleting user');
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmEdit = async () => {
    if (!userToEdit) return;
    
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/users/${userToEdit.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUsers(users.map(u => u.id === userToEdit.id ? { ...u, ...updatedUser } : u));
        setShowEditModal(false);
        setUserToEdit(null);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update user');
      }
    } catch (error) {
      alert('Error updating user');
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const getRoleIcon = (role: string) => {
    return role === 'ADMIN' ? <FaUserShield className="text-purple-500" /> : <FaUser className="text-blue-500" />;
  };

  const getRoleText = (role: string) => {
    return role === 'ADMIN' ? 'ผู้ดูแลระบบ' : 'ผู้ใช้งาน';
  };

  const getRoleBadgeClass = (role: string) => {
    return role === 'ADMIN' 
      ? 'bg-purple-100 text-purple-800 border-purple-200' 
      : 'bg-blue-100 text-blue-800 border-blue-200';
  };

  if (isLoading) {
    return (
      <LayoutWrapper>
        <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 py-8 flex items-center justify-center">
          <div className="flex items-center space-x-3 text-pink-600">
            <FaSpinner className="animate-spin text-2xl" />
            <span className="text-lg font-kanit">กำลังโหลดข้อมูลผู้ใช้...</span>
          </div>
        </div>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl flex items-center justify-center mr-4">
                  <FaUsers className="text-white text-xl" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 font-kanit">จัดการผู้ใช้งาน</h1>
                  <p className="text-gray-600 font-kanit">จัดการบัญชีผู้ใช้และสิทธิ์การเข้าถึง</p>
                </div>
              </div>
              <button
                onClick={() => router.push('/admin/users/add')}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg hover:from-pink-600 hover:to-pink-700 transition-colors font-kanit font-medium"
              >
                <FaPlus className="mr-2" />
                เพิ่มผู้ใช้ใหม่
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-400">
              <div className="flex items-center">
                <FaUsers className="text-blue-500 text-2xl mr-3" />
                <div>
                  <p className="text-sm text-gray-600 font-kanit">ผู้ใช้ทั้งหมด</p>
                  <p className="text-2xl font-bold text-gray-900 font-kanit">{users.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-400">
              <div className="flex items-center">
                <FaUserShield className="text-purple-500 text-2xl mr-3" />
                <div>
                  <p className="text-sm text-gray-600 font-kanit">ผู้ดูแลระบบ</p>
                  <p className="text-2xl font-bold text-gray-900 font-kanit">
                    {users.filter(u => u.role === 'ADMIN').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-400">
              <div className="flex items-center">
                <FaUser className="text-green-500 text-2xl mr-3" />
                <div>
                  <p className="text-sm text-gray-600 font-kanit">ผู้ใช้งานทั่วไป</p>
                  <p className="text-2xl font-bold text-gray-900 font-kanit">
                    {users.filter(u => u.role === 'USER').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                {/* Search */}
                <div className="relative flex-1">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="ค้นหาชื่อหรืออีเมล..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent font-kanit text-black"
                  />
                </div>

                {/* Role Filter */}
                <div className="relative">
                  <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent font-kanit bg-white text-black"
                  >
                    <option value="ALL">ทุกสิทธิ์</option>
                    <option value="ADMIN">ผู้ดูแลระบบ</option>
                    <option value="USER">ผู้ใช้งาน</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-600 font-kanit">
              แสดงผล {filteredUsers.length} คนจากทั้งหมด {users.length} คน
            </div>
          </div>

          {/* Users List */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 font-kanit">ผู้ใช้งาน</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 font-kanit">สิทธิ์</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 font-kanit">การยืม</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 font-kanit">วันที่สร้าง</th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-500 font-kanit">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-pink-600 rounded-full flex items-center justify-center mr-3">
                            <span className="text-white font-kanit font-medium">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 font-kanit">{user.name}</div>
                            <div className="text-sm text-gray-500 font-kanit">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {getRoleIcon(user.role)}
                          <span className={`ml-2 px-3 py-1 rounded-full text-xs font-medium border font-kanit ${getRoleBadgeClass(user.role)}`}>
                            {getRoleText(user.role)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900 font-kanit">
                          {user._count.loans} รายการ
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900 font-kanit">
                          {new Date(user.createdAt).toLocaleDateString('th-TH')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(user)}
                            className="p-2 text-pink-600 hover:text-pink-800 hover:bg-pink-100 rounded-lg transition-colors"
                            title="แก้ไข"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(user)}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-colors"
                            title="ลบ"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredUsers.length === 0 && (
                <div className="text-center py-12">
                  <FaUsers className="mx-auto text-gray-300 text-6xl mb-4" />
                  <p className="text-gray-500 font-kanit text-xl">ไม่พบผู้ใช้งาน</p>
                  <p className="text-gray-400 font-kanit">
                    {searchTerm || roleFilter !== 'ALL' 
                      ? 'ลองเปลี่ยนเงื่อนไขการกรองข้อมูล' 
                      : 'เพิ่มผู้ใช้งานใหม่เพื่อเริ่มต้นใช้งาน'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaTrash className="text-red-600 text-2xl" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 font-kanit mb-2">ยืนยันการลบผู้ใช้งาน</h3>
              <p className="text-gray-600 font-kanit mb-6">
                คุณต้องการลบผู้ใช้งาน <span className="font-medium">{userToDelete.name}</span> หรือไม่?<br />
                การดำเนินการนี้ไม่สามารถย้อนกลับได้
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setUserToDelete(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-kanit font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-kanit font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isDeleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      กำลังลบ...
                    </>
                  ) : (
                    'ลบผู้ใช้งาน'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && userToEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl flex items-center justify-center mr-4">
                <FaEdit className="text-white text-xl" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 font-kanit">แก้ไขข้อมูลผู้ใช้งาน</h3>
                <p className="text-gray-600 font-kanit text-sm">แก้ไขข้อมูลของ {userToEdit.name}</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 font-kanit mb-2">
                  ชื่อผู้ใช้งาน
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent font-kanit text-black"
                  placeholder="ชื่อผู้ใช้งาน"
                />
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 font-kanit mb-2">
                  อีเมล
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent font-kanit text-black"
                  placeholder="อีเมล"
                />
              </div>

              {/* Role Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 font-kanit mb-2">
                  สิทธิ์การใช้งาน
                </label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value as 'ADMIN' | 'USER' })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent font-kanit bg-white text-black"
                >
                  <option value="USER">ผู้ใช้งานทั่วไป</option>
                  <option value="ADMIN">ผู้ดูแลระบบ</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-4 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setUserToEdit(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-kanit font-medium"
              >
                ยกเลิก
              </button>
              <button
                onClick={confirmEdit}
                disabled={isUpdating || !editForm.name || !editForm.email}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg hover:from-pink-600 hover:to-pink-700 transition-colors font-kanit font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isUpdating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    กำลังบันทึก...
                  </>
                ) : (
                  'บันทึกการแก้ไข'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </LayoutWrapper>
  );
}

