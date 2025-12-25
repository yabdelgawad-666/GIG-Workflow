
import { User, UserRole, QRF, QRFStatus, QRFType, SystemLog, CRMLead, CRMStage, CRMChannel, CRMProduct, CRMCompany } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'u0',
    username: 'superadmin',
    password: 'super123',
    fullName: 'System SuperAdmin',
    role: UserRole.SUPER_ADMIN,
    lastLogin: '2025-11-16T08:00:00Z'
  },
  {
    id: 'u1',
    username: 'pluto',
    password: 'sales123',
    fullName: 'Pluto Head of Sales',
    role: UserRole.ADMIN, // Sales Admin
    lastLogin: '2025-11-15T08:30:00Z'
  },
  {
    id: 'u2',
    username: 'sarah',
    password: 'agent123',
    fullName: 'Sarah Sales',
    role: UserRole.AGENT, // Sales Agent
    lastLogin: '2025-11-14T09:15:00Z'
  },
  {
    id: 'u3',
    username: 'mars',
    password: 'uwadmin123',
    fullName: 'Mars Head of UW',
    role: UserRole.UW_ADMIN, // Underwriter Admin
    lastLogin: '2025-11-16T09:00:00Z'
  },
  {
    id: 'u4',
    username: 'khaled',
    password: 'uw123',
    fullName: 'Khaled UW',
    role: UserRole.UNDERWRITER, // Underwriter Agent
    lastLogin: '2025-11-15T10:00:00Z'
  },
  {
    id: 'u5',
    username: 'mona',
    password: 'uw456',
    fullName: 'Mona Senior UW',
    role: UserRole.UNDERWRITER,
    lastLogin: '2025-11-18T09:30:00Z'
  },
  {
    id: 'u6',
    username: 'ahmed',
    password: 'agent456',
    fullName: 'Ahmed Sales',
    role: UserRole.AGENT, // New Sales Agent
    lastLogin: '2025-11-20T10:00:00Z'
  }
];

export const INITIAL_COMPANIES: CRMCompany[] = [
    { id: 'c1', name: 'Bashar Soft', industry: 'Technology', createdAt: '2025-01-01T00:00:00Z' },
    { id: 'c2', name: 'Ahly Bank', industry: 'Banking', createdAt: '2025-01-01T00:00:00Z' },
    { id: 'c3', name: 'CIB Egypt', industry: 'Banking', createdAt: '2025-01-01T00:00:00Z' },
    { id: 'c4', name: 'Yodawy', industry: 'Healthcare', createdAt: '2025-01-01T00:00:00Z' },
    { id: 'c5', name: 'Egypreneur', industry: 'Services', createdAt: '2025-01-01T00:00:00Z' },
    { id: 'c6', name: 'ABC Bank', industry: 'Banking', createdAt: '2025-01-01T00:00:00Z' },
    { id: 'c7', name: 'Vodafone Egypt', industry: 'Telecom', createdAt: '2025-01-01T00:00:00Z' },
    { id: 'c8', name: 'Etisalat Misr', industry: 'Telecom', createdAt: '2025-01-01T00:00:00Z' },
    { id: 'c9', name: 'Orange Egypt', industry: 'Telecom', createdAt: '2025-01-01T00:00:00Z' },
    { id: 'c10', name: 'Telecom Egypt (WE)', industry: 'Telecom', createdAt: '2025-01-01T00:00:00Z' },
    { id: 'c11', name: 'GIG Insurance', industry: 'Insurance', createdAt: '2025-01-01T00:00:00Z' },
    { id: 'c12', name: 'Allianz Egypt', industry: 'Insurance', createdAt: '2025-01-01T00:00:00Z' },
    { id: 'c13', name: 'AXA Egypt', industry: 'Insurance', createdAt: '2025-01-01T00:00:00Z' },
    { id: 'c14', name: 'Metlife', industry: 'Insurance', createdAt: '2025-01-01T00:00:00Z' },
    { id: 'c15', name: 'Hassan Allam', industry: 'Construction', createdAt: '2025-01-01T00:00:00Z' },
    { id: 'c16', name: 'Orascom Construction', industry: 'Construction', createdAt: '2025-01-01T00:00:00Z' },
    { id: 'c17', name: 'Ezz Steel', industry: 'Manufacturing', createdAt: '2025-01-01T00:00:00Z' },
    { id: 'c18', name: 'El Sewedy Electric', industry: 'Manufacturing', createdAt: '2025-01-01T00:00:00Z' },
];

