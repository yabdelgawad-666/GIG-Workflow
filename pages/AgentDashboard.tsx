
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Copy, Check, TrendingUp, Search, LayoutGrid, AlertCircle, XCircle, CheckCircle, Link as LinkIcon, ExternalLink } from 'lucide-react';
import { QRF, User, QRFStatus, QRFType } from '../types';
import { appService } from '../services/appService';
import Button from '../components/Button';
import SortableTh from '../components/SortableTh';
import CreateQRFModal from '../components/CreateQRFModal';

interface AgentDashboardProps {
  user: User;
}

const DateCell = ({ dateStr }: { dateStr?: string }) => {
  if (!dateStr) return <span className="text-gray-300">-</span>;
  const d = new Date(dateStr);
  return (
    <div className="flex flex-col whitespace-nowrap">
      <span className="font-medium text-gray-900">{d.toLocaleDateString()}</span>
      <span className="text-[10px] text-gray-400 uppercase">
        {d.toLocaleTimeString('en-US', {hour: 'numeric', minute:'2-digit', hour12: true})}
      </span>
    </div>
  );
};

const UserCell = ({ name }: { name?: string }) => {
  if (!name) return <span className="text-gray-300 italic">Unassigned</span>;
  return (
    <div className="flex flex-col whitespace-nowrap">
      <span className="font-medium text-gray-900">{name}</span>
    </div>
  );
};

const TaTCell = ({ days }: { days: number }) => {
    if (days === -1) return <span className="text-gray-300">-</span>;
    const colorClass = days >= 5 ? 'text-red-600' : days >= 2 ? 'text-amber-600' : 'text-gray-900';
    return (
        <div className="flex flex-col whitespace-nowrap">
            <span className={`font-bold ${colorClass}`}>{days} Days</span>
        </div>
    );
};

