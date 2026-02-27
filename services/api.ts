
import { Client, ComplianceFiling, Statement, DashboardStats, ComplianceStatus, ReceivedStatus, SystemAlert, Accountant } from '../types.ts';

const BASE_URL = 'http://localhost:5000/api';
const STORAGE_KEY = 'can_account_local_db_v1';

// --- MOCK DB LOGIC ---
const getInitialMockData = () => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) return JSON.parse(saved);
  
  return {
    accountants: [
      { id: 1, name: 'John Accountant', title: 'Senior Partner', max_capacity: 12 },
      { id: 2, name: 'Jane Senior', title: 'CPA, Senior Manager', max_capacity: 15 },
      { id: 3, name: 'Bob Junior', title: 'Staff Accountant', max_capacity: 8 }
    ],
    clients: [
      { id: 1, company_name: 'TechFlow Solutions Inc.', business_number: '123456789RT0001', contact_person: 'John Doe', email: 'john@techflow.ca', phone: '416-555-0199', industry: 'Software', fiscal_year_end: 'Dec 31', client_status: 'Active', engagement_type: 'Full Cycle', assigned_accountant_id: 1, created_at: new Date().toISOString() }
    ],
    filings: [
      { id: 1, client_id: 1, compliance_type: 'GST/HST', filing_frequency: 'Quarterly', period_start: '2024-01-01', period_end: '2024-03-31', due_date: '2024-04-30', status: ComplianceStatus.PENDING }
    ],
    statements: [
      { id: 1, client_id: 1, statement_type: 'Bank', bank_name: 'TD Canada Trust', account_last4: '4421', period_year: 2024, period_month: 3, expected_date: '2024-04-05', received_status: ReceivedStatus.PENDING }
    ]
  };
};

let mockDb = getInitialMockData();
const saveMock = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(mockDb));

let isUsingMock = false;

const getHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

async function request<T>(endpoint: string, options: RequestInit = {}, fallback: () => T): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, {
      ...options,
      headers: { ...getHeaders(), ...options.headers },
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('is_auth');
        window.location.hash = '/login';
      }
      throw new Error(`HTTP Error: ${response.status}`);
    }
    isUsingMock = false;
    return response.json();
  } catch (err: any) {
    if (err.name === 'TypeError' || err.message.includes('Failed to fetch')) {
      if (!isUsingMock) {
        console.warn("Backend unavailable. Switching to Local Storage Mode.");
        isUsingMock = true;
      }
      return fallback();
    }
    throw err;
  }
}

