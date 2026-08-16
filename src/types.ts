export interface User {
  id: string;
  name: string;
  phone: string;
  role: 'admin' | 'user';
  sessionId?: string;
  lastLoginAt?: string | null;
  lastLoginDevice?: string | null;
  isActive?: boolean;
  hasActiveSession?: boolean;
  canUpdateReceiptStatus?: boolean;
  canManageExpenses?: boolean;
  createdAt?: string;
}

export interface Pavti {
  _id: string;
  receiptNo: string;
  donorName: string;
  donorPhone: string;
  donorAddress: string;
  amount: number;
  amountInWords: string;
  amountInEnglishWords?: string;
  paymentMode: 'cash' | 'upi' | 'online' | 'cheque';
  paymentStatus: 'paid' | 'unpaid';
  transactionId?: string;
  donationCategory: string;
  note?: string;
  collectedBy: {
    userId: string;
    name: string;
    role: 'admin' | 'user';
    phone?: string;
  };
  date: string;
  verified: boolean;
  status: 'active' | 'cancelled';
  cancellationReason?: string;
  cancelledBy?: string;
  qrCodeDataUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Expense {
  _id: string;
  expenseNo: string;
  title: string;
  category: string;
  amount: number;
  paymentMode: string;
  paidTo: string;
  billPhotoUrl?: string;
  recordedBy: {
    userId: string;
    name: string;
  };
  date: string;
  createdAt: string;
}

export interface CollectorStat {
  userId: string;
  name: string;
  role: string;
  phone: string;
  totalAmount: number;
  paidAmount?: number;
  unpaidAmount?: number;
  paidCount?: number;
  unpaidCount?: number;
  totalCount: number;
  todayAmount: number;
  todayCount: number;
  modes: {
    cash: number;
    upi: number;
    online: number;
    cheque: number;
  };
  modesCount?: {
    cash: number;
    upi: number;
    online: number;
    cheque: number;
  };
}

export interface CalculationsData {
  mandalTotal: {
    totalAmount: number;
    paidAmount: number;
    unpaidAmount: number;
    paidCount: number;
    unpaidCount: number;
    totalReceipts: number;
    todayAmount: number;
    todayPaidAmount: number;
    todayUnpaidAmount: number;
    todayCount: number;
    totalExpenses: number;
    balanceInHand: number;
    date: string;
  };
  paymentModes: {
    cash: { amount: number; count: number };
    upi: { amount: number; count: number };
    online: { amount: number; count: number };
    cheque: { amount: number; count: number };
  };
  categories: {
    [key: string]: { amount: number; count: number };
  };
  collectors: CollectorStat[];
  userPersonalStats: CollectorStat & {
    mandalContributionPercentage: string;
  };
  userRole: 'admin' | 'user';
  lastUpdated: string;
}

export interface DbStatusData {
  connected: boolean;
  engine: string;
  type: 'mongodb' | 'local_fallback';
  dbName: string;
  uriConfigured: boolean;
  collections: {
    users: number;
    pavtis: number;
    expenses: number;
    auditLogs?: number;
  };
  error?: string | null;
  timestamp: string;
}

export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DELETED'
  | 'USER_FORCE_LOGOUT'
  | 'PAVTI_CREATED'
  | 'PAVTI_PAYMENT_STATUS_CHANGED'
  | 'PAVTI_CANCELLED'
  | 'EXPENSE_CREATED'
  | 'EXPENSE_DELETED'
  | 'RECEIPTS_REPORT_EXPORTED'
  | 'EXPENSES_REPORT_EXPORTED'
  | 'PAVTI_PNG_EXPORTED'
  | 'PAVTI_PDF_EXPORTED'
  | 'EXPENSE_VOUCHER_PRINTED'
  | 'MANDAL_DATA_RESET';

export interface AuditLog {
  _id: string;
  action: AuditAction;
  entityType: 'auth' | 'user' | 'pavti' | 'expense';
  entityId: string;
  description: string;
  actor: {
    userId: string;
    name: string;
    phone: string;
    role: 'admin' | 'user' | 'system';
  };
  metadata: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}
