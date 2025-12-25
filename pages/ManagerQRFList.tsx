
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, QRF, QRFStatus, UserRole, QRFType } from '../types';
import { appService } from '../services/appService';
import Button from '../components/Button';
import SortableTh from '../components/SortableTh';
import { Users, Check, ExternalLink, Link as LinkIcon, ShieldCheck, PlusCircle, CheckCircle, Clock, LayoutGrid, Search, CornerDownRight, Lock, AlertCircle, XCircle, AlertTriangle, UserX } from 'lucide-react';
import CreateQRFModal from '../components/CreateQRFModal';

interface ManagerQRFListProps {
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

const getDaysAgo = (dateStr?: string) => {
    if (!dateStr) return 0;
    const diff = new Date().getTime() - new Date(dateStr).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
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

const ManagerQRFList: React.FC<ManagerQRFListProps> = ({ user }) => {
  const navigate = useNavigate();
  const isSalesAdmin = user.role === UserRole.ADMIN;
  const isSuperAdmin = user.role === UserRole.SUPER_ADMIN;
  const isUwAdmin = user.role === UserRole.UW_ADMIN;
  
  // Assignment Logic: Only UW Admin and Super Admin can assign/unassign. Sales Admin cannot.
  const canAssign = isSuperAdmin || isUwAdmin;
  
  // Checkboxes are useful for bulk actions. Sales Admin might want to export, but definitely not assign.
  const showCheckboxes = !isSalesAdmin; 

  const [qrfs, setQrfs] = useState<QRF[]>([]);
  const [underwriters, setUnderwriters] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'unassigned' | 'rejected' | 'accepted' | 'all'>('unassigned');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'tat', direction: 'desc' });
  const [filters, setFilters] = useState<{ [key: string]: string[] }>({});
  const [selectedQrfIds, setSelectedQrfIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignTargetIds, setAssignTargetIds] = useState<string[]>([]);
  const [reassignWarning, setReassignWarning] = useState<string | null>(null);
  const [toast, setToast] = useState<{show: boolean, msg: string}>({show: false, msg: ''});
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [qrfsData, uwData] = await Promise.all([appService.getQRFs(), appService.getUnderwriters()]);
    setQrfs(qrfsData);
    let finalUwData = [...uwData];
    if (user.role === UserRole.UW_ADMIN && !finalUwData.find(u => u.id === user.id)) {
        finalUwData.push(user);
    }
    setUnderwriters(finalUwData);
  };

  const showToast = (msg: string) => { setToast({show: true, msg}); setTimeout(() => setToast({show: false, msg: ''}), 3000); };
  
  const copyToClipboard = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const link = appService.generateLink(id);
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };
  
  const handleFilter = (key: string, values: string[]) => { setFilters(prev => ({ ...prev, [key]: values })); setSelectedQrfIds(new Set()); };

  // Helper to extract value from QRF for filtering
  const getValue = (q: QRF, key: string): string => {
      if (key === 'name') return q.name;
      if (key === 'agentName') return q.agentName;
      if (key === 'assignedToName') return q.assignedToName || 'Unassigned';
      if (key === 'accountName') return q.data.accountName;
      if (key === 'status') return q.status;
      if (key === 'types') return q.types.join(', ');
      if (key === 'submittedAt') return q.submittedAt ? new Date(q.submittedAt).toLocaleDateString() : '';
      if (key === 'tat') {
          const days = getTatDays(q);
          return days === -1 ? '-' : `${days} Days`;
      }
      return '';
  };

  // 1. Base Data (Tab + Search)
  const baseData = useMemo(() => {
    return qrfs.filter(q => {
         let tabMatch = true;
         if (activeTab === 'unassigned') {
            // Must be SUBMITTED and NOT have an assignedToId
            tabMatch = q.status === QRFStatus.SUBMITTED && (!q.assignedToId || q.assignedToId === '');
         } else if (activeTab === 'rejected') {
            tabMatch = q.status === QRFStatus.REJECTED;
         } else if (activeTab === 'accepted') {
            tabMatch = q.status === QRFStatus.APPROVED;
         } else if (activeTab === 'all') {
            tabMatch = true;
         }
         
         let searchMatch = true;
         if (searchQuery) {
            const lowerQ = searchQuery.toLowerCase();
            searchMatch = (q.name && q.name.toLowerCase().includes(lowerQ)) || (q.referenceNumber && q.referenceNumber.toLowerCase().includes(lowerQ));
         }
         return tabMatch && searchMatch;
    });
  }, [qrfs, activeTab, searchQuery]);

  // 2. Dynamic Unique Values (Based on Base Data + Other Filters)
  const getUniqueValues = (key: string) => {
    const subset = baseData.filter(q => {
        return Object.entries(filters).every(([filterKey, selectedValues]) => {
            if (filterKey === key) return true; // Ignore self to show all possibilities for this column
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
    
    // Custom sort for TaT to handle "2 Days" vs "10 Days" correctly
    if (key === 'tat') {
        return Array.from(values).sort((a, b) => {
            const valA = parseInt(a) || -999;
            const valB = parseInt(b) || -999;
            return valA - valB;
        });
    }
    return Array.from(values).sort();
  };

  // 3. Final Filtered Data
  const filteredQRFs = useMemo(() => {
    return baseData.filter(q => {
        return Object.entries(filters).every(([key, selectedValues]) => {
          const values = selectedValues as string[];
          if (!values || values.length === 0) return true;
          return values.includes(getValue(q, key));
        });
    });
  }, [baseData, filters]);

  const sortedQRFs = useMemo(() => {
    return [...filteredQRFs].sort((a, b) => {
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
            if (key === 'assignedToName') { valA = a.assignedToName || ''; valB = b.assignedToName || ''; }
            if (key === 'types') { valA = a.types.join(', '); valB = b.types.join(', '); }
        }
        
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });
  }, [filteredQRFs, sortConfig]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
        const selectableIds = sortedQRFs
            .filter(q => !q.isLocked && q.status !== QRFStatus.APPROVED && q.status !== QRFStatus.REJECTED)
            .map(q => q.id);
        setSelectedQrfIds(new Set(selectableIds));
    } else {
        setSelectedQrfIds(new Set());
    }
  };
  
  const handleSelectRow = (id: string) => {
    const newSet = new Set(selectedQrfIds);
    if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
    setSelectedQrfIds(newSet);
  };
  
  const openAssignModal = (ids: string[]) => { 
      setAssignTargetIds(ids); 
      const targets = qrfs.filter(q => ids.includes(q.id));
      const alreadyAssigned = targets.filter(q => q.assignedToId);
      if (alreadyAssigned.length > 0) {
          if (alreadyAssigned.length === 1) {
              const q = alreadyAssigned[0];
              const days = getDaysAgo(q.assignedAt);
              const timeMsg = days === 0 ? 'today' : `${days} days ago`;
              setReassignWarning(`This eQRF is already assigned to ${q.assignedToName} since ${timeMsg}. Are you sure you want to reassign?`);
          } else {
              setReassignWarning(`${alreadyAssigned.length} of the selected eQRFs are already assigned. Re-assigning will transfer ownership.`);
          }
      } else {
          setReassignWarning(null);
      }
      setAssignModalOpen(true); 
  };
  
  const confirmAssignment = async (underwriterId: string, underwriterName: string) => {
    const updates = assignTargetIds.map(id => {
       const qrf = qrfs.find(q => q.id === id);
       if (!qrf) return null;
       // When assigning, clear any "unassigned" flags
       return { 
           ...qrf, 
           assignedToId: underwriterId, 
           assignedToName: underwriterName,
           unassignedBy: undefined,
           unassignedAt: undefined,
           previousAssignedToName: undefined
       };
    }).filter(Boolean) as QRF[];
    await Promise.all(updates.map(q => appService.saveQRF(q)));
    setAssignModalOpen(false); setAssignTargetIds([]); setSelectedQrfIds(new Set()); loadData(); showToast(`Assigned to ${underwriterName}`);
  };

  const handleUnassign = async (id: string) => {
      const qrf = qrfs.find(q => q.id === id);
      if (!qrf) return;
      
      const updatedQrf: QRF = {
          ...qrf,
          assignedToId: undefined,
          assignedToName: undefined,
          assignedAt: undefined,
          isLocked: false,
          // Track who unassigned it and who it was assigned to
          unassignedBy: user.fullName,
          unassignedAt: new Date().toISOString(),
          previousAssignedToName: qrf.assignedToName
      };
      
      await appService.saveQRF(updatedQrf);
      loadData();
      showToast(`Unassigned ${qrf.referenceNumber}`);
  };

  const handleCreateNew = (type: QRFType) => {
    setShowCreateModal(false);
    const types = type === QRFType.MEDICAL ? [QRFType.MEDICAL, QRFType.LIFE] : [type];
    navigate('/qrf/new', { state: { types } });
  };

  // Calculate Counts
  const unassignedCount = qrfs.filter(q => q.status === QRFStatus.SUBMITTED && (!q.assignedToId || q.assignedToId === '')).length;
  const rejectedCount = qrfs.filter(q => q.status === QRFStatus.REJECTED).length;
  const acceptedCount = qrfs.filter(q => q.status === QRFStatus.APPROVED).length;
  const allCount = qrfs.length;

  return (
    <div className="space-y-6 animate-fade-in-down relative h-[calc(100vh-100px)] flex flex-col">
        {toast.show && <div className="fixed bottom-6 right-6 z-50 animate-fade-in-down bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3"><CheckCircle size={20} /><span className="font-medium">{toast.msg}</span></div>}
        
        <div className="flex justify-between items-center pb-2 border-b border-gray-200 shrink-0">
            <h2 className="text-2xl font-bold text-gray-900">All eQRFs</h2>
            <div className="flex space-x-2">
                {(isSalesAdmin || isSuperAdmin) && (
                  <Button onClick={() => setShowCreateModal(true)}>
                    <PlusCircle size={18} className="mr-2" />
                    Create New eQRF
                  </Button>
                )}
            </div>
        </div>
        
        {selectedQrfIds.size > 0 && canAssign && (
             <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg flex items-center justify-between shrink-0">
                <span className="text-sm font-medium text-blue-800 ml-2">{selectedQrfIds.size} eQRFs selected</span>
                <Button onClick={() => openAssignModal(Array.from(selectedQrfIds))} className="bg-blue-600 hover:bg-blue-700 text-sm py-1"><Users size={16} className="mr-2" />Assign Selected</Button>
             </div>
        )}
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative flex flex-col flex-1">
            <div className="border-b border-gray-200 bg-gray-50 px-6 flex flex-col md:flex-row md:items-center justify-between shrink-0">
                <div className="flex space-x-8 overflow-x-auto">
                    <button onClick={() => { setActiveTab('unassigned'); setFilters({}); }} className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center transition-colors whitespace-nowrap ${activeTab === 'unassigned' ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-red-500'}`}>
                        <AlertCircle size={16} className="mr-2" />Unassigned / Pending <span className="ml-2 bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{unassignedCount}</span>
                    </button>
                    <button onClick={() => { setActiveTab('rejected'); setFilters({}); }} className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center transition-colors whitespace-nowrap ${activeTab === 'rejected' ? 'border-gray-600 text-gray-800' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                        <XCircle size={16} className="mr-2" />Rejected <span className="ml-2 bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{rejectedCount}</span>
                    </button>
                    <button onClick={() => { setActiveTab('accepted'); setFilters({}); }} className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center transition-colors whitespace-nowrap ${activeTab === 'accepted' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-green-600'}`}>
                        <CheckCircle size={16} className="mr-2" />Approved <span className="ml-2 bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{acceptedCount}</span>
                    </button>
                    <button onClick={() => { setActiveTab('all'); setFilters({}); }} className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center transition-colors whitespace-nowrap ${activeTab === 'all' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                        <LayoutGrid size={16} className="mr-2" />All <span className="ml-2 bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{allCount}</span>
                    </button>
                </div>
                <div className="py-2 md:py-0 w-full md:w-64"><div className="relative"><input type="text" placeholder="Search Ref, Name, Agent..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-brand-500 focus:border-brand-500" /><Search size={16} className="absolute left-3 top-2.5 text-gray-400" /></div></div>
            </div>
            
            <div className="overflow-y-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-20 bg-gray-50 shadow-sm">
                  <tr className="border-b border-gray-200">
                     {showCheckboxes && <th className="px-3 py-3 w-10 sticky top-0 bg-gray-50"><input type="checkbox" className="rounded border-gray-300 text-brand-600 focus:ring-brand-500 h-4 w-4 disabled:opacity-50 disabled:cursor-not-allowed" checked={sortedQRFs.length > 0 && selectedQrfIds.size === sortedQRFs.filter(q=>!q.isLocked && q.status !== QRFStatus.APPROVED && q.status !== QRFStatus.REJECTED).length} onChange={handleSelectAll} /></th>}
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
                  {sortedQRFs.map(q => {
                      const hasHistory = q.history && q.history.length > 0;
                      const tatDays = getTatDays(q);
                      const isTerminal = q.status === QRFStatus.APPROVED || q.status === QRFStatus.REJECTED;
                      // Manager View Pending Logic: Submitted and Unassigned
                      const isPendingManagerAction = q.status === QRFStatus.SUBMITTED && (!q.assignedToId || q.assignedToId === '');

                      const mainRow = (
                        <tr key={q.id} className={`${isPendingManagerAction ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-brand-50'} transition-colors cursor-pointer ${selectedQrfIds.has(q.id) ? 'bg-blue-50' : (hasHistory ? 'bg-gray-50/50' : '')}`} onClick={() => navigate(`/qrf/edit/${q.id}`)}>
                            {showCheckboxes && (
                                <td className="px-3 py-4" onClick={e=>e.stopPropagation()}>
                                    <input type="checkbox" className="rounded border-gray-300 text-brand-600 focus:ring-brand-500 h-4 w-4 disabled:opacity-50 disabled:cursor-not-allowed" checked={selectedQrfIds.has(q.id)} onChange={() => handleSelectRow(q.id)} disabled={!!q.isLocked || isTerminal} />
                                </td>
                            )}
                            <td className="px-3 py-4 text-xs font-mono font-bold text-gray-700 whitespace-nowrap">{q.referenceNumber || '-'}</td>
                            <td className="px-3 py-4"><div className="flex flex-col space-y-1">{q.types?.map(t => <span key={t} className="text-[10px] bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded text-gray-600 w-fit">{t === QRFType.MEDICAL ? 'Medi-Life' : t}</span>) || 'Medi-Life'}</div></td>
                            <td className="px-3 py-4 font-medium text-gray-900 min-w-[150px]">{q.name}</td>
                            <td className="px-3 py-4 text-gray-600 min-w-[150px]">{q.data.accountName}</td>
                            <td className="px-3 py-4"><TaTCell days={tatDays} /></td>
                            <td className="px-3 py-4"><DateCell dateStr={q.submittedAt} /></td>
                            <td className="px-3 py-4"><UserCell name={q.agentName} /></td>
                            <td className="px-3 py-4">
                                {q.assignedToName ? (
                                    <div className="flex flex-col whitespace-nowrap"><span className="font-medium text-gray-900">{q.assignedToName}</span></div>
                                ) : q.unassignedBy ? (
                                    <div className="flex flex-col whitespace-nowrap">
                                        <span className="text-xs text-gray-400 font-medium">Unassigned by {q.unassignedBy}</span>
                                        {q.unassignedAt && <span className="text-[9px] text-gray-300">{new Date(q.unassignedAt).toLocaleTimeString('en-US', {hour: 'numeric', minute:'2-digit'})}</span>}
                                    </div>
                                ) : (
                                    <span className="text-gray-300 italic">Unassigned</span>
                                )}
                            </td>
                            <td className="px-3 py-4"><DateCell dateStr={q.assignedAt} /></td>
                            <td className="px-3 py-4"><StatusCell status={q.status} isResubmission={(q.history?.length || 0) > 0} /></td>
                            <td className="px-3 py-4 text-xs text-red-500 max-w-[150px] truncate" title={q.rejectionReason}>{q.rejectionReason || '-'}</td>
                            <td className="px-3 py-4"><DateCell dateStr={q.decidedAt} /></td>
                            <td className="px-3 py-4 text-right whitespace-nowrap" onClick={e=>e.stopPropagation()}>
                                <div className="flex flex-col items-end space-y-2">
                                {canAssign && (
                                    q.isLocked ? (
                                        <div className="flex items-center text-xs text-red-500" title="Locked by underwriter review">
                                            <Lock size={14} className="mr-1" /> Reviewing
                                        </div>
                                    ) : isTerminal ? null : (
                                        <div className="flex flex-col space-y-1 w-full">
                                            <button onClick={() => openAssignModal([q.id])} className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline flex items-center justify-end w-full" title="Assign Underwriter">
                                                <ShieldCheck size={14} className="mr-1" />
                                                {q.assignedToId ? 'Re-Assign' : 'Assign'}
                                            </button>
                                            {q.assignedToId && (
                                                <button onClick={() => handleUnassign(q.id)} className="text-xs font-medium text-gray-500 hover:text-red-600 hover:underline flex items-center justify-end w-full" title="Unassign">
                                                    <UserX size={14} className="mr-1" />
                                                    Unassign
                                                </button>
                                            )}
                                        </div>
                                    )
                                )}
                                {(q.status === 'SUBMITTED' || q.status === 'APPROVED') && <button onClick={(e) => copyToClipboard(q.id, e)} className="text-xs font-medium text-brand-600 hover:text-brand-800 hover:underline flex items-center justify-end w-full" title="Copy Link">{copiedId === q.id ? <Check size={14} className="mr-1"/> : <LinkIcon size={14} className="mr-1"/>}{copiedId === q.id ? "Copied" : "Copy Link"}</button>}
                                </div>
                            </td>
                        </tr>
                      );
                      const historyRows = (q.history || []).slice().reverse().map((h, idx) => {
                         const cycleNum = (q.history?.length || 0) - idx;
                         return (
                            <tr key={`${q.id}_hist_${idx}`} className="bg-gray-50 border-b border-dashed border-gray-200 text-xs">
                                {showCheckboxes && <td></td>} 
                                <td className="px-3 py-3 text-right text-gray-400"><CornerDownRight size={12} className="ml-auto"/></td> 
                                <td className="px-3 py-3 text-gray-400 italic" colSpan={3}>Cycle {cycleNum}</td> 
                                <td className="px-3 py-3"></td>
                                <td className="px-3 py-3"><DateCell dateStr={h.submittedAt} /></td> 
                                <td className="px-3 py-3"><UserCell name={q.agentName} /></td> 
                                <td className="px-3 py-3"><UserCell name={h.assignedToName} /></td> 
                                <td className="px-3 py-3"><DateCell dateStr={h.assignedAt} /></td> 
                                <td className="px-3 py-3"><StatusCell status={h.status} /></td>
                                <td className="px-3 py-3 text-red-500 max-w-[150px] truncate" title={h.rejectionReason}>{h.rejectionReason || '-'}</td> 
                                <td className="px-3 py-3"><DateCell dateStr={h.decidedAt} /></td> 
                                <td className="px-3 py-3"></td>
                            </tr>
                         );
                      });
                      return <React.Fragment key={q.id}>{mainRow}{historyRows}</React.Fragment>;
                  })}
                  {sortedQRFs.length === 0 && <tr><td colSpan={13} className="p-8 text-center text-gray-500">No records found.</td></tr>}
                </tbody>
              </table>
            </div>
        </div>
        
        {/* ASSIGN MODAL */}
        {assignModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl animate-fade-in-down">
                <h3 className="text-lg font-bold mb-4">Assign to Underwriter</h3>
                {reassignWarning && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex items-start">
                        <AlertTriangle size={18} className="text-amber-600 mr-2 mt-0.5 shrink-0"/>
                        <p className="text-sm text-amber-800">{reassignWarning}</p>
                    </div>
                )}
                <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
                    {underwriters.map(uw => (
                        <button key={uw.id} onClick={() => confirmAssignment(uw.id, uw.fullName)} className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-brand-500 hover:bg-brand-50 transition-all flex items-center group">
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

        {showCreateModal && <CreateQRFModal onClose={() => setShowCreateModal(false)} onSelect={handleCreateNew} />}
    </div>
  );
};

export default ManagerQRFList;
