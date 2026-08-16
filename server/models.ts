import mongoose, { Schema, Document } from 'mongoose';
import { memoryStore, saveLocalBackup, dbStatus } from './db.js';
import crypto from 'crypto';
import { MANDAL_CONFIG } from '../shared/mandalConfig.js';

// -------------------------------------------------------------
// USER MODEL / INTERFACE
// -------------------------------------------------------------
export interface IUser extends Document {
  name: string;
  phone: string;
  role: 'admin' | 'user';
  passwordHash: string;
  activeSessionId: string | null;
  lastLoginAt: string | null;
  lastLoginDevice: string | null;
  lastLoginIp: string | null;
  isActive: boolean;
  canUpdateReceiptStatus: boolean;
  canManageExpenses: boolean;
  createdAt: string;
}

const UserSchema = new Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  passwordHash: { type: String, required: true },
  activeSessionId: { type: String, default: null },
  lastLoginAt: { type: String, default: null },
  lastLoginDevice: { type: String, default: null },
  lastLoginIp: { type: String, default: null },
  isActive: { type: Boolean, default: true },
  canUpdateReceiptStatus: { type: Boolean, default: false },
  canManageExpenses: { type: Boolean, default: false },
  createdAt: { type: String, default: () => new Date().toISOString() },
});

export const MongoUserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

// -------------------------------------------------------------
// PAVTI (DONATION RECEIPT) MODEL / INTERFACE
// -------------------------------------------------------------
export interface IPavti extends Document {
  receiptNo: string; // e.g. RGM-2026-0001
  donorName: string; // दात्याचे नाव
  donorPhone: string; // मोबाईल नंबर
  donorAddress: string; // पत्ता / गल्ली / परिसर
  amount: number; // रक्कम ₹
  amountInWords: string; // अक्षरी रक्कम
  amountInEnglishWords?: string; // अक्षरी रक्कम (English)
  paymentMode: 'cash' | 'upi' | 'online' | 'cheque'; // रोख, युपीआय, ऑनलाईन, धनादेश
  paymentStatus: 'paid' | 'unpaid'; // जमा (Paid) किंवा बाकी/प्रलंबित (Unpaid)
  transactionId?: string; // UPI Ref / UTR / Cheque No
  donationCategory: string; // उत्सव वर्गणी, विशेष देणगी, महाप्रसाद/आरती, मंडप सजावट
  note?: string; // टीप / शेरा
  collectedBy: {
    userId: string;
    name: string;
    role: 'admin' | 'user';
    phone: string;
  };
  date: string; // YYYY-MM-DD
  verified: boolean;
  status: 'active' | 'cancelled';
  cancellationReason?: string;
  cancelledBy?: string;
  qrCodeDataUrl?: string;
  createdAt: string;
  updatedAt: string;
}

const PavtiSchema = new Schema({
  receiptNo: { type: String, required: true, unique: true },
  donorName: { type: String, required: true },
  donorPhone: { type: String, default: '' },
  donorAddress: { type: String, default: '' },
  amount: { type: Number, required: true },
  amountInWords: { type: String, required: true },
  amountInEnglishWords: { type: String, default: '' },
  paymentMode: { type: String, enum: ['cash', 'upi', 'online', 'cheque'], default: 'cash' },
  paymentStatus: { type: String, enum: ['paid', 'unpaid'], default: 'paid' },
  transactionId: { type: String, default: '' },
  donationCategory: { type: String, default: 'उत्सव वर्गणी (Utsav Vargani)' },
  note: { type: String, default: '' },
  collectedBy: {
    userId: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, required: true },
    phone: { type: String, default: '' },
  },
  date: { type: String, default: () => new Date().toISOString().split('T')[0] },
  verified: { type: Boolean, default: true },
  status: { type: String, enum: ['active', 'cancelled'], default: 'active' },
  cancellationReason: { type: String, default: '' },
  cancelledBy: { type: String, default: '' },
  qrCodeDataUrl: { type: String, default: '' },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
});

export const MongoPavtiModel = mongoose.models.Pavti || mongoose.model<IPavti>('Pavti', PavtiSchema);

// -------------------------------------------------------------
// EXPENSE MODEL / INTERFACE (मंडळ खर्च)
// -------------------------------------------------------------
export interface IExpense extends Document {
  expenseNo: string;
  title: string; // खर्चाचे विवरण (उदा. मूर्ती खर्च, ध्वनी व प्रकाश, प्रसाद)
  category: string;
  amount: number;
  paymentMode: string;
  paidTo: string; // कोणाला दिले
  billPhotoUrl?: string;
  recordedBy: {
    userId: string;
    name: string;
  };
  date: string;
  createdAt: string;
}

