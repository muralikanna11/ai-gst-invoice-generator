import React, { useState } from 'react';
import { Sparkles, ArrowRight, Loader2, Lightbulb, AlertTriangle } from 'lucide-react';
import { parseInvoiceRequest } from '../services/gemini';
import { InvoiceData } from '../types';

interface AIAssistantProps {
  currentInvoice: InvoiceData;
  onUpdate: (data: Partial<InvoiceData>) => void;
}

const EXAMPLE_PROMPTS = [
  "Invoice for Sharma Traders: Web Development Services - 50000",
  "Sold 5 Dell Laptops (45k each) to TechCorp, Bangalore",
  "Bill to Rohit Gupta: 100 kg Rice at 60/kg"
];

const AIAssistant: React.FC<AIAssistantProps> = ({ currentInvoice, onUpdate }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    
    try {
      const updates = await parseInvoiceRequest(prompt, currentInvoice);
      onUpdate(updates);
      setSuccessMsg("Invoice updated successfully!");
      setPrompt('');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      if (err.message === "QUOTA_EXCEEDED") {
         setError("AI Usage Limit Reached. The free tier quota is exhausted. Please try again in a few minutes.");
      } else {
         setError("Could not generate invoice data. Please check your connection and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <div className="bg-gradient-to-r from-brand-50 to-white dark:from-gray-800 dark:to-gray-800 border border-brand-100 dark:border-gray-700 rounded-xl p-5 mb-6 shadow-sm transition-colors duration-200">
      <div className="flex items-center gap-2 mb-3 text-brand-700 dark:text-brand-400 font-semibold">
        <Sparkles className="w-5 h-5" />
        <h3>AI Assistant</h3>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Describe your transaction naturally. Mention the client name, items, and prices.
      </p>
      
      <div className="relative mb-3">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. Sold 5 Dell Laptops for 45000 each and 20 Wireless Mice for 500 each to Acme Corp, Hyderabad..."
          className="w-full p-4 pr-12 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all h-24 resize-none bg-white dark:bg-gray-900 dark:text-white shadow-inner"
        />
        <button
          onClick={handleGenerate}
          disabled={loading || !prompt.trim()}
          className={`absolute bottom-3 right-3 flex items-center gap-2 p-2 bg-brand-600 dark:bg-brand-600 text-white rounded-lg hover:bg-brand-700 dark:hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm ${loading ? 'pl-3 pr-4' : ''}`}
          title="Generate Invoice"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs font-medium">Processing...</span>
            </>
          ) : (
            <ArrowRight className="w-4 h-4" />
          )}
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-xs text-red-600 dark:text-red-400 mb-3 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg border border-red-100 dark:border-red-800">
           <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
           <p className="font-medium leading-relaxed">{error}</p>
        </div>
      )}
      
      {successMsg && <p className="text-xs text-green-600 dark:text-green-400 mb-2 font-medium flex items-center gap-1"><Sparkles className="w-3 h-3" /> {successMsg}</p>}

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider">
          <Lightbulb className="w-3 h-3" /> Try Examples
        </div>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_PROMPTS.map((ex, i) => (
            <button
              key={i}
              onClick={() => setPrompt(ex)}
              className="text-xs px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full text-gray-600 dark:text-gray-300 hover:border-brand-300 hover:text-brand-600 dark:hover:text-white hover:bg-brand-50 dark:hover:bg-gray-600 transition-all text-left"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;