export const INITIAL_QRFS: QRF[] = [
  // --- SCENARIO 1: DRAFT (0 Cycles) ---
  {
    id: 'q_draft',
    referenceNumber: '00001',
    name: 'TechStart Inc - Initial Quote',
    types: [QRFType.MEDICAL],
    agentId: 'u2',
    agentName: 'Sarah Sales',
    status: QRFStatus.DRAFT,
    createdAt: '2025-11-20T10:00:00Z',
    isLocked: false,
    data: {
      accountName: 'TechStart Inc',
      quoteDate: '2025-11-20',
      natureOfBusiness: 'Software Development',
      countMembers: '45',
      showAdditionalBenefits: false,
      attachments: []
    } as any,
    history: []
  },

  // --- SCENARIO 2: CYCLE 1 - Submitted Freshly ---
  {
    id: 'q_cycle1',
    referenceNumber: '00002',
    name: 'Blue Ocean Logistics',
    types: [QRFType.LIFE, QRFType.MEDICAL],
    agentId: 'u2',
    agentName: 'Sarah Sales',
    status: QRFStatus.SUBMITTED,
    createdAt: '2025-11-19T09:00:00Z',
    submittedAt: '2025-11-19T10:30:00Z',
    assignedToId: 'u4',
    assignedToName: 'Khaled UW',
    assignedAt: '2025-11-19T11:00:00Z',
    isLocked: true, 
    data: {
      accountName: 'Blue Ocean Logistics',
      quoteDate: '2025-11-19',
      existingInsurer: 'Option 2: Allianz',
      natureOfBusiness: 'Logistics',
      countMembers: '120',
      attachments: [{ id: 'a1', name: 'Employee_Census.xlsx', size: 1024, type: 'application/xlsx', uploadedAt: '2025-11-19T09:05:00Z' }]
    } as any,
    history: [] // No history yet, first cycle
  },

  // --- SCENARIO 3: REJECTED (Pending Fix) ---
  {
    id: 'q_rejected_pending',
    referenceNumber: '00003',
    name: 'Green Energy Corp',
    types: [QRFType.PENSION],
    agentId: 'u2',
    agentName: 'Sarah Sales',
    status: QRFStatus.REJECTED,
    rejectionReason: 'Missing documents',
    rejectionNote: 'Please upload the Salary Breakdown file.',
    createdAt: '2025-11-18T08:00:00Z',
    submittedAt: '2025-11-18T09:00:00Z',
    assignedToId: 'u5',
    assignedToName: 'Mona Senior UW',
    assignedAt: '2025-11-18T10:00:00Z',
    decidedAt: '2025-11-18T14:30:00Z',
    isLocked: false, 
    data: {
      accountName: 'Green Energy Corp',
      pension_companyName: 'Green Energy',
      countMembers: '500',
      attachments: [{ id: 'a2', name: 'Company_Reg.pdf', size: 2000, type: 'application/pdf', uploadedAt: '2025-11-18T08:15:00Z' }]
    } as any,
    history: [] // Rejected in first cycle
  },

  // --- SCENARIO 4: CYCLE 2 - Resubmitted after Rejection ---
  {
    id: 'q_cycle2',
    referenceNumber: '00004',
    name: 'Retail Chain Holdings',
    types: [QRFType.CREDIT],
    agentId: 'u6',
    agentName: 'Ahmed Sales',
    status: QRFStatus.SUBMITTED,
    createdAt: '2025-11-15T08:00:00Z',
    submittedAt: '2025-11-17T09:00:00Z', // 2nd submission time
    assignedToId: 'u5',
    assignedToName: 'Mona Senior UW',
    assignedAt: '2025-11-15T12:00:00Z', // Originally assigned
    isLocked: true,
    data: {
      accountName: 'Retail Chain',
      countMembers: '2500',
      attachments: [{id:'a4', name:'Census.xlsx', size:5000, type:'application/xlsx', uploadedAt:'2025-11-15T08:00:00Z'}]
    } as any,
    history: [
        {
            status: QRFStatus.REJECTED,
            submittedAt: '2025-11-15T08:30:00Z', // 1st submission
            assignedToName: 'Mona Senior UW',
            assignedAt: '2025-11-15T12:00:00Z',
            decidedAt: '2025-11-16T14:00:00Z', // 1st rejection
            rejectionReason: 'Wrong Data'
        }
    ]
  },

  // --- SCENARIO 5: CYCLE 3 - Resubmitted twice (Complex) ---
  {
    id: 'q_cycle3',
    referenceNumber: '00005',
    name: 'Global Tech Solutions',
    types: [QRFType.MEDICAL],
    agentId: 'u2',
    agentName: 'Sarah Sales',
    status: QRFStatus.SUBMITTED,
    createdAt: '2025-11-10T09:00:00Z',
    submittedAt: '2025-11-19T16:00:00Z', // 3rd submission
    assignedToId: 'u4',
    assignedToName: 'Khaled UW',
    assignedAt: '2025-11-10T11:00:00Z',
    isLocked: true,
    data: {
      accountName: 'Global Tech',
      countMembers: '50',
      attachments: [{id:'a5', name:'Staff.pdf', size:1200, type:'application/pdf', uploadedAt:'2025-11-10T09:00:00Z'}]
    } as any,
    history: [
        {
            status: QRFStatus.REJECTED,
            submittedAt: '2025-11-10T09:30:00Z',
            decidedAt: '2025-11-11T10:00:00Z',
            assignedToName: 'Khaled UW',
            rejectionReason: 'Missing documents'
        },
        {
            status: QRFStatus.REJECTED,
            submittedAt: '2025-11-12T14:00:00Z',
            decidedAt: '2025-11-13T09:00:00Z',
            assignedToName: 'Khaled UW',
            rejectionReason: 'Other'
        }
    ]
  },

  // --- SCENARIO 6: APPROVED (After Cycle 2) ---
  {
    id: 'q_approved_cycle2',
    referenceNumber: '00006',
    name: 'Red Sea Resorts Group',
    types: [QRFType.MEDICAL],
    agentId: 'u2',
    agentName: 'Sarah Sales',
    status: QRFStatus.APPROVED,
    createdAt: '2025-11-01T08:00:00Z',
    submittedAt: '2025-11-05T09:00:00Z', // Final submission
    assignedToId: 'u4',
    assignedToName: 'Khaled UW',
    assignedAt: '2025-11-01T10:00:00Z',
    decidedAt: '2025-11-07T11:00:00Z',
    isLocked: false,
    data: {
      accountName: 'Red Sea Resorts',
      natureOfBusiness: 'Hospitality',
      countMembers: '350',
      attachments: [{ id: 'a3', name: 'Staff_List.xlsx', size: 1500, type: 'application/xlsx', uploadedAt: '2025-11-01T08:30:00Z' }],
      proposalAttachments: [
        { 
          id: 'p1', 
          name: 'GIG_Proposal_RedSea_Final.pdf', 
          size: 4096, 
          type: 'application/pdf', 
          uploadedAt: '2025-11-07T10:55:00Z',
          data: '#' 
        }
      ]
    } as any,
    history: [
        {
            status: QRFStatus.REJECTED,
            submittedAt: '2025-11-01T09:00:00Z',
            decidedAt: '2025-11-02T15:00:00Z',
            assignedToName: 'Khaled UW',
            rejectionReason: 'Missing data'
        }
    ]
  },

  // --- SCENARIO 7: TEST - Unassigned by Mona (Pending) ---
  {
    id: 'q_test_unassigned',
    referenceNumber: '00007',
    name: 'Delta Construction - Unassign Test',
    types: [QRFType.MEDICAL],
    agentId: 'u2',
    agentName: 'Sarah Sales',
    status: QRFStatus.SUBMITTED,
    createdAt: '2025-11-21T08:00:00Z',
    submittedAt: '2025-11-21T08:30:00Z',
    // NO assignedToId
    assignedToId: undefined,
    assignedToName: undefined,
    // Special tracking fields
    unassignedBy: 'Mona Senior UW',
    unassignedAt: '2025-11-21T10:45:00Z',
    previousAssignedToName: 'Mona Senior UW',
    isLocked: false,
    data: {
      accountName: 'Delta Construction',
      quoteDate: '2025-11-21',
      existingInsurer: 'Option 1: Al Mohandes',
      natureOfBusiness: 'Construction',
      countMembers: '75',
      showAdditionalBenefits: true,
      attachments: [{ id: 'a7', name: 'Site_Workers.xlsx', size: 1024, type: 'application/xlsx', uploadedAt: '2025-11-21T08:35:00Z' }]
    } as any,
    history: []
  },

  // --- SCENARIO 8: TEST - Assigned Standard ---
  {
    id: 'q_test_normal',
    referenceNumber: '00008',
    name: 'Cairo FinTech',
    types: [QRFType.CREDIT],
    agentId: 'u6',
    agentName: 'Ahmed Sales',
    status: QRFStatus.SUBMITTED,
    createdAt: '2025-11-21T09:00:00Z',
    submittedAt: '2025-11-21T09:30:00Z',
    assignedToId: 'u5',
    assignedToName: 'Mona Senior UW',
    assignedAt: '2025-11-21T10:00:00Z',
    isLocked: true,
    data: {
      accountName: 'Cairo FinTech',
      countMembers: '200',
      attachments: [{ id: 'a8', name: 'Docs.pdf', size: 2048, type: 'application/pdf', uploadedAt: '2025-11-21T09:35:00Z' }]
    } as any,
    history: []
  }
];