const ExpenseSchema = new Schema({
  expenseNo: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  category: { type: String, required: true },
  amount: { type: Number, required: true },
  paymentMode: { type: String, default: 'cash' },
  paidTo: { type: String, default: '' },
  billPhotoUrl: { type: String, default: '' },
  recordedBy: {
    userId: { type: String, required: true },
    name: { type: String, required: true },
  },
  date: { type: String, default: () => new Date().toISOString().split('T')[0] },
  createdAt: { type: String, default: () => new Date().toISOString() },
});

export const MongoExpenseModel = mongoose.models.Expense || mongoose.model<IExpense>('Expense', ExpenseSchema);

// -------------------------------------------------------------
// AUDIT LOG MODEL / INTERFACE
// -------------------------------------------------------------
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

export interface IAuditLog extends Document {
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

const AuditLogSchema = new Schema({
  action: { type: String, required: true, index: true },
  entityType: { type: String, required: true, index: true },
  entityId: { type: String, default: '', index: true },
  description: { type: String, required: true },
  actor: {
    userId: { type: String, default: '' },
    name: { type: String, default: 'System' },
    phone: { type: String, default: '' },
    role: { type: String, enum: ['admin', 'user', 'system'], default: 'system' },
  },
  metadata: { type: Schema.Types.Mixed, default: {} },
  ipAddress: { type: String, default: '' },
  userAgent: { type: String, default: '' },
  createdAt: { type: String, default: () => new Date().toISOString(), index: true },
});

export const MongoAuditLogModel = mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

export async function resetMandalData(primaryAdminId: string) {
  if (dbStatus.type === 'mongodb' && mongoose.connection.readyState === 1) {
    const [pavtis, expenses, users] = await Promise.all([
      (MongoPavtiModel as any).deleteMany({}),
      (MongoExpenseModel as any).deleteMany({}),
      (MongoUserModel as any).deleteMany({ _id: { $ne: primaryAdminId } }),
      (MongoAuditLogModel as any).deleteMany({}),
    ]);
    return { pavtis: pavtis.deletedCount || 0, expenses: expenses.deletedCount || 0, users: users.deletedCount || 0 };
  }

  const result = {
    pavtis: memoryStore.pavtis.length,
    expenses: memoryStore.expenses.length,
    users: memoryStore.users.filter((user) => user._id !== primaryAdminId && user.id !== primaryAdminId).length,
  };
  memoryStore.pavtis.splice(0);
  memoryStore.expenses.splice(0);
  memoryStore.auditLogs.splice(0);
  memoryStore.users = memoryStore.users.filter((user) => user._id === primaryAdminId || user.id === primaryAdminId);
  memoryStore.counters.pavtiSeq = 100;
  saveLocalBackup();
  return result;
}

// -------------------------------------------------------------
// UNIFIED DATA ACCESS LAYER (Transparently routes to Mongo or MemoryStore)
// -------------------------------------------------------------

export const UserModel = {
  async findOne(filter: any) {
    if (dbStatus.type === 'mongodb' && mongoose.connection.readyState === 1) {
      return await (MongoUserModel as any).findOne(filter);
    }
    return memoryStore.users.find(u => {
      for (const key of Object.keys(filter)) {
        if (key === '_id' && (u._id === filter[key] || u.id === filter[key])) continue;
        if (u[key] !== filter[key]) return false;
      }
      return true;
    }) || null;
  },

  async findById(id: string) {
    if (dbStatus.type === 'mongodb' && mongoose.connection.readyState === 1) {
      return await (MongoUserModel as any).findById(id);
    }
    return memoryStore.users.find(u => u._id === id || u.id === id) || null;
  },

  async find(filter: any = {}) {
    if (dbStatus.type === 'mongodb' && mongoose.connection.readyState === 1) {
      return await (MongoUserModel as any).find(filter).sort({ createdAt: -1 });
    }
    return memoryStore.users.filter(u => {
      for (const key of Object.keys(filter)) {
        if (u[key] !== filter[key]) return false;
      }
      return true;
    });
  },

  async create(data: any) {
    if (dbStatus.type === 'mongodb' && mongoose.connection.readyState === 1) {
      return await (MongoUserModel as any).create(data);
    }
    const newUser = {
      _id: 'usr_' + crypto.randomUUID().slice(0, 8),
      createdAt: new Date().toISOString(),
      activeSessionId: null,
      lastLoginAt: null,
      lastLoginDevice: null,
      lastLoginIp: null,
      isActive: true,
      ...data,
    };
    memoryStore.users.push(newUser);
    saveLocalBackup();
    return newUser;
  },

  async updateOne(filter: any, update: any) {
    if (dbStatus.type === 'mongodb' && mongoose.connection.readyState === 1) {
      return await (MongoUserModel as any).updateOne(filter, update);
    }
    const index = memoryStore.users.findIndex(u => {
      for (const key of Object.keys(filter)) {
        if (key === '_id' && (u._id === filter[key] || u.id === filter[key])) continue;
        if (u[key] !== filter[key]) return false;
      }
      return true;
    });
    if (index !== -1) {
      const setFields = update.$set || update;
      memoryStore.users[index] = { ...memoryStore.users[index], ...setFields };
      saveLocalBackup();
      return { modifiedCount: 1 };
    }
    return { modifiedCount: 0 };
  },

  async countDocuments(filter: any = {}) {
    if (dbStatus.type === 'mongodb' && mongoose.connection.readyState === 1) {
      return await (MongoUserModel as any).countDocuments(filter);
    }
    return memoryStore.users.length;
  },

  async deleteOne(filter: any) {
    if (dbStatus.type === 'mongodb' && mongoose.connection.readyState === 1) {
      return await (MongoUserModel as any).deleteOne(filter);
    }
    const index = memoryStore.users.findIndex((user) => user._id === filter._id || user.id === filter._id);
    if (index < 0) return { deletedCount: 0 };
    memoryStore.users.splice(index, 1);
    saveLocalBackup();
    return { deletedCount: 1 };
  }
};

export const PavtiModel = {
  async find(filter: any = {}, sort: any = { createdAt: -1 }) {
    if (dbStatus.type === 'mongodb' && mongoose.connection.readyState === 1) {
      return await (MongoPavtiModel as any).find(filter).sort(sort);
    }
    let list = [...memoryStore.pavtis];
    if (filter['collectedBy.userId']) {
      list = list.filter(p => p.collectedBy?.userId === filter['collectedBy.userId']);
    }
    if (filter.status) {
      list = list.filter(p => p.status === filter.status);
    }
    if (filter.paymentMode) {
      list = list.filter(p => p.paymentMode === filter.paymentMode);
    }
    if (filter.date) {
      list = list.filter(p => p.date === filter.date);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async findOne(filter: any) {
    if (dbStatus.type === 'mongodb' && mongoose.connection.readyState === 1) {
      return await (MongoPavtiModel as any).findOne(filter);
    }
    return memoryStore.pavtis.find(p => {
      for (const key of Object.keys(filter)) {
        if (key === '_id' && (p._id === filter[key] || p.id === filter[key])) continue;
        if (p[key] !== filter[key]) return false;
      }
      return true;
    }) || null;
  },

  async findById(id: string) {
    if (dbStatus.type === 'mongodb' && mongoose.connection.readyState === 1) {
      return await (MongoPavtiModel as any).findById(id);
    }
    return memoryStore.pavtis.find(p => p._id === id || p.id === id) || null;
  },

  async create(data: any) {
    if (dbStatus.type === 'mongodb' && mongoose.connection.readyState === 1) {
      return await (MongoPavtiModel as any).create(data);
    }
    const newPavti = {
      _id: 'pvt_' + crypto.randomUUID().slice(0, 8),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active',
      verified: true,
      ...data,
    };
    memoryStore.pavtis.unshift(newPavti);
    saveLocalBackup();
    return newPavti;
  },

  async updateOne(filter: any, update: any) {
    if (dbStatus.type === 'mongodb' && mongoose.connection.readyState === 1) {
      return await (MongoPavtiModel as any).updateOne(filter, update);
    }
    const index = memoryStore.pavtis.findIndex(p => {
      for (const key of Object.keys(filter)) {
        if (key === '_id' && (p._id === filter[key] || p.id === filter[key])) continue;
        if (p[key] !== filter[key]) return false;
      }
      return true;
    });
    if (index !== -1) {
      const setFields = update.$set || update;
      memoryStore.pavtis[index] = { ...memoryStore.pavtis[index], ...setFields, updatedAt: new Date().toISOString() };
      saveLocalBackup();
      return { modifiedCount: 1 };
    }
    return { modifiedCount: 0 };
  },

  async getNextReceiptNo(): Promise<string> {
    const year = new Date().getFullYear();
    let count = 0;
    if (dbStatus.type === 'mongodb' && mongoose.connection.readyState === 1) {
      count = (await (MongoPavtiModel as any).countDocuments()) + 1;
    } else {
      memoryStore.counters.pavtiSeq = (memoryStore.counters.pavtiSeq || 100) + 1;
      count = memoryStore.counters.pavtiSeq;
      saveLocalBackup();
    }
    const padded = String(count).padStart(4, '0');
    return `${MANDAL_CONFIG.receiptPrefix}-${year}-${padded}`;
  }
};

export const ExpenseModel = {
  async find(filter: any = {}) {
    if (dbStatus.type === 'mongodb' && mongoose.connection.readyState === 1) {
      return await (MongoExpenseModel as any).find(filter).sort({ createdAt: -1 });
    }
    return [...memoryStore.expenses].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async create(data: any) {
    if (dbStatus.type === 'mongodb' && mongoose.connection.readyState === 1) {
      const count = (await (MongoExpenseModel as any).countDocuments()) + 1;
      const expenseNo = data.expenseNo || `EXP-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`;
      return await (MongoExpenseModel as any).create({
        ...data,
        expenseNo,
      });
    }
    const count = (memoryStore.expenses.length + 1).toString().padStart(3, '0');
    const newExpense = {
      _id: 'exp_' + crypto.randomUUID().slice(0, 8),
      expenseNo: `EXP-${new Date().getFullYear()}-${count}`,
      createdAt: new Date().toISOString(),
      ...data,
    };
    memoryStore.expenses.unshift(newExpense);
    saveLocalBackup();
    return newExpense;
  },

  async deleteOne(filter: any) {
    if (dbStatus.type === 'mongodb' && mongoose.connection.readyState === 1) {
      return await (MongoExpenseModel as any).deleteOne(filter);
    }
    const index = memoryStore.expenses.findIndex(e => {
      for (const key of Object.keys(filter)) {
        if (key === '_id' && (e._id === filter[key] || e.id === filter[key])) continue;
        if (e[key] !== filter[key]) return false;
      }
      return true;
    });
    if (index !== -1) {
      const removed = memoryStore.expenses.splice(index, 1)[0];
      saveLocalBackup();
      return { deletedCount: 1, expense: removed };
    }
    return { deletedCount: 0 };
  }
};

export const AuditLogModel = {
  async create(data: any) {
    if (dbStatus.type === 'mongodb' && mongoose.connection.readyState === 1) {
      return await (MongoAuditLogModel as any).create(data);
    }
    const log = {
      _id: 'aud_' + crypto.randomUUID().slice(0, 12),
      createdAt: new Date().toISOString(),
      ...data,
    };
    memoryStore.auditLogs.unshift(log);
    memoryStore.auditLogs = memoryStore.auditLogs.slice(0, 2000);
    saveLocalBackup();
    return log;
  },

  async find(filter: any = {}, options: { skip?: number; limit?: number } = {}) {
    const skip = Math.max(0, options.skip || 0);
    const limit = Math.min(200, Math.max(1, options.limit || 50));
    if (dbStatus.type === 'mongodb' && mongoose.connection.readyState === 1) {
      return await (MongoAuditLogModel as any).find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
    }
    let list = [...memoryStore.auditLogs];
    if (filter.action) list = list.filter(log => log.action === filter.action);
    if (filter.entityType) list = list.filter(log => log.entityType === filter.entityType);
    if (filter['actor.userId']) list = list.filter(log => log.actor?.userId === filter['actor.userId']);
    return list
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(skip, skip + limit);
  },

  async countDocuments(filter: any = {}) {
    if (dbStatus.type === 'mongodb' && mongoose.connection.readyState === 1) {
      return await (MongoAuditLogModel as any).countDocuments(filter);
    }
    let list = memoryStore.auditLogs;
    if (filter.action) list = list.filter(log => log.action === filter.action);
    if (filter.entityType) list = list.filter(log => log.entityType === filter.entityType);
    if (filter['actor.userId']) list = list.filter(log => log.actor?.userId === filter['actor.userId']);
    return list.length;
  },
};
