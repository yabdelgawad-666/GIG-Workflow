
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN', // Platform Super Admin
  ADMIN = 'ADMIN', // Sales Admin (Manages Sales Agents)
  UW_ADMIN = 'UW_ADMIN', // Underwriter Admin (Manages Underwriters)
  AGENT = 'AGENT', // Sales Agent
  UNDERWRITER = 'UNDERWRITER', // Underwriting Team
}

export enum QRFType {
  MEDICAL = 'MEDICAL',
  LIFE = 'LIFE',
  PENSION = 'PENSION',
  CREDIT = 'CREDIT'
}

export interface User {
  id: string;
  username: string;
  password?: string; // Added password field
  role: UserRole;
  fullName: string;
  lastLogin?: string; // ISO Date string
}

export enum QRFStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED', // Accepted by UW
  REJECTED = 'REJECTED', // Sent back to Agent
}

// Helper type for dynamic category structure (e.g. col0, col1, col2...)
export interface CategoryValues {
  [key: string]: string;
}

export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  data?: string; // Base64 string for mock purposes
  uploadedAt: string;
}

export interface QRFData {
  // General Info (Legacy/Medical mainly, but some shared)
  accountName: string;
  brokerName: string;
  brokerCode: string;
  quoteDate: string;
  existingInsurer: string;
  natureOfBusiness: string;
  requestedBenefits: string;
  countMembers: string;
  countCategories: string;
  additionalNotes: string;
  showAdditionalBenefits: boolean; // New Toggle
  attachments: Attachment[]; // Mandatory documents
  proposalAttachments?: Attachment[]; // Final Proposal documents uploaded by Underwriter
  
  // Dynamic fields mapped by row key
  [key: string]: string | boolean | CategoryValues | Attachment[] | any;
}

// Snapshot of a previous state
export interface QRFHistoryItem {
  status: QRFStatus;
  submittedAt?: string;
  decidedAt?: string;
  assignedToName?: string;
  assignedAt?: string;
  rejectionReason?: string;
}

export interface QRF {
  id: string;
  referenceNumber: string; // New Serial Reference Number (e.g., GIG-2023-1001)
  name: string; // The name given by agent to the eQRF
  types: QRFType[]; // Array of types included in this QRF (e.g. [MEDICAL, LIFE])
  
  agentId: string;
  agentName: string;
  status: QRFStatus;
  createdAt: string;
  submittedAt?: string;
  
  assignedToId?: string; // ID of the underwriter assigned
  assignedToName?: string; // Name of the underwriter assigned
  assignedAt?: string; // ISO Date string for when assignment happened
  
  // Unassignment History
  unassignedBy?: string; // Name of user who unassigned
  unassignedAt?: string; // ISO Date string
  previousAssignedToName?: string; // Name of UW who lost assignment

  decidedAt?: string; // ISO Date string for when Approved/Rejected
  
  // Locking Mechanism
  isLocked?: boolean; // If true, cannot be re-assigned until unlocked

  // Rejection Details
  rejectionReason?: 'Missing data' | 'Missing documents' | 'Wrong Data' | 'Other';
  rejectionNote?: string;

  data: QRFData;
  
  // Transaction History (Previous Cycles)
  history?: QRFHistoryItem[];
}

export interface SystemLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  details: string;
  ipAddress?: string;
}

export interface RowConfig {
  key: string;
  label: string;
  arabicLabel?: string;
  type: 'text' | 'number' | 'percent' | 'select' | 'header' | 'textarea' | 'date';
  options?: string[];
  fixedValue?: string; // Defines a preset read-only value for the row
  required?: boolean;
}

export interface SectionConfig {
  title: string;
  arabicTitle?: string;
  id: string; // Added ID to identify Additional Benefits section
  rows: RowConfig[];
}

// --- CRM MODULE TYPES ---

export interface CRMCompany {
  id: string;
  name: string;
  industry?: string;
  createdAt: string;
}

export enum CRMStage {
  NEW = 'New Lead',
  COLLECTING = 'Collecting Required Documents',
  SENT_UW = 'Sent to Underwriting',
  REC_UW = 'Received From Underwriting',
  NEGOTIATION = 'Customer Negotiation',
  WON = 'Won',
  LOST = 'Lost'
}

export enum CRMChannel {
  AGENCY = 'Agency',
  BROKER = 'Broker',
  BROKERAGE = 'Brokerage',
  DIRECT = 'Direct',
  BANCA = 'Banca'
}

export enum CRMProduct {
  LIFE = 'Life',
  MEDILIFE = 'Medilife',
  PENSION = 'Pension',
  CREDIT_LIFE = 'Credit Life'
}

export interface CRMLead {
  id: string;
  title: string;
  expectedPremium: number;
  companyName: string;
  email: string;
  address: string;
  phone: string;
  contactPerson: string;
  jobPosition: string;
  salespersonId: string;
  salespersonName: string;
  tags: string[];
  effectiveDate: string;
  qrfUrl?: string;
  stage: CRMStage;
  
  // Channel Logic
  channel: CRMChannel;
  // If Brokerage
  brokerageName?: string;
  brokerageContactPerson?: string;
  brokerageNumber?: string;
  brokerageEmail?: string;
  // If Broker
  brokerName?: string;
  brokerContactPerson?: string;
  brokerNumber?: string;
  brokerEmail?: string;
  brokerFraCode?: string;

  // Product Logic
  product: CRMProduct;
  // Life Quotes
  initialLifeQuote?: number;
  finalLifeQuote?: number;
  // Medilife Quotes
  initialMedicalQuote?: number;
  initialTotalQuote?: number; // Usually sum of Life + Medical
  finalMedicalQuote?: number;
  finalTotalQuote?: number;

  // Competitive Info
  currentInsurance?: string;
  competitor?: string;
  competitorOffer?: string;
  
  // Outcome
  lostReason?: string;
  
  createdAt: string;
  updatedAt: string;
  
  // Documents
  attachments?: Attachment[];
}
