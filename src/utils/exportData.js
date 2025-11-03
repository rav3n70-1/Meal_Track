import jsPDF from 'jspdf';

// -----------------------------------------------------------------------------
// Internal Helper Functions
// -----------------------------------------------------------------------------

/**
 * Formats a date string or object into DD/MM/YYYY.
 * @param {string | Date} d - The date to format.
 * @returns {string} The formatted date or 'N/A'.
 */
const fmtDate = (d) => {
  if (!d) return 'N/A';
  try {
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return 'N/A'; // Invalid date
    const dd = String(dt.getDate()).padStart(2, '0');
    const mm = String(dt.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
    const yyyy = dt.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  } catch {
    return 'N/A';
  }
};

/**
 * Draws a standardized footer on the PDF document.
 * @param {jsPDF} doc - The jsPDF document instance.
 * @param {number} margin - The page margin.
 * @param {string} textLine1 - The first line of footer text.
 * @param {string} [textLine2='Developed by: Mehedi Hasan Rohan'] - The second line of footer text.
 */
const _drawPdfFooter = (doc, margin, textLine1, textLine2 = 'Developed by: Mehedi Hasan Rohan') => {
  const pageWidth = doc.internal.pageSize.width;
  const footerY = doc.internal.pageSize.height - 30;
  
  doc.setDrawColor(16, 185, 129); // Green line
  doc.line(margin, footerY, pageWidth - margin, footerY);
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text(textLine1, pageWidth / 2, footerY + 8, { align: 'center' });
  doc.text(textLine2, pageWidth / 2, footerY + 14, { align: 'center' });
};


// -----------------------------------------------------------------------------
// Exported Functions
// -----------------------------------------------------------------------------

// (Removed exportToExcel, exportBalancesToExcel, and exportToCSV)

/**
 * Generate a PDF receipt for a specific member's bill payment.
 * @param {object} bill - The bill object.
 * @param {object} member - The member object for whom the receipt is.
 * @param {object} memberAmounts - Object map of { category: amountDue } for this member.
 * @param {object} memberPayments - Object map of { category: amountPaid } for this member.
 * @param {string | null} [filename=null] - The desired output filename.
 */
export const generateRentBillReceipt = (
  bill = {}, 
  member = {}, 
  memberAmounts = {}, 
  memberPayments = {}, 
  filename = null
) => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    let yPos = margin;

    // --- Colors ---
    const colorGreen = [76, 175, 80];
    const colorRed = [244, 67, 54];
    const colorOrange = [255, 152, 0];
    const colorGrey = [120, 120, 120];
    const colorLightGrey = [230, 230, 230];
    const colorBlack = [0, 0, 0];
    const colorWhite = [255, 255, 255];

    // Calculate totals
    let totalDue = 0;
    let totalPaid = 0;
    const categories = Object.keys(memberAmounts || {});
    categories.forEach(category => {
      totalDue += parseFloat(memberAmounts[category]) || 0;
      totalPaid += parseFloat(memberPayments?.[category]) || 0;
    });

    // Determine sticker status
    let stickerText = 'PAID';
    let stickerColor = colorGreen;
    if (totalPaid === 0 && totalDue > 0) {
      stickerText = 'UNPAID';
      stickerColor = colorRed;
    } else if (totalPaid < totalDue) {
      stickerText = 'PARTIALLY PAID';
      stickerColor = colorOrange;
    }

    // --- Helper to add sticker ---
    const addSticker = () => {
      const stickerX = pageWidth - 35;
      const stickerY = margin;
      const stickerWidth = 30;
      const stickerHeight = 12;
      
      doc.setFillColor(...stickerColor);
      doc.setDrawColor(...stickerColor);
      doc.roundedRect(stickerX, stickerY, stickerWidth, stickerHeight, 2, 2, 'F');
      
      doc.setFontSize(7);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...colorWhite);
      doc.text(stickerText, stickerX + stickerWidth / 2, stickerY + stickerHeight / 2 + 2, { align: 'center' });
      doc.setTextColor(...colorBlack); // Reset text color
    };

    // --- Header ---
    doc.setFillColor(...colorGreen);
    doc.rect(0, 0, pageWidth, 20, 'F');
    doc.setFontSize(14);
    doc.setTextColor(...colorWhite);
    doc.text('HOUSEHOLD MANAGEMENT SYSTEM', pageWidth / 2, 13, { align: 'center' });
    doc.setTextColor(...colorBlack);
    yPos = 35;

    addSticker();

    // --- Title ---
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('Bill Statement', pageWidth / 2, yPos, { align: 'center' });
    yPos += 12;

    // --- Info Box ---
    doc.setDrawColor(180, 180, 180);
    doc.rect(margin, yPos, pageWidth - margin * 2, 35);
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    yPos += 7;
    doc.text(`Household: ${bill.householdName || 'N/A'}`, margin + 3, yPos);
    yPos += 6;
    doc.text(`Member: ${member.name || 'N/A'}`, margin + 3, yPos);
    yPos += 6;
    doc.text(`Bill Description: ${bill.description || 'N/A'}`, margin + 3, yPos);
    yPos += 6;
    doc.text(`Created by: ${bill.createdByName || 'Manager'}`, margin + 3, yPos);
    yPos += 6;
    doc.text(`Date: ${new Date().toLocaleDateString()}`, margin + 3, yPos);
    yPos += 10;

    // --- Table Headers ---
    const colCategory = margin;
    const colAmount = 70;
    const colPaid = 110;
    const colStatus = pageWidth - margin; // Right-aligned
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Category', colCategory, yPos);
    doc.text('Amount', colAmount, yPos);
    doc.text('Paid', colPaid, yPos);
    doc.text('Status', colStatus, yPos, { align: 'right' });
    yPos += 4;
    doc.setLineWidth(0.2);
    doc.line(colCategory, yPos, colStatus, yPos);
    doc.setFont(undefined, 'normal');
    yPos += 6;

    // --- Table Content ---
    categories.forEach(category => {
      const amount = parseFloat(memberAmounts[category]) || 0;
      const paid = parseFloat(memberPayments?.[category]) || 0;
      let status = 'Unpaid';
      if (paid >= amount && amount > 0) status = 'Paid';
      else if (paid > 0) status = 'Partially Paid';
      
      // Check for page break *before* drawing
      if (yPos > doc.internal.pageSize.height - 40) {
        doc.addPage();
        addSticker();
        yPos = margin + 10;
      }

      doc.text(category, colCategory, yPos);
      doc.text(amount.toFixed(2), colAmount, yPos);
      doc.text(paid.toFixed(2), colPaid, yPos);
      doc.text(status, colStatus, yPos, { align: 'right' });
      yPos += 6;

      doc.setDrawColor(...colorLightGrey);
      doc.line(colCategory, yPos, colStatus, yPos);
      doc.setDrawColor(...colorBlack); // Reset draw color
      yPos += 4;
    });

    // --- Totals ---
    yPos += 5;
    doc.setFont(undefined, 'bold');
    doc.text('Total', colCategory, yPos);
    doc.text(totalDue.toFixed(2), colAmount, yPos);
    doc.text(totalPaid.toFixed(2), colPaid, yPos);
    const overallStatus =
      totalPaid >= totalDue && totalDue > 0
        ? 'Fully Paid'
        : totalPaid > 0
        ? 'Partially Paid'
        : 'Unpaid';
    doc.text(overallStatus, colStatus, yPos, { align: 'right' });

    const remaining = Math.max(0, totalDue - totalPaid);
    if (remaining > 0) {
      yPos += 7;
      doc.setFont(undefined, 'normal');
      doc.text('Remaining', colCategory, yPos);
      doc.setFont(undefined, 'bold');
      doc.text(remaining.toFixed(2), colStatus, yPos, { align: 'right' });
    }

    // --- Footer ---
    _drawPdfFooter(doc, margin, 'Thank you for your payment!');

    const finalFilename =
      filename ||
      `receipt-${(member.name || 'member').replace(/\s+/g, '-')}-${Date.now()}.pdf`;
    doc.save(finalFilename);
  } catch (error) {
    console.error("Failed to generate bill receipt PDF:", error);
  }
};

