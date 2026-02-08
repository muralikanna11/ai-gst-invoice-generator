import React from 'react';
import { InvoiceData, TaxSummary, InvoiceType } from '../types';
import { numberToWords } from '../services/formatters';

interface InvoicePreviewProps {
  data: InvoiceData;
  summary: TaxSummary;
}

const InvoicePreview: React.FC<InvoicePreviewProps> = ({ data, summary }) => {
  const formatNumber = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2, // Always show 2 decimal places (e.g., 100.00)
    }).format(amount);
  };

  const sellerState = (data.seller.state || '').toLowerCase().trim();
  const buyerState = (data.buyer.state || '').toLowerCase().trim();
  const isInterState = sellerState !== buyerState;
  
  const isCreditOrDebitNote = data.type === InvoiceType.CreditNote || data.type === InvoiceType.DebitNote;
  const isBillOfSupply = data.type === InvoiceType.BillOfSupply;

  return (
    <div id="invoice-preview" className="bg-white text-black p-8 md:p-12 shadow-2xl rounded-sm min-h-[800px] text-xs md:text-sm leading-relaxed border-t-8 border-brand-600">
      
      {/* Header */}
      <div className="flex justify-between items-start mb-12">
        <div>
          {data.logoEnabled && (
            <div className="w-24 h-24 mb-4 rounded flex items-center justify-start overflow-hidden">
               {data.seller.logoUrl ? (
                <img src={data.seller.logoUrl} alt="Business Logo" className="w-full h-full object-contain" />
               ) : (
                <div className="w-16 h-16 bg-gray-100 border border-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
                  LOGO
                </div>
               )}
            </div>
          )}
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Details of Supplier</h3>
          <h2 className="text-xl font-bold text-gray-900">{data.seller.name || "Seller Name"}</h2>
          <p className="text-gray-500 w-48 whitespace-pre-line">{data.seller.address}</p>
          {data.gstEnabled && data.seller.gstin && (
             <p className="text-gray-500 mt-1">GSTIN: <span className="font-mono text-gray-700">{data.seller.gstin}</span></p>
          )}
          {data.seller.pan && (
             <p className="text-gray-500 mt-1">PAN: <span className="font-mono text-gray-700">{data.seller.pan}</span></p>
          )}
          <p className="text-gray-500">State: {data.seller.state}</p>
          {data.seller.email && (
             <p className="text-gray-500 mt-1">Email: {data.seller.email}</p>
          )}
          {data.seller.phone && (
             <p className="text-gray-500 mt-1">Phone: {data.seller.phone}</p>
          )}
        </div>

        <div className="text-right">
          <h1 className="text-3xl font-light text-brand-600 uppercase tracking-wide mb-2">{data.type}</h1>
          
          {/* Legal Text for Bill of Supply */}
          {isBillOfSupply && (
             <p className="text-[10px] text-gray-400 font-medium mb-3 uppercase max-w-[200px] ml-auto">
               Composition taxable person, not eligible to collect tax on supplies
             </p>
          )}

          <p className="text-gray-500">
            {isCreditOrDebitNote ? 'Note #' : 'Invoice #'} <span className="font-medium text-gray-900">{data.invoiceNumber || ''}</span>
          </p>
          <p className="text-gray-500">
            {isCreditOrDebitNote ? 'Date' : 'Date'}: <span className="font-medium text-gray-900">{data.invoiceDate || ''}</span>
          </p>
          
          {/* Reference to Original Invoice for Notes */}
          {isCreditOrDebitNote && (data.originalInvoiceNumber || data.originalInvoiceDate) && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-500">Orig. Inv. #: <span className="font-medium text-gray-700">{data.originalInvoiceNumber}</span></p>
              <p className="text-xs text-gray-500">Orig. Date: <span className="font-medium text-gray-700">{data.originalInvoiceDate}</span></p>
            </div>
          )}

          <p className="text-gray-500 mt-2 text-xs">Place of Supply: <span className="font-semibold text-gray-900">{data.buyer.state || "N/A"}</span></p>
        </div>
      </div>

      {/* Bill To */}
      <div className="mb-12">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Details of Recipient (Billed To)</h3>
        <h2 className="text-lg font-bold text-gray-900">{data.buyer.name || "Buyer Name"}</h2>
        <p className="text-gray-500 w-64 whitespace-pre-line">{data.buyer.address}</p>
        {data.gstEnabled && data.buyer.gstin && (
          <p className="text-gray-500 mt-1">GSTIN: <span className="font-mono text-gray-700">{data.buyer.gstin}</span></p>
        )}
        {data.buyer.pan && (
           <p className="text-gray-500 mt-1">PAN: <span className="font-mono text-gray-700">{data.buyer.pan}</span></p>
        )}
        <p className="text-gray-500">State: {data.buyer.state}</p>
        {data.buyer.email && (
           <p className="text-gray-500 mt-1">Email: {data.buyer.email}</p>
        )}
        {data.buyer.phone && (
           <p className="text-gray-500 mt-1">Phone: {data.buyer.phone}</p>
        )}
      </div>

      {/* Table */}
      <div className="w-full mb-8 overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="border-b-2 border-brand-100">
              <th className="text-left py-3 font-semibold text-brand-900 w-1/4">Item</th>
              {data.gstEnabled && <th className="text-center py-3 font-semibold text-brand-900">HSN</th>}
              <th className="text-center py-3 font-semibold text-brand-900">Qty</th>
              <th className="text-right py-3 font-semibold text-brand-900">Rate</th>
              <th className="text-right py-3 font-semibold text-brand-900">Taxable</th>
              
              {data.gstEnabled && (
                isInterState ? (
                  <>
                    <th className="text-center py-3 font-semibold text-brand-900">IGST %</th>
                    <th className="text-right py-3 font-semibold text-brand-900">IGST Amt</th>
                  </>
                ) : (
                  <>
                    <th className="text-center py-3 font-semibold text-brand-900">CGST %</th>
                    <th className="text-right py-3 font-semibold text-brand-900">CGST Amt</th>
                    <th className="text-center py-3 font-semibold text-brand-900">SGST %</th>
                    <th className="text-right py-3 font-semibold text-brand-900">SGST Amt</th>
                  </>
                )
              )}
              
              <th className="text-right py-3 font-semibold text-brand-900">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.items.map((item) => {
              const taxableValue = item.qty * item.rate;
              const taxAmount = (taxableValue * item.gstRate) / 100;
              const totalAmount = taxableValue + (data.gstEnabled ? taxAmount : 0);
              
              return (
                <tr key={item.id}>
                  <td className="py-3 text-gray-800">
                    <div className="font-medium">{item.description}</div>
                  </td>
                  {data.gstEnabled && <td className="py-3 text-center text-gray-500 font-mono text-xs">{item.hsn}</td>}
                  <td className="py-3 text-center text-gray-600">{Number(item.qty)}</td>
                  <td className="py-3 text-right text-gray-600 font-medium">{formatNumber(Number(item.rate))}</td>
                  <td className="py-3 text-right text-gray-800">{formatNumber(taxableValue)}</td>
                  
                  {data.gstEnabled && (
                    isInterState ? (
                      <>
                        <td className="py-3 text-center text-gray-600 text-xs">
                           {Number(item.gstRate)}%
                        </td>
                        <td className="py-3 text-right text-gray-600 text-xs">
                           {formatNumber(taxAmount)}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-3 text-center text-gray-600 text-xs">
                          {Number(item.gstRate) / 2}%
                        </td>
                        <td className="py-3 text-right text-gray-600 text-xs">
                          {formatNumber(taxAmount / 2)}
                        </td>
                        <td className="py-3 text-center text-gray-600 text-xs">
                          {Number(item.gstRate) / 2}%
                        </td>
                        <td className="py-3 text-right text-gray-600 text-xs">
                          {formatNumber(taxAmount / 2)}
                        </td>
                      </>
                    )
                  )}

                  <td className="py-3 text-right font-bold text-gray-900">{formatNumber(totalAmount)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-72 space-y-3 bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between text-gray-600 text-sm">
            <span>Taxable Amount</span>
            <span className="font-medium">{formatNumber(summary.taxableValue)}</span>
          </div>
          
          {data.gstEnabled && (
            <>
              {summary.igst > 0 ? (
                <div className="flex justify-between text-gray-600 text-sm">
                  <span>IGST Total</span>
                  <span className="font-medium">{formatNumber(summary.igst)}</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between text-gray-600 text-sm">
                    <span>CGST Total</span>
                    <span className="font-medium">{formatNumber(summary.cgst)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 text-sm">
                    <span>SGST Total</span>
                    <span className="font-medium">{formatNumber(summary.sgst)}</span>
                  </div>
                </>
              )}
            </>
          )}

          {/* Round Off Row */}
          {summary.roundOff !== 0 && (
            <div className="flex justify-between text-gray-600 text-sm">
              <span>Round Off</span>
              <span className="font-medium">{formatNumber(summary.roundOff)}</span>
            </div>
          )}

          <div className="flex justify-between pt-3 border-t border-gray-200 text-xl font-bold text-gray-900">
            <span>Grand Total</span>
            <span>₹ {formatNumber(summary.grandTotal)}</span>
          </div>
          <div className="text-right text-xs text-gray-500 italic">
            (Inclusive of all taxes)
          </div>
          
          <div className="mt-4 border-t border-gray-100 pt-3">
            <p className="text-xs text-gray-500 uppercase font-bold mb-1">Amount in Words</p>
            <p className="text-sm text-gray-800 italic leading-snug">{numberToWords(summary.grandTotal)}</p>
          </div>
        </div>
      </div>
      
      {/* Footer Disclaimer */}
      <div className="mt-16 pt-8 border-t border-gray-100 text-center text-gray-400 text-xs">
        <p>This is a draft invoice generated for business purposes. Please verify details before final use.</p>
        <p>Subject to {data.seller.state} Jurisdiction.</p>
      </div>

    </div>
  );
};

export default InvoicePreview;