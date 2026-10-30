import { initializeApp } from 'firebase/app';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  CACHE_SIZE_UNLIMITED,
  writeBatch,
  limit,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  runTransaction,
  increment,
  getDocs,
  setLogLevel,
  getDoc,
  updateDoc
} from 'firebase/firestore';
import { 
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  updatePassword,
  reauthenticateWithPopup,
  signInAnonymously
} from 'firebase/auth';
import { Cari, Stock, Transaction, Expense, Employee, EmployeeTransaction, RecurringTransaction } from './types';
import { OnlineMarketOrder, OnlineMarketPayout } from './types/onlineMarket';
import { PosPlatformConfig } from './types/pos';
import { getFirebaseConfigurationError } from './utils/firebaseProjectGuard.js';


const firebaseEnvironment = import.meta.env;
export const firebaseConfigurationError = getFirebaseConfigurationError(firebaseEnvironment);
export const isFirebaseConfigured = !firebaseConfigurationError;

// Never initialize against partial, stale, or shared project settings. This
// also prevents a cached auth session from connecting to the other app's project.
const firebaseConfig = isFirebaseConfigured ? {
  apiKey: firebaseEnvironment.VITE_FIREBASE_API_KEY,
  authDomain: firebaseEnvironment.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: firebaseEnvironment.VITE_FIREBASE_PROJECT_ID,
  storageBucket: firebaseEnvironment.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: firebaseEnvironment.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: firebaseEnvironment.VITE_FIREBASE_APP_ID,
} : {
  apiKey: 'not-configured',
  authDomain: 'not-configured.invalid',
  projectId: 'storm-plus-unconfigured',
  storageBucket: 'storm-plus-unconfigured.invalid',
  messagingSenderId: '0',
  appId: '1:0:web:unconfigured',
};

const app = initializeApp(firebaseConfig);

// Suppress Firestore offline connection warnings in console
setLogLevel('silent');

// Using custom database ID provisioned for AI Studio with deep offline persistence
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
    cacheSizeBytes: CACHE_SIZE_UNLIMITED
  })
}, isFirebaseConfigured ? firebaseEnvironment.VITE_FIREBASE_DATABASE_ID : '(default)');
export const auth = getAuth();

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  updatePassword,
  signInAnonymously
};
export type { User };

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}

export async function reauthenticateWithGoogle() {
  const user = auth.currentUser;
  if (!user) throw new Error("Oturum açmış kullanıcı bulunamadı.");
  const provider = new GoogleAuthProvider();
  return reauthenticateWithPopup(user, provider);
}

// Collection References
const CARILER_COLL = 'cariler';
const STOKLAR_COLL = 'stoklar';
const ISLEMLER_COLL = 'islemler';
const GIDERLER_COLL = 'giderler';
const CALISANLAR_COLL = 'calisanlar';
const CALISAN_ISLEMLER_COLL = 'calisanIslemler';
const HESAPLAR_COLL = 'hesaplar';
const HESAP_ISLEMLER_COLL = 'hesapIslemleri';
const TEKRARLAYAN_COLL = 'tekrarlayanIslemler';
const ONLINE_ORDERS_COLL = 'onlineOrders';
const ONLINE_PAYOUTS_COLL = 'onlinePayouts';
const POS_PLATFORMS_COLL = 'posPlatforms';
const SETTINGS_COLL = 'settings';


let currentUserId: string | null = null;
export function setActiveUser(userId: string | null) {
  currentUserId = userId;
}

export function getActiveWorkspace(): string {
  // Always force 'default' workspace so Web and Desktop are guaranteed to use the same path.
  // We ignore localStorage so that legacy cached values do not split the database.
  return 'default';
}

export function setActiveWorkspace(workspace: string) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('storm_app_workspace', workspace);
    window.dispatchEvent(new Event('storm_workspace_changed'));
  }
}

// Multi-tenant path helper with automatic domain/workspace isolation
function getPath(collectionName: string): string {
  if (!currentUserId) {
    throw new Error("Kullanıcı seçilmedi. Lütfen giriş yapın.");
  }
  const ws = getActiveWorkspace();
  if (ws && ws !== 'default') {
    return `storm_plus_users/${currentUserId}_${ws}/${collectionName}`;
  }
  return `storm_plus_users/${currentUserId}/${collectionName}`;
}

// Helper to recursively remove undefined properties from objects to prevent Firestore write errors
function cleanUndefined<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => cleanUndefined(item)) as unknown as T;
  }
  
  const cleaned: any = {};
  for (const key of Object.keys(obj as any)) {
    const val = (obj as any)[key];
    if (val !== undefined) {
      cleaned[key] = cleanUndefined(val);
    }
  }
  return cleaned;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {

  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  throw error;
}

