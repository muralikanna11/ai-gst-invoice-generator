import React, { useState, useMemo, useEffect } from 'react';
import { Download, Share2, Check, Link as LinkIcon, AlertTriangle, XCircle, Save, History, LogOut, Loader2, Moon, Sun } from 'lucide-react';
import InvoiceForm from './components/InvoiceForm';
import InvoicePreview from './components/InvoicePreview';
import AIAssistant from './components/AIAssistant';
import AccountingInsights from './components/AccountingInsights';
import Auth from './components/Auth';
import SavedInvoices from './components/SavedInvoices';
import { InvoiceData, TaxSummary } from './types';
import { DEFAULT_INVOICE } from './constants';
import { generatePDF } from './services/pdfGenerator';
import { validateInvoiceData } from './services/validation';
import { auth, logoutUser, saveInvoiceToDb, onAuthStateChanged, User } from './services/firebase';

// --- ROBUST ENCODING UTILS ---

const serializeData = (data: any): string => {
  try {
    const json = JSON.stringify(data);
    const bytes = new TextEncoder().encode(json);
    const binString = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
    return btoa(binString);
  } catch (e) {
    console.error("Serialization failed", e);
    return "";
  }
};

const deserializeData = (base64: string): any => {
  try {
    const cleanBase64 = base64.replace(/ /g, '+');
    const binString = atob(cleanBase64);
    const bytes = Uint8Array.from(binString, (m) => m.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json);
  } catch (e) {
    console.error("Deserialization failed", e);
    try {
      return JSON.parse(atob(base64));
    } catch (e2) {
      return null;
    }
  }
};

type ViewState = 'edit' | 'preview' | 'history' | 'login';

