
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LogOut, FileText, PlusCircle, List, ClipboardCheck, BarChart2, ShieldAlert, ShieldCheck, Users, LayoutDashboard, Clock, Activity, Briefcase } from 'lucide-react';
import { appService } from '../services/appService';
import { User, UserRole, QRFType } from '../types';
import CreateQRFModal from './CreateQRFModal';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
  notificationCount?: number;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, notificationCount = 0 }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleLogout = () => {
    appService.logout();
    onLogout();
    navigate('/');
  };

  const handleCreateNew = (type: QRFType) => {
    setShowCreateModal(false);
    const types = type === QRFType.MEDICAL ? [QRFType.MEDICAL, QRFType.LIFE] : [type];
    navigate('/qrf/new', { state: { types } });
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN: return 'Super Admin';
      case UserRole.ADMIN: return 'Sales Admin';
      case UserRole.UW_ADMIN: return 'Underwriter Admin';
      case UserRole.AGENT: return 'Sales Agent';
      case UserRole.UNDERWRITER: return 'Underwriter';
      default: return role;
    }
  };

  const isManager = user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN || user.role === UserRole.UW_ADMIN;
  const isSalesRole = user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN || user.role === UserRole.AGENT;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-brand-900 text-white flex flex-col fixed h-full z-10">
        <div className="p-6 border-b border-brand-700">
          <h1 className="text-2xl font-bold tracking-tight">GIG Portal</h1>
          <p className="text-brand-100 text-xs mt-1 uppercase tracking-wider">{getRoleLabel(user.role)}</p>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {/* CRM Module - Sales Only */}
          {isSalesRole && (
             <>
               <NavItem 
                  icon={<Briefcase size={20} />} 
                  label="CRM Pipeline" 
                  active={location.pathname === '/crm' || location.pathname.startsWith('/crm/new') || (location.pathname.startsWith('/crm/') && !location.pathname.includes('reports'))} 
                  onClick={() => navigate('/crm')} 
                />
               <NavItem 
                  icon={<BarChart2 size={20} />} 
                  label="CRM Reports" 
                  active={location.pathname === '/crm/reports'} 
                  onClick={() => navigate('/crm/reports')} 
                />
             </>
          )}

          {user.role === UserRole.AGENT && (
            <>
              <NavItem 
                icon={<FileText size={20} />} 
                label="My eQRFs" 
                active={location.pathname === '/' || location.pathname === '/agent'} 
                onClick={() => navigate('/agent')} 
                count={notificationCount}
              />
              <NavItem 
                icon={<PlusCircle size={20} />} 
                label="New eQRF" 
                active={location.pathname === '/qrf/new'} 
                onClick={() => setShowCreateModal(true)} 
              />
            </>
          )}

          {user.role === UserRole.UNDERWRITER && (
            <>
              <NavItem 
                icon={<ClipboardCheck size={20} />} 
                label="Assigned Reviews" 
                active={location.pathname === '/' || location.pathname === '/underwriter'} 
                onClick={() => navigate('/underwriter')} 
                count={notificationCount}
              />
            </>
          )}

          {isManager && (
            <>
              {/* All QRFs List */}
              <NavItem 
                icon={<List size={20} />} 
                label="All eQRFs" 
                active={location.pathname === '/manager/qrfs'} 
                onClick={() => navigate('/manager/qrfs')} 
              />

              {/* Agent Reports (Old Dashboard) */}
              <NavItem 
                icon={<Users size={20} />} 
                label="Agent Reports" 
                active={location.pathname === '/manager/reports'} 
                onClick={() => navigate('/manager/reports')} 
              />

              {/* New: TaT Report */}
              <NavItem 
                icon={<Clock size={20} />} 
                label="TaT Report" 
                active={location.pathname === '/manager/tat'} 
                onClick={() => navigate('/manager/tat')} 
              />
              
              {/* User Management */}
              <NavItem 
                icon={<ShieldCheck size={20} />} 
                label="User Management" 
                active={location.pathname === '/manager/users'} 
                onClick={() => navigate('/manager/users')} 
              />

              {/* System Logs */}
              <NavItem 
                icon={<Activity size={20} />} 
                label="System Logs" 
                active={location.pathname === '/manager/logs'} 
                onClick={() => navigate('/manager/logs')} 
              />

              {/* Create New */}
              {(user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN) && (
                <NavItem 
                    icon={<PlusCircle size={20} />} 
                    label="New eQRF" 
                    active={location.pathname === '/qrf/new'} 
                    onClick={() => setShowCreateModal(true)} 
                />
              )}
            </>
          )}
        </nav>

        <div className="p-4 border-t border-brand-700">
          <div className="flex items-center mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-brand-700 flex items-center justify-center text-sm font-bold mr-3">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="text-sm truncate">
              <p className="font-medium">{user.fullName}</p>
              <p className="text-brand-200 text-xs">@{user.username}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-2 text-sm text-brand-100 hover:text-white hover:bg-brand-800 rounded transition-colors"
          >
            <LogOut size={16} className="mr-2" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {showCreateModal && (
        <CreateQRFModal 
          onClose={() => setShowCreateModal(false)}
          onSelect={handleCreateNew}
        />
      )}
    </div>
  );
};

const NavItem: React.FC<{ icon: React.ReactNode, label: string, active: boolean, onClick: () => void, count?: number }> = ({ icon, label, active, onClick, count }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
      active 
        ? 'bg-brand-700 text-white shadow-md' 
        : 'text-brand-100 hover:bg-brand-800 hover:text-white'
    }`}
  >
    <div className="flex items-center">
      <span className="mr-3">{icon}</span>
      <span className="font-medium">{label}</span>
    </div>
    {count !== undefined && count > 0 && (
      <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
        {count}
      </span>
    )}
  </button>
);

export default Layout;
