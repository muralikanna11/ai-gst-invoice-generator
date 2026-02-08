import React, { useEffect, useState } from 'react';
import { getUserInvoices, deleteInvoiceFromDb } from '../services/firebase';
import { InvoiceData } from '../types';
import { FileText, Calendar, Trash2, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

interface SavedInvoicesProps {
  userId: string;
  onLoad: (invoice: InvoiceData) => void;
}

const SavedInvoices: React.FC<SavedInvoicesProps> = ({ userId, onLoad }) => {
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadInvoices();
  }, [userId]);

  const loadInvoices = async () => {
    setLoading(true);
    const data = await getUserInvoices(userId);
    setInvoices(data);
    setLoading(false);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this invoice?")) return;
    
    setDeletingId(id);
    try {
      await deleteInvoiceFromDb(id);
      setInvoices(prev => prev.filter(inv => inv.id !== id));
    } catch (error) {
      alert("Failed to delete invoice");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin mb-2" />
        <p className="text-sm">Loading your invoices...</p>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 transition-colors duration-200">
        <div className="bg-gray-100 dark:bg-gray-700 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
          <FileText className="w-6 h-6 text-gray-400 dark:text-gray-300" />
        </div>
        <h3 className="text-gray-900 dark:text-white font-medium mb-1">No Saved Invoices</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Create an invoice and save it to see it here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Your Saved Invoices</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {invoices.map((inv) => (
          <div 
            key={inv.id} 
            onClick={() => onLoad(inv)}
            className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-brand-300 dark:hover:border-brand-600 hover:shadow-md transition-all cursor-pointer group relative"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="inline-block px-2 py-1 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-[10px] font-bold uppercase tracking-wider rounded mb-2">
                  {inv.type}
                </span>
                <h3 className="font-bold text-gray-900 dark:text-white text-sm">#{inv.invoiceNumber}</h3>
              </div>
              <button 
                onClick={(e) => handleDelete(e, inv.id)}
                className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                title="Delete"
              >
                {deletingId === inv.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            </div>
            
            <div className="space-y-2 mb-4">
               <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                 <UserAvatar name={inv.buyer.name} />
                 <span className="truncate max-w-[150px] font-medium">{inv.buyer.name}</span>
               </div>
               <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                 <Calendar className="w-3.5 h-3.5" />
                 <span>{inv.invoiceDate}</span>
               </div>
            </div>
            
            <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                 ₹ {inv.summary?.grandTotal?.toLocaleString('en-IN') || '0'}
              </span>
              <span className="text-xs font-medium text-brand-600 dark:text-brand-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                Edit <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const UserAvatar = ({ name }: { name: string }) => (
  <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 flex items-center justify-center text-[9px] font-bold">
    {name ? name.charAt(0).toUpperCase() : 'C'}
  </div>
);

export default SavedInvoices;