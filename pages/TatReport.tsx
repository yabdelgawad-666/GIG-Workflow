import React, { useEffect, useState } from 'react';
import { appService } from '../services/appService';
import { QRF, QRFStatus, QRFType } from '../types';
import { Clock, CheckCircle, XCircle, BarChart3, TrendingUp, AlertTriangle, User, Building, Activity, Heart, Building2, Banknote } from 'lucide-react';

const DateCell = ({ dateStr }: { dateStr?: string }) => {
  if (!dateStr) return <span className="text-gray-300">-</span>;
  const d = new Date(dateStr);
  return (
    <div className="flex flex-col">
      <span className="font-medium text-gray-900">{d.toLocaleDateString()}</span>
      <span className="text-[10px] text-gray-400 uppercase">{d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
    </div>
  );
};

const UserCell = ({ name }: { name?: string }) => {
  if (!name) return <span className="text-gray-300 italic">Unassigned</span>;
  return (
    <div className="flex flex-col">
      <span className="font-medium text-gray-900">{name}</span>
    </div>
  );
};

const TatReport: React.FC = () => {
  const [qrfs, setQrfs] = useState<QRF[]>([]);
  const [metrics, setMetrics] = useState({
    avgSubmissionToReview: 0, 
    avgReviewToDecision: 0, 
    totalAccepted: 0,
    totalRejected: 0,
  });
  const [rejectionReasons, setRejectionReasons] = useState<{ [key: string]: number }>({});
  
  const [typeMetrics, setTypeMetrics] = useState({
    MEDICAL: { total: 0, submitted: 0, cancelled: 0 },
    LIFE: { total: 0, submitted: 0, cancelled: 0 },
    PENSION: { total: 0, submitted: 0, cancelled: 0 },
    CREDIT: { total: 0, submitted: 0, cancelled: 0 },
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await appService.getQRFs();
    setQrfs(data);
    calculateMetrics(data);
  };

  const calculateMetrics = (data: QRF[]) => {
    let subToAssignedTotal: number = 0;
    let subToAssignedCount: number = 0;

    let assignedToDecidedTotal: number = 0;
    let assignedToDecidedCount: number = 0;

    let accepted: number = 0;
    let rejected: number = 0;
    const reasons: { [key: string]: number } = {};

    // Initialize type metrics
    const tMetrics = {
        MEDICAL: { total: 0, submitted: 0, cancelled: 0 },
        LIFE: { total: 0, submitted: 0, cancelled: 0 },
        PENSION: { total: 0, submitted: 0, cancelled: 0 },
        CREDIT: { total: 0, submitted: 0, cancelled: 0 },
    };

    data.forEach(q => {
      // General Metrics
      if (q.status === QRFStatus.APPROVED) accepted++;
      if (q.status === QRFStatus.REJECTED) {
        rejected++;
        const r = q.rejectionReason || 'Other';
        reasons[r] = (reasons[r] || 0) + 1;
      }

      if (q.submittedAt && q.assignedAt) {
        const sub = new Date(q.submittedAt).getTime();
        const ass = new Date(q.assignedAt).getTime();
        if (ass > sub) {
          subToAssignedTotal += (ass - sub);
          subToAssignedCount++;
        }
      }

      if (q.assignedAt && q.decidedAt) {
        const ass = new Date(q.assignedAt).getTime();
        const dec = new Date(q.decidedAt).getTime();
        if (dec > ass) {
          assignedToDecidedTotal += (dec - ass);
          assignedToDecidedCount++;
        }
      }

      // Type Metrics
      const types = q.types && q.types.length > 0 ? q.types : [QRFType.MEDICAL];
      types.forEach(t => {
        if (tMetrics[t]) {
            tMetrics[t].total++;
            if (q.status === QRFStatus.SUBMITTED) tMetrics[t].submitted++;
            if (q.status === QRFStatus.REJECTED) tMetrics[t].cancelled++;
        }
      });
    });

    setMetrics({
      avgSubmissionToReview: subToAssignedCount ? (subToAssignedTotal / subToAssignedCount) / (1000 * 60 * 60) : 0, 
      avgReviewToDecision: assignedToDecidedCount ? (assignedToDecidedTotal / assignedToDecidedCount) / (1000 * 60 * 60) : 0, 
      totalAccepted: accepted,
      totalRejected: rejected
    });

    setRejectionReasons(reasons);
    setTypeMetrics(tMetrics);
  };

  const formatHours = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)} mins`;
    return `${hours.toFixed(1)} hrs`;
  };

  return (
    <div className="space-y-8 animate-fade-in-down pb-12">
      <div className="flex items-center space-x-3 mb-6">
        <BarChart3 size={28} className="text-brand-600" />
        <div>
           <h2 className="text-2xl font-bold text-gray-900">TaT & Workflows Report</h2>
           <p className="text-gray-500 text-sm">Turnaround times and decision metrics</p>
        </div>
      </div>

      {/* OVERALL METRICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-full">
           <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Avg. Assign Time</p>
            <div className="flex items-center mt-2">
                <Clock size={24} className="text-blue-500 mr-2"/>
                <span className="text-3xl font-bold text-gray-900">{formatHours(metrics.avgSubmissionToReview)}</span>
            </div>
           </div>
           <p className="text-xs text-gray-400 mt-3 border-t border-gray-50 pt-2">Submission to Underwriter</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-full">
           <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Avg. Decision Time</p>
            <div className="flex items-center mt-2">
                <Clock size={24} className="text-indigo-500 mr-2"/>
                <span className="text-3xl font-bold text-gray-900">{formatHours(metrics.avgReviewToDecision)}</span>
            </div>
           </div>
           <p className="text-xs text-gray-400 mt-3 border-t border-gray-50 pt-2">Review to Decision</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-full">
           <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Accepted QRFs</p>
            <div className="flex items-center mt-2">
                <CheckCircle size={24} className="text-green-500 mr-2"/>
                <span className="text-3xl font-bold text-gray-900">{metrics.totalAccepted}</span>
            </div>
           </div>
           <div className="w-full bg-gray-100 rounded-full h-1.5 mt-3">
               <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '100%' }}></div>
           </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-full">
           <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Rejected QRFs</p>
            <div className="flex items-center mt-2">
                <XCircle size={24} className="text-red-500 mr-2"/>
                <span className="text-3xl font-bold text-gray-900">{metrics.totalRejected}</span>
            </div>
           </div>
           <div className="w-full bg-gray-100 rounded-full h-1.5 mt-3">
               <div className="bg-red-500 h-1.5 rounded-full" style={{ width: '100%' }}></div>
           </div>
        </div>
      </div>

      {/* TYPE METRICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         {/* Medical */}
         <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover:border-blue-200 transition-colors">
            <div>
               <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Medical</p>
               <span className="text-3xl font-bold text-gray-900 block mt-1">{typeMetrics.MEDICAL.total}</span>
               <div className="text-xs text-gray-400 mt-2 flex items-center space-x-2">
                  <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-blue-500 mr-1"></span>{typeMetrics.MEDICAL.submitted} Submitted</span>
                  <span className="text-gray-300">|</span>
                  <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-red-400 mr-1"></span>{typeMetrics.MEDICAL.cancelled} Rejected</span>
               </div>
            </div>
            <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
               <Activity size={24} />
            </div>
         </div>

         {/* Life */}
         <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover:border-red-200 transition-colors">
            <div>
               <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Life</p>
               <span className="text-3xl font-bold text-gray-900 block mt-1">{typeMetrics.LIFE.total}</span>
               <div className="text-xs text-gray-400 mt-2 flex items-center space-x-2">
                  <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-blue-500 mr-1"></span>{typeMetrics.LIFE.submitted} Submitted</span>
                  <span className="text-gray-300">|</span>
                  <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-red-400 mr-1"></span>{typeMetrics.LIFE.cancelled} Rejected</span>
               </div>
            </div>
            <div className="p-3 bg-red-100 text-red-600 rounded-full">
               <Heart size={24} />
            </div>
         </div>

         {/* Pension */}
         <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover:border-green-200 transition-colors">
            <div>
               <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Pension</p>
               <span className="text-3xl font-bold text-gray-900 block mt-1">{typeMetrics.PENSION.total}</span>
               <div className="text-xs text-gray-400 mt-2 flex items-center space-x-2">
                  <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-blue-500 mr-1"></span>{typeMetrics.PENSION.submitted} Submitted</span>
                  <span className="text-gray-300">|</span>
                  <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-red-400 mr-1"></span>{typeMetrics.PENSION.cancelled} Rejected</span>
               </div>
            </div>
            <div className="p-3 bg-green-100 text-green-600 rounded-full">
               <Building2 size={24} />
            </div>
         </div>

         {/* Credit */}
         <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover:border-purple-200 transition-colors">
            <div>
               <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Credit</p>
               <span className="text-3xl font-bold text-gray-900 block mt-1">{typeMetrics.CREDIT.total}</span>
               <div className="text-xs text-gray-400 mt-2 flex items-center space-x-2">
                  <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-blue-500 mr-1"></span>{typeMetrics.CREDIT.submitted} Submitted</span>
                  <span className="text-gray-300">|</span>
                  <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-red-400 mr-1"></span>{typeMetrics.CREDIT.cancelled} Rejected</span>
               </div>
            </div>
            <div className="p-3 bg-purple-100 text-purple-600 rounded-full">
               <Banknote size={24} />
            </div>
         </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
         <div className="flex items-center mb-6">
            <AlertTriangle size={20} className="text-red-500 mr-2" />
            <h3 className="font-bold text-gray-800 text-lg">Rejection Analysis</h3>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {Object.entries(rejectionReasons).map(([reason, count], idx) => {
                const percentage = Math.round(((count as number) / metrics.totalRejected) * 100) || 0;
                const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-purple-500'];
                const color = colors[idx % colors.length];

                return (
                    <div key={reason} className="flex flex-col">
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-sm font-medium text-gray-700">{reason}</span>
                            <span className="text-2xl font-bold text-gray-900">{count as number}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                            <div className={`h-full rounded-full ${color}`} style={{ width: `${percentage}%` }}></div>
                        </div>
                        <p className="text-xs text-gray-400 mt-2 text-right">{percentage}% of rejections</p>
                    </div>
                );
            })}
            {Object.keys(rejectionReasons).length === 0 && (
                <p className="text-gray-400 text-sm italic col-span-4">No rejections recorded yet.</p>
            )}
         </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
         <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
           <h3 className="font-bold text-gray-800 flex items-center">
             <TrendingUp size={18} className="mr-2 text-gray-500" />
             Detailed Transaction Logs
           </h3>
           <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">{qrfs.length} Records</span>
         </div>
         <div className="overflow-x-auto">
           <table className="w-full text-left text-sm whitespace-nowrap">
             <thead className="bg-white text-gray-500 border-b border-gray-100 text-xs uppercase tracking-wider">
               <tr>
                 <th className="px-6 py-3 font-medium">Ref #</th>
                 <th className="px-6 py-3 font-medium">eQRF</th>
                 <th className="px-6 py-3 font-medium">Account</th>
                 <th className="px-6 py-3 font-medium">Submitted On</th>
                 <th className="px-6 py-3 font-medium">Submitted By</th>
                 <th className="px-6 py-3 font-medium">Assigned To</th>
                 <th className="px-6 py-3 font-medium">Assigned On</th>
                 <th className="px-6 py-3 font-medium">Status</th>
                 <th className="px-6 py-3 font-medium">Reason</th>
                 <th className="px-6 py-3 font-medium">Reviewed On</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-50">
               {qrfs.map(q => (
                 <tr key={q.id} className="hover:bg-gray-50">
                   <td className="px-6 py-4 text-xs font-mono font-bold text-gray-500">{q.referenceNumber || '-'}</td>
                   <td className="px-6 py-4 font-medium text-gray-900">{q.name}</td>
                   <td className="px-6 py-4 text-gray-600">{q.data.accountName}</td>
                   <td className="px-6 py-4"><DateCell dateStr={q.submittedAt} /></td>
                   <td className="px-6 py-4"><UserCell name={q.agentName} /></td>
                   <td className="px-6 py-4"><UserCell name={q.assignedToName} /></td>
                   <td className="px-6 py-4"><DateCell dateStr={q.assignedAt} /></td>
                   <td className="px-6 py-4">
                     <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                       q.status === 'APPROVED' ? 'bg-green-50 text-green-700 border-green-100' :
                       q.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-100' :
                       q.status === 'SUBMITTED' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                       'bg-gray-50 text-gray-600 border-gray-100'
                     }`}>
                       {q.status}
                     </span>
                   </td>
                   <td className="px-6 py-4 text-xs text-red-500">{q.rejectionReason || '-'}</td>
                   <td className="px-6 py-4"><DateCell dateStr={q.decidedAt} /></td>
                 </tr>
               ))}
             </tbody>
           </table>
         </div>
      </div>
    </div>
  );
};

export default TatReport;