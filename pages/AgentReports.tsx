import React, { useEffect, useState } from 'react';
import { User, QRF, QRFStatus, UserRole } from '../types';
import { appService } from '../services/appService';
import { Users, FileText, BarChart2, ShieldCheck } from 'lucide-react';

interface AgentReportsProps {
  user: User;
}

const AgentReports: React.FC<AgentReportsProps> = ({ user }) => {
  const [agents, setAgents] = useState<User[]>([]);
  const [underwriters, setUnderwriters] = useState<User[]>([]);
  const [qrfs, setQrfs] = useState<QRF[]>([]);
  
  const [agentStats, setAgentStats] = useState<any[]>([]);
  const [uwStats, setUwStats] = useState<any[]>([]);

  const isSuperAdmin = user.role === UserRole.SUPER_ADMIN;
  const isUwAdmin = user.role === UserRole.UW_ADMIN;
  const isSalesAdmin = user.role === UserRole.ADMIN;

  const showUnderwriters = isSuperAdmin || isUwAdmin;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const promises = [
      appService.getAgents(),
      appService.getQRFs()
    ] as const;

    // Fetch underwriters if needed
    let uwList: User[] = [];
    if (showUnderwriters) {
        uwList = await appService.getUnderwriters();
        setUnderwriters(uwList);
    }

    const [agentsList, qrfList] = await Promise.all(promises);
    setAgents(agentsList);
    setQrfs(qrfList);
    
    calculateAgentStats(agentsList, qrfList);
    if (showUnderwriters) {
        calculateUwStats(uwList, qrfList);
    }
  };

  const calculateAgentStats = (agentUsers: User[], allQrfs: QRF[]) => {
    const computed = agentUsers.map(agent => {
      const agentQrfs = allQrfs.filter(q => q.agentId === agent.id);
      const submitted = agentQrfs.filter(q => q.status === QRFStatus.SUBMITTED || q.status === QRFStatus.APPROVED || q.status === QRFStatus.REJECTED).length;
      const approved = agentQrfs.filter(q => q.status === QRFStatus.APPROVED).length;
      
      return {
        id: agent.id,
        name: agent.fullName,
        username: agent.username,
        lastLogin: agent.lastLogin,
        total: agentQrfs.length,
        submitted,
        approved,
        drafts: agentQrfs.filter(q => q.status === QRFStatus.DRAFT).length,
        approvalRate: submitted > 0 ? Math.round((approved / submitted) * 100) : 0
      };
    }).sort((a, b) => b.total - a.total);
    setAgentStats(computed);
  };

  const calculateUwStats = (uwUsers: User[], allQrfs: QRF[]) => {
    const computed = uwUsers.map(uw => {
        const assignedQrfs = allQrfs.filter(q => q.assignedToId === uw.id);
        const processed = assignedQrfs.filter(q => q.status === QRFStatus.APPROVED || q.status === QRFStatus.REJECTED).length;
        const pending = assignedQrfs.filter(q => q.status === QRFStatus.SUBMITTED).length;
        
        return {
            id: uw.id,
            name: uw.fullName,
            username: uw.username,
            lastLogin: uw.lastLogin,
            totalAssigned: assignedQrfs.length,
            processed,
            pending
        };
    }).sort((a,b) => b.totalAssigned - a.totalAssigned);
    setUwStats(computed);
  };

  return (
    <div className="space-y-8 animate-fade-in-down pb-10">
       <div className="flex items-center space-x-3 mb-6">
        <Users size={28} className="text-brand-600" />
        <div>
           <h2 className="text-2xl font-bold text-gray-900">Performance Reports</h2>
           <p className="text-gray-500 text-sm">Detailed breakdown of team activities</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                <Users size={24} />
                </div>
                <div>
                <p className="text-sm text-gray-500 font-medium">Total Staff</p>
                <h3 className="text-2xl font-bold text-gray-900">{agents.length + underwriters.length}</h3>
                <p className="text-xs text-gray-400 mt-1">{agents.length} Sales, {underwriters.length} UWs</p>
                </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                <FileText size={24} />
                </div>
                <div>
                <p className="text-sm text-gray-500 font-medium">Total Submissions</p>
                <h3 className="text-2xl font-bold text-gray-900">{qrfs.filter(q => q.status !== QRFStatus.DRAFT).length}</h3>
                </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center space-x-4">
                <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
                <BarChart2 size={24} />
                </div>
                <div>
                <p className="text-sm text-gray-500 font-medium">Avg Sales Approval</p>
                <h3 className="text-2xl font-bold text-gray-900">
                   {agentStats.length > 0 ? Math.round(agentStats.reduce((acc, curr) => acc + curr.approvalRate, 0) / agentStats.length) : 0}%
                </h3>
                </div>
            </div>
          </div>
      </div>

      {/* SALES AGENTS TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
           <h3 className="font-bold text-gray-800 flex items-center">
             <Users size={18} className="mr-2 text-gray-500"/>
             Sales Agent Performance
           </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white border-b border-gray-100 text-xs text-gray-500 uppercase">
               <tr>
                 <th className="px-6 py-3 font-medium">Agent Name</th>
                 <th className="px-6 py-3 font-medium text-center">Total QRFs</th>
                 <th className="px-6 py-3 font-medium text-center">Submitted</th>
                 <th className="px-6 py-3 font-medium text-center">Drafts</th>
                 <th className="px-6 py-3 font-medium text-center">Approved</th>
                 <th className="px-6 py-3 font-medium text-center">Approval Rate</th>
                 <th className="px-6 py-3 font-medium text-right">Last Login</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {agentStats.map(agent => (
                 <tr key={agent.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                       <p className="font-medium text-gray-900">{agent.name}</p>
                       <p className="text-xs text-gray-500">@{agent.username}</p>
                    </td>
                    <td className="px-6 py-4 text-center font-bold">{agent.total}</td>
                    <td className="px-6 py-4 text-center text-blue-600 font-medium">{agent.submitted}</td>
                    <td className="px-6 py-4 text-center text-gray-400">{agent.drafts}</td>
                    <td className="px-6 py-4 text-center text-green-600 font-medium">{agent.approved}</td>
                    <td className="px-6 py-4 text-center">
                       <div className="flex items-center justify-center">
                         <div className="w-16 bg-gray-200 rounded-full h-1.5 mr-2">
                            <div className="bg-brand-500 h-1.5 rounded-full" style={{width: `${agent.approvalRate}%`}}></div>
                         </div>
                         <span className="text-xs">{agent.approvalRate}%</span>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-right text-gray-500">
                       {agent.lastLogin ? new Date(agent.lastLogin).toLocaleDateString() : '-'}
                    </td>
                 </tr>
              ))}
              {agentStats.length === 0 && <tr><td colSpan={7} className="px-6 py-4 text-center text-gray-500">No agents found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* UNDERWRITERS TABLE */}
      {showUnderwriters && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-bold text-gray-800 flex items-center">
                <ShieldCheck size={18} className="mr-2 text-gray-500"/>
                Underwriter Performance
            </h3>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-white border-b border-gray-100 text-xs text-gray-500 uppercase">
                <tr>
                    <th className="px-6 py-3 font-medium">Underwriter</th>
                    <th className="px-6 py-3 font-medium text-center">Total Assigned</th>
                    <th className="px-6 py-3 font-medium text-center">Pending Review</th>
                    <th className="px-6 py-3 font-medium text-center">Processed (App/Rej)</th>
                    <th className="px-6 py-3 font-medium text-center">Completion Rate</th>
                    <th className="px-6 py-3 font-medium text-right">Last Login</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm">
                {uwStats.map(uw => {
                    const completionRate = uw.totalAssigned > 0 ? Math.round((uw.processed / uw.totalAssigned) * 100) : 0;
                    return (
                        <tr key={uw.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                                <p className="font-medium text-gray-900">{uw.name}</p>
                                <p className="text-xs text-gray-500">@{uw.username}</p>
                            </td>
                            <td className="px-6 py-4 text-center font-bold">{uw.totalAssigned}</td>
                            <td className="px-6 py-4 text-center text-yellow-600 font-medium">{uw.pending}</td>
                            <td className="px-6 py-4 text-center text-blue-600 font-medium">{uw.processed}</td>
                            <td className="px-6 py-4 text-center">
                                <div className="flex items-center justify-center">
                                    <div className="w-16 bg-gray-200 rounded-full h-1.5 mr-2">
                                        <div className="bg-blue-600 h-1.5 rounded-full" style={{width: `${completionRate}%`}}></div>
                                    </div>
                                    <span className="text-xs">{completionRate}%</span>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-right text-gray-500">
                                {uw.lastLogin ? new Date(uw.lastLogin).toLocaleDateString() : '-'}
                            </td>
                        </tr>
                    );
                })}
                {uwStats.length === 0 && <tr><td colSpan={6} className="px-6 py-4 text-center text-gray-500">No underwriters found</td></tr>}
                </tbody>
            </table>
            </div>
        </div>
      )}
    </div>
  );
};

export default AgentReports;