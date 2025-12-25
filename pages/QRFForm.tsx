
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, Send, AlertCircle, CheckCircle, Lock, UploadCloud, File, Trash2, Paperclip, ThumbsUp, ThumbsDown, AlertTriangle, X, Activity, Heart, Building2, Banknote, ShieldCheck, Calendar, Clock, Unlock, User as UserIcon, CheckSquare, FileCheck, Info } from 'lucide-react';
import { QRFData, QRFStatus, User, CategoryValues, UserRole, Attachment, QRFType, SectionConfig } from '../types';
import { MEDICAL_SECTIONS, LIFE_SECTIONS, PENSION_SECTIONS, CREDIT_SECTIONS } from '../constants';
import { appService } from '../services/appService';
import Button from '../components/Button';

interface QRFFormProps {
  user: User;
}

const INSURER_OPTIONS = [
  'Option 1: Al Mohandes', 'Option 2: Allianz', 'Option 3: Arope', 'Option 4: AXA', 'Option 5: Axon',
  'Option 6: Chubb', 'Option 7: Delta', 'Option 8: EGY Care', 'Option 9: Egyptian Saudi House',
  'Option 10: Egyptian Takaful Insurance', 'Option 11: KAF', 'Option 12: Libano-Suiss', 'Option 13: Mada',
  'Option 14: Medright', 'Option 15: MetLife', 'Option 16: Misr Insurance', 'Option 17: Misr Takafoul',
  'Option 18: Next Care', 'Option 19: Omega', 'Option 20: Orient', 'Option 21: QNB', 'Option 22: Royal',
  'Option 23: Salama', 'Option 24: Sarwa', 'Option 25: Sigma', 'Option 26: SMART', 'Option 27: Vigin', 'Option 28: Wethaq'
];

const REQUESTED_BENEFITS_OPTIONS = ['Option 1: Current Options', 'Option 2: Requested Options'];
const REJECTION_REASONS = ['Missing data', 'Missing documents', 'Wrong Data', 'Other'];

const INITIAL_DATA: QRFData = {
  accountName: '', brokerName: '', brokerCode: '', quoteDate: new Date().toISOString().split('T')[0],
  existingInsurer: '', natureOfBusiness: '', requestedBenefits: 'Option 1: Current Options', countMembers: '',
  countCategories: '3', additionalNotes: '', showAdditionalBenefits: false, attachments: [], proposalAttachments: [],
};

const InputGroup = ({ label, value, onChange, type = "text", placeholder, error, required = false, disabled = false }: any) => (
  <div className="flex flex-col">
    <label className="text-xs font-semibold text-gray-700 mb-1 flex items-center">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    {type === 'textarea' ? (
      <textarea 
        value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} disabled={disabled}
        className={`px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all h-24 resize-none ${error ? 'border-red-500' : 'border-gray-300'} ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
      />
    ) : (
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} disabled={disabled}
        className={`px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all ${error ? 'border-red-500' : 'border-gray-300'} ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
      />
    )}
    {error && <span className="text-xs text-red-500 mt-1">Required</span>}
  </div>
);