// Real-time Subscriptions
// Real-time Subscriptions
export function subscribeCariler(callback: (cariler: Cari[]) => void) {
  const q = query(collection(db, getPath(CARILER_COLL)), orderBy('name', 'asc'), limit(500));
  return onSnapshot(q, (snapshot) => {
    const list: Cari[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as Cari);
    });
    callback(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, getPath(CARILER_COLL));
  });
}

export function subscribeStoklar(callback: (stoklar: Stock[]) => void) {
  const q = query(collection(db, getPath(STOKLAR_COLL)), orderBy('name', 'asc'), limit(500));
  return onSnapshot(q, (snapshot) => {
    const list: Stock[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as Stock);
    });
    callback(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, getPath(STOKLAR_COLL));
  });
}

export function subscribeIslemler(callback: (islemler: Transaction[]) => void) {
  const q = query(collection(db, getPath(ISLEMLER_COLL)), orderBy('date', 'desc'), limit(500));
  return onSnapshot(q, (snapshot) => {
    const list: Transaction[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as Transaction);
    });

    list.sort((a, b) => {
      const dateA = a.date || "";
      const dateB = b.date || "";
      const dateCompare = dateB.localeCompare(dateA);
      if (dateCompare !== 0) return dateCompare;
      
      const timeA = new Date(a.createdAt || a.date).getTime();
      const timeB = new Date(b.createdAt || b.date).getTime();
      if (!isNaN(timeA) && !isNaN(timeB) && timeA !== timeB) return timeB - timeA;
      
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });

    callback(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, getPath(ISLEMLER_COLL));
  });
}

// CARI OPERATIONS
export async function saveCari(cari: Omit<Cari, 'id'>, id?: string) {
  try {
    const docRef = id ? doc(db, getPath(CARILER_COLL), id) : doc(collection(db, getPath(CARILER_COLL)));
    const newId = id || docRef.id;
    
    // Balance equals opening balance initially if editing doesn't override
    const finalCari: Cari = cleanUndefined({
      id: newId,
      ...cari,
      balance: id ? cari.balance : cari.openingBalance, // Keep balance if editing, use openingBalance if creating
    });
    
    await setDoc(docRef, finalCari);
    return newId;
  } catch (error) {
    handleFirestoreError(error, id ? OperationType.UPDATE : OperationType.CREATE, `${getPath(CARILER_COLL)}/${id || 'new'}`);
  throw error;
  }
}

