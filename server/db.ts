import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import dns from 'node:dns';
import { MANDAL_CONFIG } from '../shared/mandalConfig.js';

// Local backup storage file path if MongoDB URI is not active
const DATA_DIR = path.join(process.cwd(), 'data');
const BACKUP_FILE = path.join(DATA_DIR, 'mandal_db.json');

export interface IDbStatus {
  connected: boolean;
  type: 'mongodb' | 'local_fallback';
  uriConfigured: boolean;
  dbName: string;
  error?: string;
}

export let dbStatus: IDbStatus = {
  connected: false,
  type: 'local_fallback',
  uriConfigured: false,
  dbName: MANDAL_CONFIG.databaseName,
};

// In-Memory Storage Engine for reliable fallback & high speed
export const memoryStore = {
  users: [] as any[],
  pavtis: [] as any[],
  expenses: [] as any[],
  auditLogs: [] as any[],
  counters: { pavtiSeq: 100 } as { [key: string]: number },
};

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function loadLocalBackup() {
  try {
    ensureDataDir();
    if (fs.existsSync(BACKUP_FILE)) {
      const data = JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf8'));
      memoryStore.users = data.users || [];
      memoryStore.pavtis = data.pavtis || [];
      memoryStore.expenses = data.expenses || [];
      memoryStore.auditLogs = data.auditLogs || [];
      memoryStore.counters = data.counters || { pavtiSeq: 100 };
      console.log(`[DB] Loaded ${memoryStore.users.length} users, ${memoryStore.pavtis.length} pavtis from local persistent store.`);
    }
  } catch (err) {
    console.error('[DB] Error loading local backup:', err);
  }
}

export function saveLocalBackup() {
  try {
    ensureDataDir();
    fs.writeFileSync(BACKUP_FILE, JSON.stringify(memoryStore, null, 2), 'utf8');
  } catch (err) {
    console.error('[DB] Error saving local backup:', err);
  }
}

export async function connectDatabase() {
  // Node's resolver may prefer an unreachable IPv6 DNS server on some Windows
  // networks. Use reachable IPv4 resolvers for MongoDB Atlas SRV lookups.
  dns.setServers(['1.1.1.1', '1.0.0.1']);

  loadLocalBackup();

  let mongoUri = (process.env.MONGODB_URI || '').trim().replace(/^["']|["']$/g, '').replace(/\r?\n/g, '').trim();
  if (!mongoUri || mongoUri.includes('<username>') || mongoUri.includes('cluster0.mongodb.net/mandal_db')) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('A valid MONGODB_URI is required in production. Local fallback storage is not persistent on cloud hosting.');
    }
    console.log('[DB] MONGODB_URI not set or contains placeholder. Using robust persistent store.');
    dbStatus = {
      connected: true,
      type: 'local_fallback',
      uriConfigured: Boolean(mongoUri && !mongoUri.includes('<username>')),
      dbName: `${MANDAL_CONFIG.databaseName} (Persistent Local)`,
    };
    return;
  }

  try {
    dbStatus.uriConfigured = true;
    console.log(`[DB] Connecting to MongoDB...`);
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 7000,
      dbName: MANDAL_CONFIG.databaseName,
    });
    dbStatus.connected = true;
    dbStatus.type = 'mongodb';
    dbStatus.dbName = mongoose.connection.name || MANDAL_CONFIG.databaseName;
    console.log(`[DB] Connected successfully to MongoDB: ${dbStatus.dbName}`);
  } catch (err: any) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`MongoDB connection failed in production: ${err.message}`);
    }
    console.warn(`[DB] MongoDB connection warning: ${err.message}. Seamlessly falling back to persistent local storage.`);
    dbStatus = {
      connected: true,
      type: 'local_fallback',
      uriConfigured: true,
      dbName: `${MANDAL_CONFIG.databaseName} (Local Fallback)`,
      error: err.message,
    };
  }
}
