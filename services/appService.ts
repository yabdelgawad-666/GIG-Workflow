
import { User, QRF, UserRole, QRFStatus, SystemLog, CRMLead, CRMStage, CRMCompany } from '../types';
import { INITIAL_USERS, INITIAL_QRFS, INITIAL_LOGS, INITIAL_CRM_LEADS, INITIAL_COMPANIES } from './mockData';

const STORAGE_KEYS = {
  USERS: 'gig_users_v1',
  QRFS: 'gig_qrfs_v1',
  LOGS: 'gig_logs_v1',
  LEADS: 'gig_crm_leads_v1',
  COMPANIES: 'gig_crm_companies_v1'
};

// --- CONFIGURATION ---
// CHANGE THIS TO TRUE IF YOU HAVE THE NODE.JS SERVER RUNNING
const USE_MYSQL_BACKEND = false; 
const API_BASE_URL = 'http://localhost:3001/api';

class AppService {
  private users: User[] = [];
  private qrfs: QRF[] = [];
  private logs: SystemLog[] = [];
  private leads: CRMLead[] = [];
  private companies: CRMCompany[] = [];
  private currentUser: User | null = null;

  constructor() {
    if (!USE_MYSQL_BACKEND) {
        this.loadFromStorage();
    }
  }

  // --- LOCAL STORAGE METHODS (Legacy/Fallback) ---
  private loadFromStorage() {
    try {
        const storedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
        const storedQrfs = localStorage.getItem(STORAGE_KEYS.QRFS);
        const storedLogs = localStorage.getItem(STORAGE_KEYS.LOGS);
        const storedLeads = localStorage.getItem(STORAGE_KEYS.LEADS);
        const storedCompanies = localStorage.getItem(STORAGE_KEYS.COMPANIES);

        this.users = storedUsers ? JSON.parse(storedUsers) : [...INITIAL_USERS];
        this.qrfs = storedQrfs ? JSON.parse(storedQrfs) : [...INITIAL_QRFS];
        this.logs = storedLogs ? JSON.parse(storedLogs) : [...INITIAL_LOGS];
        this.leads = storedLeads ? JSON.parse(storedLeads) : [...INITIAL_CRM_LEADS];
        this.companies = storedCompanies ? JSON.parse(storedCompanies) : [...INITIAL_COMPANIES];
    } catch (e) {
        console.error("Storage corruption detected, resetting to defaults", e);
        this.users = [...INITIAL_USERS];
        this.qrfs = [...INITIAL_QRFS];
        this.logs = [...INITIAL_LOGS];
        this.leads = [...INITIAL_CRM_LEADS];
        this.companies = [...INITIAL_COMPANIES];
    }
  }

