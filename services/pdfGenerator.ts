import { InvoiceData, TaxSummary, InvoiceType } from "../types";
import { numberToWords } from "./formatters";

// Declaration for the window object to include jspdf
declare global {
  interface Window {
    jspdf: any;
  }
}

export const generatePDF = (invoice: InvoiceData, summary: TaxSummary) => {
  if (!window.jspdf) {
    alert("PDF library not loaded. Please check your internet connection.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  // Helper for smart formatting: forces 2 decimal places, adds Indian commas
  const formatAmount = (amount: number) => {
    return amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  
  const marginLeft = 15;
  const marginRight = 15;
  const pageWidth = doc.internal.pageSize.width;
  // const contentWidth = pageWidth - marginLeft - marginRight; // unused
  let yPos = 20;

  // -- LOGO --
  if (invoice.logoEnabled && invoice.seller.logoUrl) {
    try {
      const imgData = invoice.seller.logoUrl;
      const logoWidth = 28; // Slightly larger logo
      const imgProps = doc.getImageProperties(imgData);
      const logoHeight = (imgProps.height * logoWidth) / imgProps.width;

      doc.addImage(imgData, marginLeft, yPos, logoWidth, logoHeight);
      yPos += logoHeight + 5; 
    } catch (e) {
      console.warn("Could not add logo to PDF:", e);
    }
  }

  // -- HEADER (Right Side) --
  // We reset Y for the header text so it aligns with top even if logo pushes left side down
  const headerYStart = 20;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(41, 98, 255); // Blue
  doc.text((invoice.type || 'Invoice').toUpperCase(), pageWidth - marginRight, headerYStart, { align: "right" });
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(80);
  
  const isCreditOrDebitNote = invoice.type === InvoiceType.CreditNote || invoice.type === InvoiceType.DebitNote;
  const invoiceNo = invoice.invoiceNumber || '';
  const invoiceDate = invoice.invoiceDate || '';

  doc.text(`${isCreditOrDebitNote ? 'Note' : 'Invoice'} # ${invoiceNo}`, pageWidth - marginRight, headerYStart + 8, { align: "right" });
  doc.text(`Date: ${invoiceDate}`, pageWidth - marginRight, headerYStart + 14, { align: "right" });

  if (isCreditOrDebitNote) {
     if (invoice.originalInvoiceNumber) {
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text(`Orig. Inv # ${invoice.originalInvoiceNumber}`, pageWidth - marginRight, headerYStart + 20, { align: "right" });
        if (invoice.originalInvoiceDate) {
           doc.text(`Orig. Date: ${invoice.originalInvoiceDate}`, pageWidth - marginRight, headerYStart + 25, { align: "right" });
        }
     }
  }


  // Seller Info (Left) - Continue from where Logo left off or default
  // Ensure we don't overlap if logo wasn't there
  yPos = Math.max(yPos, 20); 

  doc.setFontSize(9);
  doc.setTextColor(150);
  doc.text("DETAILS OF SUPPLIER", marginLeft, yPos);
  yPos += 6;

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0);
  doc.text(invoice.seller.name || '', marginLeft, yPos);
  yPos += 7;
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(60);
  doc.text(invoice.seller.address || '', marginLeft, yPos, { maxWidth: 85 });
  
  // Calculate height of address to push next elements down
  const sellerAddressLines = doc.splitTextToSize(invoice.seller.address || '', 85).length;
  yPos += (sellerAddressLines * 4.5) + 3;

  if(invoice.gstEnabled && invoice.seller.gstin) {
      doc.text(`GSTIN: ${invoice.seller.gstin}`, marginLeft, yPos);
      yPos += 5;
  }
  if(invoice.seller.pan) {
      doc.text(`PAN: ${invoice.seller.pan}`, marginLeft, yPos);
      yPos += 5;
  }
  doc.text(`State: ${invoice.seller.state || ''}`, marginLeft, yPos);
  
  // Add Email/Phone if available
  yPos += 5;
  if(invoice.seller.email) {
      doc.text(`Email: ${invoice.seller.email}`, marginLeft, yPos);
      yPos += 5;
  }
  if(invoice.seller.phone) {
      doc.text(`Phone: ${invoice.seller.phone}`, marginLeft, yPos);
      yPos += 5;
  }

  // -- BILL TO --
  // Ensure ample space between Supplier and Buyer sections
  // Increased gap for better separation
  yPos = Math.max(yPos + 18, 90); 
  
  doc.setFontSize(9);
  doc.setTextColor(150);
  doc.text("DETAILS OF RECIPIENT (BILLED TO)", marginLeft, yPos);
  yPos += 6;
  
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0);
  
  // Only show Buyer Name if entered
  if (invoice.buyer.name) {
    doc.text(invoice.buyer.name, marginLeft, yPos);
    yPos += 7;
  }
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(60);
  
  // Only show Buyer Address if entered
  if (invoice.buyer.address) {
    doc.text(invoice.buyer.address, marginLeft, yPos, { maxWidth: 85 });
    const buyerAddressLines = doc.splitTextToSize(invoice.buyer.address, 85).length;
    yPos += (buyerAddressLines * 4.5) + 3;
  }

  if (invoice.gstEnabled && invoice.buyer.gstin) {
    doc.text(`GSTIN: ${invoice.buyer.gstin}`, marginLeft, yPos);
    yPos += 5;
  }

  // Only show Buyer State if entered
  if (invoice.buyer.state) {
    doc.text(`State: ${invoice.buyer.state}`, marginLeft, yPos);
    yPos += 5;
  }
  
  // Place of Supply Indicator
  // Align roughly with Buyer details on the right
  if (invoice.buyer.state) {
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Place of Supply: ${invoice.buyer.state}`, pageWidth - marginRight, yPos - 5, { align: "right" });
  }

  // Buyer Optional Fields
  if (invoice.buyer.pan) {
    doc.text(`PAN: ${invoice.buyer.pan}`, marginLeft, yPos);
    yPos += 5;
  }
  if (invoice.buyer.email) {
    doc.text(`Email: ${invoice.buyer.email}`, marginLeft, yPos);
    yPos += 5;
  }
  if (invoice.buyer.phone) {
    doc.text(`Phone: ${invoice.buyer.phone}`, marginLeft, yPos);
    yPos += 5;
  }


  // -- GST LOGIC FOR COLUMNS --
  // Determine Inter-state (IGST) or Intra-state (CGST+SGST)
  const sellerState = (invoice.seller.state || '').toLowerCase().trim();
  const buyerState = (invoice.buyer.state || '').toLowerCase().trim();
  const isInterState = sellerState !== buyerState;

  // -- TABLE --
  // Add more padding before table
  yPos += 20;
  
  let tableHeaders = [];
  let tableBody = [];
  let columnStyles: any = {};

  if (!invoice.gstEnabled) {
    // Non-GST Table
    // Headers without currency symbols
    tableHeaders = [["Item", "Qty", "Rate", "Total"]];
    tableBody = invoice.items.map(item => [
      item.description || '',
      (item.qty || 0).toString(),
      `${formatAmount(item.rate || 0)}`,
      `${formatAmount((item.qty || 0) * (item.rate || 0))}`
    ]);
    columnStyles = {
        0: { halign: 'left' },    // Item
        1: { halign: 'center' },  // Qty
        2: { halign: 'right' },   // Rate
        3: { halign: 'right' }    // Total
    };
  } else {
    if (isInterState) {
      // IGST Table (Split Rate and Amt)
      // Headers without currency symbols
      tableHeaders = [["Item", "HSN", "Qty", "Rate", "Taxable", "IGST %", "IGST Amt", "Total"]];
      tableBody = invoice.items.map(item => {
        const taxable = (item.qty || 0) * (item.rate || 0);
        const taxAmt = (taxable * (item.gstRate || 0)) / 100;
        const total = taxable + taxAmt;
        return [
          item.description || '',
          item.hsn || '',
          (item.qty || 0).toString(),
          `${formatAmount(item.rate || 0)}`,
          `${formatAmount(taxable)}`,
          `${item.gstRate || 0}%`,
          `${formatAmount(taxAmt)}`,
          `${formatAmount(total)}`
        ];
      });
      
      columnStyles = {
          0: { halign: 'left', cellWidth: 40 }, // Item
          1: { halign: 'center' }, // HSN
          2: { halign: 'center' }, // Qty
          3: { halign: 'right' },  // Rate
          4: { halign: 'right' },  // Taxable
          5: { halign: 'center' }, // IGST Rate
          6: { halign: 'right' },  // IGST Amt
          7: { halign: 'right' }   // Total
      };

    } else {
      // CGST + SGST Table (Split Rate and Amt)
      // Headers without currency symbols
      // This results in many columns: Item, HSN, Qty, Rate, Taxable, CGST%, CGST, SGST%, SGST, Total (10 cols)
      tableHeaders = [["Item", "HSN", "Qty", "Rate", "Taxable", "CGST %", "Amt", "SGST %", "Amt", "Total"]];
      tableBody = invoice.items.map(item => {
        const taxable = (item.qty || 0) * (item.rate || 0);
        const taxAmt = (taxable * (item.gstRate || 0)) / 100;
        const halfTax = taxAmt / 2;
        const halfRate = (item.gstRate || 0) / 2;
        const total = taxable + taxAmt;
        return [
          item.description || '',
          item.hsn || '',
          (item.qty || 0).toString(),
          `${formatAmount(item.rate || 0)}`,
          `${formatAmount(taxable)}`,
          `${halfRate}%`,
          `${formatAmount(halfTax)}`,
          `${halfRate}%`,
          `${formatAmount(halfTax)}`,
          `${formatAmount(total)}`
        ];
      });

      columnStyles = {
          0: { halign: 'left', cellWidth: 30 }, // Item - Reduced width to give space to numbers
          1: { halign: 'center' }, // HSN
          2: { halign: 'center' }, // Qty
          3: { halign: 'right' },  // Rate
          4: { halign: 'right' },  // Taxable
          5: { halign: 'center' }, // CGST %
          6: { halign: 'right' },  // CGST Amt
          7: { halign: 'center' }, // SGST %
          8: { halign: 'right' },  // SGST Amt
          9: { halign: 'right' }   // Total
      };
    }
  }

  // Determine font size based on density
  // If showing split CGST/SGST (10 columns), reduce font size slightly
  const tableFontSize = (invoice.gstEnabled && !isInterState) ? 7 : 8;

  doc.autoTable({
    startY: yPos,
    head: tableHeaders,
    body: tableBody,
    theme: 'grid', // Professional Grid Theme
    tableLineColor: [200, 200, 200],
    tableLineWidth: 0.1,
    headStyles: { 
      fillColor: [41, 98, 255], 
      textColor: 255, 
      fontStyle: 'bold', 
      valign: 'middle',
      // halign: 'center', // Removed global center to allow columnStyles to dictate header alignment
      lineWidth: 0.1,
      lineColor: [41, 98, 255]
    },
    styles: { 
      fontSize: tableFontSize, 
      cellPadding: 1.5, // Reduced padding to prevent wrapping
      valign: 'middle', 
      overflow: 'linebreak',
      lineWidth: 0.1,
      lineColor: [230, 230, 230]
    },
    alternateRowStyles: {
      fillColor: [250, 250, 255]
    },
    columnStyles: columnStyles
  });

  // -- TOTALS --
  let finalY = (doc as any).lastAutoTable.finalY + 10;
  
  // Avoid page break issues for totals
  if (finalY > doc.internal.pageSize.height - 60) {
    doc.addPage();
    finalY = 20;
  }

  const rightColX = pageWidth - 75; // Label column
  const valueColX = pageWidth - marginRight; // Value column (aligned right)
  
  // Store the starting Y of totals for "Amount in Words" reference
  const totalsStartY = finalY;

  doc.setFontSize(10);
  doc.setTextColor(60);
  
  // Helper to draw a row
  const drawTotalRow = (label: string, value: number, isGrandTotal: boolean = false) => {
    if (isGrandTotal) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(0);
    } else {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(60);
    }
    
    doc.text(label, rightColX, finalY);
    
    // Only show "Rs." prefix for Grand Total. 
    // Other values are numeric only with decimals.
    const prefix = isGrandTotal ? "Rs. " : "";
    doc.text(`${prefix}${formatAmount(value)}`, valueColX, finalY, { align: "right" });
    
    finalY += (isGrandTotal ? 10 : 6);
  };

  drawTotalRow("Taxable Amount:", summary.taxableValue);

  if (invoice.gstEnabled) {
    if (summary.igst > 0) {
      drawTotalRow("IGST Total:", summary.igst);
    } else {
      drawTotalRow("CGST Total:", summary.cgst);
      drawTotalRow("SGST Total:", summary.sgst);
    }
  }

  // Round Off Row (No Currency Symbol)
  if (summary.roundOff !== 0) {
    drawTotalRow("Round Off:", summary.roundOff);
  }

  // Divider line before Grand Total
  doc.setDrawColor(200);
  doc.line(rightColX, finalY - 2, pageWidth - marginRight, finalY - 2);
  finalY += 3;

  drawTotalRow("Grand Total:", summary.grandTotal, true);
  
  // -- AMOUNT IN WORDS --
  // Position it to the left of the Totals block, starting at the same Y as the totals
  const wordsY = totalsStartY;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(60);
  doc.text("Amount in Words:", marginLeft, wordsY);
  
  const labelWidth = doc.getTextWidth("Amount in Words:") + 2;
  
  doc.setFont("helvetica", "italic"); 
  doc.setTextColor(40);
  const words = numberToWords(summary.grandTotal);
  
  const availableWidth = (rightColX - 5) - (marginLeft + labelWidth);
  
  doc.text(words, marginLeft + labelWidth, wordsY, { maxWidth: availableWidth });

  // -- FOOTER --
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(150);
  
  // Custom text based on type
  if (invoice.type === InvoiceType.BillOfSupply) {
      doc.text("Bill of Supply: Composition taxable person, not eligible to collect tax on supplies.", marginLeft, pageHeight - 14);
  }

  doc.text("This is a computer generated invoice.", marginLeft, pageHeight - 10);
  doc.text("Powered by GSTGenius", pageWidth - marginRight, pageHeight - 10, { align: "right" });

  // Save
  doc.save(`${invoiceNo || 'invoice'}.pdf`);
};