export async function deleteCari(id: string) {
  try {
    await deleteDoc(doc(db, getPath(CARILER_COLL), id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${getPath(CARILER_COLL)}/${id}`);
  throw error;
  }
}

// STOCK OPERATIONS
export async function saveStock(stock: Omit<Stock, 'id'>, id?: string) {
  try {
    const docRef = id ? doc(db, getPath(STOKLAR_COLL), id) : doc(collection(db, getPath(STOKLAR_COLL)));
    const newId = id || docRef.id;
    const finalStock: Stock = cleanUndefined({
      id: newId,
      ...stock
    });
    await setDoc(docRef, finalStock);
    return newId;
  } catch (error) {
    handleFirestoreError(error, id ? OperationType.UPDATE : OperationType.CREATE, `${STOKLAR_COLL}/${id || 'new'}`);
  throw error;
  }
}

export async function deleteStock(id: string) {
  try {
    await deleteDoc(doc(db, getPath(STOKLAR_COLL), id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${getPath(STOKLAR_COLL)}/${id}`);
  throw error;
  }
}

export async function updateBulkStockPrices(
  updates: { id: string; salesPrice?: number; purchasePrice?: number }[]
) {
  try {
    if (!updates || updates.length === 0) return;
    
    // Chunk in groups of 400 (Firestore limit is 500)
    const chunkSize = 400;
    for (let i = 0; i < updates.length; i += chunkSize) {
      const chunk = updates.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      for (const item of chunk) {
        const docRef = doc(db, getPath(STOKLAR_COLL), item.id);
        const updateData: Record<string, any> = {};
        if (typeof item.salesPrice === 'number') {
          updateData.salesPrice = item.salesPrice;
        }
        if (typeof item.purchasePrice === 'number') {
          updateData.purchasePrice = item.purchasePrice;
        }
        if (Object.keys(updateData).length > 0) {
          batch.update(docRef, updateData);
        }
      }
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${getPath(STOKLAR_COLL)}/bulk_price_update`);
    throw error;
  }
}

// Keep related ledger, stock and balance writes in one offline-capable batch.
// Firestore increments avoid lost updates when concurrent transactions touch the same records.
export async function createTransactionsAtomically(islemDataList: Omit<Transaction, 'id'>[]) {
  try {
    if (islemDataList.length === 0) return [];
    const collPath = getPath(ISLEMLER_COLL);
    const transactions = islemDataList.map((data) => {
      const ref = doc(collection(db, collPath));
      return { ref, data: cleanUndefined({ id: ref.id, ...data }) as Transaction };
    });

    const cariDeltas = new Map<string, number>();
    const cariNames = new Map<string, string>();
    const cariRefs = new Map<string, any>();
    const stockDeltas = new Map<string, number>();
    const stockRefs = new Map<string, any>();

    for (const { data: islem } of transactions) {
      const cariId = typeof islem.cariId === 'string' ? islem.cariId.trim() : '';
      if (cariId) {
        cariNames.set(cariId, islem.cariName || 'Perakende Müşteri');
        cariRefs.set(cariId, doc(db, getPath(CARILER_COLL), cariId));
        const effectAmount = islem.type === 'sale' && islem.paymentBreakdown
          ? (islem.paymentBreakdown.openAccountAmount || 0)
          : islem.convertedAmount !== undefined && islem.convertedAmount !== 0
          ? islem.convertedAmount
          : (islem.amount || 0);
        const direction = ['sale', 'payment', 'purchase_return'].includes(islem.type)
          ? 1
          : ['purchase', 'collection', 'sale_return'].includes(islem.type)
          ? -1
          : 0;
        cariDeltas.set(cariId, (cariDeltas.get(cariId) || 0) + direction * effectAmount);
      }

      for (const item of islem.items || []) {
        const stockId = typeof item?.stockId === 'string' ? item.stockId.trim() : '';
        if (!stockId) continue;
        const direction = ['sale', 'purchase_return'].includes(islem.type)
          ? -1
          : ['purchase', 'sale_return'].includes(islem.type)
          ? 1
          : 0;
        if (!direction) continue;
        stockRefs.set(stockId, doc(db, getPath(STOKLAR_COLL), stockId));
        stockDeltas.set(stockId, (stockDeltas.get(stockId) || 0) + direction * (item.quantity || 0));
      }
    }

    const [cariSnapshots, stockSnapshots] = await Promise.all([
      Promise.all([...cariRefs.values()].map((ref) => getDoc(ref))),
      Promise.all([...stockRefs.values()].map((ref) => getDoc(ref))),
    ]);
    const cariStates = new Map<string, { exists: boolean; data?: any }>();
    [...cariRefs.keys()].forEach((id, index) => {
      const snap = cariSnapshots[index];
      cariStates.set(id, { exists: snap.exists(), data: snap.exists() ? snap.data() : undefined });
    });
    const stockExists = new Set<string>();
    [...stockRefs.keys()].forEach((id, index) => {
      if (stockSnapshots[index].exists()) stockExists.add(id);
    });

    for (const id of cariRefs.keys()) {
      if (cariStates.get(id)?.exists) continue;
      const isAutoCari = id === 'perakende_musteri' || id.startsWith('perakende') || id.startsWith('plat_cari_') || id.includes('musteri') || id.includes('platform');
      if (!isAutoCari) throw new Error(`Cari (ID: ${id}) bulunamadı. Silinmiş olabilir.`);
    }

    for (const id of stockRefs.keys()) {
      if (stockExists.has(id)) continue;
      const isServiceItem = id.startsWith('plat_srv_') || id.startsWith('srv_') || id.startsWith('custom_') ||
        transactions.some(({ data }) => (data.items || []).some((item: any) => item.stockId === id && item.stockCode === 'ONLINE-SIP'));
      if (!isServiceItem) throw new Error(`Stok (ID: ${id}) bulunamadı. Silinmiş olabilir.`);
    }

    const batch = writeBatch(db);
    for (const { ref, data } of transactions) batch.set(ref, data);

    for (const [id, ref] of cariRefs) {
      const delta = cariDeltas.get(id) || 0;
      const state = cariStates.get(id)!;
      if (!state.exists) {
        let code = 'PRK-001';
        if (id.startsWith('plat_cari_')) code = `PLT-${id.replace('plat_cari_', '').toUpperCase()}`;
        else {
          const suffix = (cariNames.get(id) || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
          code = `PRK-${suffix || '001'}`;
        }
        const newCari: Omit<Cari, 'id'> = {
          name: cariNames.get(id) || 'Perakende Müşteri',
          code,
          type: 'customer',
          balance: delta,
          openingBalance: 0,
          phone: '',
          email: '',
          address: id.startsWith('plat_cari_') ? 'Online Sipariş Platformu' : 'Hızlı Satış Kasası',
          createdAt: new Date().toISOString(),
        };
        // A merge plus increment also preserves concurrent first writes when this
        // automatically-created retail/platform account does not exist yet.
        batch.set(ref, { ...newCari, balance: increment(delta) }, { merge: true });
        continue;
      }

      const updates: Record<string, any> = {};
      if (delta !== 0) updates.balance = increment(delta);
      const existingName = state.data?.name || '';
      if (id.startsWith('plat_cari_') && cariNames.get(id) &&
        (existingName === 'Perakende Müşteri' || existingName.includes('Müşterisi') || state.data?.code?.startsWith('PRK-'))) {
        updates.name = cariNames.get(id);
        updates.code = `PLT-${id.replace('plat_cari_', '').toUpperCase()}`;
      }
      if (Object.keys(updates).length > 0) batch.update(ref, updates);
    }

    for (const [id, ref] of stockRefs) {
      const delta = stockDeltas.get(id) || 0;
      if (stockExists.has(id) && delta !== 0) batch.update(ref, { quantity: increment(delta) });
    }

    await batch.commit();
    return transactions.map(({ ref }) => ref.id);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, getPath(ISLEMLER_COLL));
    throw error;
  }
}

export async function createTransaction(islemData: Omit<Transaction, 'id'>) {
  const [id] = await createTransactionsAtomically([islemData]);
  return id;
}
export async function removeTransaction(islem: Transaction) {
  if (!islem || !islem.id) {
    throw new Error("Geçersiz işlem verisi.");
  }

  try {
    const islemRef = doc(db, getPath(ISLEMLER_COLL), islem.id);

    // 1. Check if transaction exists
    const islemSnap = await getDoc(islemRef);
    if (!islemSnap.exists()) {
      throw new Error("İşlem bulunamadı.");
    }

    // 2. Cari reference & read to reverse balance
    let cariRef = null;
    let cariExists = false;
    if (islem.cariId && typeof islem.cariId === 'string' && islem.cariId.trim() !== '') {
      try {
        cariRef = doc(db, getPath(CARILER_COLL), islem.cariId.trim());
        const cariSnap = await getDoc(cariRef);
        if (cariSnap.exists()) {
          cariExists = true;
        }
      } catch (cariErr) {
        console.warn("Cari bakiye geri alınırken hata oluştu (cari silinmiş olabilir):", cariErr);
      }
    }

    // 3. Read stock levels to reverse quantities
    const stockUpdates = new Map<string, { ref: any; delta: number }>();
    if (islem.items && Array.isArray(islem.items) && islem.items.length > 0) {
      for (const item of islem.items) {
        if (item && item.stockId && typeof item.stockId === 'string' && item.stockId.trim() !== '') {
          try {
            const stockRef = doc(db, getPath(STOKLAR_COLL), item.stockId.trim());
            const stockSnap = await getDoc(stockRef);
            if (stockSnap.exists()) {
            const direction = islem.type === 'sale' || islem.type === 'purchase_return'
              ? 1
              : islem.type === 'purchase' || islem.type === 'sale_return'
              ? -1
              : 0;
            const stockId = item.stockId.trim();
            const previous = stockUpdates.get(stockId);
            stockUpdates.set(stockId, {
              ref: stockRef,
              delta: (previous?.delta || 0) + direction * (item.quantity || 0),
            });
            }
          } catch (stockErr) {
            console.warn(`Stok miktarı geri alınırken hata oluştu (stok ${item.stockId} silinmiş olabilir):`, stockErr);
          }
        }
      }
    }

    // 4. Calculate reversed Cari balance
    let cariReversalDelta = 0;
    if (cariRef && cariExists) {
      const effectAmount = islem.type === 'sale' && islem.paymentBreakdown
        ? (islem.paymentBreakdown.openAccountAmount || 0)
        : islem.convertedAmount !== undefined && islem.convertedAmount !== 0
        ? islem.convertedAmount
        : (islem.amount || 0);
      if (islem.type === 'sale' || islem.type === 'payment' || islem.type === 'purchase_return') {
        cariReversalDelta -= effectAmount;
      } else if (islem.type === 'purchase' || islem.type === 'collection' || islem.type === 'sale_return') {
        cariReversalDelta += effectAmount;
      }
    }

    // 5. Perform deletes and updates in a batch
    const batch = writeBatch(db);
    batch.delete(islemRef);

    if (cariRef && cariExists) {
      if (cariReversalDelta !== 0) batch.update(cariRef, { balance: increment(cariReversalDelta) });
    }

    for (const update of stockUpdates.values()) {
      if (update.delta !== 0) batch.update(update.ref, { quantity: increment(update.delta) });
    }

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${getPath(ISLEMLER_COLL)}/${islem.id}`);
  throw error;
  }
}

// EXPENSE OPERATIONS
export function subscribeExpenses(callback: (expenses: Expense[]) => void) {
  const q = query(collection(db, getPath(GIDERLER_COLL)), orderBy('date', 'desc'), limit(500));
  return onSnapshot(q, (snapshot) => {
    const list: Expense[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as Expense);
    });

    list.sort((a, b) => {
      const dateA = a.date || "";
      const dateB = b.date || "";
      const dateCompare = dateB.localeCompare(dateA);
      if (dateCompare !== 0) return dateCompare;
      
      const timeA = new Date(a.createdAt || a.date).getTime();
      const timeB = new Date(b.createdAt || b.date).getTime();
      if (!isNaN(timeA) && !isNaN(timeB) && timeA !== timeB) return timeB - timeA;
      
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });

    callback(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, getPath(GIDERLER_COLL));
  });
}

