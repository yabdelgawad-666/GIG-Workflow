
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Save, Clock, Phone, File, Trash2, UploadCloud, 
  FileText, Plus, Search, AlertTriangle, CheckSquare, X, 
  Building, ChevronRight, AlertCircle 
} from 'lucide-react';

import { CRMLead, CRMStage, CRMChannel, CRMProduct, User, QRFType, Attachment, CRMCompany } from '../../types';
import { appService } from '../../services/appService';
import Button from '../../components/Button';

interface CRMLeadFormProps {
  user: User;
}

interface Note {
    user: string;
    initial: string;
    timestamp: string;
    text: string;
}

const STAGES = Object.values(CRMStage);
const CHANNELS = Object.values(CRMChannel);
const PRODUCTS = Object.values(CRMProduct);

/**
 * Helper: Levenshtein Distance Algorithm
 * Calculates the number of edits (insertions, deletions, substitutions) 
 * required to change string 'a' into string 'b'.
 */
const getLevenshteinDistance = (a: string, b: string): number => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  
  const matrix: number[][] = [];

  // Increment along the first column of each row
  for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
  }

  // Increment each column in the first row
  for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
          if (b.charAt(i - 1) === a.charAt(j - 1)) {
              matrix[i][j] = matrix[i - 1][j - 1];
          } else {
              matrix[i][j] = Math.min(
                  matrix[i - 1][j - 1] + 1, // substitution
                  Math.min(
                      matrix[i][j - 1] + 1, // insertion
                      matrix[i - 1][j] + 1 // deletion
                  )
              );
          }
      }
  }

  return matrix[b.length][a.length];
};

