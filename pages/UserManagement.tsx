import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { appService } from '../services/appService';
import Button from '../components/Button';
import { Users, UserPlus, Edit2, X, CheckCircle } from 'lucide-react';

interface UserManagementProps {
  currentUser: User;
}

const UserManagement: React.FC<UserManagementProps> = ({ currentUser }) => {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  
  // User Form State
  const [userIdToEdit, setUserIdToEdit] = useState<string | null>(null);
  const [userFormFullName, setUserFormFullName] = useState('');
  const [userFormUsername, setUserFormUsername] = useState('');
  const [userFormPassword, setUserFormPassword] = useState('');
  const [userFormRole, setUserFormRole] = useState<UserRole>(UserRole.AGENT);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Permissions
  const isSuperAdmin = currentUser.role === UserRole.SUPER_ADMIN;
  const isSalesAdmin = currentUser.role === UserRole.ADMIN;
  const isUwAdmin = currentUser.role === UserRole.UW_ADMIN;

  useEffect(() => {
    loadUsers();
    resetUserForm();
  }, []);

  const loadUsers = async () => {
    const agentsData = await appService.getAgents();
    const underwritersData = await appService.getUnderwriters();
    // For simplicity in this mock, getting admins would be separate or included in all users.
    // Using simple logic based on current user view rights.
    let combined: User[] = [];
    if (isSuperAdmin) {
       // Ideally get all.
       combined = await appService.getAllUsers(); 
    } else if (isSalesAdmin) {
       combined = agentsData;
    } else if (isUwAdmin) {
       combined = underwritersData;
    }
    setAllUsers(combined);
  };

  const getAvailableRolesForCreation = () => {
    if (isSuperAdmin) {
      return [UserRole.AGENT, UserRole.UNDERWRITER, UserRole.ADMIN, UserRole.UW_ADMIN, UserRole.SUPER_ADMIN];
    }
    if (isSalesAdmin) {
      return [UserRole.AGENT];
    }
    if (isUwAdmin) {
      return [UserRole.UNDERWRITER];
    }
    return [];
  };

  const resetUserForm = () => {
    setUserIdToEdit(null);
    setUserFormFullName('');
    setUserFormUsername('');
    setUserFormPassword('');
    if (isSalesAdmin) setUserFormRole(UserRole.AGENT);
    else if (isUwAdmin) setUserFormRole(UserRole.UNDERWRITER);
    else setUserFormRole(UserRole.AGENT);
  };

  const handleEditUserClick = (u: User) => {
    setUserIdToEdit(u.id);
    setUserFormFullName(u.fullName);
    setUserFormUsername(u.username);
    setUserFormPassword(u.password || '');
    setUserFormRole(u.role);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsFormLoading(true);
    
    try {
      if (userIdToEdit) {
        await appService.updateUser({
          id: userIdToEdit,
          fullName: userFormFullName,
          username: userFormUsername,
          password: userFormPassword,
          role: userFormRole,
        } as User);
        setSuccessMsg("User updated successfully");
      } else {
        await appService.createUser(userFormFullName, userFormUsername, userFormPassword, userFormRole);
        setSuccessMsg("User created successfully");
      }
      resetUserForm();
      loadUsers();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsFormLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-down">
       <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Users size={28} className="text-brand-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
              <p className="text-gray-500 text-sm">Create and manage system access</p>
            </div>
          </div>
          {successMsg && (
             <div className="bg-green-100 text-green-700 px-4 py-2 rounded-lg flex items-center text-sm font-medium animate-fade-in-down">
                <CheckCircle size={16} className="mr-2"/>
                {successMsg}
             </div>
          )}
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Create/Edit Form */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
                <div className="flex items-center justify-between mb-6 text-gray-900">
                    <div className="flex items-center">
                      {userIdToEdit ? <Edit2 size={20} className="mr-2 text-blue-600" /> : <UserPlus size={20} className="mr-2" />}
                      <h3 className="text-base font-bold">{userIdToEdit ? 'Edit User' : 'Create New User'}</h3>
                    </div>
                    {userIdToEdit && (
                      <button onClick={resetUserForm} className="text-xs text-red-500 hover:underline flex items-center">
                        <X size={12} className="mr-1"/> Cancel
                      </button>
                    )}
                </div>
                <form onSubmit={handleSaveUser} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input 
                    type="text" 
                    required
                    value={userFormFullName}
                    onChange={e => setUserFormFullName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-500 focus:border-brand-500"
                    placeholder="e.g. John Doe"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                    <input 
                    type="text" 
                    required
                    value={userFormUsername}
                    onChange={e => setUserFormUsername(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-500 focus:border-brand-500"
                    placeholder="e.g. jdoe"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input 
                    type="text" 
                    required={!userIdToEdit}
                    value={userFormPassword}
                    onChange={e => setUserFormPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-500 focus:border-brand-500"
                    placeholder={userIdToEdit ? "Leave blank to keep current" : "Min. 6 characters"}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <select
                    value={userFormRole}
                    onChange={e => setUserFormRole(e.target.value as UserRole)}
                    disabled={getAvailableRolesForCreation().length === 1}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-500 focus:border-brand-500 bg-white ${getAvailableRolesForCreation().length === 1 ? 'bg-gray-100' : ''}`}
                    >
                      {getAvailableRolesForCreation().map(role => (
                        <option key={role} value={role}>
                          {role === UserRole.AGENT ? 'Sales Agent' : 
                            role === UserRole.UNDERWRITER ? 'Underwriter' : 
                            role === UserRole.ADMIN ? 'Sales Admin' : 
                            role === UserRole.UW_ADMIN ? 'Underwriter Admin' : 
                            role === UserRole.SUPER_ADMIN ? 'Super Admin' : role}
                        </option>
                      ))}
                    </select>
                </div>
                <div className="pt-4">
                    <Button type="submit" isLoading={isFormLoading} className="w-full">
                      {userIdToEdit ? 'Update User' : 'Create Account'}
                    </Button>
                </div>
                </form>
            </div>

            {/* List */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center">
                        <Users size={16} className="mr-2" />
                        Existing Users
                    </h3>
                    <span className="text-xs font-medium bg-gray-200 text-gray-600 px-2 py-1 rounded-full">{allUsers.length} Total</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white border-b border-gray-100 text-xs text-gray-500 uppercase">
                            <tr>
                                <th className="px-6 py-3 font-medium">User</th>
                                <th className="px-6 py-3 font-medium">Role</th>
                                <th className="px-6 py-3 font-medium">Last Login</th>
                                <th className="px-6 py-3 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm">
                            {allUsers.map(u => (
                                <tr key={u.id} className={`hover:bg-gray-50 transition-colors ${userIdToEdit === u.id ? 'bg-blue-50' : ''}`}>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{u.fullName}</div>
                                        <div className="text-gray-500 text-xs">@{u.username}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs rounded-full font-medium border ${
                                            u.role === UserRole.SUPER_ADMIN ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                                            u.role === UserRole.UW_ADMIN ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                                            u.role === UserRole.ADMIN ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                            u.role === UserRole.UNDERWRITER ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                            'bg-green-50 text-green-700 border-green-100'
                                        }`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">
                                        {u.lastLogin ? (
                                          <span className="flex flex-col">
                                            <span>{new Date(u.lastLogin).toLocaleDateString()}</span>
                                            <span className="text-xs text-gray-400">{new Date(u.lastLogin).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                          </span>
                                        ) : <span className="text-gray-400">-</span>}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button 
                                          onClick={() => handleEditUserClick(u)}
                                          className="text-blue-600 hover:text-blue-800 font-medium text-xs flex items-center justify-end w-full"
                                        >
                                          <Edit2 size={14} className="mr-1" /> Edit
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {allUsers.length === 0 && (
                              <tr><td colSpan={4} className="p-4 text-center text-gray-500">No users found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
       </div>
    </div>
  );
};

export default UserManagement;