export async function saveExpense(expense: Omit<Expense, 'id'>, id?: string) {
  try {
    const docRef = id ? doc(db, getPath(GIDERLER_COLL), id) : doc(collection(db, getPath(GIDERLER_COLL)));
    const newId = id || docRef.id;
    const finalExpense: Expense = cleanUndefined({
      id: newId,
      ...expense
    });
    await setDoc(docRef, finalExpense);
    return newId;
  } catch (error) {
    handleFirestoreError(error, id ? OperationType.UPDATE : OperationType.CREATE, `${getPath(GIDERLER_COLL)}/${id || 'new'}`);
  throw error;
  }
}

export async function deleteExpense(id: string) {
  try {
    await deleteDoc(doc(db, getPath(GIDERLER_COLL), id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${getPath(GIDERLER_COLL)}/${id}`);
  throw error;
  }
}

// RECURRING TRANSACTIONS (TEKRARLAYAN İŞLEMLER) OPERATIONS
export function subscribeRecurringTransactions(callback: (items: RecurringTransaction[]) => void) {
  const q = query(collection(db, getPath(TEKRARLAYAN_COLL)), orderBy('nextDueDate', 'asc'), limit(500));
  return onSnapshot(q, (snapshot) => {
    const list: RecurringTransaction[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as RecurringTransaction);
    });
    callback(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, getPath(TEKRARLAYAN_COLL));
  });
}

export async function saveRecurringTransaction(item: Omit<RecurringTransaction, 'id'>, id?: string) {
  try {
    const docRef = id ? doc(db, getPath(TEKRARLAYAN_COLL), id) : doc(collection(db, getPath(TEKRARLAYAN_COLL)));
    const newId = id || docRef.id;
    const finalItem: RecurringTransaction = cleanUndefined({
      id: newId,
      ...item
    });
    await setDoc(docRef, finalItem);
    return newId;
  } catch (error) {
    handleFirestoreError(error, id ? OperationType.UPDATE : OperationType.CREATE, `${getPath(TEKRARLAYAN_COLL)}/${id || 'new'}`);
  throw error;
  }
}

export async function deleteRecurringTransaction(id: string) {
  try {
    await deleteDoc(doc(db, getPath(TEKRARLAYAN_COLL), id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${getPath(TEKRARLAYAN_COLL)}/${id}`);
  throw error;
  }
}

// EMPLOYEE OPERATIONS
export function subscribeEmployees(callback: (employees: Employee[]) => void) {
  const q = query(collection(db, getPath(CALISANLAR_COLL)), orderBy('name', 'asc'), limit(500));
  return onSnapshot(q, (snapshot) => {
    const list: Employee[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as Employee);
    });
    callback(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, getPath(CALISANLAR_COLL));
  });
}

