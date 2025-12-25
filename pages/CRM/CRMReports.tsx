
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CRMLead, CRMStage, User, UserRole, CRMChannel, CRMProduct } from '../../types';
import { appService } from '../../services/appService';
import { BarChart3, TrendingUp, Users, DollarSign, PieChart, Activity, Briefcase, Layers, Target, ExternalLink } from 'lucide-react';

interface CRMReportsProps {
  user: User;
}

const CRMReports: React.FC<CRMReportsProps> = ({ user }) => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<CRMLead[]>([]);
  
  const isAgent = user.role === UserRole.AGENT;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const allLeads = await appService.getCRMLeads();
    if (isAgent) {
        setLeads(allLeads.filter(l => l.salespersonId === user.id));
    } else {
        setLeads(allLeads);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(val);
  };

  // --- METRICS CALCULATION ---
  const metrics = useMemo(() => {
    const totalLeads = leads.length;
    const totalRevenue = leads.reduce((acc, curr) => acc + (curr.expectedPremium || 0), 0);
    const wonLeads = leads.filter(l => l.stage === CRMStage.WON);
    const winRate = totalLeads > 0 ? (wonLeads.length / totalLeads) * 100 : 0;
    const avgTicket = totalLeads > 0 ? totalRevenue / totalLeads : 0;

    return { totalLeads, totalRevenue, winRate, avgTicket };
  }, [leads]);

  // --- STAGE BREAKDOWN ---
  const stageStats = useMemo(() => {
    const stages = Object.values(CRMStage);
    return stages.map(stage => {
        const stageLeads = leads.filter(l => l.stage === stage);
        const value = stageLeads.reduce((acc, curr) => acc + (curr.expectedPremium || 0), 0);
        return {
            stage,
            count: stageLeads.length,
            value,
            percentage: metrics.totalLeads > 0 ? (stageLeads.length / metrics.totalLeads) * 100 : 0
        };
    });
  }, [leads, metrics.totalLeads]);

  // --- AGENT PERFORMANCE (Admin View) ---
  const agentStats = useMemo(() => {
      const agentMap: {[key: string]: {id: string, name: string, count: number, value: number, won: number}} = {};
      
      leads.forEach(l => {
          if (!agentMap[l.salespersonId]) {
              agentMap[l.salespersonId] = { id: l.salespersonId, name: l.salespersonName, count: 0, value: 0, won: 0 };
          }
          agentMap[l.salespersonId].count++;
          agentMap[l.salespersonId].value += (l.expectedPremium || 0);
          if (l.stage === CRMStage.WON) agentMap[l.salespersonId].won++;
      });

      // Return all agents sorted by revenue
      return Object.values(agentMap).sort((a,b) => b.value - a.value);
  }, [leads]);

  // --- SOURCES & PRODUCTS ---
  const sourceStats = useMemo(() => {
      const counts: {[key: string]: number} = {};
      Object.values(CRMChannel).forEach(c => counts[c] = 0);
      leads.forEach(l => { counts[l.channel] = (counts[l.channel] || 0) + 1; });
      return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
  }, [leads]);

  const productStats = useMemo(() => {
      const counts: {[key: string]: number} = {};
      Object.values(CRMProduct).forEach(p => counts[p] = 0);
      leads.forEach(l => { counts[l.product] = (counts[l.product] || 0) + 1; });
      return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
  }, [leads]);

  const handleAgentClick = (agentId: string) => {
    if (!isAgent) { // Only allow navigation if not a regular agent (unless viewing self, but admin usually views others)
        navigate(`/crm/report/${agentId}`);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-down pb-10">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-brand-100 rounded-lg text-brand-600">
                <BarChart3 size={28} />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-gray-900">CRM Analytics</h2>
                <p className="text-gray-500 text-sm">{isAgent ? 'My Performance Overview' : 'Sales Team Performance & Pipeline'}</p>
            </div>
        </div>

        {/* Summary Bubbles */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between hover:border-brand-200 transition-colors">
                <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Total Pipeline Value</p>
                    <h3 className="text-3xl font-bold text-brand-700">{formatCurrency(metrics.totalRevenue)}</h3>
                </div>
                <div className="mt-4 flex items-center text-sm text-brand-600 bg-brand-50 w-fit px-2 py-1 rounded-full">
                    <DollarSign size={16} className="mr-1"/> Revenue
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between hover:border-brand-200 transition-colors">
                <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Total Leads</p>
                    <h3 className="text-3xl font-bold text-gray-900">{metrics.totalLeads}</h3>
                </div>
                <div className="mt-4 flex items-center text-sm text-blue-600 bg-blue-50 w-fit px-2 py-1 rounded-full">
                    <Briefcase size={16} className="mr-1"/> Opportunities
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between hover:border-brand-200 transition-colors">
                <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Win Rate</p>
                    <h3 className="text-3xl font-bold text-gray-900">{metrics.winRate.toFixed(1)}%</h3>
                </div>
                <div className="mt-4 flex items-center text-sm text-green-600 bg-green-50 w-fit px-2 py-1 rounded-full">
                    <TrendingUp size={16} className="mr-1"/> Conversion
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between hover:border-brand-200 transition-colors">
                <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Avg Deal Size</p>
                    <h3 className="text-3xl font-bold text-gray-900">{formatCurrency(metrics.avgTicket)}</h3>
                </div>
                <div className="mt-4 flex items-center text-sm text-purple-600 bg-purple-50 w-fit px-2 py-1 rounded-full">
                    <Activity size={16} className="mr-1"/> Per Lead
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Pipeline Stage Breakdown */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center">
                    <PieChart size={20} className="mr-2 text-gray-500"/>
                    <h3 className="font-bold text-gray-800">Pipeline Stages</h3>
                </div>
                <div className="p-6 space-y-6">
                    {stageStats.map((stat) => (
                        <div key={stat.stage}>
                            <div className="flex justify-between items-end mb-1">
                                <span className="text-sm font-medium text-gray-700">{stat.stage}</span>
                                <div className="text-right">
                                    <span className="text-sm font-bold text-gray-900">{stat.count}</span>
                                    <span className="text-xs text-gray-500 ml-2">({formatCurrency(stat.value)})</span>
                                </div>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                <div 
                                    className={`h-full rounded-full ${
                                        stat.stage === CRMStage.WON ? 'bg-green-500' : 
                                        stat.stage === CRMStage.LOST ? 'bg-red-500' : 
                                        'bg-brand-500'
                                    }`} 
                                    style={{ width: `${stat.percentage}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Agent Performance Leaderboard */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center">
                    <Users size={20} className="mr-2 text-gray-500"/>
                    <h3 className="font-bold text-gray-800">Agent Performance</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 border-b border-gray-100 text-xs uppercase">
                            <tr>
                                <th className="px-4 py-3 font-medium">Agent</th>
                                <th className="px-4 py-3 font-medium text-center">Leads</th>
                                <th className="px-4 py-3 font-medium text-right">Revenue</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {agentStats.map((agent, idx) => (
                                <tr 
                                    key={idx} 
                                    className={`transition-colors ${!isAgent ? 'hover:bg-blue-50 cursor-pointer group' : ''}`}
                                    onClick={() => handleAgentClick(agent.id)}
                                >
                                    <td className="px-4 py-3 font-medium text-gray-900 flex items-center">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-2 ${idx < 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {idx + 1}
                                        </div>
                                        <span className={!isAgent ? "group-hover:underline group-hover:text-blue-700 flex items-center" : ""}>
                                            {agent.name}
                                            {!isAgent && <ExternalLink size={12} className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">{agent.count}</td>
                                    <td className="px-4 py-3 text-right font-bold text-brand-700">{formatCurrency(agent.value)}</td>
                                </tr>
                            ))}
                            {agentStats.length === 0 && (
                                <tr><td colSpan={3} className="p-4 text-center text-gray-500">No data available</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        {/* Lead Analysis Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Lead Sources */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h4 className="font-bold text-gray-800 mb-6 flex items-center"><Target size={18} className="mr-2 text-gray-500"/> Lead Sources</h4>
                <div className="space-y-4">
                    {sourceStats.map(s => (
                        <div key={s.name} className="flex items-center">
                            <span className="w-32 text-sm text-gray-600 text-right mr-3">{s.name}</span>
                            <div className="flex-1 bg-gray-100 rounded-full h-3">
                                <div className="bg-indigo-500 h-3 rounded-full" style={{ width: `${metrics.totalLeads > 0 ? (s.value / metrics.totalLeads) * 100 : 0}%` }}></div>
                            </div>
                            <span className="w-10 text-sm font-bold text-gray-900 ml-3">{s.value}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Product Mix */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h4 className="font-bold text-gray-800 mb-6 flex items-center"><Layers size={18} className="mr-2 text-gray-500"/> Product Mix</h4>
                <div className="space-y-4">
                    {productStats.map(p => (
                        <div key={p.name} className="flex items-center">
                            <span className="w-32 text-sm text-gray-600 text-right mr-3">{p.name}</span>
                            <div className="flex-1 bg-gray-100 rounded-full h-3">
                                <div className="bg-emerald-500 h-3 rounded-full" style={{ width: `${metrics.totalLeads > 0 ? (p.value / metrics.totalLeads) * 100 : 0}%` }}></div>
                            </div>
                            <span className="w-10 text-sm font-bold text-gray-900 ml-3">{p.value}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
};

export default CRMReports;