export const api = {
  isDemoMode: () => isUsingMock,

  // --- Accountants ---
  getAccountants: (): Promise<Accountant[]> => 
    request<Accountant[]>('/accountants', {}, () => mockDb.accountants),

  // --- Clients ---
  getClients: (): Promise<Client[]> => 
    request<Client[]>('/clients', {}, () => mockDb.clients),

  addClient: (client: any): Promise<Client> => 
    request<Client>('/clients', { method: 'POST', body: JSON.stringify(client) }, () => {
      const newClient = { ...client, id: Date.now(), created_at: new Date().toISOString() };
      mockDb.clients.push(newClient);
      saveMock();
      return newClient;
    }),

  updateClient: (id: number, data: any): Promise<void> => 
    request('/clients/' + id, { method: 'PUT', body: JSON.stringify(data) }, () => {
      mockDb.clients = mockDb.clients.map((c: any) => c.id === id ? { ...c, ...data } : c);
      saveMock();
    }),

  deleteClient: (id: number): Promise<void> => 
    request('/clients/' + id, { method: 'DELETE' }, () => {
      mockDb.clients = mockDb.clients.filter((c: any) => c.id !== id);
      saveMock();
    }),

  // --- Compliance ---
  getFilings: (): Promise<ComplianceFiling[]> => 
    request<ComplianceFiling[]>('/compliance', {}, () => {
      return mockDb.filings.map((f: any) => ({
        ...f,
        client_name: mockDb.clients.find((c: any) => c.id === f.client_id)?.company_name || 'Unknown Entity'
      }));
    }),

  addFiling: (filing: any): Promise<ComplianceFiling> => 
    request<ComplianceFiling>('/compliance', { method: 'POST', body: JSON.stringify(filing) }, () => {
      const newFiling = { ...filing, id: Date.now() };
      mockDb.filings.push(newFiling);
      saveMock();
      return newFiling;
    }),

  updateFiling: (id: number, data: any): Promise<void> => 
    request('/compliance/' + id, { method: 'PUT', body: JSON.stringify(data) }, () => {
      mockDb.filings = mockDb.filings.map((f: any) => f.id === id ? { ...f, ...data } : f);
      saveMock();
    }),

  deleteFiling: (id: number): Promise<void> => 
    request('/compliance/' + id, { method: 'DELETE' }, () => {
      mockDb.filings = mockDb.filings.filter((f: any) => f.id !== id);
      saveMock();
    }),

  // --- Statements ---
  getStatements: (): Promise<Statement[]> => 
    request<Statement[]>('/statements', {}, () => {
      return mockDb.statements.map((s: any) => ({
        ...s,
        client_name: mockDb.clients.find((c: any) => c.id === s.client_id)?.company_name || 'Unknown Entity'
      }));
    }),

  addStatement: (statement: any): Promise<Statement> => 
    request<Statement>('/statements', { method: 'POST', body: JSON.stringify(statement) }, () => {
      const newS = { ...statement, id: Date.now() };
      mockDb.statements.push(newS);
      saveMock();
      return newS;
    }),

  updateStatement: (id: number, data: any): Promise<void> => 
    request('/statements/' + id, { method: 'PUT', body: JSON.stringify(data) }, () => {
      mockDb.statements = mockDb.statements.map((s: any) => s.id === id ? { ...s, ...data } : s);
      saveMock();
    }),

  deleteStatement: (id: number): Promise<void> => 
    request('/statements/' + id, { method: 'DELETE' }, () => {
      mockDb.statements = mockDb.statements.filter((s: any) => s.id !== id);
      saveMock();
    }),

  // --- Dashboard ---
  getStats: (): Promise<DashboardStats> => 
    request<DashboardStats>('/dashboard/stats', {}, () => {
      const today = new Date();
      const overdueF = mockDb.filings.filter((f: any) => f.status !== ComplianceStatus.FILED && new Date(f.due_date) < today).length;
      const pendingF = mockDb.filings.filter((f: any) => f.status === ComplianceStatus.PENDING).length;
      const missingS = mockDb.statements.filter((s: any) => s.received_status === ReceivedStatus.PENDING && new Date(s.expected_date) < today).length;

      const workload = mockDb.accountants.map((acc: Accountant) => ({
        name: acc.name,
        accountantId: acc.id,
        maxCapacity: acc.max_capacity,
        count: mockDb.clients.filter((c: any) => c.assigned_accountant_id === acc.id).length
      }));

      return {
        pendingFilings: pendingF,
        overdueFilings: overdueF,
        missingStatements: missingS,
        activeClients: mockDb.clients.length,
        workloadData: workload
      };
    }),

  getSystemAlerts: (): Promise<SystemAlert[]> => 
    request<SystemAlert[]>('/dashboard/alerts', {}, () => {
      const alerts: SystemAlert[] = [];
      const today = new Date();
      
      mockDb.filings.forEach((f: any) => {
        if (f.status !== ComplianceStatus.FILED && new Date(f.due_date) < today) {
          const client = mockDb.clients.find((c: any) => c.id === f.client_id);
          alerts.push({
            id: `f-${f.id}`,
            type: 'overdue',
            message: `OVERDUE: ${f.compliance_type} for ${client?.company_name || 'Client'}`,
            severity: 'high',
            link: '/compliance',
            timestamp: f.due_date
          });
        }
      });

      mockDb.statements.forEach((s: any) => {
        if (s.received_status === ReceivedStatus.PENDING && new Date(s.expected_date) < today) {
          const client = mockDb.clients.find((c: any) => c.id === s.client_id);
          alerts.push({
            id: `s-${s.id}`,
            type: 'missing_doc',
            message: `MISSING: ${s.bank_name} for ${client?.company_name || 'Client'}`,
            severity: 'high',
            link: '/statements',
            timestamp: s.expected_date
          });
        }
      });

      return alerts;
    }),

  sendBatchReminders: (type: 'statements' | 'compliance'): Promise<number> => 
    request<{count: number}>(`/dashboard/remind/${type}`, { method: 'POST' }, () => {
      // In Mock mode, we simulate sending reminders for whatever is overdue/missing
      const today = new Date();
      let count = 0;
      if (type === 'compliance') {
        count = mockDb.filings.filter((f: any) => f.status !== ComplianceStatus.FILED && new Date(f.due_date) < today).length;
      } else {
        count = mockDb.statements.filter((s: any) => s.received_status === ReceivedStatus.PENDING && new Date(s.expected_date) < today).length;
      }
      return { count }; 
    }).then(res => res.count),
};