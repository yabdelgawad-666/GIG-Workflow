
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CRMLead, CRMStage, User } from '../../types';
import { appService } from '../../services/appService';
import { Plus, Filter, Search, MoreHorizontal, Star, Clock, List, LayoutGrid, Mail, Phone } from 'lucide-react';

interface CRMKanbanProps {
  user: User;
}

const STAGES = [
  CRMStage.NEW,
  CRMStage.COLLECTING,
  CRMStage.SENT_UW,
  CRMStage.REC_UW,
  CRMStage.NEGOTIATION,
  CRMStage.WON,
  CRMStage.LOST
];

const CRMKanban: React.FC<CRMKanbanProps> = ({ user }) => {
  const [leads, setLeads] = useState<CRMLead[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    const data = await appService.getCRMLeads();
    setLeads(data);
  };

  const getStageColor = (stage: CRMStage) => {
    switch (stage) {
      case CRMStage.NEW: return 'border-t-4 border-t-gray-300';
      case CRMStage.COLLECTING: return 'border-t-4 border-t-blue-400';
      case CRMStage.SENT_UW: return 'border-t-4 border-t-purple-400';
      case CRMStage.REC_UW: return 'border-t-4 border-t-indigo-400';
      case CRMStage.NEGOTIATION: return 'border-t-4 border-t-orange-400';
      case CRMStage.WON: return 'border-t-4 border-t-green-500';
      case CRMStage.LOST: return 'border-t-4 border-t-red-500';
      default: return 'border-t-4 border-t-gray-200';
    }
  };

  const getStageBadgeColor = (stage: CRMStage) => {
    switch (stage) {
      case CRMStage.WON: return 'bg-green-100 text-green-800';
      case CRMStage.LOST: return 'bg-red-100 text-red-800';
      case CRMStage.NEW: return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-50 text-blue-700';
    }
  };

  const getTagColor = (tag: string) => {
      if (tag.toLowerCase().includes('insured')) return 'bg-pink-100 text-pink-700';
      if (tag.toLowerCase().includes('renewal')) return 'bg-yellow-100 text-yellow-700';
      if (tag.toLowerCase().includes('virgin')) return 'bg-green-100 text-green-700';
      return 'bg-gray-100 text-gray-600';
  };

  const formatCurrency = (val: number) => {
      return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP' }).format(val);
  };

  const filteredLeads = leads.filter(l => 
    l.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    l.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.salespersonName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getLeadsByStage = (stage: CRMStage) => {
      return filteredLeads.filter(l => l.stage === stage);
  };

  const handleCardClick = (id: string) => {
      navigate(`/crm/${id}`);
  };

  const handleNewLead = () => {
      navigate('/crm/new');
  };

  // --- Drag and Drop Handlers ---

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedLeadId(id);
    e.dataTransfer.setData('leadId', id);
    e.currentTarget.classList.add('opacity-50');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('opacity-50');
    setDraggedLeadId(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); 
  };

  const handleDrop = async (e: React.DragEvent, targetStage: CRMStage) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('leadId');
    if (!leadId) return;

    const lead = leads.find(l => l.id === leadId);
    if (!lead || lead.stage === targetStage) return;

    const updatedLead = { ...lead, stage: targetStage };
    setLeads(prev => prev.map(l => l.id === leadId ? updatedLead : l));
    await appService.saveCRMLead(updatedLead);
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col animate-fade-in-down">
      {/* Toolbar */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
            <button onClick={handleNewLead} className="bg-brand-900 text-white px-4 py-2 rounded shadow hover:bg-brand-800 text-sm font-medium">New</button>
            <h2 className="text-xl font-bold ml-4 text-gray-800">Pipeline</h2>
        </div>
        <div className="flex items-center space-x-3">
            <div className="relative">
                <input 
                    type="text" 
                    placeholder="Search..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-1.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-brand-500 text-sm w-64 shadow-sm"
                />
                <Search size={16} className="absolute left-3 top-2 text-gray-400" />
            </div>
            <div className="flex bg-white border border-gray-300 rounded-md shadow-sm">
                <button 
                    onClick={() => setViewMode('kanban')}
                    className={`p-2 border-r border-gray-300 transition-colors ${viewMode === 'kanban' ? 'bg-gray-100 text-brand-600' : 'hover:bg-gray-50 text-gray-500'}`}
                    title="Kanban View"
                >
                    <LayoutGrid size={16} />
                </button>
                <button 
                    onClick={() => setViewMode('list')}
                    className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-gray-100 text-brand-600' : 'hover:bg-gray-50 text-gray-500'}`}
                    title="List View"
                >
                    <List size={16} />
                </button>
            </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'kanban' ? (
            <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4 h-full">
                <div className="flex space-x-4 h-full min-w-max px-1">
                    {STAGES.map(stage => {
                        const stageLeads = getLeadsByStage(stage);
                        const totalRevenue = stageLeads.reduce((acc, curr) => acc + (curr.expectedPremium || 0), 0);

                        return (
                            <div 
                                key={stage} 
                                className="w-80 flex flex-col h-full rounded-lg transition-colors"
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, stage)}
                            >
                                <div className="mb-3 px-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <h3 className="font-bold text-gray-700 text-sm truncate" title={stage}>{stage}</h3>
                                        <span className="text-xs text-gray-500 font-mono">{stageLeads.length}</span>
                                    </div>
                                    <div className={`h-1 w-full rounded-full ${stage === CRMStage.WON ? 'bg-green-500' : stage === CRMStage.LOST ? 'bg-red-500' : 'bg-gray-300'}`}>
                                        <div className="h-full bg-brand-600 rounded-full" style={{ width: `${stageLeads.length > 0 ? '100' : '0'}%`, opacity: 0.8 }}></div>
                                    </div>
                                    <div className="mt-1 text-right text-xs font-bold text-gray-600">
                                        {formatCurrency(totalRevenue)}
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                                    {stageLeads.map(lead => (
                                        <div 
                                            key={lead.id} 
                                            onClick={() => handleCardClick(lead.id)}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, lead.id)}
                                            onDragEnd={handleDragEnd}
                                            className={`bg-white p-3 rounded shadow-sm border border-gray-200 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow relative ${getStageColor(stage)}`}
                                        >
                                            <div className="mb-2">
                                                <h4 className="font-bold text-gray-800 text-sm leading-tight mb-1">{lead.title}</h4>
                                                <p className="text-xs text-gray-500 truncate">{lead.companyName}</p>
                                            </div>
                                            <div className="flex flex-wrap gap-1 mb-3">
                                                {lead.tags.map(tag => (
                                                    <span key={tag} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getTagColor(tag)}`}>{tag}</span>
                                                ))}
                                            </div>
                                            <div className="flex justify-between items-end mt-2">
                                                <div>
                                                    <div className="flex space-x-1 mb-1">
                                                        <Star size={12} className="text-yellow-400 fill-current" />
                                                        <Star size={12} className="text-yellow-400 fill-current" />
                                                        <Star size={12} className="text-gray-300" />
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-xs font-bold text-gray-700 mb-1">{formatCurrency(lead.expectedPremium)}</span>
                                                    <div className="w-6 h-6 rounded-full bg-brand-700 text-white flex items-center justify-center text-xs font-bold" title={lead.salespersonName}>
                                                        {lead.salespersonName.charAt(0)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="h-10"></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        ) : (
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden h-full flex flex-col">
                <div className="overflow-auto flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Opportunity</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Contact Name</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Email</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Salesperson</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-b text-right">Expected Revenue</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-b text-center">Stage</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredLeads.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">No leads found.</td></tr>
                            ) : (
                                filteredLeads.map(lead => (
                                    <tr key={lead.id} onClick={() => handleCardClick(lead.id)} className="hover:bg-gray-50 cursor-pointer transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-medium text-gray-900">{lead.title}</div>
                                            <div className="text-xs text-gray-500">{lead.companyName}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{lead.contactPerson || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {lead.email && <div className="flex items-center"><Mail size={12} className="mr-1"/>{lead.email}</div>}
                                            {lead.phone && <div className="flex items-center mt-1"><Phone size={12} className="mr-1"/>{lead.phone}</div>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <div className="flex items-center">
                                                <div className="w-5 h-5 rounded-full bg-brand-700 text-white flex items-center justify-center text-xs font-bold mr-2">
                                                    {lead.salespersonName.charAt(0)}
                                                </div>
                                                {lead.salespersonName}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold text-right">{formatCurrency(lead.expectedPremium)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStageBadgeColor(lead.stage)}`}>
                                                {lead.stage}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default CRMKanban;
