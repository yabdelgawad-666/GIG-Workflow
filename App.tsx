
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import AgentDashboard from './pages/AgentDashboard';
import UnderwriterDashboard from './pages/UnderwriterDashboard';
import QRFForm from './pages/QRFForm';
// New Modules
import ManagerQRFList from './pages/ManagerQRFList';
import AgentReports from './pages/AgentReports';
import TatReport from './pages/TatReport';
import UserManagement from './pages/UserManagement';
import SystemLogs from './pages/SystemLogs';
// CRM
import CRMKanban from './pages/CRM/CRMKanban';
import CRMLeadForm from './pages/CRM/CRMLeadForm';
import CRMReports from './pages/CRM/CRMReports';
import AgentDetailReport from './pages/CRM/AgentDetailReport';

import { User, UserRole } from './types';
import { appService } from './services/appService';

// Wrapper component to handle location-based updates
const AppContent: React.FC<{ 
  user: User | null; 
  handleLogout: () => void;
  setUser: (u: User | null) => void;
}> = ({ user, handleLogout, setUser }) => {
  const [notificationCount, setNotificationCount] = useState(0);
  const location = useLocation();

  useEffect(() => {
    if (user) {
      const fetchCounts = async () => {
        const count = await appService.getNotificationCounts(user);
        setNotificationCount(count);
      };
      fetchCounts();
    }
  }, [user, location.pathname]); // Refresh counts on route change

  const isSalesRole = user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.AGENT;
  const isManager = user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.UW_ADMIN;

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login onLogin={setUser} /> : <Navigate to="/" replace />} />
      
      {/* Protected Routes */}
      <Route
        path="*"
        element={
          user ? (
            <Layout user={user} onLogout={handleLogout} notificationCount={notificationCount}>
              <Routes>
                {/* Redirect based on role preference - First Module Rule */}
                <Route path="/" element={
                  isSalesRole ? <Navigate to="/crm" replace /> :
                  user.role === UserRole.UNDERWRITER ? <Navigate to="/underwriter" replace /> :
                  <Navigate to="/manager/qrfs" replace />
                } />
                
                {/* CRM Routes - Sales Only */}
                {isSalesRole && (
                  <>
                    <Route path="/crm" element={<CRMKanban user={user} />} />
                    <Route path="/crm/reports" element={<CRMReports user={user} />} />
                    <Route path="/crm/report/:agentId" element={<AgentDetailReport user={user} />} />
                    <Route path="/crm/new" element={<CRMLeadForm user={user} />} />
                    <Route path="/crm/:id" element={<CRMLeadForm user={user} />} />
                  </>
                )}

                {/* Agent Routes (Specific to QRF tracking) */}
                <Route path="/agent" element={user.role === UserRole.AGENT ? <AgentDashboard user={user} /> : <Navigate to="/" />} />
                
                {/* Underwriter Routes */}
                <Route path="/underwriter" element={user.role === UserRole.UNDERWRITER ? <UnderwriterDashboard user={user} /> : <Navigate to="/" />} />

                {/* Shared Routes (QRF Creation/Editing/Reviewing) - Accessible by all roles */}
                <Route path="/qrf/new" element={<QRFForm user={user} />} />
                <Route path="/qrf/edit/:id" element={<QRFForm user={user} />} />
                
                {/* Manager Routes (Broken down into modules) */}
                <Route path="/manager" element={isManager ? <Navigate to="/manager/qrfs" /> : <Navigate to="/" />} />
                
                <Route path="/manager/reports" element={isManager ? <AgentReports user={user} /> : <Navigate to="/" />} />
                <Route path="/manager/qrfs" element={isManager ? <ManagerQRFList user={user} /> : <Navigate to="/" />} />
                <Route path="/manager/tat" element={isManager ? <TatReport /> : <Navigate to="/" />} />
                <Route path="/manager/users" element={isManager ? <UserManagement currentUser={user} /> : <Navigate to="/" />} />
                <Route path="/manager/logs" element={isManager ? <SystemLogs user={user} /> : <Navigate to="/" />} />

                {/* Fallback to root for any undefined route inside layout */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(appService.getCurrentUser());

  return (
    <HashRouter>
      <AppContent 
        user={user} 
        setUser={setUser} 
        handleLogout={() => setUser(null)} 
      />
    </HashRouter>
  );
};

export default App;
