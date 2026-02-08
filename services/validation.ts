import { InvoiceData } from "../types";

export const REGEX = {
  // GSTIN: 2 digits (State) + 5 chars (PAN) + 4 digits (PAN) + 1 char (PAN) + 1 digit (Entity no) + Z + 1 char (Check code)
  GSTIN: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
  
  // PAN: 5 chars + 4 digits + 1 char
  PAN: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
  
  // Email: Standard email pattern
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  
  // Phone: 10 digits (Indian context usually)
  PHONE: /^[0-9]{10}$/
};

export interface ValidationErrors {
  [key: string]: string;
}

export const validateField = (type: 'GSTIN' | 'PAN' | 'EMAIL' | 'PHONE', value: string): string | null => {
  if (!value || !value.trim()) return null; // Allow empty or whitespace-only (treated as empty)
  
  const cleanValue = value.trim();
  
  switch (type) {
    case 'GSTIN':
      return REGEX.GSTIN.test(cleanValue) ? null : "Invalid GSTIN format (e.g., 27ABCDE1234F1Z5)";
    case 'PAN':
      return REGEX.PAN.test(cleanValue) ? null : "Invalid PAN format (e.g., ABCDE1234F)";
    case 'EMAIL':
      return REGEX.EMAIL.test(cleanValue) ? null : "Invalid email address";
    case 'PHONE':
      return REGEX.PHONE.test(cleanValue) ? null : "Phone must be 10 digits";
    default:
      return null;
  }
};

export const validateInvoiceData = (data: InvoiceData): string[] => {
  const errors: string[] = [];

  // 1. Seller Validation
  if (!data.seller.name) errors.push("Seller Name is required");
  
  // Seller GSTIN is mandatory if GST is enabled (Legal requirement to charge tax)
  if (data.gstEnabled && !data.seller.gstin) {
    errors.push("Seller GSTIN is required when GST is enabled");
  } else if (data.seller.gstin && !REGEX.GSTIN.test(data.seller.gstin)) {
    errors.push("Seller GSTIN is invalid");
  }
  
  if (data.seller.pan && !REGEX.PAN.test(data.seller.pan)) errors.push("Seller PAN is invalid");
  if (data.seller.email && !REGEX.EMAIL.test(data.seller.email)) errors.push("Seller Email is invalid");
  if (data.seller.phone && !REGEX.PHONE.test(data.seller.phone)) errors.push("Seller Phone is invalid");

  // 2. Buyer Validation
  if (!data.buyer.name) errors.push("Buyer Name is required");
  
  // Buyer GSTIN is OPTIONAL (B2C transactions don't have Buyer GSTIN)
  // Only validate format if provided
  if (data.buyer.gstin && data.buyer.gstin.trim() && !REGEX.GSTIN.test(data.buyer.gstin)) {
    errors.push("Buyer GSTIN is invalid");
  }
  
  if (data.buyer.pan && !REGEX.PAN.test(data.buyer.pan)) errors.push("Buyer PAN is invalid");
  if (data.buyer.email && !REGEX.EMAIL.test(data.buyer.email)) errors.push("Buyer Email is invalid");
  if (data.buyer.phone && !REGEX.PHONE.test(data.buyer.phone)) errors.push("Buyer Phone is invalid");

  // 3. Items Validation
  if (data.items.length === 0) errors.push("At least one item is required");
  data.items.forEach((item, index) => {
    if (!item.description) errors.push(`Item ${index + 1}: Description is required`);
    if (item.qty <= 0) errors.push(`Item ${index + 1}: Quantity must be greater than 0`);
    if (item.rate < 0) errors.push(`Item ${index + 1}: Rate cannot be negative`);
  });

  return errors;
};