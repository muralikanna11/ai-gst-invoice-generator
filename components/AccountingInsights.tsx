import React from 'react';
import { BookOpen, Info } from 'lucide-react';
import { InvoiceData, TaxSummary, InvoiceType } from '../types';

interface AccountingInsightsProps {
  data: InvoiceData;
  summary: TaxSummary;
}

const AccountingInsights: React.FC<AccountingInsightsProps> = ({ data, summary }) => {
  const isCreditNote = data.type === InvoiceType.CreditNote;
  const isDebitNote = data.type === InvoiceType.DebitNote;
  const isGST = data.gstEnabled;

  // Formatting helper
  const formatMoney = (amount: number) => 
    new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mt-8 transition-colors duration-200">
      {/* Header */}
      <div className="bg-slate-50 dark:bg-gray-900 p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="font-bold text-gray-800 dark:text-gray-100">Accounting Journal View (Golden Rules)</h3>
        </div>
        <div className="text-xs font-medium text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded border border-indigo-100 dark:border-indigo-800">
          Double Entry System
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: The Journal Entry */}
        <div className="lg:col-span-2">
          <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
            Pro-Forma Journal Entry
          </h4>
          <div className="overflow-hidden border border-gray-200 dark:border-gray-700 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left">Particulars</th>
                  <th className="px-4 py-3 text-left w-24">Type</th>
                  <th className="px-4 py-3 text-right w-32">Debit (₹)</th>
                  <th className="px-4 py-3 text-right w-32">Credit (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                
                {/* BUYER ENTRY (Sales & Debit Note) */}
                {(!isCreditNote) ? (
                  <tr className="bg-white dark:bg-gray-800">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                      {data.buyer.name || "Buyer"} A/c <span className="text-gray-400 dark:text-gray-500 font-normal italic ml-1">...Dr</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-blue-600 dark:text-blue-400 font-medium">Personal</td>
                    <td className="px-4 py-3 text-right font-mono text-gray-800 dark:text-gray-200">{formatMoney(summary.grandTotal)}</td>
                    <td className="px-4 py-3 text-right text-gray-300 dark:text-gray-600">-</td>
                  </tr>
                ) : null}

                {/* CREDIT NOTE: Sales Return is Debited */}
                {isCreditNote && (
                  <tr className="bg-white dark:bg-gray-800">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                      Sales Return A/c <span className="text-gray-400 dark:text-gray-500 font-normal italic ml-1">...Dr</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-orange-600 dark:text-orange-400 font-medium">Nominal</td>
                    <td className="px-4 py-3 text-right font-mono text-gray-800 dark:text-gray-200">{formatMoney(summary.taxableValue)}</td>
                    <td className="px-4 py-3 text-right text-gray-300 dark:text-gray-600">-</td>
                  </tr>
                )}

                {/* CREDIT NOTE: Output Taxes Debited (Reversed) */}
                {isCreditNote && isGST && summary.igst > 0 && (
                   <tr className="bg-white dark:bg-gray-800">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">Output IGST A/c <span className="text-gray-400 dark:text-gray-500 font-normal italic ml-1">...Dr</span></td>
                    <td className="px-4 py-3 text-xs text-blue-600 dark:text-blue-400 font-medium">Personal</td>
                    <td className="px-4 py-3 text-right font-mono text-gray-800 dark:text-gray-200">{formatMoney(summary.igst)}</td>
                    <td className="px-4 py-3 text-right text-gray-300 dark:text-gray-600">-</td>
                  </tr>
                )}
                 {isCreditNote && isGST && summary.cgst > 0 && (
                   <>
                    <tr className="bg-white dark:bg-gray-800">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">Output CGST A/c <span className="text-gray-400 dark:text-gray-500 font-normal italic ml-1">...Dr</span></td>
                      <td className="px-4 py-3 text-xs text-blue-600 dark:text-blue-400 font-medium">Personal</td>
                      <td className="px-4 py-3 text-right font-mono text-gray-800 dark:text-gray-200">{formatMoney(summary.cgst)}</td>
                      <td className="px-4 py-3 text-right text-gray-300 dark:text-gray-600">-</td>
                    </tr>
                    <tr className="bg-white dark:bg-gray-800">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">Output SGST A/c <span className="text-gray-400 dark:text-gray-500 font-normal italic ml-1">...Dr</span></td>
                      <td className="px-4 py-3 text-xs text-blue-600 dark:text-blue-400 font-medium">Personal</td>
                      <td className="px-4 py-3 text-right font-mono text-gray-800 dark:text-gray-200">{formatMoney(summary.sgst)}</td>
                      <td className="px-4 py-3 text-right text-gray-300 dark:text-gray-600">-</td>
                    </tr>
                   </>
                )}


                {/* SALES ENTRY (Tax Invoice / Bill of Supply) */}
                {!isCreditNote && !isDebitNote && (
                  <tr className="bg-white dark:bg-gray-800">
                    <td className="px-4 py-3 pl-8 text-gray-600 dark:text-gray-400">
                      To Sales A/c
                    </td>
                    <td className="px-4 py-3 text-xs text-orange-600 dark:text-orange-400 font-medium">Nominal</td>
                    <td className="px-4 py-3 text-right text-gray-300 dark:text-gray-600">-</td>
                    <td className="px-4 py-3 text-right font-mono text-gray-800 dark:text-gray-200">{formatMoney(summary.taxableValue)}</td>
                  </tr>
                )}
                
                {/* DEBIT NOTE ENTRY */}
                 {isDebitNote && (
                  <tr className="bg-white dark:bg-gray-800">
                    <td className="px-4 py-3 pl-8 text-gray-600 dark:text-gray-400">
                      To Other Income / Sales A/c (Value Increase)
                    </td>
                    <td className="px-4 py-3 text-xs text-orange-600 dark:text-orange-400 font-medium">Nominal</td>
                    <td className="px-4 py-3 text-right text-gray-300 dark:text-gray-600">-</td>
                    <td className="px-4 py-3 text-right font-mono text-gray-800 dark:text-gray-200">{formatMoney(summary.taxableValue)}</td>
                  </tr>
                )}

                {/* GST ENTRIES (Tax Invoice, Debit Note) */}
                {!isCreditNote && isGST && (
                  <>
                    {summary.igst > 0 ? (
                      <tr className="bg-white dark:bg-gray-800">
                        <td className="px-4 py-3 pl-8 text-gray-600 dark:text-gray-400">To Output IGST A/c</td>
                        <td className="px-4 py-3 text-xs text-blue-600 dark:text-blue-400 font-medium">Personal</td>
                        <td className="px-4 py-3 text-right text-gray-300 dark:text-gray-600">-</td>
                        <td className="px-4 py-3 text-right font-mono text-gray-800 dark:text-gray-200">{formatMoney(summary.igst)}</td>
                      </tr>
                    ) : (
                      <>
                        <tr className="bg-white dark:bg-gray-800">
                          <td className="px-4 py-3 pl-8 text-gray-600 dark:text-gray-400">To Output CGST A/c</td>
                          <td className="px-4 py-3 text-xs text-blue-600 dark:text-blue-400 font-medium">Personal</td>
                          <td className="px-4 py-3 text-right text-gray-300 dark:text-gray-600">-</td>
                          <td className="px-4 py-3 text-right font-mono text-gray-800 dark:text-gray-200">{formatMoney(summary.cgst)}</td>
                        </tr>
                        <tr className="bg-white dark:bg-gray-800">
                          <td className="px-4 py-3 pl-8 text-gray-600 dark:text-gray-400">To Output SGST A/c</td>
                          <td className="px-4 py-3 text-xs text-blue-600 dark:text-blue-400 font-medium">Personal</td>
                          <td className="px-4 py-3 text-right text-gray-300 dark:text-gray-600">-</td>
                          <td className="px-4 py-3 text-right font-mono text-gray-800 dark:text-gray-200">{formatMoney(summary.sgst)}</td>
                        </tr>
                      </>
                    )}
                  </>
                )}

                {/* CREDIT NOTE: Buyer Credited */}
                {isCreditNote && (
                  <tr className="bg-white dark:bg-gray-800">
                    <td className="px-4 py-3 pl-8 text-gray-600 dark:text-gray-400">
                      To {data.buyer.name || "Buyer"} A/c
                    </td>
                    <td className="px-4 py-3 text-xs text-blue-600 dark:text-blue-400 font-medium">Personal</td>
                    <td className="px-4 py-3 text-right text-gray-300 dark:text-gray-600">-</td>
                    <td className="px-4 py-3 text-right font-mono text-gray-800 dark:text-gray-200">{formatMoney(summary.grandTotal)}</td>
                  </tr>
                )}

              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 italic">
            (Being {isCreditNote ? 'goods returned/value reduced' : isDebitNote ? 'value increased/short charge rectified' : 'goods sold/services provided'} vide {data.invoiceNumber})
          </p>
        </div>

        {/* Right: Golden Rules Explanation */}
        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-5 border border-indigo-100 dark:border-indigo-800/50">
          <h4 className="flex items-center gap-2 text-sm font-bold text-indigo-900 dark:text-indigo-200 mb-4">
            <Info className="w-4 h-4" /> The Golden Rules Logic
          </h4>
          
          <div className="space-y-4">
            {/* Personal Account Rule */}
            <div className="bg-white dark:bg-gray-800 p-3 rounded shadow-sm border border-indigo-100 dark:border-gray-700">
              <div className="text-xs font-bold text-indigo-500 dark:text-indigo-400 uppercase mb-1">Personal Account</div>
              <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">Debit the Receiver, Credit the Giver</div>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                {!isCreditNote 
                  ? `The Buyer (${data.buyer.name || 'Party'}) is receiving value, so their account is Debited.`
                  : `The Buyer is giving back goods (or value), so their account is Credited.`
                }
              </p>
            </div>

            {/* Nominal Account Rule */}
            <div className="bg-white dark:bg-gray-800 p-3 rounded shadow-sm border border-indigo-100 dark:border-gray-700">
              <div className="text-xs font-bold text-orange-500 dark:text-orange-400 uppercase mb-1">Nominal Account</div>
              <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">Debit Expenses/Losses, Credit Incomes/Gains</div>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                {!isCreditNote
                  ? "Sales/Income is Credited (Gain)."
                  : "Sales Return implies a reduction in income (Loss), so it is Debited."
                }
              </p>
            </div>

             {/* Real Account Rule (Reference) */}
             <div className="bg-white dark:bg-gray-800 p-3 rounded shadow-sm border border-indigo-100 dark:border-gray-700 opacity-60">
              <div className="text-xs font-bold text-emerald-600 dark:text-emerald-500 uppercase mb-1">Real Account</div>
              <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">Debit what comes in, Credit what goes out</div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                (Applicable if this was a Cash Transaction)
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AccountingInsights;