const App: React.FC = () => {
  const [invoice, setInvoice] = useState<InvoiceData>(DEFAULT_INVOICE);
  const [activeTab, setActiveTab] = useState<ViewState>('login');
  const [isCopied, setIsCopied] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  // Track last saved state to prevent duplicates
  const [lastSavedJson, setLastSavedJson] = useState<string>('');
  
  // Theme State
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark';
    }
    return false;
  });

  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Theme Effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Stable Auth Listener (Runs once)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Dedicated Redirect Logic
  // Automatically redirect to EDITOR if user is logged in and currently on login page
  useEffect(() => {
    if (!authLoading && user && activeTab === 'login') {
      setActiveTab('edit');
    }
  }, [user, activeTab, authLoading]);

  // Load state from URL (Hash or Query) on mount
  useEffect(() => {
    const loadFromUrl = () => {
      let dataStr = "";
      if (window.location.hash.includes("data=")) {
        const hashParams = new URLSearchParams(window.location.hash.slice(1));
        dataStr = hashParams.get('data') || "";
      } else {
        const searchParams = new URLSearchParams(window.location.search);
        dataStr = searchParams.get('data') || "";
      }

      if (dataStr) {
        const decoded = deserializeData(dataStr);
        if (decoded) {
          setInvoice(prev => ({ ...DEFAULT_INVOICE, ...decoded }));
          setLastSavedJson(JSON.stringify({ ...DEFAULT_INVOICE, ...decoded }));
          window.history.replaceState({}, document.title, window.location.pathname);
          // If loading from URL, go to editor immediately
          setActiveTab('edit');
        }
      }
    };
    loadFromUrl();
  }, []);

  // Calculation Logic
  const summary: TaxSummary = useMemo(() => {
    let taxableValue = 0;
    let totalTax = 0;
    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    invoice.items.forEach(item => {
      const itemTotal = item.qty * item.rate;
      taxableValue += itemTotal;

      if (invoice.gstEnabled) {
        const taxAmount = (itemTotal * item.gstRate) / 100;
        totalTax += taxAmount;
      }
    });

    if (invoice.gstEnabled) {
      const sellerState = (invoice.seller.state || '').toLowerCase().trim();
      const buyerState = (invoice.buyer.state || '').toLowerCase().trim();
      const isInterState = sellerState !== buyerState;
      
      if (isInterState) {
        igst = totalTax;
      } else {
        cgst = totalTax / 2;
        sgst = totalTax / 2;
      }
    }

    const exactTotal = taxableValue + totalTax;
    const roundedGrandTotal = Math.round(exactTotal);
    const roundOff = roundedGrandTotal - exactTotal;

    return {
      taxableValue,
      cgst,
      sgst,
      igst,
      totalTax,
      roundOff,
      grandTotal: roundedGrandTotal
    };
  }, [invoice]);

  const validateAndExecute = (action: () => void) => {
    const errors = validateInvoiceData(invoice);
    if (errors.length > 0) {
      setValidationErrors(errors);
      if (activeTab === 'preview') setActiveTab('edit');
      setTimeout(() => setValidationErrors([]), 8000);
      return;
    }
    setValidationErrors([]);
    action();
  };

  const handleDownload = () => {
    validateAndExecute(async () => {
      // Auto-save logic if logged in, but only if changed
      if (user) {
        const currentJson = JSON.stringify(invoice);
        const hasChanges = currentJson !== lastSavedJson || invoice.id === 'new';

        if (hasChanges) {
          setIsSaving(true);
          try {
            const invoiceToSave = { ...invoice, summary };
            const savedId = await saveInvoiceToDb(invoiceToSave, user.uid);
            
            if (invoice.id !== savedId) {
                const updatedInvoice = { ...invoice, id: savedId };
                setInvoice(updatedInvoice);
                setLastSavedJson(JSON.stringify(updatedInvoice));
            } else {
                setLastSavedJson(currentJson);
            }
            
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
          } catch (e) {
            console.error("Auto-save failed", e);
          } finally {
            setIsSaving(false);
          }
        }
      }
      
      // Proceed with PDF generation
      generatePDF(invoice, summary);
    });
  };

  const handleSave = async () => {
    if (!user) {
      setActiveTab('login');
      return;
    }
    
    validateAndExecute(async () => {
      const currentJson = JSON.stringify(invoice);
      // Check if data has changed since last save
      // If it's a 'new' invoice, we always try to save it at least once
      if (currentJson === lastSavedJson && invoice.id !== 'new') {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        return;
      }

      setIsSaving(true);
      try {
        const invoiceToSave = { ...invoice, summary };
        const savedId = await saveInvoiceToDb(invoiceToSave, user.uid);
        
        // Update state to reflect it's no longer a new invoice
        if (invoice.id !== savedId) {
            const updatedInvoice = { ...invoice, id: savedId };
            setInvoice(updatedInvoice);
            setLastSavedJson(JSON.stringify(updatedInvoice));
        } else {
            setLastSavedJson(currentJson);
        }

        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } catch (e) {
        alert("Failed to save invoice. Please try again.");
      } finally {
        setIsSaving(false);
      }
    });
  };

  const handleLoadInvoice = (savedInvoice: InvoiceData) => {
     setInvoice(savedInvoice);
     setLastSavedJson(JSON.stringify(savedInvoice));
     setActiveTab('edit');
  };

  const handleCreateNew = () => {
    const newInvoice = {
      ...DEFAULT_INVOICE, 
      id: 'new', 
      invoiceNumber: `INV-${Date.now().toString().slice(-4)}`
    };
    setInvoice(newInvoice);
    setLastSavedJson(''); // Reset last saved for new invoice
    setActiveTab('edit');
  };

  const handleLogout = async () => {
    await logoutUser();
    // User state update will trigger useEffect
    // Manually navigate to login
    setActiveTab('login'); 
    setLastSavedJson('');
  };

  const handleShare = () => {
    validateAndExecute(() => {
        setUrlError(null);
        const dataToShare = { ...invoice };
        if (dataToShare.seller.logoUrl && dataToShare.seller.logoUrl.startsWith('data:image')) {
          dataToShare.seller = { ...dataToShare.seller, logoUrl: '' };
        }
        const base64Str = serializeData(dataToShare);
        if (!base64Str) {
          setUrlError("Failed to encode data.");
          return;
        }
        const baseUrl = window.location.href.split('?')[0].split('#')[0];
        const fullUrl = `${baseUrl}#data=${encodeURIComponent(base64Str)}`;
        if (fullUrl.length > 8000) {
          setUrlError("Invoice is too large to share via link (Limit: ~8KB).");
          return;
        }
        navigator.clipboard.writeText(fullUrl)
          .then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
          })
          .catch(() => {
            setUrlError("Could not access clipboard. Please copy manually.");
          });
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors duration-200">
      {/* Navbar */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab(user ? 'edit' : 'login')}>
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">
              G
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">GSTGenius</span>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
             {/* Theme Toggle */}
             <button
               onClick={() => setDarkMode(!darkMode)}
               className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
               title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
             >
               {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
             </button>

             <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>

             <button 
              onClick={() => setActiveTab('edit')}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'edit' ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
            >
              Editor
            </button>
            <button 
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'preview' ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'} md:hidden`}
            >
              Preview
            </button>
            
            {/* Auth Buttons */}
            {user ? (
               <button 
                onClick={() => setActiveTab('history')}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1 ${activeTab === 'history' ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
              >
                <History className="w-4 h-4" /> <span className="hidden sm:inline">My Invoices</span>
              </button>
            ) : (
               <button 
                onClick={() => setActiveTab('login')}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'login' ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
              >
                Login
              </button>
            )}

            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1 hidden md:block"></div>

            {/* Save Button */}
            <button
               onClick={handleSave}
               disabled={isSaving}
               className={`hidden md:flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all ${saveSuccess ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'text-brand-600 bg-brand-50 hover:bg-brand-100 dark:bg-brand-900/20 dark:text-brand-400 dark:hover:bg-brand-900/30'}`}
               title={invoice.id === 'new' ? "Save New Invoice" : "Save Changes"}
             >
               {saveSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
               {saveSuccess ? 'Saved' : 'Save'}
             </button>

            <button
              onClick={handleShare}
              className="hidden md:flex items-center gap-2 px-3 py-2 text-brand-600 bg-brand-50 hover:bg-brand-100 dark:bg-brand-900/20 dark:text-brand-400 dark:hover:bg-brand-900/30 text-sm font-medium rounded-lg transition-all"
            >
              {isCopied ? <Check className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
            </button>

            <button 
              onClick={handleDownload}
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 dark:bg-brand-600 dark:hover:bg-brand-500 text-white text-sm font-medium rounded-lg transition-all shadow-sm active:scale-95"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {isSaving ? 'Saving...' : 'Download'}
            </button>
            
             {user && (
               <button 
                onClick={handleLogout} 
                className="ml-2 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                title="Logout"
               >
                 <LogOut className="w-4 h-4" />
               </button>
             )}
          </div>
        </div>
      </header>

      {/* URL Error Toast */}
      {urlError && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <div className="bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {urlError}
          </div>
        </div>
      )}

      {/* Validation Errors Toast */}
      {validationErrors.length > 0 && (
         <div className="fixed bottom-4 right-4 z-50 max-w-md w-full animate-in slide-in-from-bottom-5">
           <div className="bg-red-50 border border-red-200 dark:bg-red-900/90 dark:border-red-800 shadow-xl rounded-lg p-4">
             <div className="flex items-start gap-3">
               <XCircle className="w-5 h-5 text-red-600 dark:text-red-300 flex-shrink-0 mt-0.5" />
               <div className="flex-1">
                 <h4 className="text-sm font-bold text-red-800 dark:text-red-200 mb-1">Please fix the following errors:</h4>
                 <ul className="text-xs text-red-700 dark:text-red-300 list-disc pl-4 space-y-1 max-h-40 overflow-y-auto">
                   {validationErrors.map((err, i) => (
                     <li key={i}>{err}</li>
                   ))}
                 </ul>
               </div>
               <button onClick={() => setValidationErrors([])} className="text-red-400 hover:text-red-600 dark:text-red-300 dark:hover:text-white">
                 <XCircle className="w-4 h-4" />
               </button>
             </div>
           </div>
         </div>
      )}

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:px-6 lg:px-8 py-8">
        
        {/* LOGIN VIEW */}
        {activeTab === 'login' && (
          <div className="animate-in fade-in zoom-in-95 duration-200">
             <Auth 
              onSuccess={() => setActiveTab('edit')} 
              onGuestAccess={() => setActiveTab('edit')} 
             />
          </div>
        )}

        {/* HISTORY VIEW */}
        {activeTab === 'history' && user && (
           <div className="animate-in fade-in zoom-in-95 duration-200">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Invoices</h2>
                <button 
                  onClick={handleCreateNew}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg flex items-center gap-2 shadow-sm"
                >
                  <span className="text-xl leading-none mb-0.5">+</span> Create New Invoice
                </button>
             </div>
             <SavedInvoices userId={user.uid} onLoad={handleLoadInvoice} />
           </div>
        )}
        
        {/* Fallback for History if not logged in (Edge case protection) */}
        {activeTab === 'history' && !user && (
          <div className="text-center py-20">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Please log in to view history</h3>
            <button onClick={() => setActiveTab('login')} className="mt-4 text-brand-600 hover:underline dark:text-brand-400">Go to Login</button>
          </div>
        )}

        {/* EDITOR / PREVIEW VIEWS */}
        {(activeTab === 'edit' || activeTab === 'preview') && (
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Panel: Editor */}
            <div className={`lg:col-span-5 xl:col-span-5 ${activeTab === 'preview' ? 'hidden lg:block' : 'block'}`}>
              <AIAssistant 
                currentInvoice={invoice} 
                onUpdate={(updates) => setInvoice(prev => ({ ...prev, ...updates }))} 
              />
              <InvoiceForm 
                data={invoice} 
                onChange={setInvoice} 
              />
            </div>

            {/* Right Panel: Preview & Accounting */}
            <div className={`lg:col-span-7 xl:col-span-7 ${activeTab === 'edit' ? 'hidden lg:block' : 'block'}`}>
               <div className="sticky top-24">
                 
                 {/* Mobile Actions */}
                 <div className="grid grid-cols-2 gap-2 mb-4 md:hidden">
                   <button 
                      onClick={handleSave}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-brand-600 dark:text-brand-400 text-sm font-medium rounded-lg shadow-sm"
                    >
                       {saveSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                       {saveSuccess ? 'Saved' : 'Save'}
                    </button>
                   <button 
                      onClick={handleDownload}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-brand-600 text-white text-sm font-medium rounded-lg shadow-sm"
                    >
                      <Download className="w-4 h-4" />
                      PDF
                    </button>
                 </div>

                {/* PDF PREVIEW: Always Keep Light Background to represent Paper */}
                <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-xl bg-gray-500/5 dark:bg-black/20 p-1">
                   <InvoicePreview data={invoice} summary={summary} />
                </div>

                {/* Accounting Insights Component */}
                <AccountingInsights data={invoice} summary={summary} />
               </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default App;