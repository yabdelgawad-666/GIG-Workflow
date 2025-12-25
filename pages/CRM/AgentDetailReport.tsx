
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, CRMLead, SystemLog, CRMStage } from '../../types';
import { appService } from '../../services/appService';
import { ArrowLeft, User as UserIcon, Mail, Calendar, Activity, DollarSign, Briefcase, TrendingUp, Clock } from 'lucide-react';

interface AgentDetailReportProps {
  user: User; // Current logged in user (admin)
}

const AgentDetailReport: React.FC<AgentDetailReportProps> = ({ user }) => {
  const { agentId } = useParams();
  const navigate = useNavigate();
  
  const [agent, setAgent] = useState<User | null>(null);
  const [leads, setLeads] = useState<CRMLead[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'logs'>('overview');

  useEffect(() => {
    if (agentId) {
      loadData(agentId);
    }
  }, [agentId]);

  const loadData = async (id: string) => {
    // 1. Get Agent Details
    const allUsers = await appService.getAllUsers();
    const foundAgent = allUsers.find(u => u.id === id);
    setAgent(foundAgent || null);

    // 2. Get Leads for this agent
    const allLeads = await appService.getCRMLeads();
    setLeads(allLeads.filter(l => l.salespersonId === id));

    // 3. Get Logs for this agent
    const allLogs = await appService.getSystemLogs(user); // Pass current admin user to get access
    // Filter specifically for this agent's ID
    const agentLogs = allLogs.filter(l => l.userId === id).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setLogs(agentLogs);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(val);
  };

  // Metrics
  const metrics = useMemo(() => {
    const totalLeads = leads.length;
    const totalRevenue = leads.reduce((acc, curr) => acc + (curr.expectedPremium || 0), 0);
    const wonLeads = leads.filter(l => l.stage === CRMStage.WON);
    const winRate = totalLeads > 0 ? (wonLeads.length / totalLeads) * 100 : 0;
    const avgTicket = totalLeads > 0 ? totalRevenue / totalLeads : 0;
    return { totalLeads, totalRevenue, winRate, avgTicket };
  }, [leads]);

  const stageBreakdown = useMemo(() => {
     const stages = Object.values(CRMStage);
     return stages.map(stage => {
         const count = leads.filter(l => l.stage === stage).length;
         return { stage, count, percentage: metrics.totalLeads > 0 ? (count / metrics.totalLeads) * 100 : 0 };
     });
  }, [leads, metrics.totalLeads]);

  if (!agent) {
      return <div className="p-8 text-center text-gray-500">Loading Agent Profile...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in-down pb-10">
        {/* Header */}
        <div className="flex flex-col space-y-4">
            <button onClick={() => navigate('/crm/reports')} className="flex items-center text-gray-500 hover:text-gray-700 w-fit">
                <ArrowLeft size={18} className="mr-1" /> Back to Analytics
            </button>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center">
                <div className="flex items-center">
                    <div className="w-16 h-16 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-2xl font-bold mr-4">
                        {agent.fullName.charAt(0)}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{agent.fullName}</h1>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                            <span className="flex items-center"><UserIcon size={14} className="mr-1"/> @{agent.username}</span>
                            <span className="flex items-center"><Briefcase size={14} className="mr-1"/> Sales Agent</span>
                            {agent.lastLogin && <span className="flex items-center"><Calendar size={14} className="mr-1"/> Last Login: {new Date(agent.lastLogin).toLocaleDateString()}</span>}
                        </div>
                    </div>
                </div>
                <div className="mt-4 md:mt-0 flex space-x-2">
                    <div className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-100 text-center">
                        <p className="text-xs text-gray-500 uppercase">Status</p>
                        <p className="font-bold text-green-600">Active</p>
                    </div>
                </div>
            </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
             <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                <p className="text-xs font-bold text-gray-500 uppercase">Revenue Generated</p>
                <div className="flex items-center mt-2">
                    <div className="p-2 bg-green-100 text-green-600 rounded mr-3"><DollarSign size={20}/></div>
                    <span className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.totalRevenue)}</span>
                </div>
             </div>
             <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                <p className="text-xs font-bold text-gray-500 uppercase">Total Leads</p>
                <div className="flex items-center mt-2">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded mr-3"><Briefcase size={20}/></div>
                    <span className="text-2xl font-bold text-gray-900">{metrics.totalLeads}</span>
                </div>
             </div>
             <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                <p className="text-xs font-bold text-gray-500 uppercase">Win Rate</p>
                <div className="flex items-center mt-2">
                    <div className="p-2 bg-purple-100 text-purple-600 rounded mr-3"><TrendingUp size={20}/></div>
                    <span className="text-2xl font-bold text-gray-900">{metrics.winRate.toFixed(1)}%</span>
                </div>
             </div>
             <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                <p className="text-xs font-bold text-gray-500 uppercase">Activity Count</p>
                <div className="flex items-center mt-2">
                    <div className="p-2 bg-orange-100 text-orange-600 rounded mr-3"><Activity size={20}/></div>
                    <span className="text-2xl font-bold text-gray-900">{logs.length}</span>
                </div>
             </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[500px]">
            <div className="flex border-b border-gray-200 bg-gray-50">
                <button 
                    onClick={() => setActiveTab('overview')} 
                    className={`px-6 py-4 text-sm font-medium flex items-center border-b-2 transition-colors ${activeTab === 'overview' ? 'border-brand-600 text-brand-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Overview
                </button>
                <button 
                    onClick={() => setActiveTab('logs')} 
                    className={`px-6 py-4 text-sm font-medium flex items-center border-b-2 transition-colors ${activeTab === 'logs' ? 'border-brand-600 text-brand-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Activity Log
                </button>
            </div>

            <div className="p-6">
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div>
                            <h3 className="font-bold text-gray-800 mb-4">Pipeline Status</h3>
                            <div className="space-y-4">
                                {stageBreakdown.map(s => (
                                    <div key={s.stage}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-700 font-medium">{s.stage}</span>
                                            <span className="text-gray-900 font-bold">{s.count}</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2">
                                            <div className="bg-brand-500 h-2 rounded-full" style={{ width: `${s.percentage}%` }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="font-bold text-gray-800 mb-4">Recent Leads</h3>
                            <div className="border rounded-lg overflow-hidden">
                                {leads.slice(0, 5).map((lead, idx) => (
                                    <div key={lead.id} className={`p-3 flex justify-between items-center ${idx !== leads.slice(0,5).length-1 ? 'border-b' : ''}`}>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">{lead.title}</p>
                                            <p className="text-xs text-gray-500">{lead.companyName}</p>
                                        </div>
                                        <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">{lead.stage}</span>
                                    </div>
                                ))}
                                {leads.length === 0 && <p className="p-4 text-gray-500 text-sm italic">No leads assigned.</p>}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'logs' && (
                    <div className="space-y-4">
                        <h3 className="font-bold text-gray-800 mb-2 flex items-center">
                            <Clock size={18} className="mr-2 text-gray-500"/> System Activity History
                        </h3>
                        <div className="overflow-hidden border border-gray-200 rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {logs.map(log => (
                                        <tr key={log.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(log.timestamp).toLocaleDateString()} <span className="text-xs text-gray-400">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                <span className={`px-2 py-1 rounded text-xs ${log.action === 'Login' ? 'bg-green-100 text-green-700' : log.action.includes('Create') ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.details}</td>
                                        </tr>
                                    ))}
                                    {logs.length === 0 && (
                                        <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-500">No activity logs recorded.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default AgentDetailReport;
