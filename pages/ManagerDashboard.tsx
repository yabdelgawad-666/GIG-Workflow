import React, { useEffect, useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { User, QRF, QRFStatus, UserRole } from '../types';
import { appService } from '../services/appService';
import Button from '../components/Button';
import SortableTh from '../components/SortableTh';
import { UserPlus, FileText, BarChart2, PlusCircle, Shield, User as UserIcon, Users, Check, ExternalLink, Link as LinkIcon, ShieldCheck, ShieldAlert, Edit2, X, CheckCircle } from 'lucide-react';

interface ManagerDashboardProps {
  user: User;
}

const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ user }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Role Checks
  const isSuperAdmin = user.role === UserRole.SUPER_ADMIN;
  const isSalesAdmin = user.role === UserRole.ADMIN; // "Sales Admin"
  const isUwAdmin = user.role === UserRole.UW_ADMIN;

  // Determine allowed User Management roles
  const canManageUsers = isSuperAdmin || isSalesAdmin || isUwAdmin;
  
  // Assignment Permission: Only Super Admin and UW Admin can assign to Underwriters
  const canAssign = isSuperAdmin || isUwAdmin;

  // Route Handling
  const isQRFsView = location.pathname.includes('/qrfs');
  const isDashboardView = !isQRFsView;

  // Internal Tab State
  const [activeTab, setActiveTab] = useState<'reports' | 'users'>('reports');

  // Data State
  const [allUsers, setAllUsers] = useState<User[]>([]); // To hold everyone for filtering
  const [agents, setAgents] = useState<User[]>([]);
  const [underwriters, setUnderwriters] = useState<User[]>([]);
  const [qrfs, setQrfs] = useState<QRF[]>([]);
  
  // User Form State (Create/Edit)
  const [userIdToEdit, setUserIdToEdit] = useState<string | null>(null);
  const [userFormFullName, setUserFormFullName] = useState('');
  const [userFormUsername, setUserFormUsername] = useState('');
  const [userFormPassword, setUserFormPassword] = useState('');
  const [userFormRole, setUserFormRole] = useState<UserRole>(UserRole.AGENT);
  const [isFormLoading, setIsFormLoading] = useState(false);

  // Table State (QRFs View)
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'createdAt', direction: 'desc' });
  const [filters, setFilters] = useState<{ [key: string]: string[] }>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Assignment Logic
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignTargetIds, setAssignTargetIds] = useState<string[]>([]); // IDs of QRFs to assign
  const [selectedQrfIds, setSelectedQrfIds] = useState<Set<string>>(new Set());

  // Success Feedback
  const [successToast, setSuccessToast] = useState<{show: boolean, message: string}>({ show: false, message: '' });

  useEffect(() => {
    loadData();
    // Set default role for form based on permissions
    resetUserForm();
  }, [user.role]);

  const loadData = async () => {
    // In a real app, endpoints would filter. Here we fetch and filter locally.
    const [agentsData, underwritersData, qrfsData] = await Promise.all([
      appService.getAgents(),
      appService.getUnderwriters(),
      appService.getQRFs()
    ]);

    // Construct the "System Users" list based on permissions
    let combinedUsers: User[] = [];
    
    // We reuse the data we have. 
    // Ideally we would have specific API calls like getAdmins() etc.
    // Here we assume getAgents and getUnderwriters returns those lists.
    // For admins/superadmins, we rely on what we can see or mock.
    
    if (isSuperAdmin) {
       // Super admin sees everyone. In this mock setup, we combine lists. 
       // Note: This misses existing Admins unless we fetch them separately or have a getAllUsers.
       // For this demo, we'll combine what we have + manually fetched admins logic if available.
       combinedUsers = [...agentsData, ...underwritersData]; 
       // In a real scenario, appService.getAllUsers() would be better.
    } else if (isSalesAdmin) {
       combinedUsers = [...agentsData];
    } else if (isUwAdmin) {
       combinedUsers = [...underwritersData];
    }

    setAllUsers(combinedUsers);
    setAgents(agentsData);
    setUnderwriters(underwritersData);
    setQrfs(qrfsData);
  };

  const showToast = (message: string) => {
    setSuccessToast({ show: true, message });
    setTimeout(() => setSuccessToast({ show: false, message: '' }), 3000);
  };

  const resetUserForm = () => {
    setUserIdToEdit(null);
    setUserFormFullName('');
    setUserFormUsername('');
    setUserFormPassword('');
    // Default Role
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
        // Update existing
        await appService.updateUser({
          id: userIdToEdit,
          fullName: userFormFullName,
          username: userFormUsername,
          password: userFormPassword,
          role: userFormRole,
          // preserve other fields if any
        } as User);
        showToast("User updated successfully");
      } else {
        // Create new
        await appService.createUser(userFormFullName, userFormUsername, userFormPassword, userFormRole);
        showToast("User created successfully");
      }
      
      resetUserForm();
      loadData(); // refresh list
    } catch (err) {
      console.error(err);
    } finally {
      setIsFormLoading(false);
    }
  };

  const copyToClipboard = (id: string) => {
    const link = appService.generateLink(id);
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ----------------------------------------------------------------------
  // Table Logic & filtering
  // ----------------------------------------------------------------------
  
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleFilter = (key: string, values: string[]) => {
    setFilters(prev => ({ ...prev, [key]: values }));
    setSelectedQrfIds(new Set()); 
  };

  const getUniqueValues = (key: string) => {
    const values = new Set<string>();
    qrfs.forEach(q => {
      let val = '';
      if (key === 'name') val = q.name;
      else if (key === 'agentName') val = q.agentName;
      else if (key === 'assignedToName') val = q.assignedToName || 'Unassigned';
      else if (key === 'accountName') val = q.data.accountName;
      else if (key === 'status') val = q.status;
      else if (key === 'createdAt') val = new Date(q.createdAt).toLocaleDateString();
      else if (key === 'submittedAt') val = q.submittedAt ? new Date(q.submittedAt).toLocaleDateString() : '-';
      
      if (val) values.add(val);
    });
    return Array.from(values).sort();
  };

  const filteredAndSortedQRFs = useMemo(() => {
    return qrfs
      .filter(q => {
        return Object.entries(filters).every(([key, selectedValues]) => {
          const values = selectedValues as string[];
          if (!values || values.length === 0) return true;
          
          let val = '';
          if (key === 'name') val = q.name;
          else if (key === 'agentName') val = q.agentName;
          else if (key === 'assignedToName') val = q.assignedToName || 'Unassigned';
          else if (key === 'accountName') val = q.data.accountName;
          else if (key === 'status') val = q.status;
          else if (key === 'createdAt') val = new Date(q.createdAt).toLocaleDateString();
          else if (key === 'submittedAt') val = q.submittedAt ? new Date(q.submittedAt).toLocaleDateString() : '-';

          return values.includes(val);
        });
      })
      .sort((a, b) => {
        const key = sortConfig.key;
        let valA: any = a[key as keyof QRF];
        let valB: any = b[key as keyof QRF];

        if (key === 'accountName') {
          valA = a.data.accountName;
          valB = b.data.accountName;
        }
        if (key === 'assignedToName') {
           valA = a.assignedToName || '';
           valB = b.assignedToName || '';
        }

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
  }, [qrfs, filters, sortConfig]);

  // ----------------------------------------------------------------------
  // Selection Logic
  // ----------------------------------------------------------------------

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = filteredAndSortedQRFs.map(q => q.id);
      setSelectedQrfIds(new Set(allIds));
    } else {
      setSelectedQrfIds(new Set());
    }
  };

  const handleSelectRow = (id: string) => {
    const newSet = new Set(selectedQrfIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedQrfIds(newSet);
  };

  // ----------------------------------------------------------------------
  // Assignment Logic
  // ----------------------------------------------------------------------

  const openAssignModal = (ids: string[]) => {
    setAssignTargetIds(ids);
    setAssignModalOpen(true);
  };

  const confirmAssignment = async (underwriterId: string, underwriterName: string) => {
    // Perform bulk update
    const updates = assignTargetIds.map(id => {
       const qrf = qrfs.find(q => q.id === id);
       if (!qrf) return null;
       return { ...qrf, assignedToId: underwriterId, assignedToName: underwriterName };
    }).filter(Boolean) as QRF[];

    await Promise.all(updates.map(q => appService.saveQRF(q)));
    
    setAssignModalOpen(false);
    setAssignTargetIds([]);
    setSelectedQrfIds(new Set()); 
    
    // Auto-refresh logic
    await loadData();
    
    // Show success confirmation
    showToast(`Successfully assigned to ${underwriterName}`);
  };


  // ----------------------------------------------------------------------
  // Analytics Helpers
  // ----------------------------------------------------------------------
  const totalSubmitted = qrfs.filter(q => q.status === QRFStatus.SUBMITTED).length;
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const isCurrentMonth = (dateStr?: string) => {
    if(!dateStr) return false;
    const d = new Date(dateStr);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  };

  // Agent Stats
  const agentPerformance = agents.map(agent => {
    const agentQrfs = qrfs.filter(q => q.agentId === agent.id);
    const submitted = agentQrfs.filter(q => q.status === QRFStatus.SUBMITTED).length;
    const drafts = agentQrfs.filter(q => q.status === QRFStatus.DRAFT).length;
    return {
      agent,
      total: agentQrfs.length,
      submitted,
      drafts
    };
  }).sort((a, b) => b.total - a.total);

  // UW Stats
  const uwPerformance = underwriters.map(uw => {
      const assigned = qrfs.filter(q => q.assignedToId === uw.id);
      return {
          uw,
          totalAssigned: assigned.length,
          reviewed: assigned.length // For now assuming all assigned are being reviewed/processed
      }
  }).sort((a,b) => b.totalAssigned - a.totalAssigned);

  const maxActivity = Math.max(...agentPerformance.map(a => a.total), 1);
  const maxUwActivity = Math.max(...uwPerformance.map(u => u.totalAssigned), 1);

  const getUserMetrics = (u: User) => {
     if(u.role === UserRole.AGENT) {
         return qrfs.filter(q => q.agentId === u.id && isCurrentMonth(q.createdAt)).length;
     } else {
         return qrfs.filter(q => q.assignedToId === u.id).length;
     }
  };

  // ----------------------------------------------------------------------
  // User Management Permissions Helpers
  // ----------------------------------------------------------------------
  
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

  const getManagementTitle = () => {
    if (isSuperAdmin) return "System Users";
    if (isSalesAdmin) return "Sales Agents";
    if (isUwAdmin) return "Underwriters";
    return "Users";
  };

  return (
    <div className="space-y-8 animate-fade-in-down relative">
      
      {/* Success Toast */}
      {successToast.show && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in-down">
          <div className="bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3">
             <div className="bg-white rounded-full p-1">
               <CheckCircle size={20} className="text-green-600" />
             </div>
             <span className="font-medium">{successToast.message}</span>
          </div>
        </div>
      )}

      {/* Header Stats - Visible on Dashboard View */}
      {isDashboardView && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                <UserPlus size={24} />
                </div>
                <div>
                <p className="text-sm text-gray-500 font-medium">Total Staff</p>
                <h3 className="text-2xl font-bold text-gray-900">{agents.length + underwriters.length}</h3>
                <p className="text-xs text-gray-400 mt-1">{agents.length} Sales, {underwriters.length} Underwriters</p>
                </div>
            </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center space-x-4">
                <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
                <FileText size={24} />
                </div>
                <div>
                <p className="text-sm text-gray-500 font-medium">Total eQRFs</p>
                <h3 className="text-2xl font-bold text-gray-900">{qrfs.length}</h3>
                </div>
            </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                <BarChart2 size={24} />
                </div>
                <div>
                <p className="text-sm text-gray-500 font-medium">Completion Rate</p>
                <h3 className="text-2xl font-bold text-gray-900">
                    {qrfs.length > 0 ? Math.round((totalSubmitted / qrfs.length) * 100) : 0}%
                </h3>
                </div>
            </div>
            </div>
        </div>
      )}

      {/* DASHBOARD VIEW (Tabs) */}
      {isDashboardView && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 min-h-[600px]">
            {/* Tabs Navigation */}
            <div className="border-b border-gray-200 bg-gray-50 px-6">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('reports')}
                  className={`${
                    activeTab === 'reports'
                      ? 'border-brand-500 text-brand-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors`}
                >
                  <BarChart2 size={18} className="mr-2" />
                  Reports & Analytics
                </button>
                {/* User Management for Admins */}
                {canManageUsers && (
                  <button
                    onClick={() => setActiveTab('users')}
                    className={`${
                      activeTab === 'users'
                        ? 'border-brand-500 text-brand-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors`}
                  >
                    <Users size={18} className="mr-2" />
                    User Management
                  </button>
                )}
              </nav>
            </div>

            <div className="p-6">
              {/* TAB: REPORTS */}
              {activeTab === 'reports' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in-down">
                      {/* Agent Performance Chart */}
                      <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
                          <h4 className="font-semibold text-gray-900 mb-6 flex items-center">
                            <Users size={18} className="mr-2 text-gray-500" />
                            Sales Agent Performance
                          </h4>
                          <div className="space-y-5">
                              {agentPerformance.map((stat) => (
                              <div key={stat.agent.id}>
                                  <div className="flex justify-between text-sm mb-2">
                                  <span className="font-medium text-gray-700">{stat.agent.fullName}</span>
                                  <span className="text-gray-900 font-bold">{stat.total}</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                  <div className="flex h-3 rounded-full overflow-hidden">
                                      <div style={{ width: `${(stat.submitted / maxActivity) * 100}%` }} className="bg-brand-500 h-full"></div>
                                      <div style={{ width: `${(stat.drafts / maxActivity) * 100}%` }} className="bg-yellow-400 h-full"></div>
                                  </div>
                                  </div>
                                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                                  <span>Submitted: {stat.submitted}</span>
                                  <span>Drafts: {stat.drafts}</span>
                                  </div>
                              </div>
                              ))}
                              {agentPerformance.length === 0 && <p className="text-gray-400 text-sm">No data available.</p>}
                          </div>
                      </div>

                      {/* Underwriting Performance Chart */}
                      <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
                          <h4 className="font-semibold text-gray-900 mb-6 flex items-center">
                            <Shield size={18} className="mr-2 text-gray-500" />
                            Underwriting Team Workload
                          </h4>
                          <div className="space-y-5">
                              {uwPerformance.map((stat) => (
                              <div key={stat.uw.id}>
                                  <div className="flex justify-between text-sm mb-2">
                                  <span className="font-medium text-gray-700">{stat.uw.fullName}</span>
                                  <span className="text-gray-900 font-bold">{stat.totalAssigned}</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                      <div style={{ width: `${(stat.totalAssigned / maxUwActivity) * 100}%` }} className="bg-blue-600 h-full rounded-full"></div>
                                  </div>
                                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                                      <span>Assigned Reviews</span>
                                  </div>
                              </div>
                              ))}
                              {uwPerformance.length === 0 && <p className="text-gray-400 text-sm">No underwriters found.</p>}
                          </div>
                      </div>

                      {/* Pipeline Health */}
                      <div className="lg:col-span-2 bg-gray-50 p-5 rounded-lg border border-gray-100">
                          <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                            <FileText size={18} className="mr-2 text-gray-500" />
                            Pipeline Health
                          </h4>
                          <div className="flex flex-col md:flex-row items-center justify-around py-4">
                              <div className="relative w-40 h-40 rounded-full border-[16px] border-white shadow-sm flex items-center justify-center mb-6 md:mb-0">
                                  <div 
                                  className="absolute inset-0 rounded-full border-[16px] border-brand-500"
                                  style={{ clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 100%)`, transform: `rotate(${qrfs.length ? (totalSubmitted/qrfs.length)*180 : 0}deg)` }} 
                                  ></div> 
                                  <div className="text-center">
                                      <span className="text-3xl font-bold text-gray-900">{qrfs.length}</span>
                                      <p className="text-xs text-gray-500">Total</p>
                                  </div>
                              </div>
                              <div className="grid grid-cols-2 gap-6 text-center w-full max-w-md">
                                  <div className="p-4 bg-white border border-gray-100 rounded-lg shadow-sm">
                                      <p className="text-brand-600 font-bold text-2xl">{totalSubmitted}</p>
                                      <p className="text-sm text-gray-600">Submitted</p>
                                  </div>
                                  <div className="p-4 bg-white border border-gray-100 rounded-lg shadow-sm">
                                      <p className="text-yellow-600 font-bold text-2xl">{qrfs.length - totalSubmitted}</p>
                                      <p className="text-sm text-gray-600">Drafts</p>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              )}

              {/* TAB: USERS (PERMISSIONS BASED) */}
              {activeTab === 'users' && canManageUsers && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in-down">
                      {/* LEFT: Create/Edit User */}
                      <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 h-fit">
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
                              required={!userIdToEdit} // Required only on create
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

                      {/* RIGHT: User List */}
                      <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 overflow-hidden">
                          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center">
                                  <Users size={16} className="mr-2" />
                                  {getManagementTitle()}
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
              )}
            </div>
        </div>
      )}

      {/* QRFS VIEW (TABLE) */}
      {isQRFsView && (
        <div className="space-y-4 animate-fade-in-down">
          <div className="flex justify-between items-center pb-2 border-b border-gray-200 mb-4">
            <h2 className="text-2xl font-bold text-gray-900">All eQRFs</h2>
          </div>
          <div className="flex justify-between items-center">
             <div className="flex space-x-2">
               {selectedQrfIds.size > 0 && canAssign && (
                  <Button onClick={() => openAssignModal(Array.from(selectedQrfIds))} className="bg-blue-600 hover:bg-blue-700">
                    <Users size={18} className="mr-2" />
                    Bulk Assign ({selectedQrfIds.size})
                  </Button>
               )}
             </div>
             {/* Only show create if allowed */}
             {(isSalesAdmin || isSuperAdmin) && (
              <Button onClick={() => navigate('/qrf/new')}>
                  <PlusCircle size={18} className="mr-2" />
                  Create New eQRF
                </Button>
             )}
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
            <div className="overflow-x-auto min-h-[500px] pb-12">
              <table className="w-full text-left">
                <thead className="relative z-10">
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 w-10">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 text-brand-600 focus:ring-brand-500 h-4 w-4"
                        checked={filteredAndSortedQRFs.length > 0 && selectedQrfIds.size === filteredAndSortedQRFs.length}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <SortableTh 
                      label="Name" 
                      sortKey="name" 
                      currentSort={sortConfig} onSort={handleSort} 
                      options={getUniqueValues('name')}
                      selectedValues={filters.name || []} onFilter={(v) => handleFilter('name', v)} 
                    />
                    <SortableTh 
                      label="Sales Agent" 
                      sortKey="agentName" 
                      currentSort={sortConfig} onSort={handleSort} 
                      options={getUniqueValues('agentName')}
                      selectedValues={filters.agentName || []} onFilter={(v) => handleFilter('agentName', v)} 
                    />
                    <SortableTh 
                      label="Account" 
                      sortKey="accountName" 
                      currentSort={sortConfig} onSort={handleSort} 
                      options={getUniqueValues('accountName')}
                      selectedValues={filters.accountName || []} onFilter={(v) => handleFilter('accountName', v)} 
                    />
                     <SortableTh 
                      label="Assigned To" 
                      sortKey="assignedToName" 
                      currentSort={sortConfig} onSort={handleSort} 
                      options={getUniqueValues('assignedToName')}
                      selectedValues={filters.assignedToName || []} onFilter={(v) => handleFilter('assignedToName', v)} 
                    />
                    <SortableTh 
                      label="Status" 
                      sortKey="status" 
                      currentSort={sortConfig} onSort={handleSort} 
                      options={getUniqueValues('status')}
                      selectedValues={filters.status || []} onFilter={(v) => handleFilter('status', v)} 
                    />
                    <SortableTh 
                      label="Submitted" 
                      sortKey="submittedAt" 
                      currentSort={sortConfig} onSort={handleSort} 
                      options={getUniqueValues('submittedAt')}
                      selectedValues={filters.submittedAt || []} onFilter={(v) => handleFilter('submittedAt', v)} 
                    />
                    <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAndSortedQRFs.map(q => (
                    <tr key={q.id} className={`hover:bg-brand-50 transition-colors ${selectedQrfIds.has(q.id) ? 'bg-blue-50' : ''}`}>
                       <td className="px-4 py-4">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-brand-600 focus:ring-brand-500 h-4 w-4"
                          checked={selectedQrfIds.has(q.id)}
                          onChange={() => handleSelectRow(q.id)}
                        />
                      </td>
                      <td className="px-4 py-4 font-medium text-gray-900 text-sm">{q.name}</td>
                      <td className="px-4 py-4 text-gray-600 text-sm">{q.agentName}</td>
                      <td className="px-4 py-4 text-gray-600 text-sm">{q.data.accountName}</td>
                      <td className="px-4 py-4 text-sm">
                         {q.assignedToName ? (
                            <span className="flex items-center text-blue-600">
                               <Shield size={14} className="mr-1" />
                               {q.assignedToName}
                            </span>
                         ) : (
                            <span className="text-gray-400 italic">Unassigned</span>
                         )}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          q.status === 'SUBMITTED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {q.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-gray-500 text-sm">{q.submittedAt ? new Date(q.submittedAt).toLocaleDateString() : '-'}</td>
                      <td className="px-4 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-3">
                           {canAssign && (
                             <button
                               onClick={() => openAssignModal([q.id])}
                               className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline flex items-center"
                               title="Assign Underwriter"
                             >
                               <ShieldCheck size={14} className="mr-1" />
                               Assign
                             </button>
                           )}

                            {q.status === 'SUBMITTED' && (
                              <button 
                                onClick={() => copyToClipboard(q.id)}
                                className="text-xs font-medium text-brand-600 hover:text-brand-800 hover:underline flex items-center"
                                title="Copy Link"
                              >
                                {copiedId === q.id ? <Check size={14} className="mr-1"/> : <LinkIcon size={14} className="mr-1"/>}
                                {copiedId === q.id ? "Copied" : "Share Link"}
                              </button>
                            )}
                            <button 
                              onClick={() => navigate(`/qrf/edit/${q.id}`)}
                              className="text-xs font-medium text-gray-500 hover:text-gray-700 hover:underline flex items-center"
                              title="View Details"
                            >
                              <ExternalLink size={14} className="mr-1" />
                              View
                            </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredAndSortedQRFs.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-gray-500">No records found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ASSIGNMENT MODAL */}
      {assignModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl animate-fade-in-down">
             <h3 className="text-lg font-bold mb-4">Assign to Underwriter</h3>
             <p className="text-sm text-gray-600 mb-4">
                {assignTargetIds.length === 1 
                  ? `Select an underwriter to review the selected QRF.` 
                  : `Select an underwriter to review ${assignTargetIds.length} QRFs.`}
             </p>
             <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
               {underwriters.map(uw => (
                 <button
                   key={uw.id}
                   onClick={() => confirmAssignment(uw.id, uw.fullName)}
                   className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-brand-500 hover:bg-brand-50 transition-all flex items-center group"
                 >
                   <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3 text-xs font-bold group-hover:bg-blue-200">
                     {uw.username.substring(0,2).toUpperCase()}
                   </div>
                   <div>
                      <p className="font-medium text-gray-900 group-hover:text-brand-700">{uw.fullName}</p>
                      <p className="text-xs text-gray-500">@{uw.username}</p>
                   </div>
                 </button>
               ))}
               {underwriters.length === 0 && <p className="text-gray-500 text-sm">No underwriters available.</p>}
             </div>
             <Button variant="outline" className="w-full" onClick={() => setAssignModalOpen(false)}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerDashboard;