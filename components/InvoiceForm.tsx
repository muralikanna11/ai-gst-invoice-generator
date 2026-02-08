import React from 'react';
import { Plus, Trash2, Building2, User, FileText, Upload, Image as ImageIcon, Info, AlertCircle, Sparkles } from 'lucide-react';
import { InvoiceData, InvoiceType, InvoiceItem } from '../types';
import { INDIAN_STATES, GST_RATES, COMMON_HSN_MAP } from '../constants';
import { validateField } from '../services/validation';

interface InvoiceFormProps {
  data: InvoiceData;
  onChange: (data: InvoiceData) => void;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ data, onChange }) => {

  const updateSeller = (field: string, value: string) => {
    // Auto-uppercase for GSTIN/PAN
    if (field === 'gstin' || field === 'pan') {
      value = value.toUpperCase();
    }
    onChange({ ...data, seller: { ...data.seller, [field]: value } });
  };

  const updateBuyer = (field: string, value: string) => {
    // Auto-uppercase for GSTIN/PAN
    if (field === 'gstin' || field === 'pan') {
      value = value.toUpperCase();
    }
    onChange({ ...data, buyer: { ...data.buyer, [field]: value } });
  };

  const findBestHsnMatch = (description: string): string | null => {
    if (!description) return null;
    const descLower = description.toLowerCase();
    
    let bestMatchHsn = '';
    let longestMatchLen = 0;

    for (const [key, hsn] of Object.entries(COMMON_HSN_MAP)) {
      if (descLower.includes(key) && key.length > longestMatchLen) {
        bestMatchHsn = hsn;
        longestMatchLen = key.length;
      }
    }
    return bestMatchHsn || null;
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...data.items];
    let newItem = { ...newItems[index], [field]: value };
    
    // Auto-fill HSN based on Description
    if (field === 'description' && data.gstEnabled) {
      const match = findBestHsnMatch(value as string);
      
      // Auto-fill only if HSN is currently empty and we found a match
      if (match && (!newItem.hsn || newItem.hsn.length < 4)) {
        newItem.hsn = match;
      }
    }

    newItems[index] = newItem;
    onChange({ ...data, items: newItems });
  };

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: '',
      hsn: '',
      qty: 1,
      rate: 0,
      gstRate: 18
    };
    onChange({ ...data, items: [...data.items, newItem] });
  };

  const removeItem = (index: number) => {
    if (data.items.length === 1) return;
    const newItems = data.items.filter((_, i) => i !== index);
    onChange({ ...data, items: newItems });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) { // 4MB limit
        alert("File is too large. Please upload a logo smaller than 4MB.");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        updateSeller('logoUrl', result);
      };
      reader.onerror = () => {
        alert("Failed to read file");
      };
      reader.readAsDataURL(file);
    }
    // Reset the input so the same file can be selected again if needed
    e.target.value = ''; 
  };

  // Helper to safely format total for display
  const getLineTotal = (item: InvoiceItem) => {
    const total = item.qty * item.rate * (data.gstEnabled ? (1 + item.gstRate/100) : 1);
    // Smart formatting: forces 2 decimal places
    return total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Validation Helpers
  const ErrorMsg = ({ msg }: { msg: string | null }) => {
    if (!msg) return null;
    return (
      <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
        <AlertCircle className="w-3 h-3" /> {msg}
      </p>
    );
  };

  const isCreditOrDebitNote = data.type === InvoiceType.CreditNote || data.type === InvoiceType.DebitNote;
  const isBillOfSupply = data.type === InvoiceType.BillOfSupply;

  const inputClass = "w-full p-2 border rounded-md text-sm focus:ring-2 focus:ring-brand-200 outline-none bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-white dark:focus:ring-brand-500/30";
  const labelClass = "block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1";
  const cardClass = "bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200";

  return (
    <div className="space-y-8">
      {/* Settings */}
      <div className={cardClass}>
        <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">Settings</h3>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={data.gstEnabled} 
              onChange={(e) => onChange({ ...data, gstEnabled: e.target.checked })}
              className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Enable GST</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={data.logoEnabled} 
              onChange={(e) => onChange({ ...data, logoEnabled: e.target.checked })}
              className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Show Logo</span>
          </label>
        </div>
      </div>

      {/* Invoice Type Alerts */}
      {isBillOfSupply && (
         <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-4 rounded-lg flex gap-3">
           <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
           <div className="text-sm text-blue-800 dark:text-blue-200">
             <strong>Bill of Supply</strong> is used when:
             <ul className="list-disc ml-4 mt-1 space-y-1">
               <li>You are a Composition Dealer (Cannot collect tax)</li>
               <li>You are selling Exempt Goods (0% Tax)</li>
             </ul>
             <p className="mt-2 text-xs">Ensure GST is disabled OR Tax Rates are 0%.</p>
           </div>
         </div>
      )}

      {/* Basic Details */}
      <div className={cardClass}>
         <div className="flex items-center gap-2 mb-4 text-brand-600 dark:text-brand-400">
          <FileText className="w-5 h-5" />
          <h3 className="font-semibold">Invoice Details</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>
              {isCreditOrDebitNote ? 'Note Number' : 'Invoice Number'}
            </label>
            <input 
              type="text" 
              value={data.invoiceNumber || ''}
              onChange={(e) => onChange({ ...data, invoiceNumber: e.target.value })}
              className={inputClass} 
            />
          </div>
          <div>
            <label className={labelClass}>
               {isCreditOrDebitNote ? 'Note Date' : 'Date'}
            </label>
            <input 
              type="date" 
              value={data.invoiceDate || ''}
              onChange={(e) => onChange({ ...data, invoiceDate: e.target.value })}
              className={inputClass} 
            />
          </div>
          <div>
            <label className={labelClass}>Type</label>
            <select 
              value={data.type}
              onChange={(e) => onChange({ ...data, type: e.target.value as InvoiceType })}
              className={inputClass}
            >
              {Object.values(InvoiceType).map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Original Invoice Details (For Credit/Debit Notes) */}
        {isCreditOrDebitNote && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
             <div>
              <label className={labelClass}>Original Invoice Number</label>
              <input 
                type="text" 
                placeholder="e.g. INV-001"
                value={data.originalInvoiceNumber || ''}
                onChange={(e) => onChange({ ...data, originalInvoiceNumber: e.target.value })}
                className={inputClass} 
              />
            </div>
            <div>
              <label className={labelClass}>Original Invoice Date</label>
              <input 
                type="date" 
                value={data.originalInvoiceDate || ''}
                onChange={(e) => onChange({ ...data, originalInvoiceDate: e.target.value })}
                className={inputClass} 
              />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Seller Section */}
        <div className={cardClass}>
          <div className="flex items-center gap-2 mb-4 text-brand-600 dark:text-brand-400">
            <Building2 className="w-5 h-5" />
            <h3 className="font-semibold">From (Seller)</h3>
          </div>
          <div className="space-y-3">
             {/* Logo Upload UI */}
             {data.logoEnabled && (
              <div className="mb-4 p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50/50 dark:bg-gray-700/30">
                <div className="flex items-center justify-between mb-3">
                   <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Business Logo</label>
                   {data.seller.logoUrl && (
                     <button onClick={() => updateSeller('logoUrl', '')} className="text-red-500 text-xs hover:text-red-600 flex items-center gap-1 font-medium transition-colors">
                       <Trash2 className="w-3 h-3" /> Remove Logo
                     </button>
                   )}
                </div>
                
                <div className="flex gap-4 items-start">
                  {/* Preview Area */}
                  {data.seller.logoUrl ? (
                    <div className="relative w-24 h-24 group bg-white rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden shadow-sm">
                      <img 
                        src={data.seller.logoUrl} 
                        alt="Logo" 
                        className="w-full h-full object-contain p-1" 
                      />
                    </div>
                  ) : (
                    <div className="relative w-24 h-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 hover:border-blue-300 transition-all bg-white dark:bg-gray-800 flex flex-col items-center justify-center text-gray-400 group cursor-pointer">
                      <Upload className="w-6 h-6 mb-1 group-hover:text-blue-500 transition-colors" />
                      <span className="text-[10px] text-center px-1 font-medium text-gray-500 dark:text-gray-400 group-hover:text-blue-600">Upload</span>
                      <input 
                        type="file" 
                        accept="image/png, image/jpeg, image/jpg" 
                        onChange={handleLogoUpload} 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                        title="Click to upload logo"
                      />
                    </div>
                  )}

                  {/* Controls Area */}
                  <div className="flex-1 flex flex-col justify-center min-h-[6rem]">
                    {data.seller.logoUrl ? (
                      <div className="space-y-2">
                        <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                          <ImageIcon className="w-3 h-3" /> Logo Uploaded
                        </p>
                         <label className="inline-block">
                             <div className="cursor-pointer px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition-all flex items-center gap-2">
                               <Upload className="w-3 h-3" />
                               Replace Logo
                             </div>
                             <input 
                               type="file" 
                               accept="image/png, image/jpeg, image/jpg" 
                               onChange={handleLogoUpload} 
                               className="hidden" 
                             />
                          </label>
                      </div>
                    ) : (
                      <div className="space-y-3 w-full">
                        <div>
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Upload File</p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400">Supported: PNG, JPG, JPEG (Max 4MB)</p>
                        </div>
                        
                        <div className="relative flex items-center">
                           <div className="flex-grow border-t border-gray-200 dark:border-gray-600"></div>
                           <span className="flex-shrink-0 mx-2 text-[10px] text-gray-400 uppercase font-medium">OR URL</span>
                           <div className="flex-grow border-t border-gray-200 dark:border-gray-600"></div>
                        </div>

                         <div>
                           <input
                            type="text"
                            placeholder="https://example.com/logo.png"
                            className="w-full text-xs p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-brand-500 outline-none transition-all placeholder:text-gray-400 bg-white dark:bg-gray-900 dark:text-white"
                            onChange={(e) => updateSeller('logoUrl', e.target.value)}
                           />
                           <p className="text-[10px] text-orange-500 mt-1">* Web URLs might not appear in PDF due to security policies.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <input 
              placeholder="Business Name" 
              value={data.seller.name || ''}
              onChange={(e) => updateSeller('name', e.target.value)}
              className={`${inputClass} font-medium`}
            />
            <textarea 
              placeholder="Address" 
              value={data.seller.address || ''}
              onChange={(e) => updateSeller('address', e.target.value)}
              className={`${inputClass} h-20 resize-none`}
            />
            {data.gstEnabled && (
              <div>
                <input 
                  placeholder="GSTIN (Required for Seller)" 
                  value={data.seller.gstin || ''}
                  onChange={(e) => updateSeller('gstin', e.target.value)}
                  className={`${inputClass} uppercase ${validateField('GSTIN', data.seller.gstin || '') ? 'border-red-300 focus:ring-red-200' : ''}`}
                />
                <ErrorMsg msg={validateField('GSTIN', data.seller.gstin || '')} />
              </div>
            )}
            <div>
              <input 
                  placeholder="PAN Number (Optional)" 
                  value={data.seller.pan || ''}
                  onChange={(e) => updateSeller('pan', e.target.value)}
                  className={`${inputClass} uppercase ${validateField('PAN', data.seller.pan || '') ? 'border-red-300 focus:ring-red-200' : ''}`}
              />
              <ErrorMsg msg={validateField('PAN', data.seller.pan || '')} />
            </div>
             <select 
              value={data.seller.state || 'Maharashtra'}
              onChange={(e) => updateSeller('state', e.target.value)}
              className={inputClass}
            >
              {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <div>
              <input 
                  placeholder="Email (Optional)" 
                  value={data.seller.email || ''}
                  onChange={(e) => updateSeller('email', e.target.value)}
                  className={`${inputClass} ${validateField('EMAIL', data.seller.email || '') ? 'border-red-300 focus:ring-red-200' : ''}`}
              />
              <ErrorMsg msg={validateField('EMAIL', data.seller.email || '')} />
            </div>
            <div>
              <input 
                  placeholder="Phone (Optional)" 
                  value={data.seller.phone || ''}
                  onChange={(e) => updateSeller('phone', e.target.value)}
                  className={`${inputClass} ${validateField('PHONE', data.seller.phone || '') ? 'border-red-300 focus:ring-red-200' : ''}`}
              />
              <ErrorMsg msg={validateField('PHONE', data.seller.phone || '')} />
            </div>
          </div>
        </div>

        {/* Buyer Section */}
        <div className={cardClass}>
          <div className="flex items-center gap-2 mb-4 text-brand-600 dark:text-brand-400">
            <User className="w-5 h-5" />
            <h3 className="font-semibold">To (Buyer)</h3>
          </div>
          <div className="space-y-3">
            <input 
              placeholder="Client Name" 
              value={data.buyer.name || ''}
              onChange={(e) => updateBuyer('name', e.target.value)}
              className={`${inputClass} font-medium`}
            />
            <textarea 
              placeholder="Address" 
              value={data.buyer.address || ''}
              onChange={(e) => updateBuyer('address', e.target.value)}
              className={`${inputClass} h-20 resize-none`}
            />
            {data.gstEnabled && (
              <div>
                <input 
                  placeholder="GSTIN (Optional for B2C)" 
                  value={data.buyer.gstin || ''}
                  onChange={(e) => updateBuyer('gstin', e.target.value)}
                  className={`${inputClass} uppercase ${validateField('GSTIN', data.buyer.gstin || '') ? 'border-red-300 focus:ring-red-200' : ''}`}
                />
                <ErrorMsg msg={validateField('GSTIN', data.buyer.gstin || '')} />
              </div>
            )}
            <div>
              <input 
                  placeholder="PAN Number (Optional)" 
                  value={data.buyer.pan || ''}
                  onChange={(e) => updateBuyer('pan', e.target.value)}
                  className={`${inputClass} uppercase ${validateField('PAN', data.buyer.pan || '') ? 'border-red-300 focus:ring-red-200' : ''}`}
              />
              <ErrorMsg msg={validateField('PAN', data.buyer.pan || '')} />
            </div>
            <select 
              value={data.buyer.state || 'Maharashtra'}
              onChange={(e) => updateBuyer('state', e.target.value)}
              className={inputClass}
            >
              {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <div>
               <input 
                  placeholder="Email (Optional)" 
                  value={data.buyer.email || ''}
                  onChange={(e) => updateBuyer('email', e.target.value)}
                  className={`${inputClass} ${validateField('EMAIL', data.buyer.email || '') ? 'border-red-300 focus:ring-red-200' : ''}`}
              />
              <ErrorMsg msg={validateField('EMAIL', data.buyer.email || '')} />
            </div>
            <div>
              <input 
                  placeholder="Phone (Optional)" 
                  value={data.buyer.phone || ''}
                  onChange={(e) => updateBuyer('phone', e.target.value)}
                  className={`${inputClass} ${validateField('PHONE', data.buyer.phone || '') ? 'border-red-300 focus:ring-red-200' : ''}`}
              />
              <ErrorMsg msg={validateField('PHONE', data.buyer.phone || '')} />
            </div>
          </div>
        </div>
      </div>

      {/* Items Section */}
      <div className={cardClass}>
        <div className="flex justify-between items-center mb-4">
           <h3 className="font-semibold text-gray-800 dark:text-gray-200">Items</h3>
           <span className="text-xs text-gray-500 dark:text-gray-400 font-medium bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
             {data.gstEnabled ? "Total includes GST" : "Total is plain amount"}
           </span>
        </div>
        
        <div className="space-y-4">
          {data.items.map((item, index) => {
            // Check for better HSN suggestions
            const suggestedHsn = data.gstEnabled ? findBestHsnMatch(item.description) : null;
            const hasBetterSuggestion = suggestedHsn && suggestedHsn !== item.hsn;

            return (
              <div key={item.id} className="flex flex-col gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg group border border-gray-100 dark:border-gray-600 hover:border-brand-200 dark:hover:border-brand-700 transition-colors">
                <div className="flex flex-col md:flex-row gap-3 items-start md:items-center w-full">
                  <div className="flex-1 w-full">
                     <label className="block md:hidden text-xs text-gray-500 dark:text-gray-400 mb-1">Description</label>
                    <input 
                      placeholder="Item Description (e.g. Laptop, Consulting)" 
                      value={item.description || ''}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  
                  {data.gstEnabled && (
                    <div className="w-full md:w-24 flex flex-col">
                       <label className="block md:hidden text-xs text-gray-500 dark:text-gray-400 mb-1">HSN</label>
                      <input 
                        placeholder="HSN" 
                        value={item.hsn || ''}
                        onChange={(e) => updateItem(index, 'hsn', e.target.value)}
                        className={inputClass}
                      />
                      {hasBetterSuggestion && (
                         <button 
                           onClick={() => updateItem(index, 'hsn', suggestedHsn)}
                           className="text-[10px] text-brand-600 dark:text-brand-400 text-left mt-1 hover:underline flex items-center gap-1 font-medium"
                           title="Apply suggested HSN Code"
                         >
                           <Sparkles className="w-3 h-3" /> Use {suggestedHsn}
                         </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-3 items-center w-full">
                  <div className="w-20 flex-grow md:flex-grow-0">
                    <label className="block md:hidden text-xs text-gray-500 dark:text-gray-400 mb-1">Qty</label>
                    <input 
                      type="number"
                      placeholder="Qty" 
                      value={item.qty || ''}
                      onChange={(e) => updateItem(index, 'qty', e.target.value === '' ? 0 : Number(e.target.value))}
                      className={inputClass}
                    />
                  </div>

                  <div className="w-28 flex-grow md:flex-grow-0">
                     <label className="block md:hidden text-xs text-gray-500 dark:text-gray-400 mb-1">Rate (₹)</label>
                    <input 
                      type="number"
                      placeholder="Rate" 
                      value={item.rate || ''}
                      onChange={(e) => updateItem(index, 'rate', e.target.value === '' ? 0 : Number(e.target.value))}
                      className={inputClass}
                      step="any"
                    />
                  </div>

                   {data.gstEnabled && (
                    <div className="w-24 flex-grow md:flex-grow-0">
                      <label className="block md:hidden text-xs text-gray-500 dark:text-gray-400 mb-1">GST %</label>
                      <select
                        value={item.gstRate || 0}
                        onChange={(e) => updateItem(index, 'gstRate', Number(e.target.value))}
                        className={inputClass}
                      >
                        {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                      </select>
                    </div>
                  )}
                  
                  <div className="flex-grow md:flex-grow-0 flex items-center justify-between md:justify-start gap-4 ml-auto md:ml-2">
                     <div className="text-right">
                       <span className="block text-[10px] text-gray-400 font-medium uppercase">Line Total</span>
                       <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{getLineTotal(item)}</span>
                     </div>
                     <button 
                      onClick={() => removeItem(index)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-all"
                      title="Remove Item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <button 
          onClick={addItem}
          className="mt-4 flex items-center gap-2 text-sm font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors px-2 py-1 hover:bg-brand-50 dark:hover:bg-brand-900/30 rounded-lg w-fit"
        >
          <Plus className="w-4 h-4" />
          Add Line Item
        </button>
      </div>
    </div>
  );
};

export default InvoiceForm;