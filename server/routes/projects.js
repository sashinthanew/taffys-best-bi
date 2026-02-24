const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const auth = require('../middleware/auth');
const ExcelJS = require('exceljs');

// IMPORTANT: Export route MUST come BEFORE /:id route
router.get('/export/excel', auth, async (req, res) => {
  try {
    console.log('Excel export route hit');
    console.log('Starting Excel export...');
    
    // ✅ Check for filter parameter
    const { projectUniqNo } = req.query;
    let query = {};
    
    if (projectUniqNo && projectUniqNo.trim()) {
      console.log(`Filtering by Project Uniq No: ${projectUniqNo}`);
      query.projectUniqNo = { $regex: projectUniqNo, $options: 'i' };
    }
    
    const projects = await Project.find(query).sort({ projectUniqNo: 1, createdAt: -1 });
    console.log(`Found ${projects.length} projects to export`);

    if (projects.length === 0) {
      return res.status(404).json({ message: 'No projects found to export' });
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'TWL System';
    workbook.created = new Date();
    workbook.modified = new Date();
    
    const worksheet = workbook.addWorksheet('All Projects', {
      pageSetup: { 
        paperSize: 9, 
        orientation: 'landscape', 
        fitToPage: true,
        fitToWidth: 1,
        margins: {
          left: 0.5, right: 0.5,
          top: 0.75, bottom: 0.75,
          header: 0.3, footer: 0.3
        }
      },
      views: [{ state: 'frozen', xSplit: 0, ySplit: 2 }] // Freeze top 2 rows
    });

    // ✅ REORDERED COLUMNS - Date/Time/Reference FIRST in each section
    const columns = [
      // PROJECT INFO GROUP
      { header: 'Project Uniq No', key: 'projectUniqNo', width: 15, group: 'project' },
      { header: 'Project No', key: 'projectNo', width: 15, group: 'project' },
      { header: 'Project Date', key: 'projectDate', width: 12, group: 'project' },
      { header: 'Project Name', key: 'projectName', width: 30, group: 'project' },
      { header: 'Status', key: 'status', width: 10, group: 'project' },
      
      // SUPPLIER - PROFORMA INVOICE GROUP
      { header: 'Supplier Name', key: 'supplierName', width: 25, group: 'supplier_invoice' },
      { header: 'Invoice No', key: 'supplierInvoiceNo', width: 18, group: 'supplier_invoice' },
      { header: 'Invoice Amount', key: 'supplierInvoiceAmount', width: 15, group: 'supplier_invoice' },
      { header: 'Credit Note', key: 'supplierCreditNote', width: 12, group: 'supplier_invoice' },
      { header: 'Final Invoice', key: 'supplierFinalInvoice', width: 15, group: 'supplier_invoice' },
      
      // SUPPLIER - ADVANCE PAYMENT GROUP (Date/Ref FIRST)
      { header: 'Payment Date', key: 'paymentDate', width: 12, group: 'supplier_advance' },
      { header: 'Reference No', key: 'referenceNumber', width: 18, group: 'supplier_advance' },
      { header: 'Loan Amount', key: 'loanAmount', width: 15, group: 'supplier_advance' },
      { header: 'TWL Contribution', key: 'twlContribution', width: 15, group: 'supplier_advance' },
      { header: 'Total Payment', key: 'totalPayment', width: 15, group: 'supplier_advance' },
      { header: 'Balance', key: 'balanceAmount', width: 15, group: 'supplier_advance' },
      
      // SUPPLIER - BALANCE PAYMENT GROUP (Date/Ref FIRST)
      { header: 'Balance Date', key: 'balanceDate', width: 12, group: 'supplier_balance' },
      { header: 'Balance Ref', key: 'balanceReference', width: 18, group: 'supplier_balance' },
      { header: 'Balance Loan', key: 'balanceLoanAmount', width: 15, group: 'supplier_balance' },
      { header: 'Balance TWL', key: 'balanceTwlContribution', width: 15, group: 'supplier_balance' },
      { header: 'Balance Total', key: 'balanceTotalPayment', width: 15, group: 'supplier_balance' },
      
      // SUPPLIER - SUMMARY GROUP
      { header: 'Total Amount', key: 'supplierTotalAmount', width: 15, group: 'supplier_summary' },
      { header: 'Cancel Amount', key: 'supplierCancelAmount', width: 15, group: 'supplier_summary' },
      { header: 'Balance Payment', key: 'supplierBalancePayment', width: 15, group: 'supplier_summary' },
      
      // BUYER - PROFORMA INVOICE GROUP (Date FIRST)
      { header: 'Invoice Date', key: 'buyerInvoiceDate', width: 12, group: 'buyer_invoice' },
      { header: 'Invoice No', key: 'buyerInvoiceNo', width: 18, group: 'buyer_invoice' },
      { header: 'Buyer Name', key: 'buyerName', width: 25, group: 'buyer_invoice' },
      { header: 'TWL Invoice', key: 'twlInvoiceAmount', width: 15, group: 'buyer_invoice' },
      { header: 'Credit Note', key: 'buyerCreditNote', width: 12, group: 'buyer_invoice' },
      { header: 'Bank Interest', key: 'bankInterest', width: 12, group: 'buyer_invoice' },
      { header: 'Freight', key: 'freightCharges', width: 12, group: 'buyer_invoice' },
      { header: 'Commission', key: 'commission', width: 12, group: 'buyer_invoice' },
      { header: 'Final Invoice', key: 'buyerFinalInvoice', width: 15, group: 'buyer_invoice' },
      
      // BUYER - ADVANCE PAYMENT GROUP (Date/Ref FIRST)
      { header: 'Date', key: 'buyerAdvanceDate', width: 12, group: 'buyer_advance' },
      { header: 'Reference', key: 'buyerAdvanceRef', width: 18, group: 'buyer_advance' },
      { header: 'TWL Received', key: 'buyerAdvanceTwl', width: 15, group: 'buyer_advance' },
      { header: 'Balance', key: 'buyerAdvanceBalance', width: 15, group: 'buyer_advance' },
      
      // BUYER - BALANCE PAYMENT GROUP (Date/Ref FIRST)
      { header: 'Date', key: 'buyerBalanceDate', width: 12, group: 'buyer_balance' },
      { header: 'Reference', key: 'buyerBalanceRef', width: 18, group: 'buyer_balance' },
      { header: 'TWL Received', key: 'buyerBalanceTwl', width: 15, group: 'buyer_balance' },
      
      // BUYER - SUMMARY GROUP
      { header: 'Total Received', key: 'buyerTotalReceived', width: 15, group: 'buyer_summary' },
      { header: 'Cancel', key: 'buyerCancel', width: 12, group: 'buyer_summary' },
      { header: 'Balance Received', key: 'buyerBalanceReceived', width: 15, group: 'buyer_summary' },
      
      // COSTING GROUP
      { header: 'Supplier Invoice', key: 'costingSupplierInvoice', width: 15, group: 'costing' },
      { header: 'TWL Invoice', key: 'costingTwlInvoice', width: 15, group: 'costing' },
      { header: 'Profit', key: 'profit', width: 12, group: 'costing' },
      { header: 'In Going', key: 'inGoing', width: 12, group: 'costing' },
      { header: 'Out Going', key: 'outGoing', width: 12, group: 'costing' },
      { header: 'CAL Charges', key: 'calCharges', width: 12, group: 'costing' },
      { header: 'Other', key: 'other', width: 12, group: 'costing' },
      { header: 'Foreign Bank', key: 'foreignBankCharges', width: 12, group: 'costing' },
      { header: 'Loan Interest', key: 'loanInterest', width: 12, group: 'costing' },
      { header: 'Freight', key: 'costingFreightCharges', width: 12, group: 'costing' },
      { header: 'Total Expenses', key: 'totalExpenses', width: 15, group: 'costing' },
      { header: 'Net Profit', key: 'netProfit', width: 15, group: 'costing' }
    ];

    worksheet.columns = columns.map(col => ({
      header: col.header,
      key: col.key,
      width: col.width
    }));

    // ✅ CREATE GROUP HEADER ROW (Row 1) - Updated ranges
    const groupHeaderRow = worksheet.insertRow(1, []);
    
    const groups = [
      { name: 'PROJECT INFO', start: 1, end: 5, color: '4472C4' },
      { name: 'SUPPLIER - PROFORMA INVOICE', start: 6, end: 10, color: '70AD47' },
      { name: 'SUPPLIER - ADVANCE PAYMENT', start: 11, end: 16, color: '70AD47' },
      { name: 'SUPPLIER - BALANCE PAYMENT', start: 17, end: 21, color: '70AD47' },
      { name: 'SUPPLIER - SUMMARY', start: 22, end: 24, color: '70AD47' },
      { name: 'BUYER - PROFORMA INVOICE', start: 25, end: 33, color: 'FFC000' },
      { name: 'BUYER - ADVANCE PAYMENT', start: 34, end: 37, color: 'FFC000' },
      { name: 'BUYER - BALANCE PAYMENT', start: 38, end: 40, color: 'FFC000' },
      { name: 'BUYER - SUMMARY', start: 41, end: 43, color: 'FFC000' },
      { name: 'COSTING', start: 44, end: 55, color: 'E74C3C' }
    ];

    groups.forEach(group => {
      worksheet.mergeCells(1, group.start, 1, group.end);
      const cell = worksheet.getCell(1, group.start);
      cell.value = group.name;
      cell.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: `FF${group.color}` }
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thick' },
        left: { style: 'thick' },
        bottom: { style: 'thick' },
        right: { style: 'thick' }
      };
    });

    groupHeaderRow.height = 30;

    // ✅ STYLE COLUMN HEADERS (Row 2)
    const headerRow = worksheet.getRow(2);
    headerRow.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
    headerRow.height = 25;
    
    columns.forEach((col, index) => {
      const cell = headerRow.getCell(index + 1);
      const group = groups.find(g => index + 1 >= g.start && index + 1 <= g.end);
      
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: group ? `FF${group.color}` : 'FF757575' }
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // ✅ ADD DATA ROWS WITH REORDERED COLUMNS
    projects.forEach((project, index) => {
      console.log(`Processing project ${index + 1}: ${project.projectName}`);
      
      try {
        // Calculations
        const supplierInvoice = parseFloat(project.costing?.supplierInvoiceAmount) || 0;
        const twlInvoice = parseFloat(project.costing?.twlInvoiceAmount) || 0;
        const inGoing = parseFloat(project.costing?.inGoing) || 0;
        const outGoing = parseFloat(project.costing?.outGoing) || 0;
        const calCharges = parseFloat(project.costing?.calCharges) || 0;
        const other = parseFloat(project.costing?.other) || 0;
        const foreignBank = parseFloat(project.costing?.foreignBankCharges) || 0;
        const loanInterest = parseFloat(project.costing?.loanInterest) || 0;
        const freightChargesCost = parseFloat(project.costing?.freightCharges) || 0;
        
        const calculatedProfit = twlInvoice - supplierInvoice;
        const calculatedTotalExpenses = inGoing + outGoing + calCharges + other + foreignBank + loanInterest + freightChargesCost;
        const calculatedNetProfit = calculatedProfit - calculatedTotalExpenses;
        
        const balanceLoanAmount = parseFloat(project.supplier?.balancePayment?.loanAmount) || 0;
        const balanceTwlContribution = parseFloat(project.supplier?.balancePayment?.twlContribution) || 0;
        const calculatedBalanceTotalPayment = balanceLoanAmount + balanceTwlContribution;
        
        const supplierInvoiceAmount = parseFloat(project.supplier?.proformaInvoice?.invoiceAmount) || 0;
        const supplierCancelAmount = parseFloat(project.supplier?.summary?.cancelAmount) || 0;
        const calculatedSupplierTotalAmount = supplierInvoiceAmount - supplierCancelAmount;
        
        const advanceTotalPayment = parseFloat(project.supplier?.advancePayment?.totalPayment) || 0;
        const totalPaidToSupplier = advanceTotalPayment + calculatedBalanceTotalPayment;
        const calculatedSupplierBalancePayment = calculatedSupplierTotalAmount - totalPaidToSupplier;
        
        const buyerFinalInvoiceAmount = parseFloat(project.buyer?.proformaInvoice?.finalInvoiceAmount) || 0;
        const buyerAdvanceTwlReceived = parseFloat(project.buyer?.advancePayment?.twlReceived) || 0;
        const calculatedBuyerAdvanceBalance = buyerFinalInvoiceAmount - buyerAdvanceTwlReceived;
        
        const row = worksheet.addRow({
          // Project Info - Date moved up
          projectUniqNo: project.projectUniqNo || '',
          projectNo: project.projectNo || '',
          projectDate: project.projectDate ? new Date(project.projectDate).toLocaleDateString('en-US') : '',
          projectName: project.projectName || '',
          status: project.status || '',
          
          // Supplier Invoice
          supplierName: project.supplier?.proformaInvoice?.supplierName || '',
          supplierInvoiceNo: project.supplier?.proformaInvoice?.invoiceNumber || '',
          supplierInvoiceAmount: supplierInvoiceAmount,
          supplierCreditNote: project.supplier?.proformaInvoice?.creditNote || 0,
          supplierFinalInvoice: project.supplier?.proformaInvoice?.finalInvoiceAmount || 0,
          
          // Supplier Advance - Date/Ref FIRST
          paymentDate: project.supplier?.advancePayment?.paymentDate ? new Date(project.supplier.advancePayment.paymentDate).toLocaleDateString('en-US') : '',
          referenceNumber: project.supplier?.advancePayment?.referenceNumber || '',
          loanAmount: project.supplier?.advancePayment?.loanAmount || 0,
          twlContribution: project.supplier?.advancePayment?.twlContribution || 0,
          totalPayment: advanceTotalPayment,
          balanceAmount: project.supplier?.advancePayment?.balanceAmount || 0,
          
          // Supplier Balance - Date/Ref FIRST
          balanceDate: project.supplier?.balancePayment?.date ? new Date(project.supplier.balancePayment.date).toLocaleDateString('en-US') : '',
          balanceReference: project.supplier?.balancePayment?.reference || '',
          balanceLoanAmount: balanceLoanAmount,
          balanceTwlContribution: balanceTwlContribution,
          balanceTotalPayment: calculatedBalanceTotalPayment,
          
          // Supplier Summary
          supplierTotalAmount: calculatedSupplierTotalAmount,
          supplierCancelAmount: supplierCancelAmount,
          supplierBalancePayment: calculatedSupplierBalancePayment,
          
          // Buyer Invoice - Date FIRST
          buyerInvoiceDate: project.buyer?.proformaInvoice?.invoiceDate ? new Date(project.buyer.proformaInvoice.invoiceDate).toLocaleDateString('en-US') : '',
          buyerInvoiceNo: project.buyer?.proformaInvoice?.invoiceNo || '',
          buyerName: project.buyer?.proformaInvoice?.buyerName || '',
          twlInvoiceAmount: parseFloat(project.buyer?.proformaInvoice?.twlInvoiceAmount) || 0,
          buyerCreditNote: project.buyer?.proformaInvoice?.creditNote || 0,
          bankInterest: project.buyer?.proformaInvoice?.bankInterest || 0,
          freightCharges: project.buyer?.proformaInvoice?.freightCharges || 0,
          commission: project.buyer?.proformaInvoice?.commission || 0,
          buyerFinalInvoice: buyerFinalInvoiceAmount,
          
          // Buyer Advance - Date/Ref FIRST
          buyerAdvanceDate: project.buyer?.advancePayment?.date ? new Date(project.buyer.advancePayment.date).toLocaleDateString('en-US') : '',
          buyerAdvanceRef: project.buyer?.advancePayment?.reference || '',
          buyerAdvanceTwl: buyerAdvanceTwlReceived,
          buyerAdvanceBalance: calculatedBuyerAdvanceBalance,
          
          // Buyer Balance - Date/Ref FIRST
          buyerBalanceDate: project.buyer?.balancePayment?.date ? new Date(project.buyer.balancePayment.date).toLocaleDateString('en-US') : '',
          buyerBalanceRef: project.buyer?.balancePayment?.reference || '',
          buyerBalanceTwl: project.buyer?.balancePayment?.twlReceived || 0,
          
          // Buyer Summary
          buyerTotalReceived: project.buyer?.summary?.totalReceived || 0,
          buyerCancel: project.buyer?.summary?.cancel || 0,
          buyerBalanceReceived: project.buyer?.summary?.balanceReceived || 0,
          
          // Costing
          costingSupplierInvoice: supplierInvoice,
          costingTwlInvoice: twlInvoice,
          profit: calculatedProfit,
          inGoing: inGoing,
          outGoing: outGoing,
          calCharges: calCharges,
          other: other,
          foreignBankCharges: foreignBank,
          loanInterest: loanInterest,
          costingFreightCharges: freightChargesCost,
          totalExpenses: calculatedTotalExpenses,
          netProfit: calculatedNetProfit
        });

        // ✅ ALTERNATE ROW COLORS
        if (index % 2 === 0) {
          row.eachCell((cell) => {
            if (!cell.fill || !cell.fill.fgColor) {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFF5F5F5' }
              };
            }
          });
        }

        // ✅ CONDITIONAL FORMATTING & ALIGNMENT
        row.eachCell((cell, colNumber) => {
          if (typeof cell.value === 'number') {
            cell.numFmt = '#,##0.00';
            if (cell.value < 0) {
              cell.font = { ...cell.font, color: { argb: 'FFE74C3C' }, bold: true };
            }
          }
          
          // Date columns and text: left align, Numbers: right align
          const isDateOrTextColumn = colNumber <= 5 || [11, 12, 17, 18, 25, 26, 27, 34, 35, 38, 39].includes(colNumber);
          cell.alignment = { vertical: 'middle', horizontal: isDateOrTextColumn ? 'left' : 'right' };
          
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFD3D3D3' } },
            left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
            bottom: { style: 'thin', color: { argb: 'FFD3D3D3' } },
            right: { style: 'thin', color: { argb: 'FFD3D3D3' } }
          };
        });

      } catch (rowError) {
        console.error(`Error processing project ${index + 1}:`, rowError);
        throw rowError;
      }
    });

    // ✅ CALCULATE TOTALS BY STATUS
    const calculateTotalsByStatus = (projectList, status) => {
      const filteredProjects = status ? projectList.filter(p => p.status === status) : projectList;
      
      return filteredProjects.reduce((totals, project) => {
        const balanceLoan = parseFloat(project.supplier?.balancePayment?.loanAmount) || 0;
        const balanceTwl = parseFloat(project.supplier?.balancePayment?.twlContribution) || 0;
        const calcBalanceTotal = balanceLoan + balanceTwl;
        
        const suppInvAmt = parseFloat(project.supplier?.proformaInvoice?.invoiceAmount) || 0;
        const suppCancelAmt = parseFloat(project.supplier?.summary?.cancelAmount) || 0;
        const calcSuppTotal = suppInvAmt - suppCancelAmt;
        
        const advTotal = parseFloat(project.supplier?.advancePayment?.totalPayment) || 0;
        const totalPaid = advTotal + calcBalanceTotal;
        const calcSuppBalance = calcSuppTotal - totalPaid;
        
        const buyerFinalInv = parseFloat(project.buyer?.proformaInvoice?.finalInvoiceAmount) || 0;
        const buyerAdvTwl = parseFloat(project.buyer?.advancePayment?.twlReceived) || 0;
        
        totals.supplierInvoiceAmount += suppInvAmt;
        totals.supplierCreditNote += parseFloat(project.supplier?.proformaInvoice?.creditNote) || 0;
        totals.supplierFinalInvoice += parseFloat(project.supplier?.proformaInvoice?.finalInvoiceAmount) || 0;
        totals.loanAmount += parseFloat(project.supplier?.advancePayment?.loanAmount) || 0;
        totals.twlContribution += parseFloat(project.supplier?.advancePayment?.twlContribution) || 0;
        totals.totalPayment += advTotal;
        totals.balanceAmount += parseFloat(project.supplier?.advancePayment?.balanceAmount) || 0;
        totals.balanceLoanAmount += balanceLoan;
        totals.balanceTwlContribution += balanceTwl;
        totals.balanceTotalPayment += calcBalanceTotal;
        totals.supplierTotalAmount += calcSuppTotal;
        totals.supplierCancelAmount += suppCancelAmt;
        totals.supplierBalancePayment += calcSuppBalance;
        totals.twlInvoiceAmount += parseFloat(project.buyer?.proformaInvoice?.twlInvoiceAmount) || 0;
        totals.buyerCreditNote += parseFloat(project.buyer?.proformaInvoice?.creditNote) || 0;
        totals.bankInterest += parseFloat(project.buyer?.proformaInvoice?.bankInterest) || 0;
        totals.freightCharges += parseFloat(project.buyer?.proformaInvoice?.freightCharges) || 0;
        totals.commission += parseFloat(project.buyer?.proformaInvoice?.commission) || 0;
        totals.buyerFinalInvoice += buyerFinalInv;
        totals.buyerAdvanceTwl += buyerAdvTwl;
        totals.buyerAdvanceBalance += (buyerFinalInv - buyerAdvTwl);
        totals.buyerBalanceTwl += parseFloat(project.buyer?.balancePayment?.twlReceived) || 0;
        totals.buyerTotalReceived += parseFloat(project.buyer?.summary?.totalReceived) || 0;
        totals.buyerCancel += parseFloat(project.buyer?.summary?.cancel) || 0;
        totals.buyerBalanceReceived += parseFloat(project.buyer?.summary?.balanceReceived) || 0;
        totals.costingSupplierInvoice += parseFloat(project.costing?.supplierInvoiceAmount) || 0;
        totals.costingTwlInvoice += parseFloat(project.costing?.twlInvoiceAmount) || 0;
        totals.inGoing += parseFloat(project.costing?.inGoing) || 0;
        totals.outGoing += parseFloat(project.costing?.outGoing) || 0;
        totals.calCharges += parseFloat(project.costing?.calCharges) || 0;
        totals.other += parseFloat(project.costing?.other) || 0;
        totals.foreignBankCharges += parseFloat(project.costing?.foreignBankCharges) || 0;
        totals.loanInterest += parseFloat(project.costing?.loanInterest) || 0;
        totals.costingFreightCharges += parseFloat(project.costing?.freightCharges) || 0;
        
        return totals;
      }, {
        supplierInvoiceAmount: 0, supplierCreditNote: 0, supplierFinalInvoice: 0,
        loanAmount: 0, twlContribution: 0, totalPayment: 0, balanceAmount: 0,
        balanceLoanAmount: 0, balanceTwlContribution: 0, balanceTotalPayment: 0,
        supplierTotalAmount: 0, supplierCancelAmount: 0, supplierBalancePayment: 0,
        twlInvoiceAmount: 0, buyerCreditNote: 0, bankInterest: 0, freightCharges: 0,
        commission: 0, buyerFinalInvoice: 0, buyerAdvanceTwl: 0, buyerAdvanceBalance: 0,
        buyerBalanceTwl: 0, buyerTotalReceived: 0, buyerCancel: 0, buyerBalanceReceived: 0,
        costingSupplierInvoice: 0, costingTwlInvoice: 0, inGoing: 0, outGoing: 0,
        calCharges: 0, other: 0, foreignBankCharges: 0, loanInterest: 0,
        costingFreightCharges: 0
      });
    };

    const inactiveTotals = calculateTotalsByStatus(projects, 'Inactive');
    const activeTotals = calculateTotalsByStatus(projects, 'Active');
    const grandTotals = calculateTotalsByStatus(projects, null);

    // Helper function to create totals row
    const createTotalsRow = (label, totals, bgColor) => {
      const totalProfit = totals.costingTwlInvoice - totals.costingSupplierInvoice;
      const totalExpenses = totals.inGoing + totals.outGoing + totals.calCharges + totals.other + 
                           totals.foreignBankCharges + totals.loanInterest + totals.costingFreightCharges;
      const totalNetProfit = totalProfit - totalExpenses;

      const totalsRow = worksheet.addRow({
        projectUniqNo: label,
        projectNo: '',
        projectDate: '',
        projectName: '',
        status: '',
        supplierName: '',
        supplierInvoiceNo: '',
        supplierInvoiceAmount: totals.supplierInvoiceAmount,
        supplierCreditNote: totals.supplierCreditNote,
        supplierFinalInvoice: totals.supplierFinalInvoice,
        paymentDate: '',
        referenceNumber: '',
        loanAmount: totals.loanAmount,
        twlContribution: totals.twlContribution,
        totalPayment: totals.totalPayment,
        balanceAmount: totals.balanceAmount,
        balanceDate: '',
        balanceReference: '',
        balanceLoanAmount: totals.balanceLoanAmount,
        balanceTwlContribution: totals.balanceTwlContribution,
        balanceTotalPayment: totals.balanceTotalPayment,
        supplierTotalAmount: totals.supplierTotalAmount,
        supplierCancelAmount: totals.supplierCancelAmount,
        supplierBalancePayment: totals.supplierBalancePayment,
        buyerInvoiceDate: '',
        buyerInvoiceNo: '',
        buyerName: '',
        twlInvoiceAmount: totals.twlInvoiceAmount,
        buyerCreditNote: totals.buyerCreditNote,
        bankInterest: totals.bankInterest,
        freightCharges: totals.freightCharges,
        commission: totals.commission,
        buyerFinalInvoice: totals.buyerFinalInvoice,
        buyerAdvanceDate: '',
        buyerAdvanceRef: '',
        buyerAdvanceTwl: totals.buyerAdvanceTwl,
        buyerAdvanceBalance: totals.buyerAdvanceBalance,
        buyerBalanceDate: '',
        buyerBalanceRef: '',
        buyerBalanceTwl: totals.buyerBalanceTwl,
        buyerTotalReceived: totals.buyerTotalReceived,
        buyerCancel: totals.buyerCancel,
        buyerBalanceReceived: totals.buyerBalanceReceived,
        costingSupplierInvoice: totals.costingSupplierInvoice,
        costingTwlInvoice: totals.costingTwlInvoice,
        profit: totalProfit,
        inGoing: totals.inGoing,
        outGoing: totals.outGoing,
        calCharges: totals.calCharges,
        other: totals.other,
        foreignBankCharges: totals.foreignBankCharges,
        loanInterest: totals.loanInterest,
        costingFreightCharges: totals.costingFreightCharges,
        totalExpenses: totalExpenses,
        netProfit: totalNetProfit
      });

      totalsRow.font = { bold: true, size: 11 };
      totalsRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: bgColor }
      };
      totalsRow.height = 25;
      
      totalsRow.eachCell((cell, colNumber) => {
        if (typeof cell.value === 'number') {
          cell.numFmt = '#,##0.00';
          if (cell.value < 0) {
            cell.font = { ...cell.font, color: { argb: 'FFE74C3C' } };
          }
        }
        const isDateOrTextColumn = colNumber <= 5 || [11, 12, 17, 18, 25, 26, 27, 34, 35, 38, 39].includes(colNumber);
        cell.alignment = { vertical: 'middle', horizontal: isDateOrTextColumn ? 'left' : 'right' };
        cell.border = {
          top: { style: 'double', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'double', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } }
        };
      });

      return totalsRow;
    };

    createTotalsRow('INACTIVE TOTAL', inactiveTotals, 'FFFFCCCC');
    createTotalsRow('ACTIVE TOTAL', activeTotals, 'FFCCFFCC');
    createTotalsRow('GRAND TOTAL', grandTotals, 'FFFFEB3B');

    worksheet.autoFilter = {
      from: { row: 2, column: 1 },
      to: { row: 2, column: columns.length }
    };

    console.log('Workbook created successfully with reordered columns');
    console.log('Generating Excel buffer...');

    const buffer = await workbook.xlsx.writeBuffer();
    console.log('Excel buffer generated, size:', buffer.length);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=TWL_Projects_${new Date().toISOString().split('T')[0]}.xlsx`);
    res.setHeader('Content-Length', buffer.length);

    console.log('Sending Excel file to client...');
    res.send(buffer);
    console.log('Excel export completed successfully');

  } catch (error) {
    console.error('Excel export error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Failed to export Excel file', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get all projects
router.get('/', auth, async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json({ success: true, projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get single project
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    res.json({ success: true, project });
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create project (admin only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
    }

    const project = new Project({
      ...req.body,
      createdBy: req.user.id
    });

    await project.save();
    res.status(201).json({ success: true, message: 'Project created successfully', project });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update project (admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
    }

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    res.json({ success: true, message: 'Project updated successfully', project });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete project (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
    }

    const project = await Project.findByIdAndDelete(req.params.id);
    
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get impact analysis for all projects
router.get('/analysis/impact', auth, async (req, res) => {
  try {
    console.log('Impact analysis route hit');
    
    const projects = await Project.find().sort({ projectDate: -1 });
    
    if (projects.length === 0) {
      return res.json({ 
        success: true, 
        analysis: {
          projects: [],
          companyMetrics: {
            totalProjects: 0,
            activeProjects: 0,
            inactiveProjects: 0,
            totalRevenue: 0,
            totalCost: 0,
            totalProfit: 0,
            averageROI: 0,
            averageProfitMargin: 0,
            totalRiskExposure: 0
          }
        }
      });
    }

    // Calculate impact metrics for each project
    const projectsWithImpact = projects.map(project => {
      // Financial calculations
      const revenue = parseFloat(project.buyer?.summary?.totalReceived) || 0;
      const cost = parseFloat(project.supplier?.summary?.totalAmount) || 0;
      const netProfit = parseFloat(project.costing?.netProfit) || 0;
      const totalInvestment = parseFloat(project.supplier?.advancePayment?.loanAmount) || 0 + 
                             parseFloat(project.supplier?.advancePayment?.twlContribution) || 0;
      
      // ROI Calculation: (Net Profit / Total Investment) * 100
      const roi = totalInvestment > 0 ? ((netProfit / totalInvestment) * 100) : 0;
      
      // Profit Margin: (Net Profit / Revenue) * 100
      const profitMargin = revenue > 0 ? ((netProfit / revenue) * 100) : 0;
      
      // Efficiency Score: How much profit per dollar spent (Net Profit / Cost)
      const efficiencyScore = cost > 0 ? (netProfit / cost) : 0;
      
      // Project Value: Combined revenue and profit importance
      const projectValue = revenue + Math.abs(netProfit);
      
      // Risk Score based on various factors
      let riskScore = 0;
      if (project.status === 'Inactive') riskScore += 40;
      if (netProfit < 0) riskScore += 30;
      if (profitMargin < 10) riskScore += 15;
      if (revenue === 0) riskScore += 15;
      
      // Risk Level
      let riskLevel = 'Low';
      if (riskScore >= 60) riskLevel = 'High';
      else if (riskScore >= 30) riskLevel = 'Medium';
      
      // Impact Score: Combination of profitability, efficiency, and value
      // Higher score means more positive impact to company
      let impactScore = 0;
      impactScore += (netProfit > 0 ? 30 : -20); // Profitability weight
      impactScore += Math.min(roi / 2, 20); // ROI contribution (max 20 points)
      impactScore += Math.min(efficiencyScore * 10, 20); // Efficiency (max 20 points)
      impactScore += Math.min((projectValue / 10000), 20); // Value contribution (max 20 points)
      impactScore += (project.status === 'Active' ? 10 : -10); // Status weight
      
      // Impact Level
      let impactLevel = 'Neutral';
      if (impactScore >= 60) impactLevel = 'Very Positive';
      else if (impactScore >= 30) impactLevel = 'Positive';
      else if (impactScore <= -20) impactLevel = 'Negative';
      
      // Calculate contribution percentage (will be calculated after aggregation)
      const contribution = {
        revenue: revenue,
        profit: netProfit,
        cost: cost
      };
      
      // Time-based metrics
      const projectAge = project.projectDate ? 
        Math.floor((new Date() - new Date(project.projectDate)) / (1000 * 60 * 60 * 24)) : 0;
      
      return {
        projectId: project._id,
        projectNo: project.projectNo,
        projectName: project.projectName,
        projectDate: project.projectDate,
        status: project.status,
        supplier: project.supplier?.proformaInvoice?.supplierName || 'N/A',
        buyer: project.buyer?.proformaInvoice?.buyerName || 'N/A',
        financial: {
          revenue,
          cost,
          netProfit,
          investment: totalInvestment,
          expenses: parseFloat(project.costing?.total) || 0
        },
        metrics: {
          roi: parseFloat(roi.toFixed(2)),
          profitMargin: parseFloat(profitMargin.toFixed(2)),
          efficiencyScore: parseFloat(efficiencyScore.toFixed(2)),
          impactScore: parseFloat(impactScore.toFixed(2)),
          impactLevel,
          riskScore: parseFloat(riskScore.toFixed(2)),
          riskLevel,
          projectAge
        },
        contribution
      };
    });

    // Calculate company-wide metrics
    const activeProjects = projectsWithImpact.filter(p => p.status === 'Active');
    const inactiveProjects = projectsWithImpact.filter(p => p.status === 'Inactive');
    
    const totalRevenue = projectsWithImpact.reduce((sum, p) => sum + p.financial.revenue, 0);
    const totalCost = projectsWithImpact.reduce((sum, p) => sum + p.financial.cost, 0);
    const totalProfit = projectsWithImpact.reduce((sum, p) => sum + p.financial.netProfit, 0);
    const totalInvestment = projectsWithImpact.reduce((sum, p) => sum + p.financial.investment, 0);
    
    const activeRevenue = activeProjects.reduce((sum, p) => sum + p.financial.revenue, 0);
    const activeProfit = activeProjects.reduce((sum, p) => sum + p.financial.netProfit, 0);
    const inactiveProfit = inactiveProjects.reduce((sum, p) => sum + p.financial.netProfit, 0);
    
    const averageROI = projectsWithImpact.length > 0 ?
      projectsWithImpact.reduce((sum, p) => sum + p.metrics.roi, 0) / projectsWithImpact.length : 0;
    
    const averageProfitMargin = projectsWithImpact.length > 0 ?
      projectsWithImpact.reduce((sum, p) => sum + p.metrics.profitMargin, 0) / projectsWithImpact.length : 0;
    
    const totalRiskExposure = projectsWithImpact.reduce((sum, p) => 
      sum + (p.metrics.riskLevel === 'High' ? p.financial.cost : 0), 0);
    
    const averageImpactScore = projectsWithImpact.length > 0 ?
      projectsWithImpact.reduce((sum, p) => sum + p.metrics.impactScore, 0) / projectsWithImpact.length : 0;
    
    // Calculate contribution percentages
    projectsWithImpact.forEach(project => {
      project.contribution.revenuePercentage = totalRevenue > 0 ? 
        parseFloat(((project.contribution.revenue / totalRevenue) * 100).toFixed(2)) : 0;
      project.contribution.profitPercentage = totalProfit !== 0 ? 
        parseFloat(((project.contribution.profit / totalProfit) * 100).toFixed(2)) : 0;
      project.contribution.costPercentage = totalCost > 0 ? 
        parseFloat(((project.contribution.cost / totalCost) * 100).toFixed(2)) : 0;
    });
    
    // Top performers
    const topProfitableProjects = [...projectsWithImpact]
      .sort((a, b) => b.financial.netProfit - a.financial.netProfit)
      .slice(0, 5);
    
    const highImpactProjects = [...projectsWithImpact]
      .sort((a, b) => b.metrics.impactScore - a.metrics.impactScore)
      .slice(0, 5);
    
    const highRiskProjects = [...projectsWithImpact]
      .filter(p => p.metrics.riskLevel === 'High' || p.metrics.riskLevel === 'Medium')
      .sort((a, b) => b.metrics.riskScore - a.metrics.riskScore);

    const companyMetrics = {
      totalProjects: projects.length,
      activeProjects: activeProjects.length,
      inactiveProjects: inactiveProjects.length,
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      totalCost: parseFloat(totalCost.toFixed(2)),
      totalProfit: parseFloat(totalProfit.toFixed(2)),
      totalInvestment: parseFloat(totalInvestment.toFixed(2)),
      activeRevenue: parseFloat(activeRevenue.toFixed(2)),
      activeProfit: parseFloat(activeProfit.toFixed(2)),
      inactiveProfit: parseFloat(inactiveProfit.toFixed(2)),
      averageROI: parseFloat(averageROI.toFixed(2)),
      averageProfitMargin: parseFloat(averageProfitMargin.toFixed(2)),
      averageImpactScore: parseFloat(averageImpactScore.toFixed(2)),
      totalRiskExposure: parseFloat(totalRiskExposure.toFixed(2)),
      companyHealth: totalProfit > 0 ? 'Healthy' : 'Needs Attention',
      topPerformers: {
        byProfit: topProfitableProjects.map(p => ({
          projectNo: p.projectNo,
          projectName: p.projectName,
          netProfit: p.financial.netProfit
        })),
        byImpact: highImpactProjects.map(p => ({
          projectNo: p.projectNo,
          projectName: p.projectName,
          impactScore: p.metrics.impactScore
        }))
      },
      riskAssessment: {
        highRiskCount: highRiskProjects.filter(p => p.metrics.riskLevel === 'High').length,
        mediumRiskCount: highRiskProjects.filter(p => p.metrics.riskLevel === 'Medium').length,
        totalRiskExposure: parseFloat(totalRiskExposure.toFixed(2)),
        highRiskProjects: highRiskProjects.slice(0, 5).map(p => ({
          projectNo: p.projectNo,
          projectName: p.projectName,
          riskLevel: p.metrics.riskLevel,
          riskScore: p.metrics.riskScore
        }))
      }
    };

    console.log('Impact analysis completed successfully');
    
    res.json({
      success: true,
      analysis: {
        projects: projectsWithImpact,
        companyMetrics
      }
    });

  } catch (error) {
    console.error('Error calculating impact analysis:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;