const CRMLeadForm: React.FC<CRMLeadFormProps> = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const companySearchInputRef = useRef<HTMLInputElement>(null);
  
  const isNew = !id || id === 'new';

  const [lead, setLead] = useState<CRMLead>({
    id: `lead_${Date.now()}`,
    title: '',
    expectedPremium: 0,
    companyName: '',
    email: '',
    address: '',
    phone: '',
    contactPerson: '',
    jobPosition: '',
    salespersonId: user.id,
    salespersonName: user.fullName,
    tags: [],
    effectiveDate: new Date().toISOString().split('T')[0],
    stage: CRMStage.NEW,
    channel: CRMChannel.DIRECT,
    product: CRMProduct.MEDILIFE,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    attachments: []
  });

  const [activeTab, setActiveTab] = useState<'products'|'contacts'|'brokerage'|'competitor'>('products');
  const [activeSidebarTab, setActiveSidebarTab] = useState<'note'|'upload'>('note');
  
  // Company Management State
  const [availableCompanies, setAvailableCompanies] = useState<CRMCompany[]>([]);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  
  // Modal Internal State
  const [companySearch, setCompanySearch] = useState('');
  const [filteredCompanies, setFilteredCompanies] = useState<CRMCompany[]>([]);
  const [showCreateConfirmation, setShowCreateConfirmation] = useState(false);
  const [confirmCheckbox, setConfirmCheckbox] = useState(false);

  // Notes State
  const [notes, setNotes] = useState<Note[]>([
      { user: 'Malak Tamer', initial: 'M', timestamp: 'Yesterday at 5:19 PM', text: '123,456.00 LE -> 0.00 LE (Expected Revenue)' },
      { user: 'System', initial: 'S', timestamp: 'Dec 3, 12:04 PM', text: 'Lead/Opportunity created' }
  ]);
  const [noteInput, setNoteInput] = useState('');

  useEffect(() => {
    if (!isNew && id) {
      loadLead(id);
    }
    loadCompanies();
  }, [id]);

  // Focus management for Modal
  useEffect(() => {
      if (isCompanyModalOpen && companySearchInputRef.current) {
          setTimeout(() => companySearchInputRef.current?.focus(), 100);
      }
      
      const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'Escape' && isCompanyModalOpen) {
              setIsCompanyModalOpen(false);
          }
      };
      
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCompanyModalOpen]);

  // Fuzzy Search Effect
  useEffect(() => {
      if (!companySearch.trim()) {
          setFilteredCompanies(availableCompanies.slice(0, 8)); // Show default suggestions
          return;
      }

      const lowerSearch = companySearch.toLowerCase();
      
      const matches = availableCompanies.filter(c => {
          const lowerName = c.name.toLowerCase();
          
          // 1. Direct substring match (Fastest)
          if (lowerName.includes(lowerSearch)) return true;

          // 2. Fuzzy match (Levenshtein)
          const dist = getLevenshteinDistance(lowerSearch, lowerName);
          
          // Tolerance Logic:
          // Allow 2 errors max, or 40% of the word length for longer words.
          const threshold = Math.max(2, Math.floor(lowerName.length * 0.4));
          
          return dist <= threshold;
      }).sort((a, b) => {
          const aName = a.name.toLowerCase();
          const bName = b.name.toLowerCase();
          
          // Sort Priority: 
          // 1. Starts with search term
          // 2. Contains search term
          // 3. Fuzzy match
          const aStarts = aName.startsWith(lowerSearch);
          const bStarts = bName.startsWith(lowerSearch);
          
          if (aStarts && !bStarts) return -1;
          if (!aStarts && bStarts) return 1;
          return 0;
      });

      setFilteredCompanies(matches);
  }, [companySearch, availableCompanies]);

  const loadLead = async (leadId: string) => {
    const leads = await appService.getCRMLeads();
    const found = leads.find(l => l.id === leadId);
    if (found) setLead(found);
  };

  const loadCompanies = async () => {
      const comps = await appService.getCompanies();
      setAvailableCompanies(comps);
  };

  const handleChange = (key: keyof CRMLead, value: any) => {
    setLead(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    await appService.saveCRMLead(lead);
    navigate('/crm');
  };

  const handleLogNote = async () => {
      if (!noteInput.trim()) return;
      
      const newNote: Note = {
          user: user.fullName,
          initial: user.fullName.charAt(0).toUpperCase(),
          timestamp: 'Just now',
          text: noteInput
      };

      setNotes(prev => [newNote, ...prev]);
      await appService.logActivity('CRM Note', `Note on ${lead.title}: ${noteInput}`);
      setNoteInput('');
  };

  // --- Company Selection Logic ---
  const openCompanyModal = () => {
      setCompanySearch('');
      setShowCreateConfirmation(false);
      setConfirmCheckbox(false);
      setIsCompanyModalOpen(true);
  };

  const selectCompany = (name: string) => {
      setLead(prev => ({ ...prev, companyName: name }));
      setIsCompanyModalOpen(false);
  };

  const initiateCreateCompany = () => {
      if (!companySearch.trim()) return;
      
      // If there are matches, show confirmation screen
      if (filteredCompanies.length > 0) {
          setShowCreateConfirmation(true);
      } else {
          // No matches, create directly
          finalizeCreateCompany();
      }
  };

  const finalizeCreateCompany = async () => {
      const added = await appService.addCompany(companySearch);
      setAvailableCompanies(prev => [...prev, added]);
      setLead(prev => ({ ...prev, companyName: added.name }));
      setIsCompanyModalOpen(false);
  };

  const createQrf = () => {
      let type = QRFType.MEDICAL;
      if (lead.product === CRMProduct.LIFE) type = QRFType.LIFE;
      if (lead.product === CRMProduct.PENSION) type = QRFType.PENSION;
      if (lead.product === CRMProduct.CREDIT_LIFE) type = QRFType.CREDIT;

      const initialData: any = {
          accountName: lead.companyName,
          quoteDate: lead.effectiveDate,
          brokerName: lead.channel === CRMChannel.BROKER ? lead.brokerName : (lead.channel === CRMChannel.BROKERAGE ? lead.brokerageName : ''),
          brokerCode: lead.channel === CRMChannel.BROKER ? lead.brokerFraCode : '',
          additionalNotes: `Contact: ${lead.contactPerson || 'N/A'}\nPhone: ${lead.phone || 'N/A'}\nEmail: ${lead.email || 'N/A'}\n\nGenerated from CRM Lead: ${lead.title}`,
          attachments: lead.attachments || []
      };

      navigate('/qrf/new', { state: { types: [type], initialData: initialData } });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const newAttachments: Attachment[] = [];
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
        });
        newAttachments.push({ id: `att_${Date.now()}_${i}`, name: file.name, size: file.size, type: file.type, uploadedAt: new Date().toISOString(), data: base64 });
    }
    const updatedLead = { ...lead, attachments: [...(lead.attachments || []), ...newAttachments] };
    setLead(updatedLead);
    await appService.saveCRMLead(updatedLead);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = async (attachmentId: string) => {
      const updatedLead = { ...lead, attachments: (lead.attachments || []).filter(a => a.id !== attachmentId) };
      setLead(updatedLead);
      await appService.saveCRMLead(updatedLead);
  };

  const renderProductFields = () => {
      if (lead.product === CRMProduct.LIFE) {
          return (
              <div className="grid grid-cols-2 gap-6">
                  <div><label className="block text-sm font-semibold text-gray-700">Initial Life Quote</label><input type="number" className="mt-1 w-full border rounded p-2 text-sm" value={lead.initialLifeQuote || ''} onChange={e => handleChange('initialLifeQuote', parseFloat(e.target.value))} /></div>
                  <div><label className="block text-sm font-semibold text-gray-700">Final Life Quote</label><input type="number" className="mt-1 w-full border rounded p-2 text-sm" value={lead.finalLifeQuote || ''} onChange={e => handleChange('finalLifeQuote', parseFloat(e.target.value))} /></div>
              </div>
          );
      }
      if (lead.product === CRMProduct.MEDILIFE) {
          return (
            <div className="space-y-4">
                <h4 className="font-bold text-gray-700 border-b pb-2">Initial Quotes</h4>
                <div className="grid grid-cols-3 gap-4">
                    <div><label className="block text-xs text-gray-500">Life</label><input type="number" className="w-full border rounded p-1 text-sm" value={lead.initialLifeQuote || ''} onChange={e => handleChange('initialLifeQuote', parseFloat(e.target.value))} /></div>
                    <div><label className="block text-xs text-gray-500">Medical</label><input type="number" className="w-full border rounded p-1 text-sm" value={lead.initialMedicalQuote || ''} onChange={e => handleChange('initialMedicalQuote', parseFloat(e.target.value))} /></div>
                    <div><label className="block text-xs text-gray-500">Total</label><input type="number" className="w-full border rounded p-1 text-sm bg-gray-50" value={lead.initialTotalQuote || ''} onChange={e => handleChange('initialTotalQuote', parseFloat(e.target.value))} /></div>
                </div>
                <h4 className="font-bold text-gray-700 border-b pb-2 pt-2">Final Quotes</h4>
                <div className="grid grid-cols-3 gap-4">
                    <div><label className="block text-xs text-gray-500">Life</label><input type="number" className="w-full border rounded p-1 text-sm" value={lead.finalLifeQuote || ''} onChange={e => handleChange('finalLifeQuote', parseFloat(e.target.value))} /></div>
                    <div><label className="block text-xs text-gray-500">Medical</label><input type="number" className="w-full border rounded p-1 text-sm" value={lead.finalMedicalQuote || ''} onChange={e => handleChange('finalMedicalQuote', parseFloat(e.target.value))} /></div>
                    <div><label className="block text-xs text-gray-500">Total</label><input type="number" className="w-full border rounded p-1 text-sm bg-gray-50" value={lead.finalTotalQuote || ''} onChange={e => handleChange('finalTotalQuote', parseFloat(e.target.value))} /></div>
                </div>
            </div>
          );
      }
      return <div className="text-gray-400 italic p-4">No specific quote fields for this product type.</div>;
  };

  const renderChannelFields = () => {
      if (lead.channel === CRMChannel.BROKERAGE) {
          return (
            <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-gray-700">Brokerage Name</label><input className="w-full border rounded p-2 text-sm" value={lead.brokerageName || ''} onChange={e => handleChange('brokerageName', e.target.value)} /></div>
                <div><label className="block text-xs font-bold text-gray-700">Contact Person</label><input className="w-full border rounded p-2 text-sm" value={lead.brokerageContactPerson || ''} onChange={e => handleChange('brokerageContactPerson', e.target.value)} /></div>
                <div><label className="block text-xs font-bold text-gray-700">Number</label><input className="w-full border rounded p-2 text-sm" value={lead.brokerageNumber || ''} onChange={e => handleChange('brokerageNumber', e.target.value)} /></div>
                <div><label className="block text-xs font-bold text-gray-700">Email</label><input className="w-full border rounded p-2 text-sm" value={lead.brokerageEmail || ''} onChange={e => handleChange('brokerageEmail', e.target.value)} /></div>
            </div>
          );
      }
      if (lead.channel === CRMChannel.BROKER) {
        return (
            <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-gray-700">Broker Name</label><input className="w-full border rounded p-2 text-sm" value={lead.brokerName || ''} onChange={e => handleChange('brokerName', e.target.value)} /></div>
                <div><label className="block text-xs font-bold text-gray-700">Contact Person</label><input className="w-full border rounded p-2 text-sm" value={lead.brokerContactPerson || ''} onChange={e => handleChange('brokerContactPerson', e.target.value)} /></div>
                <div><label className="block text-xs font-bold text-gray-700">Number</label><input className="w-full border rounded p-2 text-sm" value={lead.brokerNumber || ''} onChange={e => handleChange('brokerNumber', e.target.value)} /></div>
                <div><label className="block text-xs font-bold text-gray-700">Email</label><input className="w-full border rounded p-2 text-sm" value={lead.brokerEmail || ''} onChange={e => handleChange('brokerEmail', e.target.value)} /></div>
                <div><label className="block text-xs font-bold text-gray-700">FRA Code</label><input className="w-full border rounded p-2 text-sm" value={lead.brokerFraCode || ''} onChange={e => handleChange('brokerFraCode', e.target.value)} /></div>
            </div>
          );
      }
      return <div className="text-gray-400 italic p-4">No extra fields for selected channel.</div>;
  };

  return (
    <div className="flex h-[calc(100vh-100px)] relative">
      {/* COMPANY SELECTION MODAL */}
      {isCompanyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm p-4 pt-20 animate-fade-in-down">
              <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[80vh]">
                  
                  {/* Modal Header */}
                  <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
                      <h3 className="text-lg font-bold text-gray-900 flex items-center">
                          <Building className="mr-2 text-brand-600" size={20}/> 
                          {showCreateConfirmation ? 'Confirm New Company' : 'Select Company'}
                      </h3>
                      <button onClick={() => setIsCompanyModalOpen(false)} className="text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 p-1"><X size={20}/></button>
                  </div>
                  
                  {/* Modal Content */}
                  <div className="flex-1 overflow-hidden flex flex-col">
                      
                      {!showCreateConfirmation ? (
                          <>
                            {/* Search Input Area */}
                            <div className="p-6 pb-2">
                                <div className="relative">
                                    <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
                                    <input 
                                        ref={companySearchInputRef}
                                        className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 focus:ring-4 focus:ring-brand-50 outline-none text-lg transition-all"
                                        placeholder="Type company name to search or create..."
                                        value={companySearch}
                                        onChange={e => setCompanySearch(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                                {companySearch && filteredCompanies.length > 0 && (
                                    <div className="mt-3 flex items-start text-yellow-700 bg-yellow-50 px-3 py-2 rounded-lg text-sm border border-yellow-100 animate-pulse">
                                        <AlertTriangle size={16} className="mr-2 mt-0.5 shrink-0"/>
                                        <span>Caution: Similar companies found. Please check the list below before creating a new one.</span>
                                    </div>
                                )}
                            </div>

                            {/* List Area */}
                            <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar">
                                <div className="space-y-2">
                                    {filteredCompanies.map(c => (
                                        <button 
                                            key={c.id} 
                                            onClick={() => selectCompany(c.name)}
                                            className="w-full text-left p-4 rounded-xl border border-gray-100 hover:border-brand-300 hover:bg-brand-50 hover:shadow-sm transition-all group flex justify-between items-center"
                                        >
                                            <div>
                                                <span className="font-bold text-gray-800 group-hover:text-brand-700">{c.name}</span>
                                                {c.industry && <span className="block text-xs text-gray-500 mt-0.5">{c.industry}</span>}
                                            </div>
                                            <ChevronRight size={16} className="text-gray-300 group-hover:text-brand-500"/>
                                        </button>
                                    ))}
                                    
                                    {filteredCompanies.length === 0 && companySearch && (
                                        <div className="text-center py-8 text-gray-500">
                                            <Building size={40} className="mx-auto mb-2 text-gray-300"/>
                                            <p>No existing companies match "{companySearch}"</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Create Action Footer */}
                            {companySearch.trim().length > 0 && (
                                <div className="p-4 border-t border-gray-100 bg-gray-50 shrink-0">
                                    <button 
                                        onClick={initiateCreateCompany}
                                        className="w-full flex items-center justify-center py-3 px-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-medium transition-colors shadow-sm hover:shadow"
                                    >
                                        <Plus size={20} className="mr-2"/>
                                        Create "{companySearch}" as new Company
                                    </button>
                                </div>
                            )}
                          </>
                      ) : (
                          // Confirmation View
                          <div className="p-8 flex flex-col h-full">
                              <div className="flex-1">
                                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 mb-6">
                                      <h4 className="text-orange-800 font-bold text-lg mb-2 flex items-center">
                                          <AlertCircle size={20} className="mr-2"/>
                                          Duplicate Warning
                                      </h4>
                                      <p className="text-orange-700 mb-4">
                                          You are about to create <span className="font-bold text-black">"{companySearch}"</span>.
                                      </p>
                                      <p className="text-sm text-orange-800 mb-2">We found similar existing companies:</p>
                                      <ul className="list-disc list-inside space-y-1 text-sm text-orange-900 font-medium ml-2">
                                          {filteredCompanies.slice(0, 3).map(c => (
                                              <li key={c.id}>{c.name}</li>
                                          ))}
                                          {filteredCompanies.length > 3 && <li>...and {filteredCompanies.length - 3} more</li>}
                                      </ul>
                                  </div>

                                  <label className="flex items-start p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                                      <input 
                                          type="checkbox" 
                                          className="mt-1 mr-3 w-5 h-5 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
                                          checked={confirmCheckbox}
                                          onChange={e => setConfirmCheckbox(e.target.checked)}
                                      />
                                      <span className="text-sm text-gray-700 font-medium leading-relaxed">
                                          I have reviewed the similar companies listed above and verify that <span className="font-bold">"{companySearch}"</span> is a distinct, new entity.
                                      </span>
                                  </label>
                              </div>

                              <div className="flex gap-3 pt-6 mt-auto">
                                  <button 
                                      onClick={() => setShowCreateConfirmation(false)} 
                                      className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                                  >
                                      Back to List
                                  </button>
                                  <button 
                                      onClick={finalizeCreateCompany} 
                                      disabled={!confirmCheckbox}
                                      className="flex-1 py-3 px-4 bg-brand-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-xl hover:bg-brand-700 transition-colors shadow-sm"
                                  >
                                      Confirm & Create
                                  </button>
                              </div>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* LEFT: Main Form */}
      <div className="flex-1 overflow-y-auto pr-4">
        {/* Header Actions */}
        <div className="flex justify-between items-center mb-6 border-b pb-4">
            <div className="flex items-center space-x-3">
                <button onClick={() => navigate('/crm')} className="text-gray-500 hover:text-gray-700"><ArrowLeft size={24}/></button>
                <div>
                    <div className="flex items-center space-x-2">
                        <span className="text-2xl font-bold text-gray-800">{isNew ? 'New Lead' : lead.title}</span>
                    </div>
                </div>
            </div>
            <div className="flex space-x-2">
                <Button onClick={createQrf} variant="outline">Create eQRF</Button>
                <Button onClick={handleSave}><Save size={16} className="mr-2"/> Save</Button>
            </div>
        </div>

        {/* Stage Bar */}
        <div className="mb-6 flex justify-between items-center border border-gray-300 rounded overflow-hidden">
            {STAGES.map((stage, idx) => (
                <button 
                    key={stage} 
                    onClick={() => handleChange('stage', stage)}
                    className={`flex-1 py-2 text-xs font-bold text-center border-r border-gray-300 last:border-0 transition-colors relative
                        ${lead.stage === stage ? 'bg-brand-700 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}
                    `}
                >
                    {stage}
                    {lead.stage === stage && <span className="absolute right-0 top-0 bottom-0 w-3 bg-brand-700 transform translate-x-1 skew-x-12 z-10 border-r border-white"></span>}
                </button>
            ))}
        </div>

        {/* Main Info */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-2">
                <input 
                    className="w-full outline-none placeholder-gray-300" 
                    placeholder="e.g. Life Insurance for TechCorp" 
                    value={lead.title}
                    onChange={e => handleChange('title', e.target.value)}
                />
            </h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <div className="flex items-center">
                        <label className="w-32 text-sm font-bold text-gray-700">Expected Premium</label>
                        <div className="flex-1 flex items-center">
                            <input type="number" className="border-b border-gray-300 focus:border-brand-500 outline-none w-32 py-1 font-bold text-gray-800" value={lead.expectedPremium} onChange={e => handleChange('expectedPremium', parseFloat(e.target.value))} />
                            <span className="ml-2 text-sm font-bold text-gray-500">EGP</span>
                        </div>
                    </div>
                    <div className="flex items-center">
                        <label className="w-32 text-sm font-bold text-gray-700">Company</label>
                        <div 
                            className="flex-1 flex items-center border-b border-gray-300 cursor-pointer hover:border-brand-500 group py-1"
                            onClick={openCompanyModal}
                        >
                            <span className={`text-sm flex-1 ${lead.companyName ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                                {lead.companyName || 'Select or create company...'}
                            </span>
                            <Search size={14} className="text-gray-400 group-hover:text-brand-500"/>
                        </div>
                    </div>
                    <div className="flex items-center">
                        <label className="w-32 text-sm font-bold text-gray-700">Address</label>
                        <input className="flex-1 border-b border-gray-300 focus:border-brand-500 outline-none py-1 text-sm" value={lead.address} onChange={e => handleChange('address', e.target.value)} />
                    </div>
                    <div className="flex items-center">
                        <label className="w-32 text-sm font-bold text-gray-700">Website</label>
                        <input className="flex-1 border-b border-gray-300 focus:border-brand-500 outline-none py-1 text-sm" placeholder="http://..." />
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center">
                        <label className="w-32 text-sm font-bold text-gray-700">Salesperson</label>
                        <div className="flex-1 flex items-center bg-red-50 px-2 py-1 rounded text-red-700 text-sm font-bold border border-red-100 w-fit">
                            <span className="w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center text-xs mr-2">{lead.salespersonName.charAt(0)}</span>
                            {lead.salespersonName}
                        </div>
                    </div>
                    <div className="flex items-center">
                        <label className="w-32 text-sm font-bold text-gray-700">Email</label>
                        <input className="flex-1 border-b border-gray-300 focus:border-brand-500 outline-none py-1 text-sm" value={lead.email} onChange={e => handleChange('email', e.target.value)} />
                    </div>
                    <div className="flex items-center">
                        <label className="w-32 text-sm font-bold text-gray-700">Phone</label>
                        <input className="flex-1 border-b border-gray-300 focus:border-brand-500 outline-none py-1 text-sm" value={lead.phone} onChange={e => handleChange('phone', e.target.value)} />
                    </div>
                    <div className="flex items-center">
                        <label className="w-32 text-sm font-bold text-gray-700">Tags</label>
                        <div className="flex-1">
                            <input className="border-b border-gray-300 focus:border-brand-500 outline-none py-1 text-sm w-full" placeholder="e.g. Virgin, Renewal" value={lead.tags.join(', ')} onChange={e => handleChange('tags', e.target.value.split(', '))} />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Tabbed Detail Section */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden min-h-[300px]">
            <div className="flex border-b border-gray-200">
                <button onClick={() => setActiveTab('products')} className={`px-6 py-3 text-sm font-bold border-b-2 ${activeTab==='products' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-600'}`}>Products</button>
                <button onClick={() => setActiveTab('contacts')} className={`px-6 py-3 text-sm font-bold border-b-2 ${activeTab==='contacts' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-600'}`}>Contacts</button>
                <button onClick={() => setActiveTab('brokerage')} className={`px-6 py-3 text-sm font-bold border-b-2 ${activeTab==='brokerage' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-600'}`}>Brokerage</button>
                <button onClick={() => setActiveTab('competitor')} className={`px-6 py-3 text-sm font-bold border-b-2 ${activeTab==='competitor' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-600'}`}>Current & Competitor</button>
            </div>
            <div className="p-6">
                {activeTab === 'products' && (
                    <div className="max-w-2xl">
                        <div className="mb-4">
                            <label className="block text-sm font-bold text-gray-700 mb-1">Product Line</label>
                            <select className="w-full border rounded p-2 bg-white" value={lead.product} onChange={e => handleChange('product', e.target.value)}>
                                {PRODUCTS.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                        <div className="border-t pt-4">
                            {renderProductFields()}
                        </div>
                    </div>
                )}

                {activeTab === 'contacts' && (
                    <div className="grid grid-cols-2 gap-6 max-w-3xl">
                        <div><label className="block text-sm font-bold text-gray-700">Contact Person</label><input className="w-full border rounded p-2 mt-1" value={lead.contactPerson} onChange={e => handleChange('contactPerson', e.target.value)} /></div>
                        <div><label className="block text-sm font-bold text-gray-700">Job Position</label><input className="w-full border rounded p-2 mt-1" value={lead.jobPosition} onChange={e => handleChange('jobPosition', e.target.value)} /></div>
                        <div><label className="block text-sm font-bold text-gray-700">Mobile</label><input className="w-full border rounded p-2 mt-1" value={lead.phone} onChange={e => handleChange('phone', e.target.value)} /></div>
                        <div><label className="block text-sm font-bold text-gray-700">Email</label><input className="w-full border rounded p-2 mt-1" value={lead.email} onChange={e => handleChange('email', e.target.value)} /></div>
                    </div>
                )}

                {activeTab === 'brokerage' && (
                    <div className="max-w-3xl">
                        <div className="mb-4">
                            <label className="block text-sm font-bold text-gray-700 mb-1">Channel Type</label>
                            <select className="w-full border rounded p-2 bg-white" value={lead.channel} onChange={e => handleChange('channel', e.target.value)}>
                                {CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="border-t pt-4">
                            {renderChannelFields()}
                        </div>
                    </div>
                )}

                {activeTab === 'competitor' && (
                    <div className="grid grid-cols-2 gap-6 max-w-3xl">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Current Insurance</label>
                            <select className="w-full border rounded p-2" value={lead.currentInsurance || ''} onChange={e => handleChange('currentInsurance', e.target.value)}>
                                <option value="">Select...</option>
                                {['Metlife', 'AXA', 'Allianz', 'Libano-suiss', 'Orient', 'Sarwa', 'Other'].map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Competitor</label>
                            <select className="w-full border rounded p-2" value={lead.competitor || ''} onChange={e => handleChange('competitor', e.target.value)}>
                                <option value="">Select...</option>
                                {['Metlife', 'AXA', 'Allianz', 'Libano-suiss', 'Orient', 'Sarwa', 'Other'].map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-bold text-gray-700 mb-1">Competitor Offer Details</label>
                            <textarea className="w-full border rounded p-2 h-20" value={lead.competitorOffer || ''} onChange={e => handleChange('competitorOffer', e.target.value)} />
                        </div>
                        {lead.stage === CRMStage.LOST && (
                            <div className="col-span-2 bg-red-50 p-4 rounded border border-red-200">
                                <label className="block text-sm font-bold text-red-700 mb-1">Lost Reason</label>
                                <select className="w-full border rounded p-2" value={lead.lostReason || ''} onChange={e => handleChange('lostReason', e.target.value)}>
                                    <option value="">Select...</option>
                                    {['Pricing', 'Not Matching TOB', 'Renewed with current carrier', 'Pricing-requirements', 'TAT-client', 'TAT-UW', 'TAT-Sales', 'TAT-Broker', 'Other'].map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* RIGHT: Sidebar (Logs & Docs) */}
      <div className="w-80 border-l border-gray-200 bg-white flex flex-col">
          <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <div className="flex space-x-2 w-full">
                  <button onClick={() => setActiveSidebarTab('note')} className={`flex-1 p-1.5 rounded text-sm font-medium flex items-center justify-center transition-colors ${activeSidebarTab === 'note' ? 'bg-brand-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}>
                      <Clock size={14} className="mr-1"/> Log note
                  </button>
                  <button onClick={() => setActiveSidebarTab('upload')} className={`flex-1 p-1.5 rounded text-sm font-medium flex items-center justify-center transition-colors ${activeSidebarTab === 'upload' ? 'bg-brand-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}>
                      <FileText size={14} className="mr-1"/> Documents
                  </button>
              </div>
          </div>
          
          <div className="flex-1 overflow-y-auto flex flex-col">
              {activeSidebarTab === 'note' && (
                  <>
                    <div className="p-4 border-b bg-gray-50">
                        <input 
                            className="w-full border p-2 rounded text-sm bg-white focus:border-brand-500 outline-none" 
                            placeholder="Log an internal note..." 
                            value={noteInput}
                            onChange={(e) => setNoteInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleLogNote()}
                        />
                        <div className="flex justify-between mt-2">
                            <button onClick={handleLogNote} className="bg-brand-600 text-white text-xs px-3 py-1 rounded hover:bg-brand-700">Log</button>
                        </div>
                    </div>
                    <div className="p-4 space-y-6">
                        {notes.map((note, idx) => (
                            <div key={idx} className="relative pl-8 border-l-2 border-gray-200 pb-2">
                                <div className={`absolute -left-2.5 top-0 w-5 h-5 rounded-full text-white flex items-center justify-center text-xs font-bold ${note.user === 'System' ? 'bg-gray-600' : 'bg-brand-600'}`}>
                                    {note.initial}
                                </div>
                                <div className="text-sm">
                                    <span className="font-bold text-gray-900">{note.user}</span> <span className="text-gray-500 text-xs">{note.timestamp}</span>
                                    <p className="text-gray-600 mt-1">{note.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                  </>
              )}

              {activeSidebarTab === 'upload' && (
                  <div className="p-4">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 hover:border-brand-400 transition-all mb-4" onClick={() => fileInputRef.current?.click()}>
                          <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileUpload} />
                          <UploadCloud size={32} className="mx-auto text-gray-400 mb-2"/>
                          <p className="text-sm text-gray-600 font-medium">Click to upload files</p>
                      </div>

                      {lead.attachments && lead.attachments.length > 0 ? (
                          <div className="space-y-3">
                              {lead.attachments.map(f => (
                                  <div key={f.id} className="flex items-center justify-between p-2 border rounded bg-gray-50">
                                      <div className="flex items-center overflow-hidden">
                                          <div className="p-1.5 bg-blue-100 text-blue-600 rounded mr-2"><File size={14}/></div>
                                          <div className="truncate">
                                              <p className="text-xs font-medium truncate max-w-[150px]">{f.name}</p>
                                              <p className="text-[10px] text-gray-500">{(f.size/1024).toFixed(0)} KB</p>
                                          </div>
                                      </div>
                                      <button onClick={() => removeAttachment(f.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={14}/></button>
                                  </div>
                              ))}
                          </div>
                      ) : (
                          <div className="text-center text-gray-400 text-sm italic mt-8">No documents uploaded</div>
                      )}
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};

export default CRMLeadForm;