export const INITIAL_CRM_LEADS: CRMLead[] = [
  {
    id: 'lead_1',
    title: 'Life & Medical',
    expectedPremium: 200000,
    companyName: 'Bashar Soft',
    email: 'info@basharsoft.com',
    address: 'Cairo, Egypt',
    phone: '+20100000001',
    contactPerson: 'Mostafa Ali',
    jobPosition: 'HR Manager',
    salespersonId: 'u2',
    salespersonName: 'Sarah Sales',
    tags: ['Virgin'],
    effectiveDate: '2025-12-01',
    stage: CRMStage.COLLECTING,
    channel: CRMChannel.DIRECT,
    product: CRMProduct.MEDILIFE,
    createdAt: '2025-11-01T10:00:00Z',
    updatedAt: '2025-11-05T10:00:00Z',
    currentInsurance: 'AXA',
    competitor: 'Metlife'
  },
  {
    id: 'lead_2',
    title: 'Pension',
    expectedPremium: 0,
    companyName: 'Ahly Bank',
    email: 'info@ahlybank.com',
    address: 'Cairo, Egypt',
    phone: '+20100000002',
    contactPerson: 'Ahmed Banking',
    jobPosition: 'Procurement',
    salespersonId: 'u2',
    salespersonName: 'Sarah Sales',
    tags: [],
    effectiveDate: '2026-01-01',
    stage: CRMStage.NEW,
    channel: CRMChannel.AGENCY,
    product: CRMProduct.PENSION,
    createdAt: '2025-11-20T10:00:00Z',
    updatedAt: '2025-11-20T10:00:00Z'
  },
  {
    id: 'lead_3',
    title: 'Credit Life',
    expectedPremium: 1555555,
    companyName: 'CIB Egypt',
    email: 'info@cibeg.com',
    address: 'Giza, Egypt',
    phone: '',
    contactPerson: 'Malak Tamer',
    jobPosition: '',
    salespersonId: 'u6',
    salespersonName: 'Ahmed Sales',
    tags: ['Insured'],
    effectiveDate: '2025-11-30',
    stage: CRMStage.NEW,
    channel: CRMChannel.DIRECT,
    product: CRMProduct.CREDIT_LIFE,
    createdAt: '2025-11-19T10:00:00Z',
    updatedAt: '2025-11-19T10:00:00Z'
  },
  {
    id: 'lead_4',
    title: 'Life & Medical',
    expectedPremium: 3456677,
    companyName: 'Yodawy',
    email: 'm.tamer@yodawy.com',
    address: '',
    phone: '',
    contactPerson: 'Omar Abdelrahman',
    jobPosition: 'CEO',
    salespersonId: 'u2',
    salespersonName: 'Sarah Sales',
    tags: ['Renewal'],
    effectiveDate: '2025-12-15',
    stage: CRMStage.NEGOTIATION,
    channel: CRMChannel.BROKER,
    brokerName: 'Marsh',
    brokerContactPerson: 'Samy Broker',
    brokerEmail: 'samy@marsh.com',
    product: CRMProduct.MEDILIFE,
    initialLifeQuote: 100000,
    initialMedicalQuote: 3000000,
    initialTotalQuote: 3100000,
    createdAt: '2025-10-15T10:00:00Z',
    updatedAt: '2025-11-18T10:00:00Z'
  },
  {
    id: 'lead_5',
    title: 'Pension',
    expectedPremium: 3000000,
    companyName: 'Egypreneur',
    email: 'covid19-support@egypreneur.com',
    address: '',
    phone: '',
    contactPerson: 'Ahmed Mohamed',
    jobPosition: '',
    salespersonId: 'u6',
    salespersonName: 'Ahmed Sales',
    tags: ['Virgin'],
    effectiveDate: '2025-12-01',
    stage: CRMStage.SENT_UW,
    channel: CRMChannel.DIRECT,
    product: CRMProduct.PENSION,
    createdAt: '2025-11-10T10:00:00Z',
    updatedAt: '2025-11-15T10:00:00Z'
  },
  {
    id: 'lead_6',
    title: 'Credit Life',
    expectedPremium: 1000000,
    companyName: 'ABC Bank',
    email: 'proc@abc.com',
    address: '',
    phone: '',
    contactPerson: 'Malak Tamer',
    jobPosition: '',
    salespersonId: 'u2',
    salespersonName: 'Sarah Sales',
    tags: [],
    effectiveDate: '2025-11-01',
    stage: CRMStage.WON,
    channel: CRMChannel.DIRECT,
    product: CRMProduct.CREDIT_LIFE,
    createdAt: '2025-10-01T10:00:00Z',
    updatedAt: '2025-11-01T10:00:00Z'
  }
];

// Helper to generate Logs
const generateLogs = (): SystemLog[] => {
  const logs: SystemLog[] = [];
  const actions = ['Login', 'Logout', 'Create QRF', 'Submit QRF', 'Assign Underwriter', 'Reject QRF', 'Approve QRF', 'Update User'];
  const users = INITIAL_USERS;
  
  const now = new Date();
  for (let i = 0; i < 50; i++) { 
     // Ensure mock logs start from at least 1 day ago to not conflict with "Just now" interactions during demo
     const daysAgo = Math.floor(Math.random() * 10) + 1; 
     const date = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
     date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
     
     const user = users[Math.floor(Math.random() * users.length)];
     const action = actions[Math.floor(Math.random() * actions.length)];
     
     logs.push({
        id: `log_${i}`,
        timestamp: date.toISOString(),
        userId: user.id,
        userName: user.fullName,
        userRole: user.role,
        action: action,
        details: action.includes('QRF') ? `Ref: 000${Math.floor(Math.random()*4)+1}` : '-',
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`
     });
  }
  return logs.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const INITIAL_LOGS: SystemLog[] = generateLogs();
