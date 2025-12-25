
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CRMLead, CRMStage, CRMChannel, CRMProduct, User, QRFType, Attachment, CRMCompany } from '../../types';
import { appService } from '../../services/appService';
import Button from '../../components/Button';
import { ArrowLeft, Save, Clock, Phone, File, Trash2, UploadCloud, FileText, Plus, Search, AlertTriangle, CheckSquare, X } from 'lucide-react';

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

const CRMLeadForm: React.FC<CRMLeadFormProps> = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyStep, setNewCompanyStep] = useState<0 | 1 | 2>(0); // 0: Input, 1: Warning, 2: Confirmation
  const [similarCompanyName, setSimilarCompanyName] = useState('');
  const [confirmNewCompany, setConfirmNewCompany] = useState(false);

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
      // Also log to system logs
      await appService.logActivity('CRM Note', `Note on ${lead.title}: ${noteInput}`);
      
      setNoteInput('');
  };

  // --- Company Modal Logic ---
  const openCompanyModal = () => {
      setNewCompanyName('');
      setSimilarCompanyName('');
      setNewCompanyStep(0);
      setConfirmNewCompany(false);
      setIsCompanyModalOpen(true);
  };

  const handleCheckCompany = async () => {
      if (!newCompanyName.trim()) return;
      
      const similar = await appService.findSimilarCompany(newCompanyName);
      if (similar) {
          setSimilarCompanyName(similar.name);
          setNewCompanyStep(1); // Go to Warning
      } else {
          // No similarity, add directly
          await performAddCompany(newCompanyName);
      }
  };

  const performAddCompany = async (name: string) => {
      const added = await appService.addCompany(name);
      setAvailableCompanies(prev => [...prev, added]);
      setLead(prev => ({ ...prev, companyName: added.name }));
      setIsCompanyModalOpen(false);
  };

  const handleConfirmWarning = () => {
      setNewCompanyStep(2); // Go to Final Confirmation
  };

  const handleFinalAdd = async () => {
      if (confirmNewCompany) {
          await performAddCompany(newCompanyName);
      }
  };

  const createQrf = () => {
      // Logic to jump to QRF creation pre-filled
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

  // --- Document Handling ---
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
        newAttachments.push({
            id: `att_${Date.now()}_${i}`,
            name: file.name,
            size: file.size,
            type: file.type,
            uploadedAt: new Date().toISOString(),
            data: base64
        });
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
                  <div>
                      <label className="block text-sm font-semibold text-gray-700">Initial Life Quote</label>
                      <input type="number" className="mt-1 w-full border rounded p-2 text-sm" value={lead.initialLifeQuote || ''} onChange={e => handleChange('initialLifeQuote', parseFloat(e.target.value))} />
                  </div>
                  <div>
                      <label className="block text-sm font-semibold text-gray-700">Final Life Quote</label>
                      <input type="number" className="mt-1 w-full border rounded p-2 text-sm" value={lead.finalLifeQuote || ''} onChange={e => handleChange('finalLifeQuote', parseFloat(e.target.value))} />
                  </div>
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
      {/* COMPANY MODAL */}
      {isCompanyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full overflow-hidden animate-fade-in-down">
                  <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                      <h3 className="text-lg font-bold text-gray-900">Add New Company</h3>
                      <button onClick={() => setIsCompanyModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                  </div>
                  
                  <div className="p-8">
                      {/* Step 0: Input */}
                      {newCompanyStep === 0 && (
                          <div className="space-y-4">
                              <label className="block text-sm font-medium text-gray-700">Company Name</label>
                              <input 
                                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-lg"
                                  placeholder="Enter official company name"
                                  value={newCompanyName}
                                  onChange={e => setNewCompanyName(e.target.value)}
                                  autoFocus
                              />
                              <div className="pt-4 flex justify-end">
                                  <Button onClick={handleCheckCompany} disabled={!newCompanyName.trim()}>Next</Button>
                              </div>
                          </div>
                      )}

                      {/* Step 1: Warning */}
                      {newCompanyStep === 1 && (
                          <div className="space-y-6">
                              <div className="flex items-start bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                                  <AlertTriangle className="text-yellow-600 mr-3 mt-1 shrink-0" size={24} />
                                  <div>
                                      <h4 className="font-bold text-yellow-800 text-lg mb-1">Similar Company Found</h4>
                                      <p className="text-yellow-700 mb-2">There is a company saved with a similar name: <br/><span className="font-bold text-black block mt-1 text-xl">"{similarCompanyName}"</span></p>
                                      <p className="text-sm text-yellow-800">Are you sure you want to add a new company record instead of selecting the existing one?</p>
                                  </div>
                              </div>
                              <div className="flex justify-end gap-3 pt-2">
                                  <Button variant="outline" onClick={() => setIsCompanyModalOpen(false)}>Cancel</Button>
                                  <Button onClick={handleConfirmWarning} className="bg-yellow-600 hover:bg-yellow-700 text-white">Yes, proceed</Button>
                              </div>
                          </div>
                      )}

                      {/* Step 2: Final Confirmation */}
                      {newCompanyStep === 2 && (
                          <div className="space-y-6">
                              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                                  <h4 className="font-bold text-red-800 mb-2">Final Confirmation</h4>
                                  <p className="text-sm text-red-700">Creating duplicate company records can fragment data. Please confirm you have verified this is a distinct entity.</p>
                              </div>
                              
                              <label className="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                  <input 
                                      type="checkbox" 
                                      className="mt-1 mr-3 w-5 h-5 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
                                      checked={confirmNewCompany}
                                      onChange={e => setConfirmNewCompany(e.target.checked)}
                                  />
                                  <span className="text-sm text-gray-700 font-medium leading-relaxed">
                                      I have reviewed the similar company "{similarCompanyName}" and agree to add a new one named "{newCompanyName}".
                                  </span>
                              </label>

                              <div className="flex justify-end gap-3 pt-2">
                                  <Button variant="outline" onClick={() => setIsCompanyModalOpen(false)}>Cancel</Button>
                                  <Button onClick={handleFinalAdd} disabled={!confirmNewCompany} className="bg-red-600 hover:bg-red-700 text-white">Create Company</Button>
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
                        <div className="flex-1 flex space-x-2">
                            <select 
                                className="flex-1 border-b border-gray-300 focus:border-brand-500 outline-none py-1 text-sm bg-white"
                                value={lead.companyName}
                                onChange={e => handleChange('companyName', e.target.value)}
                            >
                                <option value="">Select Company...</option>
                                {availableCompanies.map(c => (
                                    <option key={c.id} value={c.name}>{c.name}</option>
                                ))}
                            </select>
                            <button 
                                onClick={openCompanyModal}
                                className="bg-brand-600 text-white rounded p-1 hover:bg-brand-700 transition-colors"
                                title="Add New Company"
                            >
                                <Plus size={16} />
                            </button>
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
