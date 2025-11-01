// Utility functions for exporting data to Excel/CSV and PDF
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';

/**
 * Export expenses to Excel
 */
export const exportToExcel = (expenses, members, filename = 'expenses.xlsx') => {
  const memberLookup = {};
  members.forEach(member => {
    memberLookup[member.uid] = member.name;
  });

  const expenseData = expenses.map(expense => ({
    'Date': new Date(expense.date).toLocaleDateString(),
    'Item': expense.item,
    'Amount': expense.amount,
    'Buyer': memberLookup[expense.buyer] || 'Unknown',
    'Shared Among': (expense.sharedAmong || [])
      .map(uid => memberLookup[uid] || 'Unknown')
      .join(', '),
    'Status': expense.status,
    'Notes': expense.notes || '',
    'Created At': new Date(expense.createdAt).toLocaleDateString()
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(expenseData);
  XLSX.utils.book_append_sheet(wb, ws, 'Expenses');
  XLSX.writeFile(wb, filename);
};

/**
 * Export balance summary to Excel
 */
export const exportBalancesToExcel = (balances, debts, filename = 'balances.xlsx') => {
  const balanceData = Object.values(balances).map(member => ({
    'Name': member.name,
    'Email': member.email,
    'Total Paid': member.totalPaid.toFixed(2),
    'Total Share': member.totalShare.toFixed(2),
    'Balance': member.balance.toFixed(2),
    'Expense Count': member.expenseCount
  }));

  const debtData = debts.map(debt => ({
    'From': debt.fromName,
    'To': debt.toName,
    'Amount': debt.amount.toFixed(2)
  }));

  const wb = XLSX.utils.book_new();
  const ws1 = XLSX.utils.json_to_sheet(balanceData);
  XLSX.utils.book_append_sheet(wb, ws1, 'Balances');
  const ws2 = XLSX.utils.json_to_sheet(debtData);
  XLSX.utils.book_append_sheet(wb, ws2, 'Who Owes Whom');
  XLSX.writeFile(wb, filename);
};

/**
 * Export to CSV
 */
export const exportToCSV = (expenses, members, filename = 'expenses.csv') => {
  const memberLookup = {};
  members.forEach(member => {
    memberLookup[member.uid] = member.name;
  });

  const expenseData = expenses.map(expense => ({
    'Date': new Date(expense.date).toLocaleDateString(),
    'Item': expense.item,
    'Amount': expense.amount,
    'Buyer': memberLookup[expense.buyer] || 'Unknown',
    'Shared Among': (expense.sharedAmong || [])
      .map(uid => memberLookup[uid] || 'Unknown')
      .join('; '),
    'Status': expense.status,
    'Notes': expense.notes || '',
    'Created At': new Date(expense.createdAt).toLocaleDateString()
  }));

  const ws = XLSX.utils.json_to_sheet(expenseData);
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = filename;
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Generate PDF receipt for rent/bill payment
 */
export const generateRentBillReceipt = (bill, member, memberAmounts, memberPayments, filename = null) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  let yPos = margin;

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
  let stickerColor = [76, 175, 80];
  if (totalPaid === 0) {
    stickerText = 'UNPAID';
    stickerColor = [244, 67, 54];
  } else if (totalPaid < totalDue) {
    stickerText = 'PARTIALLY PAID';
    stickerColor = [255, 152, 0];
  }

  // Add sticker to first page
  const addSticker = () => {
    const stickerX = pageWidth - 35;
    const stickerY = margin;
    const stickerWidth = 30;
    const stickerHeight = 12;
    
    // Draw sticker background
    doc.setFillColor(...stickerColor);
    doc.setDrawColor(...stickerColor);
    doc.roundedRect(stickerX, stickerY, stickerWidth, stickerHeight, 2, 2, 'F');
    
    // Add text
    doc.setFontSize(7);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(stickerText, stickerX + stickerWidth / 2, stickerY + stickerHeight / 2 + 2, { align: 'center' });
    doc.setTextColor(0, 0, 0);
  };

  // Header bar
  doc.setFillColor(76, 175, 80);
  doc.rect(0, 0, pageWidth, 20, 'F');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('HOUSEHOLD MANAGEMENT SYSTEM', pageWidth / 2, 13, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  yPos = 35;

  // Add sticker
  addSticker();

  // Title
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.text('Bill Statement', pageWidth / 2, yPos, { align: 'center' });
  yPos += 12;

  // Info box
  doc.setDrawColor(180, 180, 180);
  doc.rect(margin, yPos, pageWidth - margin * 2, 35);
  doc.setFontSize(10);
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

  // Table headers
  const colCategory = margin;
  const colAmount = 70;
  const colPaid = 110;
  const colStatus = pageWidth - margin;
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

  // Table content
  categories.forEach(category => {
    const amount = parseFloat(memberAmounts[category]) || 0;
    const paid = parseFloat(memberPayments?.[category]) || 0;
    let status = 'Unpaid';
    if (paid >= amount && amount > 0) status = 'Paid';
    else if (paid > 0) status = 'Partially Paid';

    doc.text(category, colCategory, yPos);
    doc.text(amount.toFixed(2), colAmount, yPos);
    doc.text(paid.toFixed(2), colPaid, yPos);
    doc.text(status, colStatus, yPos, { align: 'right' });
    yPos += 6;

    doc.setDrawColor(230, 230, 230);
    doc.line(colCategory, yPos, colStatus, yPos);
    doc.setDrawColor(0, 0, 0);
    yPos += 4;

    if (yPos > doc.internal.pageSize.height - 40) {
      doc.addPage();
      addSticker();
      yPos = margin + 10;
    }
  });

  // Totals
  yPos += 5;
  doc.setFont(undefined, 'bold');
  doc.text('Total', colCategory, yPos);
  doc.text(totalDue.toFixed(2), colAmount, yPos);
  doc.text(totalPaid.toFixed(2), colPaid, yPos);
  const overallStatus =
    totalPaid >= totalDue
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
    doc.text(remaining.toFixed(2), colStatus, yPos, { align: 'right' });
  }

  // Footer
  const footerY = doc.internal.pageSize.height - 30;
  doc.setDrawColor(76, 175, 80);
  doc.line(margin, footerY, pageWidth - margin, footerY);
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text('Thank you for your payment!', pageWidth / 2, footerY + 8, { align: 'center' });
  doc.text('Developed by: Mehedi Hasan Rohan', pageWidth / 2, footerY + 14, { align: 'center' });

  const finalFilename =
    filename ||
    `receipt-${member.name.replace(/\s+/g, '-')}-${Date.now()}.pdf`;
  doc.save(finalFilename);
};