const SelectGroup = ({ label, value, onChange, options, error, required = false, disabled = false }: any) => (
  <div className="flex flex-col">
    <label className="text-xs font-semibold text-gray-700 mb-1 flex items-center">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <select
      value={value} onChange={e => onChange(e.target.value)} disabled={disabled}
      className={`px-3 py-2 bg-white border rounded-md text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all ${error ? 'border-red-500' : 'border-gray-300'} ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
    >
      <option value="">Select Option</option>
      {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
    </select>
    {error && <span className="text-xs text-red-500 mt-1">Required</span>}
  </div>
);

const QRFForm: React.FC<QRFFormProps> = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const proposalFileInputRef = useRef<HTMLInputElement>(null);
  
  // Basic State
  const [qrfName, setQrfName] = useState('');
  const [qrfRefNumber, setQrfRefNumber] = useState('');
  const [qrfStatus, setQrfStatus] = useState<QRFStatus>(QRFStatus.DRAFT);
  const [activeTypes, setActiveTypes] = useState<QRFType[]>([QRFType.MEDICAL]);
  const [currentTab, setCurrentTab] = useState<string>(QRFType.MEDICAL);
  const [rejectionInfo, setRejectionInfo] = useState<{reason?: string, note?: string}>({});
  const [metadata, setMetadata] = useState<{ 
      submittedAt?: string; 
      assignedToName?: string; 
      assignedToId?: string; 
      assignedAt?: string; 
      agentName?: string; 
      agentId?: string; 
      decidedAt?: string;
      unassignedBy?: string;
      previousAssignedToName?: string;
  }>({});
  const [isLocked, setIsLocked] = useState(false);
  const [isResubmission, setIsResubmission] = useState(false);
  
  // Data State
  const [formData, setFormData] = useState<QRFData>(INITIAL_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: boolean }>({});
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorPopupMessage, setErrorPopupMessage] = useState('');
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showUnlockSuccess, setShowUnlockSuccess] = useState(false);
  
  // Modals
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRejectionReason, setSelectedRejectionReason] = useState('');
  const [rejectionNote, setRejectionNote] = useState('');

  // Role Checks
  const isUwUser = user.role === UserRole.UNDERWRITER || user.role === UserRole.UW_ADMIN;
  
  // Is current user the assigned underwriter?
  const isAssignedUw = isUwUser && metadata.assignedToId === user.id;

  // --- READ-ONLY LOGIC ---
  // If no ID is present, it's a new form, so current user is owner.
  // We use `!id` OR check against metadata.
  const isOwner = !id || metadata.agentId === user.id;
  const isApproved = qrfStatus === QRFStatus.APPROVED;
  
  // Permissions Logic:
  // 1. Owner can edit if Draft or Rejected (Regardless of role, e.g. Admin testing as agent)
  // 2. Assigned Underwriter can edit if Submitted (for corrections/review)
  const canEdit = 
    (!isApproved) && (
        (isOwner && (qrfStatus === QRFStatus.DRAFT || qrfStatus === QRFStatus.REJECTED)) ||
        (isUwUser && isAssignedUw && qrfStatus === QRFStatus.SUBMITTED)
    );
    
  const isReadOnly = !canEdit;

  // Determine if Proposal Tab should be visible
  const showProposalTab = 
    (isUwUser && (qrfStatus === QRFStatus.SUBMITTED || qrfStatus === QRFStatus.APPROVED)) || 
    (qrfStatus === QRFStatus.APPROVED) || 
    (user.role === UserRole.SUPER_ADMIN);

  // Derived UI
  const [categoryColumns, setCategoryColumns] = useState<string[]>(['0', '1', '2']);

  useEffect(() => {
    if (id) {
      loadQRF(id);
    } else if (location.state && location.state.types) {
      // New creation with passed types
      setActiveTypes(location.state.types);
      setCurrentTab(location.state.types[0]);
      
      // Handle Initial Data from CRM
      if (location.state.initialData) {
          setFormData(prev => ({
              ...prev,
              ...location.state.initialData
          }));
          
          if (location.state.initialData.accountName) {
              setQrfName(`${location.state.initialData.accountName} - QRF`);
          }
      }

      // Explicitly set metadata for the current user as creator to ensure UI reflects ownership immediately
      setMetadata({
          agentId: user.id,
          agentName: user.fullName,
          createdAt: new Date().toISOString()
      });
    }
  }, [id, location.state]);

  useEffect(() => {
    const count = parseInt(formData.countCategories) || 1;
    const safeCount = Math.max(1, Math.min(count, 10));
    setCategoryColumns(Array.from({ length: safeCount }, (_, i) => i.toString()));
  }, [formData.countCategories]);

  const loadQRF = async (qrfId: string) => {
    const qrf = (await appService.getQRFs()).find(q => q.id === qrfId);
    if (qrf) {
      setQrfName(qrf.name);
      setQrfRefNumber(qrf.referenceNumber || '');
      setFormData(qrf.data);
      setQrfStatus(qrf.status);
      setMetadata({ 
          submittedAt: qrf.submittedAt, 
          assignedToName: qrf.assignedToName, 
          assignedToId: qrf.assignedToId,
          assignedAt: qrf.assignedAt, 
          agentName: qrf.agentName,
          agentId: qrf.agentId,
          decidedAt: qrf.decidedAt,
          unassignedBy: qrf.unassignedBy,
          previousAssignedToName: qrf.previousAssignedToName
      });
      setIsLocked(!!qrf.isLocked);
      if (qrf.types && qrf.types.length > 0) {
        setActiveTypes(qrf.types);
        setCurrentTab(qrf.types[0]);
      }
      if (qrf.rejectionReason) {
        setRejectionInfo({ reason: qrf.rejectionReason, note: qrf.rejectionNote });
      }
      
      // Determine Resubmission status based on history
      if (qrf.status === QRFStatus.REJECTED || (qrf.history && qrf.history.length > 0 && qrf.status !== QRFStatus.APPROVED)) {
          setIsResubmission(true);
      }

      // Auto-Lock Logic: If viewing as the assigned underwriter and not locked, lock it.
      if (isUwUser && qrf.assignedToId === user.id && !qrf.isLocked && qrf.status === QRFStatus.SUBMITTED) {
         await appService.toggleLock(qrf.id, true);
         setIsLocked(true);
      }
    }
  };

  const getReadOnlyMessage = () => {
      if (qrfStatus === QRFStatus.SUBMITTED) {
          if (!metadata.assignedToName && metadata.unassignedBy && metadata.previousAssignedToName) {
              return `This eQRF needs to be re-assigned. It was previously assigned to ${metadata.previousAssignedToName} and has been un-assigned`;
          }
          if (metadata.assignedToName) return "This eQRF cannot be edited in its current state. Currently under review by " + metadata.assignedToName;
          return "This eQRF cannot be edited in its current state. Waiting for an underwriter to be assigned.";
      }
      if (qrfStatus === QRFStatus.APPROVED) {
          return "eQRF Approved. Process Complete.";
      }
      return "Requires Attention.";
  };

  const handleBack = () => {
    if (window.history.length > 2) {
        navigate(-1);
    } else {
        if (user.role === UserRole.AGENT) {
            navigate('/agent');
        } else if (user.role === UserRole.UNDERWRITER) {
            navigate('/underwriter');
        } else {
            navigate('/manager/qrfs');
        }
    }
  };

  const handleUnlock = async () => {
    if (!id) return;
    setIsSaving(true);
    try {
        await appService.toggleLock(id, false);
        setIsLocked(false);
        setShowUnlockSuccess(true);
        setTimeout(() => setShowUnlockSuccess(false), 3000);
    } catch (e) {
        console.error(e);
    } finally {
        setIsSaving(false);
    }
  };

  const calculateTaT = () => {
      if (!metadata.submittedAt) return null;
      const start = new Date(metadata.submittedAt).getTime();
      let end = new Date().getTime();
      if (metadata.decidedAt) {
          end = new Date(metadata.decidedAt).getTime();
      } else if (metadata.assignedAt) {
          end = new Date(metadata.assignedAt).getTime();
      }
      
      const diff = Math.max(0, end - start);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      return { days };
  };

  const tat = calculateTaT();

  const handleInputChange = (key: string, value: any) => {
    if (isReadOnly) return;
    setFormData(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: false }));
  };

  const handleCategoryChange = (rowKey: string, colIndex: string, value: string) => {
    if (isReadOnly) return;
    setFormData(prev => {
      const currentRow = (prev[rowKey] as CategoryValues) || {};
      return { ...prev, [rowKey]: { ...currentRow, [`col${colIndex}`]: value } };
    });
  };

  const getCategoryValue = (rowKey: string, colIndex: string): string => {
    const row = formData[rowKey] as CategoryValues;
    return row ? row[`col${colIndex}`] || '' : '';
  };

  // --- FILE UPLOAD (General) ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) return;
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const newAttachments = await processFiles(files);
    setFormData(prev => ({ ...prev, attachments: [...(prev.attachments || []), ...newAttachments] }));
    if (errors['attachments']) setErrors(prev => ({ ...prev, attachments: false }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- PROPOSAL FILE UPLOAD ---
  const handleProposalUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const newAttachments = await processFiles(files);
    setFormData(prev => ({ ...prev, proposalAttachments: [...(prev.proposalAttachments || []), ...newAttachments] }));
    if (errors['proposalAttachments']) setErrors(prev => ({ ...prev, proposalAttachments: false }));
    if (proposalFileInputRef.current) proposalFileInputRef.current.value = '';
  };

  const processFiles = async (files: FileList): Promise<Attachment[]> => {
    const newAttachments: Attachment[] = [];
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
        });
        newAttachments.push({
            id: `att_${Date.now()}_${i}`,
            name: file.name,
            size: file.size,
            type: file.type,
            uploadedAt: new Date().toISOString(),
            data: base64
        });
    }
    return newAttachments;
  };

  const removeAttachment = (attachmentId: string) => {
    if (isReadOnly) return;
    setFormData(prev => ({ ...prev, attachments: prev.attachments.filter(a => a.id !== attachmentId) }));
  };

  const removeProposalAttachment = (attachmentId: string) => {
    setFormData(prev => ({ ...prev, proposalAttachments: (prev.proposalAttachments || []).filter(a => a.id !== attachmentId) }));
  };

  // --- VALIDATION & SAVE ---
  const validateForm = () => {
    const newErrors: { [key: string]: boolean } = {};
    let isValid = true;
    
    if (!qrfName) { newErrors['qrfName'] = true; isValid = false; }
    if (!formData.attachments || formData.attachments.length === 0) {
      newErrors['attachments'] = true;
      isValid = false;
    }
    if (activeTypes.includes(QRFType.MEDICAL)) {
       const req = ['accountName', 'quoteDate', 'existingInsurer', 'natureOfBusiness', 'countMembers'];
       req.forEach(f => { if (!formData[f]) { newErrors[f] = true; isValid = false; }});
    }
    setErrors(newErrors);
    return isValid;
  };

  const handleSave = async (status: QRFStatus) => {
    // Determine if user is allowed to save updates (even in "read-only" context like assigned UW, we might save edits)
    // Actually, canEdit handles this.
    if (!canEdit) return;

    if (status === QRFStatus.SUBMITTED && !validateForm()) {
      setErrorPopupMessage('Please fill required fields and upload attachments.');
      setShowErrorPopup(true);
      return;
    }
    if (status === QRFStatus.SUBMITTED) setIsSubmitting(true); else setIsSaving(true);

    try {
      const isResubmissionAction = qrfStatus === QRFStatus.REJECTED && status === QRFStatus.SUBMITTED;
      await appService.saveQRF({
        id: id || `q${Date.now()}`,
        referenceNumber: qrfRefNumber,
        name: qrfName || 'Untitled QRF',
        types: activeTypes,
        agentId: user.id,
        agentName: user.fullName,
        status,
        createdAt: id ? (await appService.getQRFs()).find(q => q.id === id)?.createdAt || new Date().toISOString() : new Date().toISOString(),
        submittedAt: status === QRFStatus.SUBMITTED ? new Date().toISOString() : undefined,
        rejectionReason: isResubmissionAction ? undefined : rejectionInfo.reason as any,
        rejectionNote: isResubmissionAction ? undefined : rejectionInfo.note,
        isLocked: isLocked, // Preserve locked state
        data: formData
      });
      if (status === QRFStatus.SUBMITTED) setShowSuccessPopup(true);
      else if (!id) navigate('/agent');
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false); setIsSaving(false);
    }
  };

  const handleUnderwriterAction = async (action: 'APPROVE' | 'REJECT') => {
    if (!id) return;
    
    if (action === 'APPROVE') {
        if (!formData.proposalAttachments || formData.proposalAttachments.length === 0) {
            setErrorPopupMessage('You must upload a Final Proposal document before approving.');
            setShowErrorPopup(true);
            setCurrentTab('PROPOSAL');
            return;
        }
    }

    setIsSubmitting(true);
    try {
      const currentQrf = (await appService.getQRFs()).find(q => q.id === id);
      if(!currentQrf) return;
      
      const updatedData = { ...formData };
      
      if (action === 'APPROVE') {
        await appService.saveQRF({ 
            ...currentQrf, 
            status: QRFStatus.APPROVED, 
            isLocked: false,
            data: updatedData
        });
        navigate('/underwriter');
      } else {
        await appService.saveQRF({
          ...currentQrf,
          status: QRFStatus.REJECTED,
          isLocked: false,
          rejectionReason: selectedRejectionReason as any,
          rejectionNote: rejectionNote,
          data: updatedData
        });
        navigate('/underwriter');
      }
    } catch (e) { console.error(e); } finally { setIsSubmitting(false); }
  };

  // ... (renderMedicalForm, renderDynamicForm, renderProposalTab - Reused exactly as is)
  const renderMedicalForm = () => (
    <>
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 border-b border-gray-200">
          <InputGroup label="Account Name" value={formData.accountName} onChange={(v: string) => handleInputChange('accountName', v)} required error={errors.accountName} disabled={isReadOnly} />
          <InputGroup label="Broker Name" value={formData.brokerName} onChange={(v: string) => handleInputChange('brokerName', v)} disabled={isReadOnly} />
          <InputGroup label="Broker Code" value={formData.brokerCode} onChange={(v: string) => handleInputChange('brokerCode', v)} disabled={isReadOnly} />
          <InputGroup label="Quote / Renewal Date" type="date" value={formData.quoteDate} onChange={(v: string) => handleInputChange('quoteDate', v)} required error={errors.quoteDate} disabled={isReadOnly} />
          <SelectGroup label="Existing Insurer" options={INSURER_OPTIONS} value={formData.existingInsurer} onChange={(v: string) => handleInputChange('existingInsurer', v)} required error={errors.existingInsurer} disabled={isReadOnly} />
          <InputGroup label="Nature of Business" value={formData.natureOfBusiness} onChange={(v: string) => handleInputChange('natureOfBusiness', v)} required error={errors.natureOfBusiness} disabled={isReadOnly} />
          <SelectGroup label="Requested Benefits" options={REQUESTED_BENEFITS_OPTIONS} value={formData.requestedBenefits} onChange={(v: string) => handleInputChange('requestedBenefits', v)} disabled={isReadOnly} />
          <div className="grid grid-cols-2 gap-4">
            <InputGroup label="Members" type="number" value={formData.countMembers} onChange={(v: string) => handleInputChange('countMembers', v)} required error={errors.countMembers} disabled={isReadOnly} />
            <InputGroup label="Categories" type="number" value={formData.countCategories} onChange={(v: string) => handleInputChange('countCategories', v)} disabled={isReadOnly} />
          </div>
      </div>
      <div className="px-6 py-4">
         <InputGroup label="Additional Notes" type="textarea" value={formData.additionalNotes} onChange={(v: string) => handleInputChange('additionalNotes', v)} disabled={isReadOnly} />
      </div>
      {MEDICAL_SECTIONS.map(section => (
        <div key={section.id} className="border-t border-gray-200">
          <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex justify-between items-center">
             <div><h3 className="text-sm font-bold text-gray-900 uppercase">{section.title}</h3>{section.arabicTitle && <p className="text-xs text-gray-500 font-arabic text-right">{section.arabicTitle}</p>}</div>
             {section.id === 'additional' && (
                <div className="flex items-center">
                   <input type="checkbox" checked={formData.showAdditionalBenefits} onChange={(e) => handleInputChange('showAdditionalBenefits', e.target.checked)} disabled={isReadOnly} className="mr-2" />
                   <label className="text-sm text-gray-700">Include</label>
                </div>
             )}
          </div>
          {(section.id !== 'additional' || formData.showAdditionalBenefits) && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead><tr className="bg-gray-100 text-gray-600 border-b border-gray-200"><th className="px-6 py-3 font-medium w-1/3 min-w-[300px]">Benefit</th>{categoryColumns.map((col, idx) => <th key={col} className="px-6 py-3 font-medium min-w-[200px]">Cat {idx + 1}</th>)}</tr></thead>
                <tbody className="divide-y divide-gray-100">{section.rows.map(row => (
                  <tr key={row.key} className="hover:bg-gray-50">
                    <td className="px-6 py-3 bg-white border-r border-gray-100"><div><span className="font-medium text-gray-900">{row.label}</span>{row.arabicLabel && <span className="text-xs text-gray-500 block font-arabic text-right">{row.arabicLabel}</span>}</div></td>
                    {categoryColumns.map(col => <td key={`${row.key}-${col}`} className="px-4 py-2">{row.fixedValue ? <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded text-center italic">{row.fixedValue}</div> : row.type === 'select' ? <select className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" value={getCategoryValue(row.key, col)} onChange={e => handleCategoryChange(row.key, col, e.target.value)} disabled={isReadOnly}><option value="">Select...</option>{row.options?.map(o => <option key={o} value={o}>{o}</option>)}</select> : <div className="relative"><input type="text" className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm" value={getCategoryValue(row.key, col)} onChange={e => handleCategoryChange(row.key, col, e.target.value)} disabled={isReadOnly} placeholder={row.type==='percent'?'%':''} />{row.type==='percent'&&<span className="absolute right-3 top-1.5 text-gray-400">%</span>}</div>}</td>)}
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </>
  );

  const renderDynamicForm = (sections: SectionConfig[]) => (
    <div className="p-6">
       {sections.map(section => (
         <div key={section.id} className="mb-8 border border-gray-200 rounded-lg overflow-hidden">
             <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 font-bold text-gray-800 text-sm uppercase">{section.title}</div>
             <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {section.rows.map(row => (
                  <div key={row.key} className={row.type === 'textarea' ? 'col-span-full' : ''}>
                     {row.type === 'select' ? (
                       <SelectGroup label={row.label} value={formData[row.key]} onChange={(v:string) => handleInputChange(row.key, v)} options={row.options || []} disabled={isReadOnly} />
                     ) : (
                       <InputGroup label={row.label} type={row.type} value={formData[row.key]} onChange={(v:string) => handleInputChange(row.key, v)} disabled={isReadOnly} />
                     )}
                  </div>
                ))}
             </div>
         </div>
       ))}
       <div className="border border-gray-200 rounded-lg overflow-hidden mb-8">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 font-bold text-gray-800 text-sm uppercase">Historical Data (Last 5 Years)</div>
          <div className="overflow-x-auto p-4">
             <table className="w-full text-xs text-left border border-gray-200">
               <thead>
                 <tr className="bg-gray-100"><th className="p-2 border">Year</th><th className="p-2 border">Policy No</th><th className="p-2 border">Claims Count</th><th className="p-2 border">Claims Amount</th></tr>
               </thead>
               <tbody>
                 {[1,2,3,4,5].map(i => (
                   <tr key={i}>
                     <td className="p-2 border font-medium">Year {i}</td>
                     <td className="p-2 border"><input className="w-full bg-transparent outline-none" placeholder="Policy..." disabled={isReadOnly}/></td>
                     <td className="p-2 border"><input className="w-full bg-transparent outline-none" placeholder="0" type="number" disabled={isReadOnly}/></td>
                     <td className="p-2 border"><input className="w-full bg-transparent outline-none" placeholder="0.00" type="number" disabled={isReadOnly}/></td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
       </div>
    </div>
  );

  const renderProposalTab = () => (
    <div className="p-6">
      <div className="bg-white border rounded-lg p-6 text-center">
         <h3 className="text-lg font-bold text-gray-900 mb-2">Final Proposal Documents</h3>
         <p className="text-sm text-gray-500 mb-6">Upload the final proposal document(s) for the client here.</p>
         
         {!isReadOnly && (
            <div className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer mb-6 ${errors.proposalAttachments ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-brand-500 hover:bg-brand-50'}`} onClick={()=>proposalFileInputRef.current?.click()}>
                <input type="file" ref={proposalFileInputRef} className="hidden" multiple onChange={handleProposalUpload} />
                <UploadCloud size={40} className={`mx-auto ${errors.proposalAttachments?'text-red-400':'text-brand-400'}`}/>
                <p className="mt-2 text-sm font-medium">Click to upload proposal documents</p>
            </div>
         )}

         {formData.proposalAttachments && formData.proposalAttachments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
                {formData.proposalAttachments.map(f => (
                    <div key={f.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                    <div className="flex items-center overflow-hidden"><div className="p-2 bg-green-100 text-green-600 rounded mr-3"><FileCheck size={18}/></div><div className="truncate"><p className="text-sm font-medium truncate">{f.name}</p><p className="text-xs text-gray-500">{(f.size/1024).toFixed(0)} KB</p></div></div>
                    {!isReadOnly && <button onClick={()=>removeProposalAttachment(f.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={16}/></button>}
                    </div>
                ))}
            </div>
         ) : (
             <div className="text-gray-400 text-sm italic">No proposal documents uploaded yet.</div>
         )}
      </div>
    </div>
  );

  return (
    <div className="pb-20 relative">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
              <button onClick={handleBack} className="mr-4 text-gray-500 hover:text-gray-700"><ArrowLeft size={24} /></button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  {id ? (isUwUser ? 'Review eQRF' : (qrfStatus === QRFStatus.REJECTED ? 'Fix & Resubmit' : 'Edit eQRF')) : 'New eQRF'}
                  {qrfRefNumber && <span className="ml-3 text-sm font-mono text-gray-500 font-normal">({qrfRefNumber})</span>}
                  <span className="ml-3 flex space-x-1">
                      {activeTypes.map(t => (
                        <span key={t} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full border border-blue-200">{t === QRFType.MEDICAL ? 'Medi-Life' : t}</span>
                      ))}
                  </span>
                </h1>
              </div>
          </div>
          <div className="flex space-x-3">
              {/* Agent Actions - Conditional on Edit Rights */}
              {!isReadOnly && !isUwUser && (
                <>
                  <Button variant="outline" onClick={() => handleSave(QRFStatus.DRAFT)} isLoading={isSaving}>
                    <Save size={18} className="mr-2" />
                    Save Draft
                  </Button>
                  <Button onClick={() => handleSave(QRFStatus.SUBMITTED)} isLoading={isSubmitting}>
                    <Send size={18} className="mr-2" />
                    {isResubmission ? 'Re-Submit' : 'Submit'}
                  </Button>
                </>
              )}
              
              {/* Underwriter Edit Actions (If needed, they could save changes) */}
              {canEdit && isUwUser && (
                 <Button variant="outline" onClick={() => handleSave(QRFStatus.SUBMITTED)} isLoading={isSaving}>
                    <Save size={18} className="mr-2" />
                    Save Changes
                 </Button>
              )}
              
              {/* Unlock for Owner if Locked */}
              {isOwner && isLocked && qrfStatus === QRFStatus.SUBMITTED && (
                  <Button variant="secondary" onClick={handleUnlock} isLoading={isSaving} className="ml-2">
                      <Unlock size={18} className="mr-2" /> Unlock
                  </Button>
              )}
              
              {/* Underwriter Actions - Only Assigned UW can act */}
              {isAssignedUw && qrfStatus === QRFStatus.SUBMITTED && (
                  <>
                    {/* Only the assigned underwriter can unlock to allow re-assignment */}
                    {isLocked && metadata.assignedToName === user.fullName && (
                        <Button variant="secondary" onClick={handleUnlock} isLoading={isSaving}>
                            <Unlock size={18} className="mr-2" /> Unlock for Re-assign
                        </Button>
                    )}
                    <Button variant="danger" onClick={() => setShowRejectModal(true)}><ThumbsDown size={18} className="mr-2" />Reject</Button>
                    <Button className="bg-green-600" onClick={() => handleUnderwriterAction('APPROVE')}><ThumbsUp size={18} className="mr-2" />Approve</Button>
                  </>
              )}
          </div>
        </div>

        {id && (
           <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-wrap gap-6 items-center text-sm relative">
              <div className="flex flex-col">
                 <span className="text-xs text-gray-500 font-medium uppercase">Status</span>
                 <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border w-fit mt-1 ${
                    qrfStatus === 'APPROVED' ? 'bg-green-50 text-green-700 border-green-100' :
                    qrfStatus === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-100' :
                    qrfStatus === 'SUBMITTED' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                    'bg-gray-50 text-gray-600 border-gray-100'
                  }`}>
                    {qrfStatus === 'APPROVED' ? 'APPROVED' : qrfStatus}
                 </span>
              </div>
              
              {tat && (
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 font-medium uppercase">TaT</span>
                    <div className="mt-1">
                        <span className={`font-bold ${tat.days >= 5 ? 'text-red-600' : tat.days >= 2 ? 'text-amber-600' : 'text-gray-900'}`}>{tat.days} Days</span>
                    </div>
                  </div>
              )}

              <div className="flex flex-col">
                 <span className="text-xs text-gray-500 font-medium uppercase">Submitted By</span>
                 <span className="font-medium text-gray-900 mt-1 flex items-center">
                    <UserIcon size={14} className="mr-1 text-gray-400"/>
                    {metadata.agentName || 'Unknown'}
                 </span>
              </div>

              <div className="flex flex-col">
                 <span className="text-xs text-gray-500 font-medium uppercase">Submitted On</span>
                 <span className="font-medium text-gray-900 mt-1 flex items-center">
                    <Calendar size={14} className="mr-1 text-gray-400"/>
                    {metadata.submittedAt ? new Date(metadata.submittedAt).toLocaleDateString() : '-'}
                 </span>
              </div>

              <div className="flex flex-col">
                 <span className="text-xs text-gray-500 font-medium uppercase">Assigned Underwriter</span>
                 <span className="font-medium text-gray-900 mt-1 flex items-center">
                    <ShieldCheck size={14} className="mr-1 text-gray-400"/>
                    {metadata.assignedToName || 'Unassigned'}
                 </span>
              </div>
              
              <div className="flex flex-col">
                 <span className="text-xs text-gray-500 font-medium uppercase">Assigned On</span>
                 <span className="font-medium text-gray-900 mt-1 flex items-center">
                    <Clock size={14} className="mr-1 text-gray-400"/>
                    {metadata.assignedAt ? new Date(metadata.assignedAt).toLocaleDateString() : '-'}
                 </span>
              </div>

              {metadata.decidedAt && (
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 font-medium uppercase">Reviewed On</span>
                    <span className="font-medium text-gray-900 mt-1 flex items-center">
                        <CheckSquare size={14} className="mr-1 text-gray-400"/>
                        {new Date(metadata.decidedAt).toLocaleDateString()}
                    </span>
                  </div>
              )}

              {qrfStatus === QRFStatus.REJECTED && rejectionInfo.reason && (
                  <div className="flex flex-col border-l border-gray-200 pl-6 ml-2">
                     <span className="text-xs text-red-500 font-medium uppercase">Rejection Reason</span>
                     <span className="font-medium text-red-700 mt-1">{rejectionInfo.reason}</span>
                     {rejectionInfo.note && <span className="text-xs text-gray-500 mt-1 max-w-xs truncate" title={rejectionInfo.note}>{rejectionInfo.note}</span>}
                  </div>
              )}
              {isLocked && (
                  <div className="absolute right-4 top-4 flex items-center bg-red-50 text-red-700 px-3 py-1 rounded-full border border-red-100 text-xs font-bold">
                      <Lock size={12} className="mr-1" />
                      LOCKED
                  </div>
              )}
           </div>
        )}
      </div>

      {/* Popups & Modals */}
      {showErrorPopup && <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"><div className="bg-white p-6 rounded-lg max-w-sm"><h3 className="text-lg font-bold text-red-600 mb-2 flex items-center"><AlertCircle className="mr-2"/> Error</h3><p className="mb-4">{errorPopupMessage || 'Please fill required fields and upload attachments.'}</p><Button onClick={()=>setShowErrorPopup(false)} className="w-full">OK</Button></div></div>}
      {showSuccessPopup && <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"><div className="bg-white p-6 rounded-lg max-w-sm"><h3 className="text-lg font-bold text-green-600 mb-2 flex items-center"><CheckCircle className="mr-2"/> Success</h3><p className="mb-4">eQRF Submitted Successfully.</p><Button onClick={()=>navigate('/agent')} className="w-full">Dashboard</Button></div></div>}
      {showUnlockSuccess && <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"><div className="bg-white p-6 rounded-lg max-w-sm"><h3 className="text-lg font-bold text-green-600 mb-2 flex items-center"><Unlock className="mr-2"/> Unlocked</h3><p className="mb-4">eQRF is now available for edits or re-assignment.</p><Button onClick={()=>setShowUnlockSuccess(false)} className="w-full">OK</Button></div></div>}
      {showRejectModal && <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"><div className="bg-white p-6 rounded-lg max-w-md w-full"><div className="flex justify-between mb-4"><h3 className="font-bold">Reject</h3><button onClick={()=>setShowRejectModal(false)}><X/></button></div><div className="space-y-4"><select className="w-full border p-2 rounded" value={selectedRejectionReason} onChange={e=>setSelectedRejectionReason(e.target.value)}><option value="">Reason...</option>{REJECTION_REASONS.map(r=><option key={r} value={r}>{r}</option>)}</select><textarea className="w-full border p-2 rounded h-24" placeholder="Comments..." value={rejectionNote} onChange={e=>setRejectionNote(e.target.value)}/><div className="flex gap-2"><Button variant="outline" onClick={()=>setShowRejectModal(false)} className="w-full">Cancel</Button><Button variant="danger" onClick={()=>handleUnderwriterAction('REJECT')} disabled={!selectedRejectionReason} className="w-full">Confirm</Button></div></div></div></div>}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
         
         {/* READ ONLY BANNER */}
         {isReadOnly && (
            <div className="bg-orange-50 border-b border-orange-100 p-4 flex items-start">
               <div className="flex-shrink-0">
                  <Lock className="h-5 w-5 text-orange-400" aria-hidden="true" />
               </div>
               <div className="ml-3">
                  <h3 className="text-sm font-bold text-orange-800 uppercase tracking-wide">Read Only View</h3>
                  <div className="mt-1 text-sm text-orange-700">
                     <p>{getReadOnlyMessage()}</p>
                  </div>
               </div>
            </div>
         )}

         {/* Internal Name */}
         <div className="p-6 border-b border-gray-200 bg-gray-50">
            <div className="max-w-md">
               <InputGroup label="eQRF Reference Name (Internal)" value={qrfName} onChange={setQrfName} required error={errors.qrfName} disabled={isReadOnly} />
            </div>
         </div>

         {/* Tabs */}
         <div className="flex border-b border-gray-200 overflow-x-auto">
            {activeTypes.map(type => (
               <button
                  key={type}
                  onClick={() => setCurrentTab(type)}
                  className={`px-6 py-4 text-sm font-medium flex items-center border-b-2 transition-colors whitespace-nowrap ${currentTab === type ? 'border-brand-600 text-brand-600 bg-brand-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
               >
                  {type === QRFType.MEDICAL && <Activity size={16} className="mr-2" />}
                  {type === QRFType.LIFE && <Heart size={16} className="mr-2" />}
                  {type === QRFType.PENSION && <Building2 size={16} className="mr-2" />}
                  {type === QRFType.CREDIT && <Banknote size={16} className="mr-2" />}
                  {type === QRFType.MEDICAL ? 'Medi-Life' : type} Form
               </button>
            ))}
            {showProposalTab && (
                <button
                    onClick={() => setCurrentTab('PROPOSAL')}
                    className={`px-6 py-4 text-sm font-medium flex items-center border-b-2 transition-colors whitespace-nowrap ${currentTab === 'PROPOSAL' ? 'border-green-600 text-green-600 bg-green-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                >
                    <FileCheck size={16} className="mr-2" />
                    Final Proposal
                </button>
            )}
         </div>

         {/* Content Area */}
         <div>
            {currentTab === QRFType.MEDICAL && renderMedicalForm()}
            {currentTab === QRFType.LIFE && renderDynamicForm(LIFE_SECTIONS)}
            {currentTab === QRFType.PENSION && renderDynamicForm(PENSION_SECTIONS)}
            {currentTab === QRFType.CREDIT && renderDynamicForm(CREDIT_SECTIONS)}
            {currentTab === 'PROPOSAL' && renderProposalTab()}
         </div>

         {/* Attachments - Shared */}
         {currentTab !== 'PROPOSAL' && (
             <div className="border-t border-gray-200 bg-white">
                <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 font-bold text-gray-900 text-sm uppercase flex items-center">
                <Paperclip size={16} className="mr-2"/> Attachments <span className="ml-2 text-xs text-red-500 normal-case">* Mandatory</span>
                </div>
                <div className="p-6">
                {/* File Upload is allowed if not read-only */}
                {!isReadOnly && (
                    <div className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer ${errors.attachments ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-brand-500 hover:bg-brand-50'}`} onClick={()=>fileInputRef.current?.click()}>
                        <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileUpload} />
                        <UploadCloud size={40} className={`mx-auto ${errors.attachments?'text-red-400':'text-brand-400'}`}/>
                        <p className="mt-2 text-sm font-medium">Click to upload documents</p>
                    </div>
                )}
                {formData.attachments?.length > 0 && (
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
                        {formData.attachments.map(f => (
                            <div key={f.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                            <div className="flex items-center overflow-hidden"><div className="p-2 bg-blue-100 text-blue-600 rounded mr-3"><File size={18}/></div><div className="truncate"><p className="text-sm font-medium truncate">{f.name}</p><p className="text-xs text-gray-500">{(f.size/1024).toFixed(0)} KB</p></div></div>
                            {!isReadOnly && <button onClick={()=>removeAttachment(f.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={16}/></button>}
                            </div>
                        ))}
                    </div>
                )}
                </div>
            </div>
         )}
      </div>
    </div>
  );
};

export default QRFForm;