/**
 * Generate a PDF summary for a full bill (category and member breakdown).
 * @param {object} bill - The bill object, containing categories and memberCategoryAmounts.
 * @param {Array<object>} [allMembers=[]] - List of all household members.
 * @param {string} [householdName=''] - The name of the household.
 * @param {string | null} [filename=null] - The desired output filename.
 */
export const generateBillSummaryPdf = (
  bill = {}, 
  allMembers = [], 
  householdName = '', 
  filename = null
) => {
  try {
    // Use landscape orientation for wider tables
    const doc = new jsPDF({ orientation: 'landscape' });
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    let y = margin;
    const rowHeight = 8;
    const headerRowHeight = 8;
    const tableLineHeight = 5; // Space inside header row
    const tableRowLineHeight = 6; // Space inside data row

    // --- Colors ---
    const colorGreen = [16, 185, 129];
    const colorDarkGreen = [5, 150, 105];
    const colorRed = [220, 38, 38];
    const colorOrange = [255, 152, 0];
    const colorHeaderBg = [243, 244, 246];
    const colorCardBg = [245, 245, 245];
    const colorCardBorder = [220, 220, 220];
    const colorHighlightBg = [236, 253, 245];
    const colorBlack = [0, 0, 0];
    const colorWhite = [255, 255, 255];

    // --- Lookups ---
    const memberLookup = {};
    allMembers.forEach(m => { memberLookup[m.uid] = m.name || m.email || m.uid; });

    // --- Header ---
    doc.setFillColor(...colorGreen);
    doc.rect(0, 0, pageWidth, 18, 'F');
    doc.setFillColor(...colorDarkGreen);
    doc.rect(0, 18, pageWidth, 2, 'F');
    doc.setTextColor(...colorWhite);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Rent / Bills Summary', pageWidth / 2, 12, { align: 'center' });
    doc.setTextColor(...colorBlack);
    y = 26;

    // --- Info Card ---
    doc.setDrawColor(...colorCardBorder);
    doc.setFillColor(...colorCardBg);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 26, 3, 3, 'FD');
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    let iy = y + 8;
    doc.text(`Household: ${householdName || 'N/A'}`, margin + 4, iy); iy += 6;
    doc.text(`Description: ${bill.description || 'Bill'}`, margin + 4, iy); iy += 6;
    doc.text(`Due Date: ${fmtDate(bill.dueDate)}`, margin + 4, iy);
    y += 26 + 8; // Card height + padding

    // --- Category Totals (Calculation) ---
    const categories = Array.isArray(bill.categories) ? bill.categories : [];
    const mca = bill.memberCategoryAmounts || {};
    const mcp = bill.memberCategoryPayments || {}; // Member Category Payments
    const categoryTotals = {};
    categories.forEach(cat => { categoryTotals[cat] = 0; });
    
    Object.values(mca).forEach(catMap => {
      categories.forEach(cat => {
        categoryTotals[cat] += parseFloat(catMap?.[cat]) || 0;
      });
    });
    const totalBill = Object.values(categoryTotals).reduce((s, v) => s + (parseFloat(v) || 0), 0);

    // --- Category Totals (Drawing) ---
    doc.setFont(undefined, 'bold');
    doc.text('Category Totals', margin, y);
    y += 6;

    const col1 = margin;
    const col2 = pageWidth - margin; // Right edge
    doc.setFontSize(10);
    doc.setFillColor(...colorHeaderBg);
    doc.rect(margin, y, pageWidth - margin * 2, headerRowHeight, 'F');
    doc.text('Category', col1 + 3, y + tableLineHeight);
    doc.text('Amount', col2 - 3, y + tableLineHeight, { align: 'right' });
    y += headerRowHeight + 2;
    doc.setFont(undefined, 'normal');

    categories.forEach((cat, idx) => {
      if (y > doc.internal.pageSize.height - 20) { doc.addPage(); y = margin; }
      const bg = idx % 2 === 0 ? 255 : 250; // Zebra striping
      doc.setFillColor(bg, bg, bg);
      doc.rect(margin, y - tableRowLineHeight + 2, pageWidth - margin * 2, rowHeight, 'F');
      doc.text(cat, col1 + 3, y);
      doc.text((categoryTotals[cat] || 0).toFixed(2), col2 - 3, y, { align: 'right' });
      y += rowHeight;
    });
    if (y > doc.internal.pageSize.height - 30) { doc.addPage(); y = margin; }

    // --- Total Bill Highlight Card ---
    doc.setFont(undefined, 'bold');
    doc.setFillColor(...colorHighlightBg);
    doc.setDrawColor(...colorGreen);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 10, 2, 2, 'FD');
    doc.text('Total Bill', col1 + 3, y + 7);
    doc.text(totalBill.toFixed(2), col2 - 3, y + 7, { align: 'right' });
    y += 14;

    // --- Paid / Due / Status ---
    // Calculate total paid from all members and categories
    const totalPaid = typeof bill.paidAmount === 'number'
      ? bill.paidAmount
      : Object.values(mcp).reduce((sumMem, catMap) => sumMem + Object.values(catMap || {}).reduce((s, a) => s + (parseFloat(a) || 0), 0), 0);
    const totalDue = Math.max(0, totalBill - totalPaid);
    const billStatus = totalPaid >= totalBill && totalBill > 0 ? 'Full' : totalPaid > 0 ? 'Partial' : 'Due';

    doc.setFontSize(10);
    doc.setFillColor(...colorHeaderBg);
    doc.rect(margin, y, pageWidth - margin * 2, 10, 'F');
    doc.setFont(undefined, 'bold');
    doc.text(`Paid: ${totalPaid.toFixed(2)}`, col1 + 3, y + 7);
    doc.text(`Due: ${totalDue.toFixed(2)}`, (col1 + col2) / 2, y + 7, { align: 'center' });
    doc.text(`Status: ${billStatus}`, col2 - 3, y + 7, { align: 'right' });
    y += 16;


    // --- *** MEMBER BREAKDOWN TABLE *** ---
    doc.setFont(undefined, 'bold');
    doc.text('Member Breakdown', margin, y);
    y += 6;
    doc.setFontSize(10);
    
    // --- Define Column Widths ---
    const tableWidth = pageWidth - margin * 2;
    const memberColWidth = tableWidth * 0.28; // 28% for member name
    const totalColWidth = tableWidth * 0.18; // 18% for total
    const numCategories = categories.length;
    // Remaining width for categories
    const categoryColsWidth = tableWidth - memberColWidth - totalColWidth;
    // Avoid division by zero if there are no categories
    const singleCategoryWidth = numCategories > 0 ? categoryColsWidth / numCategories : 0;
    
    // --- Draw Member Breakdown Header ---
    doc.setFillColor(...colorHeaderBg);
    doc.rect(margin, y, tableWidth, headerRowHeight, 'F');
    
    doc.text('Member', margin + 3, y + tableLineHeight);
    
    let currentX = margin + memberColWidth;
    categories.forEach(cat => {
      doc.text(cat, currentX + (singleCategoryWidth / 2), y + tableLineHeight, { 
        align: 'center', 
        maxWidth: singleCategoryWidth - 4 
      });
      currentX += singleCategoryWidth;
    });
    
    doc.text('Total', currentX + (totalColWidth / 2), y + tableLineHeight, { align: 'center' });
    y += headerRowHeight + 2; // Move down past header

    // --- Draw Member Data Rows ---
    doc.setFont(undefined, 'normal');
    let zebra = 0;
    // Get sorted list of member IDs to draw
    const memberIds = Object.keys(mca).sort((a, b) => (memberLookup[a] || a).localeCompare(memberLookup[b] || b));
    
    memberIds.forEach(memberId => {
      // Handle page breaks
      if (y > doc.internal.pageSize.height - 30) { // Extra space for footer
        doc.addPage();
        y = margin;
        zebra = 0;
      }
      
      const catMap = mca[memberId] || {};
      const memberName = memberLookup[memberId] || memberId;
      let memberTotal = 0;
      
      // Draw row background
      const bg = zebra % 2 === 0 ? 255 : 250;
      doc.setFillColor(bg, bg, bg);
      doc.rect(margin, y - tableRowLineHeight + 2, tableWidth, rowHeight, 'F');
      
      // Member name
      doc.text(memberName, margin + 3, y, { maxWidth: memberColWidth - 4 });
      
      // --- Draw Category Amounts with Payment Indicators (IMPROVED ALIGNMENT) ---
      currentX = margin + memberColWidth;
      categories.forEach(cat => {
        const amt = parseFloat(catMap?.[cat]) || 0;
        const paid = parseFloat(mcp?.[memberId]?.[cat]) || 0;
        memberTotal += amt;

        // ---MODIFICATION---
        // Get the CENTER of the column, same as the header
        const amountX = currentX + (singleCategoryWidth / 2);
        const amountStr = amt.toFixed(2);
        
        // Default color
        doc.setTextColor(...colorBlack);
        
        let cellText = amountStr; // Default text is just the amount

        if (amt > 0) {
          if (paid >= amt) {
            // --- PAID ---
            doc.setTextColor(...colorGreen);
            doc.setFont(undefined, 'bold'); // Make text bold
            cellText = amountStr; // REMOVED tick mark
            
          } else if (paid > 0) {
            // --- PARTIAL ---
            doc.setTextColor(...colorOrange);
            // Combine amount and partial payment into one string
            cellText = `${amountStr} (${paid.toFixed(2)})`;

          } else {
            // --- UNPAID ---
            doc.setTextColor(...colorRed);
            // cellText is already amountStr
          }
        } else {
          // --- ZERO AMOUNT ---
          // cellText is already amountStr
          // doc.setTextColor(150, 150, 150); // Optional: grey out zeros
        }
        
        // ---MODIFICATION---
        // Draw the single, combined string, CENTER-aligned
        doc.text(cellText, amountX, y, { align: 'center', maxWidth: singleCategoryWidth - 4 });
        
        doc.setFont(undefined, 'normal'); // Reset font weight just in case
        doc.setTextColor(...colorBlack); // Reset color for next cell
        currentX += singleCategoryWidth;
      });
      // --- End of Category Loop ---
      
      // Member total (this should be right-aligned in its column)
      doc.setFont(undefined, 'bold');
      const totalAmountX = currentX + totalColWidth - 3; // Right-aligned
      doc.text(memberTotal.toFixed(2), totalAmountX, y, { align: 'right' });
      doc.setFont(undefined, 'normal');
      
      y += rowHeight;
      zebra++;
    });
    
    // --- Draw Member Breakdown Footer (Totals) ---
    if (y > doc.internal.pageSize.height - 30) { // Extra space for footer
      doc.addPage();
      y = margin;
    }
    
    doc.setFont(undefined, 'bold');
    doc.setFillColor(...colorHeaderBg);
    doc.rect(margin, y - tableRowLineHeight + 2, tableWidth, rowHeight, 'F');
    
    doc.text('Total', margin + 3, y);
    
    currentX = margin + memberColWidth;
    categories.forEach(cat => {
      const total = categoryTotals[cat] || 0;
      // ---MODIFICATION---
      // Center-align the category totals
      const totalX = currentX + (singleCategoryWidth / 2);
      doc.text(total.toFixed(2), totalX, y, { align: 'center' });
      currentX += singleCategoryWidth;
    });
    
    // Grand total (right-aligned)
    const grandTotalX = currentX + totalColWidth - 3;
    doc.text(totalBill.toFixed(2), grandTotalX, y, { align: 'right' });
    y += rowHeight;

    // --- Page Footer ---
    // This will draw the footer on the *current* page
    _drawPdfFooter(doc, margin, 'This is a summary of all amounts due for this bill.');

    // --- Save ---
    const outName = filename || `bill-summary-${(bill.description || 'bill').replace(/\s+/g, '-')}-${Date.now()}.pdf`;
    doc.save(outName);
  } catch (error) {
    console.error("Failed to generate bill summary PDF:", error);
  }
};

