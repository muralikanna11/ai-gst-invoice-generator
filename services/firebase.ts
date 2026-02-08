import { InvoiceData } from "../types";

/**
 * Mock Firebase Implementation using LocalStorage
 * Designed to provide persistent behavior across sessions in a browser.
 */

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous?: boolean;
}

const LOCAL_STORAGE_USER_KEY = 'gst_mock_user';
const LOCAL_STORAGE_DATA_KEY = 'gst_mock_invoices';

export const auth = {}; 

let authListeners: ((user: User | null) => void)[] = [];

const notifyListeners = (user: User | null) => {
  authListeners.forEach(listener => listener(user));
};

// Safe JSON Parse helper
const safeParse = (key: string): any => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error(`Error parsing localStorage key: ${key}`, e);
    return null;
  }
};

export const onAuthStateChanged = (authObj: any, callback: (user: User | null) => void) => {
  authListeners.push(callback);
  
  // Try to restore previous session (Real or Guest)
  const stored = safeParse(LOCAL_STORAGE_USER_KEY);
  if (stored) {
    callback(stored);
  } else {
    callback(null);
  }
  
  return () => {
    authListeners = authListeners.filter(l => l !== callback);
  };
};

export const signInWithGoogle = async () => {
  await new Promise(resolve => setTimeout(resolve, 600));
  const mockUser: User = {
    uid: 'mock-google-user-permanent-id', 
    email: 'demo@gstgenius.app',
    displayName: 'Demo User',
    photoURL: null,
    isAnonymous: false
  };
  localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(mockUser));
  notifyListeners(mockUser);
  return mockUser;
};

const hashCode = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; 
  }
  return Math.abs(hash).toString(16);
};

export const signInWithEmailAndPassword = async (auth: any, email: string, password?: string) => {
    await new Promise(resolve => setTimeout(resolve, 600));
    const deterministicUid = `user-${hashCode(email.toLowerCase().trim())}`;
    const mockUser: User = {
        uid: deterministicUid,
        email: email,
        displayName: email.split('@')[0],
        photoURL: null,
        isAnonymous: false
    };
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(mockUser));
    notifyListeners(mockUser);
    return { user: mockUser };
}

export const createUserWithEmailAndPassword = async (auth: any, email: string, password?: string) => {
    return signInWithEmailAndPassword(auth, email, password);
}

/**
 * Enables persistent storage for Guest users by assigning a unique local browser ID.
 */
export const signInGuest = async () => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Check if there is an existing Guest ID
  let existingUser = safeParse(LOCAL_STORAGE_USER_KEY);
  
  if (!existingUser || !existingUser.isAnonymous) {
    existingUser = {
      uid: `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      email: null,
      displayName: 'Guest User',
      photoURL: null,
      isAnonymous: true
    };
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(existingUser));
  }
  
  notifyListeners(existingUser);
  return existingUser;
};

export const logoutUser = async () => {
  await new Promise(resolve => setTimeout(resolve, 300));
  localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
  notifyListeners(null);
};

export const saveInvoiceToDb = async (invoice: InvoiceData, userId: string) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const invoices: InvoiceData[] = safeParse(LOCAL_STORAGE_DATA_KEY) || [];
  
  const newInvoice = {
    ...invoice,
    userId,
    id: invoice.id === 'new' ? 'inv-' + Date.now() : invoice.id,
    createdAt: invoice.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const filtered = invoices.filter(inv => inv.id !== newInvoice.id);
  const updatedList = [newInvoice, ...filtered];
  
  localStorage.setItem(LOCAL_STORAGE_DATA_KEY, JSON.stringify(updatedList));
  return newInvoice.id;
};

export const getUserInvoices = async (userId: string): Promise<InvoiceData[]> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const invoices: InvoiceData[] = safeParse(LOCAL_STORAGE_DATA_KEY) || [];
  
  return invoices
    .filter(inv => inv.userId === userId)
    .sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return dateB - dateA;
    });
};

export const deleteInvoiceFromDb = async (invoiceId: string) => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const invoices: InvoiceData[] = safeParse(LOCAL_STORAGE_DATA_KEY) || [];
  const filtered = invoices.filter(inv => inv.id !== invoiceId);
  localStorage.setItem(LOCAL_STORAGE_DATA_KEY, JSON.stringify(filtered));
};