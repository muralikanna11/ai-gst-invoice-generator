export enum InvoiceType {
  TaxInvoice = 'Tax Invoice',
  BillOfSupply = 'Bill of Supply',
  ProformaInvoice = 'Proforma Invoice',
  CreditNote = 'Credit Note',
  DebitNote = 'Debit Note',
}

export interface Party {
  name: string;
  gstin: string;
  address: string;
  state: string;
  email?: string;
  phone?: string;
  logoUrl?: string;
  pan?: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  hsn: string;
  qty: number;
  rate: number;
  gstRate: number; // Percentage (e.g., 18)
}

export interface TaxSummary {
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  roundOff: number;
  grandTotal: number;
}

export interface InvoiceData {
  id: string;
  userId?: string; // For saved invoices
  createdAt?: string; // ISO string
  updatedAt?: string; // ISO string
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  type: InvoiceType;
  
  // Credit/Debit Note specifics
  originalInvoiceNumber?: string;
  originalInvoiceDate?: string;
  
  // Toggles
  gstEnabled: boolean;
  logoEnabled: boolean;
  
  // Parties
  seller: Party;
  buyer: Party;
  
  // Content
  items: InvoiceItem[];
  notes: string;
  terms: string;
  
  // Calculated
  summary?: TaxSummary;
}

export interface AIResponseSchema {
  invoiceType: string;
  buyerName: string;
  buyerGstin?: string;
  buyerAddress?: string;
  items: {
    description: string;
    qty: number;
    rate: number;
    hsn?: string;
    gstRate?: number;
  }[];
}