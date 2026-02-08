import { InvoiceType, InvoiceData } from './types';

export const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", 
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", 
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", 
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", 
  "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", 
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", 
  "Lakshadweep", "Puducherry"
];

export const GST_RATES = [0, 5, 12, 18, 28];

export const COMMON_HSN_MAP: Record<string, string> = {
  // Electronics & Gadgets
  "laptop": "8471",
  "computer": "8471",
  "printer": "8443",
  "mouse": "8471",
  "keyboard": "8471",
  "monitor": "8528",
  "mobile": "8517",
  "phone": "8517",
  "tablet": "8471",
  "camera": "8525",
  "hard disk": "8471",
  "pen drive": "8523",
  "router": "8517",
  "projector": "8528",
  "speaker": "8518",
  "headphone": "8518",
  "earphone": "8518",
  "smart watch": "8517",
  "cctv": "8525",
  "battery": "8506",
  "charger": "8504",
  
  // IT & Professional Services
  "consulting": "9983",
  "web design": "9983",
  "development": "9983",
  "software": "9973",
  "marketing": "9983",
  "advertising": "9983",
  "hosting": "9983",
  "domain": "9983",
  "seo": "9983",
  "maintenance": "9987",
  "legal": "9982",
  "accounting": "9982",
  "audit": "9982",
  "recruitment": "9985",
  "security": "9985",
  "courier": "9968",
  "transport": "9965",
  "rental": "9972",
  "brokerage": "9971",
  "training": "9992",
  "photography": "9996",
  
  // Home & Construction
  "cement": "2523",
  "paint": "3208",
  "steel": "7200",
  "wood": "4407",
  "plywood": "4412",
  "door": "4418",
  "window": "7610",
  "glass": "7007",
  "tiles": "6907",
  "bricks": "6904",
  "sand": "2505",
  "pipe": "3917",
  "wire": "8544",
  "switch": "8536",
  "bulb": "8539",
  "led": "8539",
  "fan": "8414",
  "ac": "8415",
  "refrigerator": "8418",
  "furniture": "9403",
  
  // Food & Consumables
  "rice": "1006",
  "wheat": "1001",
  "flour": "1101",
  "milk": "0401",
  "butter": "0405",
  "cheese": "0406",
  "honey": "0409",
  "water": "2201",
  "coffee": "0901",
  "tea": "0902",
  "spices": "0910",
  "sugar": "1701",
  "chocolate": "1806",
  "biscuit": "1905",
  
  // Clothing & Personal
  "shirt": "6205",
  "trousers": "6203",
  "clothing": "6100",
  "shoes": "6400",
  "soap": "3401",
  "shampoo": "3305",
  "sanitizer": "3808",
  "mask": "6307",
  
  // Stationary
  "paper": "4802",
  "pen": "9608",
  "notebook": "4820",
  "file": "4820",
  "book": "4901",
};

export const DEFAULT_INVOICE: InvoiceData = {
  id: 'new',
  invoiceNumber: 'INV-001',
  invoiceDate: new Date().toISOString().split('T')[0],
  dueDate: '',
  type: InvoiceType.TaxInvoice,
  originalInvoiceNumber: '',
  originalInvoiceDate: '',
  gstEnabled: true,
  logoEnabled: true,
  seller: {
    name: 'Your Business Name',
    gstin: '',
    address: '',
    state: 'Maharashtra',
    email: '',
    phone: '',
    pan: ''
  },
  buyer: {
    name: '',
    gstin: '',
    address: '',
    state: 'Maharashtra',
    email: '',
    phone: '',
    pan: ''
  },
  items: [
    {
      id: '1',
      description: 'Consulting Services',
      hsn: '9983',
      qty: 1,
      rate: 1000,
      gstRate: 18
    }
  ],
  notes: 'Thank you for your business.',
  terms: 'Payment due within 15 days.'
};