  private saveToStorage() {
    if (USE_MYSQL_BACKEND) return;
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(this.users));
    localStorage.setItem(STORAGE_KEYS.QRFS, JSON.stringify(this.qrfs));
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(this.logs));
    localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(this.leads));
    localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(this.companies));
  }

  // --- API HELPER ---
  private async apiCall(endpoint: string, method: string = 'GET', body?: any) {
    try {
        const options: RequestInit = {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: body ? JSON.stringify(body) : undefined
        };
        const res = await fetch(`${API_BASE_URL}${endpoint}`, options);
        if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
        return await res.json();
    } catch (e) {
        console.error('API Call Failed:', e);
        throw e;
    }
  }

  // --- LOGGING SYSTEM ---
  private async addLog(action: string, details: string) {
    if (!this.currentUser) return;

    const newLog: SystemLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      userId: this.currentUser.id,
      userName: this.currentUser.fullName,
      userRole: this.currentUser.role,
      action: action,
      details: details,
      ipAddress: '127.0.0.1'
    };

    if (USE_MYSQL_BACKEND) {
        try { await this.apiCall('/logs', 'POST', newLog); } catch (e) { console.error('Failed to save log'); }
    } else {
        this.logs.unshift(newLog);
        this.saveToStorage();
    }
  }

  // Public method to allow manual logging from UI components
  public async logActivity(action: string, details: string) {
      await this.addLog(action, details);
  }

  // --- AUTH ---
  async login(username: string, password?: string): Promise<User | undefined> {
    if (USE_MYSQL_BACKEND) {
        try {
            const user = await this.apiCall('/login', 'POST', { username, password });
            this.currentUser = user;
            await this.addLog('Login', 'User logged into the system');
            return user;
        } catch (e) {
            return undefined;
        }
    } else {
        return new Promise((resolve) => {
            setTimeout(() => {
                this.loadFromStorage();
                const user = this.users.find(u => u.username === username);
                if (user && user.password === password) {
                    this.currentUser = user;
                    user.lastLogin = new Date().toISOString();
                    this.saveToStorage();
                    this.addLog('Login', 'User logged into the system');
                    resolve(user);
                } else {
                    resolve(undefined);
                }
            }, 500);
        });
    }
  }

  logout() {
    if (this.currentUser) {
        this.addLog('Logout', 'User logged out');
    }
    this.currentUser = null;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  // --- DEV HELPERS ---
  getDevUsers(): User[] {
    return this.users; // Even in API mode, we might want to cache this for the login screen quick-access
  }

  // --- USER MANAGEMENT ---
  async createUser(fullName: string, username: string, password?: string, role: UserRole = UserRole.AGENT): Promise<User> {
    const newUser: User = {
      id: `u${Date.now()}`,
      username,
      password: password || 'pass123',
      fullName,
      role,
      lastLogin: null as any
    };

    if (USE_MYSQL_BACKEND) {
        await this.apiCall('/users', 'POST', newUser);
    } else {
        this.users.push(newUser);
        this.saveToStorage();
    }
    
    this.addLog('Create User', `Created user: ${username} (${role})`);
    return newUser;
  }

  async updateUser(user: User): Promise<User> {
    if (USE_MYSQL_BACKEND) {
        await this.apiCall('/users', 'POST', user); // Using POST as upsert
    } else {
        const index = this.users.findIndex(u => u.id === user.id);
        if (index !== -1) {
            this.users[index] = user;
            this.saveToStorage();
        }
    }
    this.addLog('Update User', `Updated profile for: ${user.username}`);
    return user;
  }

  async getAgents(): Promise<User[]> {
    if (USE_MYSQL_BACKEND) {
        const all = await this.getAllUsers();
        return all.filter(u => u.role === UserRole.AGENT);
    }
    this.loadFromStorage();
    return this.users.filter(u => u.role === UserRole.AGENT);
  }

  async getUnderwriters(): Promise<User[]> {
    if (USE_MYSQL_BACKEND) {
        const all = await this.getAllUsers();
        return all.filter(u => u.role === UserRole.UNDERWRITER);
    }
    this.loadFromStorage();
    return this.users.filter(u => u.role === UserRole.UNDERWRITER);
  }

  async getAllUsers(): Promise<User[]> {
    if (USE_MYSQL_BACKEND) {
        this.users = await this.apiCall('/users'); // Cache locally for dev helpers
        return this.users;
    }
    this.loadFromStorage();
    return this.users;
  }

  // --- QRF MANAGEMENT ---
  async getQRFs(userId?: string): Promise<QRF[]> {
    if (USE_MYSQL_BACKEND) {
        let qrfs = await this.apiCall('/qrfs');
        if (userId) {
            qrfs = qrfs.filter((q: QRF) => q.agentId === userId || q.assignedToId === userId);
        }
        return qrfs;
    } else {
        return new Promise((resolve) => {
            setTimeout(() => {
                this.loadFromStorage();
                if (userId) {
                    resolve(this.qrfs.filter(q => q.agentId === userId || q.assignedToId === userId));
                } else {
                    resolve(this.qrfs);
                }
            }, 400);
        });
    }
  }

  async saveQRF(qrf: QRF): Promise<QRF> {
    // Ensure freshness to avoid race conditions or overwriting with stale data
    if (!USE_MYSQL_BACKEND) {
        this.loadFromStorage();
    }

    const isNew = !qrf.submittedAt && !qrf.createdAt; // Rough check
    const now = new Date().toISOString();
    
    // Logic determination (Same for both methods)
    // We need to fetch the "old" QRF to compare if updating
    let oldQrf: QRF | undefined;
    
    if (USE_MYSQL_BACKEND) {
        const currentQrfs = await this.apiCall('/qrfs');
        oldQrf = currentQrfs.find((q: QRF) => q.id === qrf.id);
    } else {
        oldQrf = this.qrfs.find(q => q.id === qrf.id);
    }

    if (oldQrf) {
          // --- UPDATE LOGIC ---
          // Preserve critical fields
          if (!qrf.referenceNumber) qrf.referenceNumber = oldQrf.referenceNumber;

          // Logic: Assignment Change
          if (!oldQrf.assignedToId && qrf.assignedToId) {
             qrf.assignedAt = now;
             this.addLog('Assign Underwriter', `Assigned ${qrf.referenceNumber} to ${qrf.assignedToName}`);
          } else if (oldQrf.assignedToId && qrf.assignedToId && oldQrf.assignedToId !== qrf.assignedToId) {
             qrf.assignedAt = now;
             this.addLog('Re-Assign Underwriter', `Re-assigned ${qrf.referenceNumber} from ${oldQrf.assignedToName} to ${qrf.assignedToName}`);
          } else {
            qrf.assignedAt = oldQrf.assignedAt;
          }

          // Logic: Decision Made
          if ((qrf.status === QRFStatus.APPROVED || qrf.status === QRFStatus.REJECTED) && oldQrf.status !== qrf.status) {
            qrf.decidedAt = now;
            const action = qrf.status === QRFStatus.APPROVED ? 'Approve QRF' : 'Reject QRF';
            this.addLog(action, `${action} ${qrf.referenceNumber}`);
            
            // Push to History logic (Mock only) - In real backend, this is handled by preserving state snapshot
            if (!qrf.history) qrf.history = [];
            if (oldQrf.history) qrf.history = [...oldQrf.history];
            
            // If rejecting, we are adding a cycle
            if (qrf.status === QRFStatus.REJECTED) {
                // history typically tracks previous states. 
                // Currently just logging current transition.
            }
          } else if (qrf.status === QRFStatus.SUBMITTED && oldQrf.status !== QRFStatus.SUBMITTED) {
             // Re-submission or Draft->Submit
             qrf.decidedAt = undefined;
             this.addLog('Submit QRF', `Submitted ${qrf.referenceNumber} for review`);
             
             // If it was Rejected before, add the rejection to history now that we are moving forward
             if (oldQrf.status === QRFStatus.REJECTED) {
                 if (!qrf.history) qrf.history = [];
                 qrf.history.push({
                     status: QRFStatus.REJECTED,
                     submittedAt: oldQrf.submittedAt, // The previous submission date
                     decidedAt: oldQrf.decidedAt,
                     assignedToName: oldQrf.assignedToName,
                     assignedAt: oldQrf.assignedAt,
                     rejectionReason: oldQrf.rejectionReason
                 });
             }
          } else {
             qrf.decidedAt = oldQrf.decidedAt;
             if (oldQrf.history) qrf.history = oldQrf.history;
          }
          if (qrf.isLocked === undefined) qrf.isLocked = oldQrf.isLocked;
    } else {
        // --- CREATE NEW ---
        qrf.referenceNumber = this.generateNextReferenceNumber();
        qrf.isLocked = false;
        this.addLog('Create QRF', `Created new eQRF: ${qrf.referenceNumber}`);
    }

    if (USE_MYSQL_BACKEND) {
        await this.apiCall('/qrfs', 'POST', qrf);
        return qrf;
    } else {
        // CRITICAL FIX: Save synchronously BEFORE the mock timeout.
        // This ensures data persists even if the browser/tab is closed immediately after clicking save.
        const index = this.qrfs.findIndex(q => q.id === qrf.id);
        if (index >= 0) this.qrfs[index] = qrf;
        else this.qrfs.push(qrf);
        this.saveToStorage();

        return new Promise((resolve) => {
             setTimeout(() => {
                 resolve(qrf);
             }, 600);
        });
    }
  }

  async toggleLock(qrfId: string, isLocked: boolean): Promise<QRF | undefined> {
    // This requires fetching, updating, and saving
    let qrf: QRF | undefined;
    if (USE_MYSQL_BACKEND) {
        const qrfs = await this.apiCall('/qrfs');
        qrf = qrfs.find((q: QRF) => q.id === qrfId);
    } else {
        qrf = this.qrfs.find(q => q.id === qrfId);
    }

    if (qrf) {
        qrf.isLocked = isLocked;
        await this.saveQRF(qrf);
        if (!isLocked) {
            this.addLog('Unlock QRF', `Unlocked ${qrf.referenceNumber} for re-assignment`);
        }
        return qrf;
    }
    return undefined;
  }

  private generateNextReferenceNumber(): string {
    const refs = this.qrfs.map(q => q.referenceNumber).filter(Boolean).sort();
    const lastRef = refs.length > 0 ? refs[refs.length - 1] : '00000';

    if (/^\d+$/.test(lastRef)) {
      const num = parseInt(lastRef, 10);
      if (num < 99999) {
        return (num + 1).toString().padStart(5, '0');
      } else {
        return 'A0001';
      }
    } else {
      const prefix = lastRef.charAt(0);
      const numPart = lastRef.substring(1);
      const num = parseInt(numPart, 10);
      if (num < 9999) {
        return `${prefix}${(num + 1).toString().padStart(4, '0')}`;
      } else {
        const nextPrefix = String.fromCharCode(prefix.charCodeAt(0) + 1);
        return `${nextPrefix}0001`;
      }
    }
  }

  async getNotificationCounts(user: User): Promise<number> {
    if (USE_MYSQL_BACKEND) {
        const qrfs = await this.getQRFs();
        if (user.role === UserRole.AGENT) {
            // Count Active (Not Approved) -> Draft + Submitted + Rejected
            return qrfs.filter(q => q.agentId === user.id && q.status !== QRFStatus.APPROVED).length;
        } else if (user.role === UserRole.UNDERWRITER) {
            return qrfs.filter(q => q.assignedToId === user.id && q.status === QRFStatus.SUBMITTED).length;
        }
        return 0;
    } else {
        return new Promise((resolve) => {
            setTimeout(() => {
                this.loadFromStorage();
                let count = 0;
                if (user.role === UserRole.AGENT) {
                    // Count Active (Not Approved) -> Draft + Submitted + Rejected
                    count = this.qrfs.filter(q => q.agentId === user.id && q.status !== QRFStatus.APPROVED).length;
                } else if (user.role === UserRole.UNDERWRITER) {
                    count = this.qrfs.filter(q => q.assignedToId === user.id && q.status === QRFStatus.SUBMITTED).length;
                }
                resolve(count);
            }, 300);
        });
    }
  }

  generateLink(qrfId: string): string {
    // Robust link generation using current base URL
    // This splits at the hash to get the base "http://host:port/" or "http://host/path/" part
    const baseUrl = window.location.href.split('#')[0];
    // Ensure we don't end up with double slashes if baseUrl ends with /
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    return `${cleanBase}/#/qrf/edit/${qrfId}`;
  }

  async getSystemLogs(user: User): Promise<SystemLog[]> {
     if (USE_MYSQL_BACKEND) {
         let logs = await this.apiCall('/logs');
         // Basic role filtering (Mocking security)
         if (user.role === UserRole.SUPER_ADMIN) return logs;
         if (user.role === UserRole.ADMIN) return logs.filter((l:SystemLog) => l.userRole === UserRole.AGENT || l.userId === user.id || l.userRole === UserRole.ADMIN);
         if (user.role === UserRole.UW_ADMIN) return logs.filter((l:SystemLog) => l.userRole === UserRole.UNDERWRITER || l.userId === user.id || l.userRole === UserRole.UW_ADMIN);
         return logs.filter((l:SystemLog) => l.userId === user.id);
     } else {
        return new Promise((resolve) => {
            setTimeout(() => {
            this.loadFromStorage();
            if (user.role === UserRole.SUPER_ADMIN) {
                resolve(this.logs);
            } else if (user.role === UserRole.ADMIN) {
                resolve(this.logs.filter(l => l.userRole === UserRole.AGENT || l.userId === user.id || l.userRole === UserRole.ADMIN));
            } else if (user.role === UserRole.UW_ADMIN) {
                resolve(this.logs.filter(l => l.userRole === UserRole.UNDERWRITER || l.userId === user.id || l.userRole === UserRole.UW_ADMIN));
            } else {
                resolve(this.logs.filter(l => l.userId === user.id));
            }
            }, 400);
        });
     }
  }

  // --- CRM LEADS MANAGEMENT ---
  async getCRMLeads(userId?: string): Promise<CRMLead[]> {
    if (USE_MYSQL_BACKEND) {
        // Assume API endpoints exist
        return []; 
    } else {
        return new Promise((resolve) => {
            setTimeout(() => {
                this.loadFromStorage();
                // Filter logic can be added here if needed, typically all sales see all leads or just theirs
                // For now returning all, usually filtered by role in UI
                resolve(this.leads);
            }, 300);
        });
    }
  }

  async saveCRMLead(lead: CRMLead): Promise<CRMLead> {
    if (!USE_MYSQL_BACKEND) {
        this.loadFromStorage();
        const index = this.leads.findIndex(l => l.id === lead.id);
        
        if (index >= 0) {
            const oldLead = this.leads[index];
            let action = 'Update Lead';
            let details = `Updated Lead: ${lead.title}`;

            // Smart Logging for CRM Activities
            if (oldLead.stage !== lead.stage) {
                 if (lead.stage === CRMStage.WON) {
                     action = 'Lead Won';
                     details = `Won deal: ${lead.title} (${lead.companyName}) - Value: ${lead.expectedPremium}`;
                 } else if (lead.stage === CRMStage.LOST) {
                     action = 'Lead Lost';
                     details = `Lost deal: ${lead.title} (${lead.companyName})`;
                 } else {
                     action = 'Lead Stage Change';
                     details = `Moved ${lead.title} to ${lead.stage}`;
                 }
            } else if ((oldLead.attachments?.length || 0) !== (lead.attachments?.length || 0)) {
                 action = 'Lead Document Update';
                 details = `Documents updated for ${lead.title}`;
            }

            this.leads[index] = lead;
            this.addLog(action, details);
        } else {
            this.leads.push(lead);
            this.addLog('Create Lead', `Created Lead: ${lead.title} (${lead.companyName})`);
        }
        this.saveToStorage();
        return lead;
    }
    // Mock return for backend
    return lead;
  }

  // --- COMPANY DATABASE & FUZZY LOGIC ---
  async getCompanies(): Promise<CRMCompany[]> {
      if (USE_MYSQL_BACKEND) {
          // fetch from API
          return [];
      }
      this.loadFromStorage();
      return this.companies;
  }

  async addCompany(name: string): Promise<CRMCompany> {
      const newCompany: CRMCompany = {
          id: `c_${Date.now()}`,
          name: name.trim(),
          createdAt: new Date().toISOString()
      };
      
      if (!USE_MYSQL_BACKEND) {
          this.companies.push(newCompany);
          this.saveToStorage();
          this.addLog('Add Company', `Added new company to DB: ${name}`);
      }
      return newCompany;
  }

  // Levenshtein Distance Algorithm
  private levenshteinDistance(a: string, b: string): number {
      if (a.length === 0) return b.length;
      if (b.length === 0) return a.length;

      const matrix = [];

      // increment along the first column of each row
      for (let i = 0; i <= b.length; i++) {
          matrix[i] = [i];
      }

      // increment each column in the first row
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
  }

  async findSimilarCompany(name: string): Promise<CRMCompany | null> {
      const allCompanies = await this.getCompanies();
      const target = name.toLowerCase().trim();
      
      if (!target) return null;

      // Exact match check first
      const exact = allCompanies.find(c => c.name.toLowerCase() === target);
      if (exact) return exact;

      // Fuzzy match
      // Threshold: distance <= 2 for short strings, or roughly 20% length for longer ones
      for (const company of allCompanies) {
          const source = company.name.toLowerCase();
          const dist = this.levenshteinDistance(target, source);
          
          const threshold = Math.max(2, Math.floor(source.length * 0.3)); // 30% allowance or 2 chars
          
          if (dist <= threshold) {
              return company;
          }
      }
      return null;
  }
}

export const appService = new AppService();