const StatusCell = ({ status, isResubmission }: { status: string, isResubmission?: boolean }) => {
  if (status === 'SUBMITTED' && isResubmission) {
     return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border bg-purple-50 text-purple-700 border-purple-100 whitespace-nowrap">
            RE-SUBMISSION
        </span>
     );
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border whitespace-nowrap ${
      status === 'APPROVED' ? 'bg-green-50 text-green-700 border-green-100' :
      status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-100' :
      status === 'SUBMITTED' ? 'bg-blue-50 text-blue-700 border-blue-100' :
      'bg-gray-50 text-gray-600 border-gray-100'
    }`}>
      {status === 'APPROVED' ? 'APPROVED' : status}
    </span>
  );
};

const getTatDays = (q: QRF): number => {
    if (!q.submittedAt) return -1;
    const start = new Date(q.submittedAt).getTime();
    let end = new Date().getTime();
    if (q.status === QRFStatus.APPROVED || q.status === QRFStatus.REJECTED) {
        end = q.decidedAt ? new Date(q.decidedAt).getTime() : end;
    } else if (q.assignedToId) {
        end = q.assignedAt ? new Date(q.assignedAt).getTime() : end;
    }
    const diff = Math.max(0, end - start);
    return Math.floor(diff / (1000 * 60 * 60 * 24));
};

const AgentDashboard: React.FC<AgentDashboardProps> = ({ user }) => {
  const [qrfs, setQrfs] = useState<QRF[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'unassigned' | 'rejected' | 'accepted' | 'all'>('unassigned');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'createdAt', direction: 'desc' });
  const [filters, setFilters] = useState<{ [key: string]: string[] }>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => { loadQRFs(); }, []);
  const loadQRFs = async () => { setQrfs(await appService.getQRFs(user.id)); };

  const copyToClipboard = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); 
    const link = appService.generateLink(id);
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRowClick = (id: string) => {
    navigate(`/qrf/edit/${id}`);
  };

  const handleCreateNew = (type: QRFType) => {
    setShowCreateModal(false);
    const types = type === QRFType.MEDICAL ? [QRFType.MEDICAL, QRFType.LIFE] : [type];
    navigate('/qrf/new', { state: { types } });
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const handleFilter = (key: string, values: string[]) => {
    setFilters(prev => ({ ...prev, [key]: values }));
  };

  const getValue = (q: QRF, key: string): string => {
      if (key === 'name') return q.name;
      if (key === 'accountName') return q.data.accountName;
      if (key === 'status') return q.status;
      if (key === 'types') return (q.types || []).join(', ');
      if (key === 'agentName') return q.agentName;
      if (key === 'assignedToName') return q.assignedToName || 'Unassigned';
      if (key === 'submittedAt') return q.submittedAt ? new Date(q.submittedAt).toLocaleDateString() : '';
      if (key === 'tat') {
          const days = getTatDays(q);
          return days === -1 ? '-' : `${days} Days`;
      }
      return '';
  };

  const baseData = useMemo(() => {
      return qrfs.filter(q => {
          let tabMatch = true;
          if (activeTab === 'unassigned') {
              // Agent "Pending" means Draft or Submitted (waiting for UW)
              tabMatch = q.status === QRFStatus.DRAFT || q.status === QRFStatus.SUBMITTED; 
          } else if (activeTab === 'rejected') {
              tabMatch = q.status === QRFStatus.REJECTED;
          } else if (activeTab === 'accepted') {
              tabMatch = q.status === QRFStatus.APPROVED;
          }
          
          let searchMatch = true;
          if (searchQuery) {
              const lowerQ = searchQuery.toLowerCase();
              searchMatch = 
                  (q.name && q.name.toLowerCase().includes(lowerQ)) ||
                  (q.referenceNumber && q.referenceNumber.toLowerCase().includes(lowerQ)) ||
                  (q.data.accountName && q.data.accountName.toLowerCase().includes(lowerQ));
          }
          return tabMatch && searchMatch;
      });
  }, [qrfs, activeTab, searchQuery]);

  const getUniqueValues = (key: string) => {
    const subset = baseData.filter(q => {
        return Object.entries(filters).every(([filterKey, selectedValues]) => {
            if (filterKey === key) return true;
            const values = selectedValues as string[];
            if (!values || values.length === 0) return true;
            return values.includes(getValue(q, filterKey));
        });
    });

    const values = new Set<string>();
    subset.forEach(q => {
      const val = getValue(q, key);
      if (val) values.add(val);
    });
    if (key === 'tat') return Array.from(values).sort((a,b) => parseInt(a) - parseInt(b));
    return Array.from(values).sort();
  };

  const filteredAndSortedQRFs = useMemo(() => {
    return baseData.filter(q => {
      return Object.entries(filters).every(([key, selectedValues]) => {
        const values = selectedValues as string[];
        if (!values || values.length === 0) return true;
        return values.includes(getValue(q, key));
      });
    }).sort((a, b) => {
      const key = sortConfig.key;
      let valA: any = a[key as keyof QRF];
      let valB: any = b[key as keyof QRF];
      
      if (key === 'tat') {
          valA = getTatDays(a);
          valB = getTatDays(b);
      } else if (key === 'submittedAt') {
          valA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
          valB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
      } else {
          if (key === 'accountName') { valA = a.data.accountName; valB = b.data.accountName; }
          if (key === 'types') { valA = (a.types || []).join(', '); valB = (b.types || []).join(', '); }
          if (key === 'assignedToName') { valA = a.assignedToName || ''; valB = b.assignedToName || ''; }
      }
      
      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [baseData, filters, sortConfig]);

  // Calculate Counts
  const activeCount = qrfs.filter(q => q.status !== QRFStatus.APPROVED).length;
  
  // Pending tasks for Agent: Drafts + Submitted. (These are what make up the active count mostly, plus Rejected)
  const pendingTabCount = qrfs.filter(q => q.status === QRFStatus.DRAFT || q.status === QRFStatus.SUBMITTED).length;
  const rejectedTabCount = qrfs.filter(q => q.status === QRFStatus.REJECTED).length;
  const allCount = qrfs.length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 rounded-full bg-blue-50 text-brand-600 mr-4"><TrendingUp size={24} /></div>
          <div><p className="text-sm text-gray-500 font-medium">Active / Due eQRFs</p><p className="text-2xl font-bold text-gray-900">{activeCount}</p></div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center">
           <div className="p-3 rounded-full bg-gray-50 text-gray-600 mr-4"><LayoutGrid size={24} /></div>
           <div><p className="text-sm text-gray-500 font-medium">Total Generated</p><p className="text-2xl font-bold text-gray-900">{qrfs.length}</p></div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center pt-4">
        <div className="mb-4 md:mb-0">
          <h2 className="text-2xl font-bold text-gray-900">My eQRFs</h2>
          <p className="text-gray-500 mt-1">Manage and track your quote request forms.</p>
        </div>
        <div className="flex space-x-3">
             <Button onClick={() => setShowCreateModal(true)}><Plus size={18} className="mr-2" />Create New eQRF</Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200 bg-gray-50 px-6 flex flex-col md:flex-row md:items-center justify-between">
            <div className="flex space-x-8 overflow-x-auto">
                <button onClick={() => { setActiveTab('unassigned'); setFilters({}); }} className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center transition-colors whitespace-nowrap ${activeTab === 'unassigned' ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-red-500'}`}>
                    <AlertCircle size={16} className="mr-2" />Unassigned / Pending 
                    {pendingTabCount > 0 && <span className="ml-2 bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">{pendingTabCount}</span>}
                </button>
                <button onClick={() => { setActiveTab('rejected'); setFilters({}); }} className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center transition-colors whitespace-nowrap ${activeTab === 'rejected' ? 'border-gray-600 text-gray-800' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                    <XCircle size={16} className="mr-2" />Rejected 
                    {rejectedTabCount > 0 && <span className="ml-2 bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">{rejectedTabCount}</span>}
                </button>
                <button onClick={() => { setActiveTab('accepted'); setFilters({}); }} className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center transition-colors whitespace-nowrap ${activeTab === 'accepted' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-green-600'}`}>
                    <CheckCircle size={16} className="mr-2" />Approved
                </button>
                <button onClick={() => { setActiveTab('all'); setFilters({}); }} className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center transition-colors whitespace-nowrap ${activeTab === 'all' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                    <LayoutGrid size={16} className="mr-2" />All <span className="ml-2 bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{allCount}</span>
                </button>
            </div>
            <div className="py-2 md:py-0 w-full md:w-64"><div className="relative"><input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-brand-500 focus:border-brand-500" /><Search size={16} className="absolute left-3 top-2.5 text-gray-400" /></div></div>
        </div>

        <div className="overflow-x-auto min-h-[500px]">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-20 bg-gray-50 shadow-sm">
              <tr className="border-b border-gray-200">
                <th className="px-3 py-3 font-semibold text-gray-700 text-xs uppercase tracking-wider whitespace-nowrap sticky top-0 bg-gray-50">Ref #</th>
                <SortableTh label="Type" sortKey="types" currentSort={sortConfig} onSort={handleSort} options={getUniqueValues('types')} selectedValues={filters.types || []} onFilter={(v) => handleFilter('types', v)} className="whitespace-nowrap px-3 sticky top-0 bg-gray-50" />
                <SortableTh label="Ref Name" sortKey="name" currentSort={sortConfig} onSort={handleSort} options={getUniqueValues('name')} selectedValues={filters.name || []} onFilter={(v) => handleFilter('name', v)} className="whitespace-nowrap px-3 sticky top-0 bg-gray-50" />
                <SortableTh label="Account" sortKey="accountName" currentSort={sortConfig} onSort={handleSort} options={getUniqueValues('accountName')} selectedValues={filters.accountName || []} onFilter={(v) => handleFilter('accountName', v)} className="whitespace-nowrap px-3 sticky top-0 bg-gray-50" />
                <SortableTh label="TaT" sortKey="tat" currentSort={sortConfig} onSort={handleSort} options={getUniqueValues('tat')} selectedValues={filters.tat || []} onFilter={(v) => handleFilter('tat', v)} className="whitespace-nowrap px-3 sticky top-0 bg-gray-50" />
                <SortableTh label="Submitted On" sortKey="submittedAt" currentSort={sortConfig} onSort={handleSort} options={getUniqueValues('submittedAt')} selectedValues={filters.submittedAt || []} onFilter={(v) => handleFilter('submittedAt', v)} className="whitespace-nowrap px-3 sticky top-0 bg-gray-50" />
                <SortableTh label="Submitted By" sortKey="agentName" currentSort={sortConfig} onSort={handleSort} options={getUniqueValues('agentName')} selectedValues={filters.agentName || []} onFilter={(v) => handleFilter('agentName', v)} className="whitespace-nowrap px-3 sticky top-0 bg-gray-50" />
                <SortableTh label="Assigned To" sortKey="assignedToName" currentSort={sortConfig} onSort={handleSort} options={getUniqueValues('assignedToName')} selectedValues={filters.assignedToName || []} onFilter={(v) => handleFilter('assignedToName', v)} className="whitespace-nowrap px-3 sticky top-0 bg-gray-50" />
                <th className="px-3 py-3 font-semibold text-gray-700 text-xs uppercase tracking-wider whitespace-nowrap sticky top-0 bg-gray-50">Assigned On</th>
                <SortableTh label="Status" sortKey="status" currentSort={sortConfig} onSort={handleSort} options={getUniqueValues('status')} selectedValues={filters.status || []} onFilter={(v) => handleFilter('status', v)} className="whitespace-nowrap px-3 sticky top-0 bg-gray-50" />
                <th className="px-3 py-3 font-semibold text-gray-700 text-xs uppercase tracking-wider whitespace-nowrap sticky top-0 bg-gray-50">Reason</th>
                <th className="px-3 py-3 font-semibold text-gray-700 text-xs uppercase tracking-wider whitespace-nowrap sticky top-0 bg-gray-50">Reviewed On</th>
                <th className="px-3 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider text-right whitespace-nowrap sticky top-0 bg-gray-50">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredAndSortedQRFs.length === 0 ? (
                <tr><td colSpan={13} className="px-6 py-12 text-center text-gray-500">No eQRFs found in this view.</td></tr>
              ) : (
                filteredAndSortedQRFs.map((q) => {
                    let tatDays = getTatDays(q);
                    // Pending rows for Agent: DRAFT, SUBMITTED, REJECTED. (Anything NOT APPROVED)
                    const isPendingAction = q.status !== QRFStatus.APPROVED;
                    
                    return (
                        <tr key={q.id} className={`${isPendingAction ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-brand-50'} transition-colors group cursor-pointer`} onClick={() => handleRowClick(q.id)}>
                            <td className="px-3 py-4 text-xs font-mono font-bold text-gray-500 whitespace-nowrap">{q.referenceNumber || '-'}</td>
                            <td className="px-3 py-4">
                                <div className="flex flex-col space-y-1">
                                    {q.types?.map(t => (
                                    <span key={t} className="text-[10px] bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded text-gray-600 w-fit">{t === QRFType.MEDICAL ? 'Medi-Life' : t}</span>
                                    )) || <span className="text-[10px] bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded text-gray-600 w-fit">Medi-Life</span>}
                                </div>
                            </td>
                            <td className="px-3 py-4 font-medium text-gray-900 min-w-[150px]">{q.name}</td>
                            <td className="px-3 py-4 text-gray-600 min-w-[150px]">{q.data.accountName}</td>
                            <td className="px-3 py-4"><TaTCell days={tatDays} /></td>
                            <td className="px-3 py-4"><DateCell dateStr={q.submittedAt} /></td>
                            <td className="px-3 py-4"><UserCell name={q.agentName} /></td>
                            <td className="px-3 py-4"><UserCell name={q.assignedToName} /></td>
                            <td className="px-3 py-4"><DateCell dateStr={q.assignedAt} /></td>
                            <td className="px-3 py-4"><StatusCell status={q.status} isResubmission={(q.history?.length || 0) > 0} /></td>
                            <td className="px-3 py-4 text-xs text-red-500 max-w-[150px] truncate" title={q.rejectionReason}>{q.rejectionReason || '-'}</td>
                            <td className="px-3 py-4"><DateCell dateStr={q.decidedAt} /></td>
                            <td className="px-3 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end space-x-2">
                                {(q.status === 'SUBMITTED' || q.status === 'APPROVED') && (
                                <button onClick={(e) => copyToClipboard(q.id, e)} className="p-2 text-brand-600 hover:bg-brand-100 rounded-lg transition-colors flex items-center text-xs font-semibold" title="Copy Link">
                                    {copiedId === q.id ? <Check size={16} className="mr-1" /> : <LinkIcon size={16} className="mr-1" />}
                                </button>
                                )}
                                <button onClick={() => navigate(`/qrf/edit/${q.id}`)} className="text-xs text-brand-600 hover:underline flex items-center">
                                    <ExternalLink size={14} className="mr-1"/>View
                                </button>
                            </div>
                            </td>
                        </tr>
                    );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      {showCreateModal && <CreateQRFModal onClose={() => setShowCreateModal(false)} onSelect={handleCreateNew} />}
    </div>
  );
};

export default AgentDashboard;