export async function saveEmployee(employee: Omit<Employee, 'id'>, id?: string) {
  try {
    const docRef = id ? doc(db, getPath(CALISANLAR_COLL), id) : doc(collection(db, getPath(CALISANLAR_COLL)));
    const newId = id || docRef.id;
    const finalEmployee: Employee = cleanUndefined({
      id: newId,
      ...employee
    });
    await setDoc(docRef, finalEmployee);
    return newId;
  } catch (error) {
    handleFirestoreError(error, id ? OperationType.UPDATE : OperationType.CREATE, `${getPath(CALISANLAR_COLL)}/${id || 'new'}`);
  throw error;
  }
}

export async function deleteEmployee(id: string) {
  try {
    await deleteDoc(doc(db, getPath(CALISANLAR_COLL), id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${getPath(CALISANLAR_COLL)}/${id}`);
  throw error;
  }
}

// EMPLOYEE TRANSACTION OPERATIONS
export function subscribeEmployeeTransactions(callback: (transactions: EmployeeTransaction[]) => void) {
  const q = query(collection(db, getPath(CALISAN_ISLEMLER_COLL)), orderBy('date', 'desc'), limit(500));
  return onSnapshot(q, (snapshot) => {
    const list: EmployeeTransaction[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as EmployeeTransaction);
    });

    list.sort((a, b) => {
      const dateA = a.date || "";
      const dateB = b.date || "";
      const dateCompare = dateB.localeCompare(dateA);
      if (dateCompare !== 0) return dateCompare;
      
      const timeA = new Date(a.createdAt || a.date).getTime();
      const timeB = new Date(b.createdAt || b.date).getTime();
      if (!isNaN(timeA) && !isNaN(timeB) && timeA !== timeB) return timeB - timeA;
      
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });

    callback(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, getPath(CALISAN_ISLEMLER_COLL));
  });
}

export async function saveEmployeeTransaction(transaction: Omit<EmployeeTransaction, 'id'>, id?: string) {
  try {
    const docRef = id ? doc(db, getPath(CALISAN_ISLEMLER_COLL), id) : doc(collection(db, getPath(CALISAN_ISLEMLER_COLL)));
    const newId = id || docRef.id;
    const finalTx: EmployeeTransaction = cleanUndefined({
      id: newId,
      ...transaction
    });
    await setDoc(docRef, finalTx);

    // Sync with Expenses (giderler)
    if (finalTx.type === 'payment' || finalTx.type === 'advance') {
      const expenseDocRef = doc(db, getPath(GIDERLER_COLL), newId);
      const title = finalTx.type === 'payment' 
        ? `Maaş Ödemesi: ${finalTx.employeeName}` 
        : `Avans Ödemesi: ${finalTx.employeeName}`;
      
      const expenseData = cleanUndefined({
        id: newId,
        title,
        category: 'Maaş/Personel',
        amount: finalTx.amount,
        date: finalTx.date,
        account: (finalTx.account === 'cash' || finalTx.account === 'bank' || finalTx.account === 'pos') ? finalTx.account : 'cash',
        description: finalTx.description || '',
        currency: finalTx.currency,
        createdAt: finalTx.createdAt || new Date().toISOString()
      });
      await setDoc(expenseDocRef, expenseData);
    } else {
      // If changed to 'accrual', delete any existing synced expense with this transaction ID
      const expenseDocRef = doc(db, getPath(GIDERLER_COLL), newId);
      await deleteDoc(expenseDocRef).catch(() => {});
    }

    return newId;
  } catch (error) {
    handleFirestoreError(error, id ? OperationType.UPDATE : OperationType.CREATE, `${getPath(CALISAN_ISLEMLER_COLL)}/${id || 'new'}`);
  throw error;
  }
}

export async function deleteEmployeeTransaction(id: string) {
  try {
    await deleteDoc(doc(db, getPath(CALISAN_ISLEMLER_COLL), id));
    // Also delete any synced expense with this transaction ID
    const expenseDocRef = doc(db, getPath(GIDERLER_COLL), id);
    await deleteDoc(expenseDocRef).catch(() => {});
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${getPath(CALISAN_ISLEMLER_COLL)}/${id}`);
  throw error;
  }
}

// BANK ACCOUNTS & ACCOUNT TRANSACTIONS
export function subscribeBankAccounts(callback: (accounts: any[]) => void) {
  const q = query(collection(db, getPath(HESAPLAR_COLL)), orderBy('createdAt', 'desc'), limit(500));
  return onSnapshot(q, (snapshot) => {
    const list: any[] = [];
    snapshot.forEach((docSnap) => list.push({ id: docSnap.id, ...docSnap.data() }));
    callback(list);
  }, (error) => handleFirestoreError(error, OperationType.GET, getPath(HESAPLAR_COLL)));
}

export async function saveBankAccount(account: any, id?: string) {
  try {
    const docRef = id ? doc(db, getPath(HESAPLAR_COLL), id) : doc(collection(db, getPath(HESAPLAR_COLL)));
    const newId = id || docRef.id;
    const finalAccount = cleanUndefined({ id: newId, ...account });
    await setDoc(docRef, finalAccount);
    return newId;
  } catch (error) {
    handleFirestoreError(error, id ? OperationType.UPDATE : OperationType.CREATE, `${getPath(HESAPLAR_COLL)}/${id || 'new'}`);
  throw error;
  }
}

export async function deleteBankAccount(id: string) {
  try {
    await deleteDoc(doc(db, getPath(HESAPLAR_COLL), id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${getPath(HESAPLAR_COLL)}/${id}`);
  throw error;
  }
}

export function subscribeAccountTransactions(callback: (transactions: any[]) => void) {
  const q = query(collection(db, getPath(HESAP_ISLEMLER_COLL)), orderBy('createdAt', 'desc'), limit(500));
  return onSnapshot(q, (snapshot) => {
    const list: any[] = [];
    snapshot.forEach((docSnap) => list.push({ id: docSnap.id, ...docSnap.data() }));
    callback(list);
  }, (error) => handleFirestoreError(error, OperationType.GET, getPath(HESAP_ISLEMLER_COLL)));
}

export async function saveAccountTransaction(transaction: any, id?: string) {
  try {
    const docRef = id ? doc(db, getPath(HESAP_ISLEMLER_COLL), id) : doc(collection(db, getPath(HESAP_ISLEMLER_COLL)));
    const newId = id || docRef.id;
    const finalTx = cleanUndefined({ id: newId, ...transaction });
    await setDoc(docRef, finalTx);
    return newId;
  } catch (error) {
    handleFirestoreError(error, id ? OperationType.UPDATE : OperationType.CREATE, `${getPath(HESAP_ISLEMLER_COLL)}/${id || 'new'}`);
  throw error;
  }
}

export async function clearAllDatabaseData(options?: { excludeStocks?: boolean }) {
  try {
    const collections = [
      CARILER_COLL,
      ...(options?.excludeStocks ? [] : [STOKLAR_COLL]),
      ISLEMLER_COLL,
      GIDERLER_COLL,
      CALISANLAR_COLL,
      CALISAN_ISLEMLER_COLL,
      HESAPLAR_COLL,
      HESAP_ISLEMLER_COLL,
      TEKRARLAYAN_COLL,
      ONLINE_ORDERS_COLL,
      ONLINE_PAYOUTS_COLL
    ];
    for (const colName of collections) {
      const q = collection(db, getPath(colName));
      const snapshot = await getDocs(q);
      
      let batch = writeBatch(db);
      let count = 0;
      
      for (const docSnap of snapshot.docs) {
        batch.delete(docSnap.ref);
        count++;
        if (count === 500) {
          await batch.commit();
          batch = writeBatch(db);
          count = 0;
        }
      }
      if (count > 0) {
        await batch.commit();
      }
    }

    // Clear online marketler orders & payouts, parked sales, tables from localStorage
    if (typeof localStorage !== 'undefined') {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.startsWith('storm_online_market_orders') ||
          key.startsWith('storm_online_market_payouts') ||
          key.startsWith('storm_pos_parked_sales') ||
          key.startsWith('storm_pos_restaurant_tables')
        )) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('storm_online_orders_updated'));
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, 'all_collections');
  throw error;
  }
}

export async function importAllDatabaseData(backupJson: any) {
  try {
    // 1. Clear first
    await clearAllDatabaseData();

    // 2. Insert collections in batches of 500
    const collectionsMap: { [key: string]: any[] } = {
      [CARILER_COLL]: backupJson.cariler || [],
      [STOKLAR_COLL]: backupJson.stoklar || [],
      [ISLEMLER_COLL]: backupJson.islemler || [],
      [GIDERLER_COLL]: backupJson.giderler || [],
      [CALISANLAR_COLL]: backupJson.calisanlar || [],
      [CALISAN_ISLEMLER_COLL]: backupJson.calisanIslemler || [],
      [HESAPLAR_COLL]: backupJson.hesaplar || [],
      [HESAP_ISLEMLER_COLL]: backupJson.hesapIslemleri || [],
      [TEKRARLAYAN_COLL]: backupJson.tekrarlayanIslemler || [],
    };

    for (const [colName, items] of Object.entries(collectionsMap)) {
      if (!Array.isArray(items) || items.length === 0) continue;
      
      let batch = writeBatch(db);
      let count = 0;
      
      for (const item of items) {
        if (!item || !item.id) continue;
        const docRef = doc(db, getPath(colName), item.id);
        const cleaned = cleanUndefined(item);
        batch.set(docRef, cleaned);
        count++;
        
        if (count === 500) {
          await batch.commit();
          batch = writeBatch(db);
          count = 0;
        }
      }
      
      if (count > 0) {
        await batch.commit();
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'import_collections');
  throw error;
  }
}



// ONLINE MARKETLER OPERATIONS
export function subscribeOnlineOrders(callback: (orders: OnlineMarketOrder[]) => void) {
  const q = query(collection(db, getPath(ONLINE_ORDERS_COLL)), limit(1500));
  return onSnapshot(q, (snapshot) => {
    const list: OnlineMarketOrder[] = [];
    snapshot.forEach((docSnap) => list.push({ id: docSnap.id, ...docSnap.data() } as OnlineMarketOrder));
    
    // Sort in client to support older documents without createdAt
    list.sort((a, b) => {
      const timeA = new Date(a.createdAt || a.date || 0).getTime();
      const timeB = new Date(b.createdAt || b.date || 0).getTime();
      return timeB - timeA;
    });

    callback(list);
  }, (error) => handleFirestoreError(error, OperationType.GET, getPath(ONLINE_ORDERS_COLL)));
}

export async function saveOnlineOrder(order: any, id?: string) {
  try {
    const docRef = id ? doc(db, getPath(ONLINE_ORDERS_COLL), id) : doc(collection(db, getPath(ONLINE_ORDERS_COLL)));
    const newId = id || docRef.id;
    const finalOrder = cleanUndefined({ id: newId, ...order });
    await setDoc(docRef, finalOrder);
    return newId;
  } catch (error) {
    handleFirestoreError(error, id ? OperationType.UPDATE : OperationType.CREATE, `${getPath(ONLINE_ORDERS_COLL)}/${id || 'new'}`);
  throw error;
  }
}

export async function deleteOnlineOrder(id: string) {
  try {
    await deleteDoc(doc(db, getPath(ONLINE_ORDERS_COLL), id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${getPath(ONLINE_ORDERS_COLL)}/${id}`);
  throw error;
  }
}

export function subscribeOnlinePayouts(callback: (payouts: OnlineMarketPayout[]) => void) {
  const q = query(collection(db, getPath(ONLINE_PAYOUTS_COLL)), orderBy('createdAt', 'desc'), limit(1000));
  return onSnapshot(q, (snapshot) => {
    const list: OnlineMarketPayout[] = [];
    snapshot.forEach((docSnap) => list.push({ id: docSnap.id, ...docSnap.data() } as OnlineMarketPayout));
    callback(list);
  }, (error) => handleFirestoreError(error, OperationType.GET, getPath(ONLINE_PAYOUTS_COLL)));
}

export async function saveOnlinePayout(payout: any, id?: string) {
  try {
    const docRef = id ? doc(db, getPath(ONLINE_PAYOUTS_COLL), id) : doc(collection(db, getPath(ONLINE_PAYOUTS_COLL)));
    const newId = id || docRef.id;
    const finalPayout = cleanUndefined({ id: newId, ...payout });
    await setDoc(docRef, finalPayout);
    return newId;
  } catch (error) {
    handleFirestoreError(error, id ? OperationType.UPDATE : OperationType.CREATE, `${getPath(ONLINE_PAYOUTS_COLL)}/${id || 'new'}`);
  throw error;
  }
}

export async function deleteOnlinePayout(id: string) {
  try {
    await deleteDoc(doc(db, getPath(ONLINE_PAYOUTS_COLL), id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${getPath(ONLINE_PAYOUTS_COLL)}/${id}`);
  throw error;
  }
}

export function subscribePosPlatforms(callback: (platforms: PosPlatformConfig[]) => void) {
  const q = query(collection(db, getPath(POS_PLATFORMS_COLL)));
  return onSnapshot(q, (snapshot) => {
    const list: PosPlatformConfig[] = [];
    snapshot.forEach((docSnap) => list.push({ id: docSnap.id, ...docSnap.data() } as PosPlatformConfig));
    callback(list);
  }, (error) => handleFirestoreError(error, OperationType.GET, getPath(POS_PLATFORMS_COLL)));
}

export async function savePosPlatform(platform: any, id?: string) {
  try {
    const docRef = id ? doc(db, getPath(POS_PLATFORMS_COLL), id) : doc(collection(db, getPath(POS_PLATFORMS_COLL)));
    const newId = id || docRef.id;
    const finalPlatform = cleanUndefined({ id: newId, ...platform });
    await setDoc(docRef, finalPlatform);
    return newId;
  } catch (error) {
    handleFirestoreError(error, id ? OperationType.UPDATE : OperationType.CREATE, `${getPath(POS_PLATFORMS_COLL)}/${id || 'new'}`);
  throw error;
  }
}


// SETTINGS OPERATIONS
export function subscribeSettings(docId: string, callback: (data: any) => void) {
  const docRef = doc(db, getPath(SETTINGS_COLL), docId);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data());
    } else {
      callback(null);
    }
  }, (error) => handleFirestoreError(error, OperationType.GET, `${getPath(SETTINGS_COLL)}/${docId}`));
}

export async function saveSettings(docId: string, data: any) {
  try {
    const docRef = doc(db, getPath(SETTINGS_COLL), docId);
    await setDoc(docRef, cleanUndefined(data), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${getPath(SETTINGS_COLL)}/${docId}`);
  throw error;
  }
}
