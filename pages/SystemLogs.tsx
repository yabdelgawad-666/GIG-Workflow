
import React, { useEffect, useState, useMemo } from 'react';
import { User, SystemLog } from '../types';
import { appService } from '../services/appService';
import SortableTh from '../components/SortableTh';
import { Activity, Search, Server } from 'lucide-react';

interface SystemLogsProps {
  user: User;
}

const SystemLogs: React.FC<SystemLogsProps> = ({ user }) => {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'timestamp', direction: 'desc' });
  const [filters, setFilters] = useState<{ [key: string]: string[] }>({});
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
       const data = await appService.getSystemLogs(user);
       setLogs(data);
    };
    fetchLogs();
  }, [user]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const handleFilter = (key: string, values: string[]) => {
    setFilters(prev => ({ ...prev, [key]: values }));
  };

  const getValue = (l: SystemLog, key: string) => {
      if (key === 'action') return l.action;
      if (key === 'userRole') return l.userRole;
      if (key === 'userName') return l.userName;
      return '';
  }

  // 1. Base Data (Search)
  const baseData = useMemo(() => {
      return logs.filter(l => {
        if (!searchQuery) return true;
        const lower = searchQuery.toLowerCase();
        return l.action.toLowerCase().includes(lower) || 
                l.userName.toLowerCase().includes(lower) || 
                l.details.toLowerCase().includes(lower);
      });
  }, [logs, searchQuery]);

  // 2. Dynamic Unique Values
  const getUniqueValues = (key: string) => {
    const subset = baseData.filter(l => {
        return Object.entries(filters).every(([filterKey, selectedValues]) => {
           if (filterKey === key) return true;
           const values = selectedValues as string[];
           if (!values || values.length === 0) return true;
           return values.includes(getValue(l, filterKey));
        });
    });

    const values = new Set<string>();
    subset.forEach(l => {
       const val = getValue(l, key);
       if (val) values.add(val);
    });
    return Array.from(values).sort();
  };

  // 3. Final Filtered Data
  const filteredLogs = useMemo(() => {
    return baseData.filter(l => {
        return Object.entries(filters).every(([key, selectedValues]) => {
           const values = selectedValues as string[];
           if (!values || values.length === 0) return true;
           return values.includes(getValue(l, key));
        });
    }).sort((a, b) => {
        const key = sortConfig.key;
        let valA: any = a[key as keyof SystemLog];
        let valB: any = b[key as keyof SystemLog];
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });
  }, [baseData, filters, sortConfig]);

  return (
    <div className="space-y-6 animate-fade-in-down h-[calc(100vh-100px)] flex flex-col">
       <div className="flex items-center justify-between pb-2 border-b border-gray-200 shrink-0">
          <div className="flex items-center space-x-3">
             <Activity size={28} className="text-brand-600" />
             <div>
               <h2 className="text-2xl font-bold text-gray-900">System Logs</h2>
               <p className="text-gray-500 text-sm">Audit trail of system activities (100 days)</p>
             </div>
          </div>
       </div>

       <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative flex flex-col flex-1">
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-3 flex justify-between items-center shrink-0">
              <div className="flex items-center text-gray-500 text-sm">
                 <Server size={16} className="mr-2"/>
                 <span>{filteredLogs.length} Records found</span>
              </div>
              <div className="relative w-64">
                 <input 
                   type="text" 
                   placeholder="Search logs..." 
                   value={searchQuery}
                   onChange={e => setSearchQuery(e.target.value)}
                   className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
                 />
                 <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
              </div>
          </div>

          <div className="overflow-y-auto flex-1">
             <table className="w-full text-left border-collapse text-sm">
               <thead className="sticky top-0 bg-gray-50 z-20 shadow-sm">
                 <tr>
                    <SortableTh 
                        label="Timestamp" 
                        sortKey="timestamp" 
                        currentSort={sortConfig} onSort={handleSort} 
                        options={[]} // No filter for date usually
                        selectedValues={[]} onFilter={()=>{}}
                        className="whitespace-nowrap sticky top-0 bg-gray-50"
                    />
                    <SortableTh 
                        label="User" 
                        sortKey="userName" 
                        currentSort={sortConfig} onSort={handleSort} 
                        options={getUniqueValues('userName')}
                        selectedValues={filters.userName || []} onFilter={(v) => handleFilter('userName', v)}
                        className="whitespace-nowrap sticky top-0 bg-gray-50"
                    />
                    <SortableTh 
                        label="Role" 
                        sortKey="userRole" 
                        currentSort={sortConfig} onSort={handleSort} 
                        options={getUniqueValues('userRole')}
                        selectedValues={filters.userRole || []} onFilter={(v) => handleFilter('userRole', v)}
                        className="whitespace-nowrap sticky top-0 bg-gray-50"
                    />
                    <SortableTh 
                        label="Action" 
                        sortKey="action" 
                        currentSort={sortConfig} onSort={handleSort} 
                        options={getUniqueValues('action')}
                        selectedValues={filters.action || []} onFilter={(v) => handleFilter('action', v)}
                        className="whitespace-nowrap sticky top-0 bg-gray-50"
                    />
                    <th className="px-4 py-3 font-semibold text-gray-700 text-xs uppercase tracking-wider sticky top-0 bg-gray-50">Details</th>
                    <th className="px-4 py-3 font-semibold text-gray-700 text-xs uppercase tracking-wider sticky top-0 bg-gray-50 text-right">IP Address</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                  {filteredLogs.map(log => (
                     <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                           {new Date(log.timestamp).toLocaleDateString()} <span className="text-xs text-gray-400 ml-1">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">{log.userName}</td>
                        <td className="px-4 py-3">
                           <span className="px-2 py-0.5 rounded text-xs border bg-gray-100 text-gray-600 border-gray-200">
                              {log.userRole}
                           </span>
                        </td>
                        <td className="px-4 py-3 text-brand-600 font-medium">{log.action}</td>
                        <td className="px-4 py-3 text-gray-600">{log.details}</td>
                        <td className="px-4 py-3 text-right text-gray-400 font-mono text-xs">{log.ipAddress || '-'}</td>
                     </tr>
                  ))}
                  {filteredLogs.length === 0 && (
                     <tr><td colSpan={6} className="p-8 text-center text-gray-500">No logs found matching criteria.</td></tr>
                  )}
               </tbody>
             </table>
          </div>
       </div>
    </div>
  );
};

export default SystemLogs;
