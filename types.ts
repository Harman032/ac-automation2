
export enum Role {
  ADMIN = 'admin',
  ACCOUNTANT = 'accountant'
}

export enum ComplianceStatus {
  PENDING = 'Pending',
  DOCS_AWAITED = 'Docs Awaited',
  IN_PROGRESS = 'In Progress',
  FILED = 'Filed'
}

export enum ReceivedStatus {
  PENDING = 'Pending',
  RECEIVED = 'Received',
  NOT_REQUIRED = 'Not Required'
}

export interface SystemAlert {
  id: string;
  type: 'overdue' | 'reminder' | 'missing_doc' | 'workload';
  message: string;
  severity: 'high' | 'medium' | 'low';
  link: string;
  timestamp: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
}

export interface Accountant {
  id: number;
  name: string;
  title: string;
  max_capacity: number;
}

export interface Client {
  id: number;
  company_name: string;
  parent_company?: string;
  business_number: string;
  contact_person: string;
  email: string;
  phone: string;
  industry: string;
  fiscal_year_end: string;
  assigned_accountant_id?: number;
  client_status: string;
  engagement_type: string;
  notes?: string;
  created_at: string;
}

export interface ComplianceFiling {
  id: number;
  client_id: number;
  client_name?: string;
  compliance_type: string;
  filing_frequency: string;
  period_start: string;
  period_end: string;
  due_date: string;
  status: ComplianceStatus;
  filed_date?: string;
  filed_by_user_id?: number;
  notes?: string;
}

export interface Statement {
  id: number;
  client_id: number;
  client_name?: string;
  statement_type: 'Bank' | 'Credit Card';
  bank_name: string;
  account_last4: string;
  period_year: number;
  period_month: number;
  expected_date: string;
  received_status: ReceivedStatus;
  received_date?: string;
  file_path?: string;
  notes?: string;
}

export interface DashboardStats {
  pendingFilings: number;
  overdueFilings: number;
  missingStatements: number;
  activeClients: number;
  workloadData: { name: string; count: number; accountantId: number; maxCapacity: number }[];
}
