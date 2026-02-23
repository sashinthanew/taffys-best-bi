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
    
    // Fetch all projects
    const projects = await Project.find().sort({ projectDate: -1 });
    console.log(`Found ${projects.length} projects to export`);

    if (projects.length === 0) {
      console.log('No projects found');
      return res.status(404).json({ success: false, message: 'No projects found to export' });
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'TWL System';
    workbook.created = new Date();
    
    const worksheet = workbook.addWorksheet('All Projects', {
      pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true }
    });

    // Define ALL columns with their keys FIRST - This is critical!
    worksheet.columns = [
      // Project Info (4) - UPDATE COUNT FROM 3 TO 4
      { header: 'Project No', key: 'projectNo', width: 15 },
      { header: 'Project Name', key: 'projectName', width: 25 },
      { header: 'Project Date', key: 'projectDate', width: 15 },
      { header: 'Status', key: 'status', width: 12 },  // ADD THIS LINE
      
      // Supplier - Proforma Invoice (5)
      { header: 'Supplier Name', key: 'supplierName', width: 20 },
      { header: 'Supplier Invoice No', key: 'supplierInvoiceNo', width: 18 },
      { header: 'Supplier Invoice Amt', key: 'supplierInvoiceAmount', width: 18 },
      { header: 'Supplier Credit Note', key: 'supplierCreditNote', width: 18 },
      { header: 'Supplier Final Invoice', key: 'supplierFinalInvoice', width: 20 },
      
      // Supplier - Advance Payment (6)
      { header: 'Loan Amount', key: 'loanAmount', width: 15 },
      { header: 'Advance Payment Date', key: 'advancePaymentDate', width: 18 },
      { header: 'Advance Reference', key: 'advanceReference', width: 18 },
      { header: 'TWL Contribution (Adv)', key: 'twlContributionAdv', width: 20 },
      { header: 'Total Payment (Adv)', key: 'totalPaymentAdv', width: 18 },
      { header: 'Balance Amount (Adv)', key: 'balanceAmountAdv', width: 18 },
      
      // Supplier - Balance Payment (5)
      { header: 'Supplier Balance Loan Amt', key: 'supplierBalanceLoanAmount', width: 20 },
      { header: 'Supplier Balance Date', key: 'supplierBalanceDate', width: 18 },
      { header: 'Supplier Balance Ref', key: 'supplierBalanceRef', width: 18 },
      { header: 'TWL Contribution (Bal)', key: 'twlContributionBal', width: 20 },
      { header: 'Total Payment (Bal)', key: 'totalPaymentBal', width: 18 },
      
      // Supplier - Summary (3)
      { header: 'Supplier Total Amt', key: 'supplierTotalAmount', width: 18 },
      { header: 'Supplier Cancel Amt', key: 'supplierCancelAmount', width: 18 },
      { header: 'Supplier Balance Pay', key: 'supplierBalancePayment', width: 20 },
      
      // Buyer - Proforma Invoice (9)
      { header: 'Buyer Name', key: 'buyerName', width: 20 },
      { header: 'Buyer Invoice No', key: 'buyerInvoiceNo', width: 18 },
      { header: 'Buyer Invoice Date', key: 'buyerInvoiceDate', width: 18 },
      { header: 'TWL Invoice Amount', key: 'twlInvoiceAmount', width: 18 },
      { header: 'Buyer Credit Note', key: 'buyerCreditNote', width: 18 },
      { header: 'Bank Interest', key: 'bankInterest', width: 15 },
      { header: 'Freight Charges', key: 'freightCharges', width: 15 },
      { header: 'Commission', key: 'commission', width: 15 },
      { header: 'Buyer Final Invoice', key: 'buyerFinalInvoice', width: 18 },
      
      // Buyer - Advance Payment (4)
      { header: 'Buyer Advance TWL', key: 'buyerAdvanceTwl', width: 18 },
      { header: 'Buyer Advance Balance', key: 'buyerAdvanceBalance', width: 20 },
      { header: 'Buyer Advance Date', key: 'buyerAdvanceDate', width: 18 },
      { header: 'Buyer Advance Ref', key: 'buyerAdvanceRef', width: 18 },
      
      // Buyer - Balance Payment (3)
      { header: 'Buyer Balance TWL', key: 'buyerBalanceTwl', width: 18 },
      { header: 'Buyer Balance Date', key: 'buyerBalanceDate', width: 18 },
      { header: 'Buyer Balance Ref', key: 'buyerBalanceRef', width: 18 },
      
      // Buyer - Summary (3)
      { header: 'Buyer Total Received', key: 'buyerTotalReceived', width: 18 },
      { header: 'Buyer Cancel', key: 'buyerCancel', width: 15 },
      { header: 'Buyer Balance Received', key: 'buyerBalanceReceived', width: 20 },
      
      // Costing (12)
      { header: 'Costing Supplier Inv', key: 'costingSupplierInvoice', width: 18 },
      { header: 'Costing TWL Invoice', key: 'costingTwlInvoice', width: 18 },
      { header: 'Profit', key: 'profit', width: 15 },
      { header: 'In Going', key: 'inGoing', width: 15 },
      { header: 'Out Going', key: 'outGoing', width: 15 },
      { header: 'CAL Charges', key: 'calCharges', width: 15 },
      { header: 'Other', key: 'other', width: 15 },
      { header: 'Foreign Bank Charges', key: 'foreignBankCharges', width: 20 },
      { header: 'Loan Interest', key: 'loanInterest', width: 15 },
      { header: 'Freight Charges (Cost)', key: 'freightChargesCost', width: 18 },
      { header: 'Total Expenses', key: 'totalExpenses', width: 15 },
      { header: 'NET PROFIT', key: 'netProfit', width: 18 }
    ];

    console.log('Adding project data to Excel...');

    // Add data rows - worksheet.addRow() will now automatically map by key
    projects.forEach((project, index) => {
      console.log(`Processing project ${index + 1}: ${project.projectName}`);
      
      // Calculate values dynamically using the correct logic
      const supplierInvoice = parseFloat(project.costing?.supplierInvoiceAmount) || 0;
      const twlInvoice = parseFloat(project.costing?.twlInvoiceAmount) || 0;
      const inGoing = parseFloat(project.costing?.inGoing) || 0;
      const outGoing = parseFloat(project.costing?.outGoing) || 0;
      const calCharges = parseFloat(project.costing?.calCharges) || 0;
      const other = parseFloat(project.costing?.other) || 0;
      const foreignBank = parseFloat(project.costing?.foreignBankCharges) || 0;
      const loanInterest = parseFloat(project.costing?.loanInterest) || 0;
      const freightChargesCost = parseFloat(project.costing?.freightCharges) || 0;
      
      // Calculate profit: TWL Invoice - Supplier Invoice
      const calculatedProfit = twlInvoice - supplierInvoice;
      
      // Calculate total expenses
      const calculatedTotalExpenses = inGoing + outGoing + calCharges + other + foreignBank + loanInterest + freightChargesCost;
      
      // Calculate net profit: Profit - Total Expenses
      const calculatedNetProfit = calculatedProfit - calculatedTotalExpenses;
      
      // Calculate supplier balance payment total (now manual entry, use stored value)
      const storedBalanceTotalPayment = parseFloat(project.supplier?.balancePayment?.totalPayment) || 0;
      
      // Calculate supplier summary (Total Amount = Advance Total + Balance Total)
      const advanceTotalPayment = parseFloat(project.supplier?.advancePayment?.totalPayment) || 0;
      const calculatedSupplierTotalAmount = advanceTotalPayment + storedBalanceTotalPayment;
      
      // Calculate supplier summary balance payment (Final Invoice - Total Amount)
      const finalInvoiceAmount = parseFloat(project.supplier?.proformaInvoice?.finalInvoiceAmount) || 0;
      const calculatedSupplierBalancePayment = finalInvoiceAmount - calculatedSupplierTotalAmount;
      
      worksheet.addRow({
        // Project Info
        projectNo: project.projectNo || '',
        projectName: project.projectName || '',
        projectDate: project.projectDate ? new Date(project.projectDate).toLocaleDateString() : '',
        status: project.status || '',
        
        // Supplier - Proforma Invoice
        supplierName: project.supplier?.proformaInvoice?.supplierName || '',
        supplierInvoiceNo: project.supplier?.proformaInvoice?.invoiceNumber || '',
        supplierInvoiceAmount: project.supplier?.proformaInvoice?.invoiceAmount || 0,
        supplierCreditNote: project.supplier?.proformaInvoice?.creditNote || 0,
        supplierFinalInvoice: project.supplier?.proformaInvoice?.finalInvoiceAmount || 0,
        
        // Supplier - Advance Payment
        loanAmount: project.supplier?.advancePayment?.loanAmount || 0,
        advancePaymentDate: project.supplier?.advancePayment?.paymentDate ? new Date(project.supplier.advancePayment.paymentDate).toLocaleDateString() : '',
        advanceReference: project.supplier?.advancePayment?.referenceNumber || '',
        twlContributionAdv: project.supplier?.advancePayment?.twlContribution || 0,
        totalPaymentAdv: project.supplier?.advancePayment?.totalPayment || 0,
        balanceAmountAdv: project.supplier?.advancePayment?.balanceAmount || 0,
        
        // Supplier - Balance Payment
        supplierBalanceLoanAmount: project.supplier?.balancePayment?.loanAmount || 0,
        supplierBalanceDate: project.supplier?.balancePayment?.date ? new Date(project.supplier.balancePayment.date).toLocaleDateString() : '',
        supplierBalanceRef: project.supplier?.balancePayment?.reference || '',
        twlContributionBal: project.supplier?.balancePayment?.twlContribution || 0,
        totalPaymentBal: storedBalanceTotalPayment,  // Auto-calculated: Loan Amount + TWL Contribution
        
        // Supplier - Summary
        supplierTotalAmount: calculatedSupplierTotalAmount,  // ✅ Calculated: Advance Total + Balance Total
        supplierCancelAmount: project.supplier?.summary?.cancelAmount || 0,
        supplierBalancePayment: calculatedSupplierBalancePayment,  // ✅ Calculated: Final Invoice - Total Amount
        
        // Buyer - Proforma Invoice
        buyerName: project.buyer?.proformaInvoice?.buyerName || '',
        buyerInvoiceNo: project.buyer?.proformaInvoice?.invoiceNo || '',
        buyerInvoiceDate: project.buyer?.proformaInvoice?.invoiceDate ? new Date(project.buyer.proformaInvoice.invoiceDate).toLocaleDateString() : '',
        twlInvoiceAmount: project.buyer?.proformaInvoice?.twlInvoiceAmount || 0,
        buyerCreditNote: project.buyer?.proformaInvoice?.creditNote || 0,
        bankInterest: project.buyer?.proformaInvoice?.bankInterest || 0,
        freightCharges: project.buyer?.proformaInvoice?.freightCharges || 0,
        commission: project.buyer?.proformaInvoice?.commission || 0,
        buyerFinalInvoice: project.buyer?.proformaInvoice?.finalInvoiceAmount || 0,
        
        // Buyer - Advance Payment
        buyerAdvanceTwl: project.buyer?.advancePayment?.twlReceived || 0,
        buyerAdvanceBalance: project.buyer?.advancePayment?.balanceAmount || 0,
        buyerAdvanceDate: project.buyer?.advancePayment?.date ? new Date(project.buyer.advancePayment.date).toLocaleDateString() : '',
        buyerAdvanceRef: project.buyer?.advancePayment?.reference || '',
        
        // Buyer - Balance Payment
        buyerBalanceTwl: project.buyer?.balancePayment?.twlReceived || 0,
        buyerBalanceDate: project.buyer?.balancePayment?.date ? new Date(project.buyer.balancePayment.date).toLocaleDateString() : '',
        buyerBalanceRef: project.buyer?.balancePayment?.reference || '',
        
        // Buyer - Summary
        buyerTotalReceived: project.buyer?.summary?.totalReceived || 0,
        buyerCancel: project.buyer?.summary?.cancel || 0,
        buyerBalanceReceived: project.buyer?.summary?.balanceReceived || 0,
        
        // Costing - USE CALCULATED VALUES
        costingSupplierInvoice: supplierInvoice,
        costingTwlInvoice: twlInvoice,
        profit: calculatedProfit,  // ✅ Calculated: TWL - Supplier
        inGoing: inGoing,
        outGoing: outGoing,
        calCharges: calCharges,
        other: other,
        foreignBankCharges: foreignBank,
        loanInterest: loanInterest,
        freightChargesCost: freightChargesCost,
        totalExpenses: calculatedTotalExpenses,  // ✅ Calculated: Sum of expenses
        netProfit: calculatedNetProfit  // ✅ Calculated: Profit - Total Expenses
      });
    });

    console.log('Calculating and adding totals...');

    // Calculate totals for Active and Inactive projects separately
    const activeProjects = projects.filter(p => p.status === 'Active');
    const inactiveProjects = projects.filter(p => p.status === 'Inactive');
    
    const calculateTotals = (projectList) => {
      return projectList.reduce((totals, project) => {
        // Supplier values
        totals.supplierInvoiceAmount += parseFloat(project.supplier?.proformaInvoice?.invoiceAmount) || 0;
        totals.supplierCreditNote += parseFloat(project.supplier?.proformaInvoice?.creditNote) || 0;
        totals.supplierFinalInvoice += parseFloat(project.supplier?.proformaInvoice?.finalInvoiceAmount) || 0;
        totals.loanAmount += parseFloat(project.supplier?.advancePayment?.loanAmount) || 0;
        totals.twlContributionAdv += parseFloat(project.supplier?.advancePayment?.twlContribution) || 0;
        totals.totalPaymentAdv += parseFloat(project.supplier?.advancePayment?.totalPayment) || 0;
        totals.balanceAmountAdv += parseFloat(project.supplier?.advancePayment?.balanceAmount) || 0;
        totals.supplierBalanceLoanAmount += parseFloat(project.supplier?.balancePayment?.loanAmount) || 0;
        totals.twlContributionBal += parseFloat(project.supplier?.balancePayment?.twlContribution) || 0;
        totals.totalPaymentBal += parseFloat(project.supplier?.balancePayment?.totalPayment) || 0;
        
        const advTotal = parseFloat(project.supplier?.advancePayment?.totalPayment) || 0;
        const balTotal = parseFloat(project.supplier?.balancePayment?.totalPayment) || 0;
        totals.supplierTotalAmount += advTotal + balTotal;
        totals.supplierCancelAmount += parseFloat(project.supplier?.summary?.cancelAmount) || 0;
        
        const finalInv = parseFloat(project.supplier?.proformaInvoice?.finalInvoiceAmount) || 0;
        totals.supplierBalancePayment += finalInv - (advTotal + balTotal);
        
        // Buyer values
        totals.twlInvoiceAmount += parseFloat(project.buyer?.proformaInvoice?.twlInvoiceAmount) || 0;
        totals.buyerCreditNote += parseFloat(project.buyer?.proformaInvoice?.creditNote) || 0;
        totals.bankInterest += parseFloat(project.buyer?.proformaInvoice?.bankInterest) || 0;
        totals.freightCharges += parseFloat(project.buyer?.proformaInvoice?.freightCharges) || 0;
        totals.commission += parseFloat(project.buyer?.proformaInvoice?.commission) || 0;
        totals.buyerFinalInvoice += parseFloat(project.buyer?.proformaInvoice?.finalInvoiceAmount) || 0;
        totals.buyerAdvanceTwl += parseFloat(project.buyer?.advancePayment?.twlReceived) || 0;
        totals.buyerAdvanceBalance += parseFloat(project.buyer?.advancePayment?.balanceAmount) || 0;
        totals.buyerBalanceTwl += parseFloat(project.buyer?.balancePayment?.twlReceived) || 0;
        totals.buyerTotalReceived += parseFloat(project.buyer?.summary?.totalReceived) || 0;
        totals.buyerCancel += parseFloat(project.buyer?.summary?.cancel) || 0;
        totals.buyerBalanceReceived += parseFloat(project.buyer?.summary?.balanceReceived) || 0;
        
        // Costing values
        const supplierInv = parseFloat(project.costing?.supplierInvoiceAmount) || 0;
        const twlInv = parseFloat(project.costing?.twlInvoiceAmount) || 0;
        totals.costingSupplierInvoice += supplierInv;
        totals.costingTwlInvoice += twlInv;
        totals.profit += (twlInv - supplierInv);
        totals.inGoing += parseFloat(project.costing?.inGoing) || 0;
        totals.outGoing += parseFloat(project.costing?.outGoing) || 0;
        totals.calCharges += parseFloat(project.costing?.calCharges) || 0;
        totals.other += parseFloat(project.costing?.other) || 0;
        totals.foreignBankCharges += parseFloat(project.costing?.foreignBankCharges) || 0;
        totals.loanInterest += parseFloat(project.costing?.loanInterest) || 0;
        totals.freightChargesCost += parseFloat(project.costing?.freightCharges) || 0;
        
        return totals;
      }, {
        supplierInvoiceAmount: 0, supplierCreditNote: 0, supplierFinalInvoice: 0,
        loanAmount: 0, twlContributionAdv: 0, totalPaymentAdv: 0, balanceAmountAdv: 0,
        supplierBalanceLoanAmount: 0, twlContributionBal: 0, totalPaymentBal: 0,
        supplierTotalAmount: 0, supplierCancelAmount: 0, supplierBalancePayment: 0,
        twlInvoiceAmount: 0, buyerCreditNote: 0, bankInterest: 0, freightCharges: 0,
        commission: 0, buyerFinalInvoice: 0, buyerAdvanceTwl: 0, buyerAdvanceBalance: 0,
        buyerBalanceTwl: 0, buyerTotalReceived: 0, buyerCancel: 0, buyerBalanceReceived: 0,
        costingSupplierInvoice: 0, costingTwlInvoice: 0, profit: 0, inGoing: 0,
        outGoing: 0, calCharges: 0, other: 0, foreignBankCharges: 0, loanInterest: 0,
        freightChargesCost: 0
      });
    };
    
    const activeTotals = calculateTotals(activeProjects);
    const inactiveTotals = calculateTotals(inactiveProjects);
    
    // Calculate total expenses and net profit for each
    activeTotals.totalExpenses = activeTotals.inGoing + activeTotals.outGoing + activeTotals.calCharges + 
                                  activeTotals.other + activeTotals.foreignBankCharges + activeTotals.loanInterest + 
                                  activeTotals.freightChargesCost;
    activeTotals.netProfit = activeTotals.profit - activeTotals.totalExpenses;
    
    inactiveTotals.totalExpenses = inactiveTotals.inGoing + inactiveTotals.outGoing + inactiveTotals.calCharges + 
                                    inactiveTotals.other + inactiveTotals.foreignBankCharges + inactiveTotals.loanInterest + 
                                    inactiveTotals.freightChargesCost;
    inactiveTotals.netProfit = inactiveTotals.profit - inactiveTotals.totalExpenses;
    
    // Add empty row before totals
    worksheet.addRow({});
    
    // Add Active Total row
    const activeTotalRow = worksheet.addRow({
      projectNo: '',
      projectName: '',
      projectDate: '',
      status: `ACTIVE TOTAL (${activeProjects.length} projects)`,
      supplierInvoiceAmount: activeTotals.supplierInvoiceAmount,
      supplierCreditNote: activeTotals.supplierCreditNote,
      supplierFinalInvoice: activeTotals.supplierFinalInvoice,
      loanAmount: activeTotals.loanAmount,
      twlContributionAdv: activeTotals.twlContributionAdv,
      totalPaymentAdv: activeTotals.totalPaymentAdv,
      balanceAmountAdv: activeTotals.balanceAmountAdv,
      supplierBalanceLoanAmount: activeTotals.supplierBalanceLoanAmount,
      twlContributionBal: activeTotals.twlContributionBal,
      totalPaymentBal: activeTotals.totalPaymentBal,
      supplierTotalAmount: activeTotals.supplierTotalAmount,
      supplierCancelAmount: activeTotals.supplierCancelAmount,
      supplierBalancePayment: activeTotals.supplierBalancePayment,
      twlInvoiceAmount: activeTotals.twlInvoiceAmount,
      buyerCreditNote: activeTotals.buyerCreditNote,
      bankInterest: activeTotals.bankInterest,
      freightCharges: activeTotals.freightCharges,
      commission: activeTotals.commission,
      buyerFinalInvoice: activeTotals.buyerFinalInvoice,
      buyerAdvanceTwl: activeTotals.buyerAdvanceTwl,
      buyerAdvanceBalance: activeTotals.buyerAdvanceBalance,
      buyerBalanceTwl: activeTotals.buyerBalanceTwl,
      buyerTotalReceived: activeTotals.buyerTotalReceived,
      buyerCancel: activeTotals.buyerCancel,
      buyerBalanceReceived: activeTotals.buyerBalanceReceived,
      costingSupplierInvoice: activeTotals.costingSupplierInvoice,
      costingTwlInvoice: activeTotals.costingTwlInvoice,
      profit: activeTotals.profit,
      inGoing: activeTotals.inGoing,
      outGoing: activeTotals.outGoing,
      calCharges: activeTotals.calCharges,
      other: activeTotals.other,
      foreignBankCharges: activeTotals.foreignBankCharges,
      loanInterest: activeTotals.loanInterest,
      freightChargesCost: activeTotals.freightChargesCost,
      totalExpenses: activeTotals.totalExpenses,
      netProfit: activeTotals.netProfit
    });
    
    // Add Inactive Total row (if there are inactive projects)
    let inactiveTotalRow;
    if (inactiveProjects.length > 0) {
      inactiveTotalRow = worksheet.addRow({
        projectNo: '',
        projectName: '',
        projectDate: '',
        status: `INACTIVE TOTAL (${inactiveProjects.length} projects)`,
        supplierInvoiceAmount: inactiveTotals.supplierInvoiceAmount,
        supplierCreditNote: inactiveTotals.supplierCreditNote,
        supplierFinalInvoice: inactiveTotals.supplierFinalInvoice,
        loanAmount: inactiveTotals.loanAmount,
        twlContributionAdv: inactiveTotals.twlContributionAdv,
        totalPaymentAdv: inactiveTotals.totalPaymentAdv,
        balanceAmountAdv: inactiveTotals.balanceAmountAdv,
        supplierBalanceLoanAmount: inactiveTotals.supplierBalanceLoanAmount,
        twlContributionBal: inactiveTotals.twlContributionBal,
        totalPaymentBal: inactiveTotals.totalPaymentBal,
        supplierTotalAmount: inactiveTotals.supplierTotalAmount,
        supplierCancelAmount: inactiveTotals.supplierCancelAmount,
        supplierBalancePayment: inactiveTotals.supplierBalancePayment,
        twlInvoiceAmount: inactiveTotals.twlInvoiceAmount,
        buyerCreditNote: inactiveTotals.buyerCreditNote,
        bankInterest: inactiveTotals.bankInterest,
        freightCharges: inactiveTotals.freightCharges,
        commission: inactiveTotals.commission,
        buyerFinalInvoice: inactiveTotals.buyerFinalInvoice,
        buyerAdvanceTwl: inactiveTotals.buyerAdvanceTwl,
        buyerAdvanceBalance: inactiveTotals.buyerAdvanceBalance,
        buyerBalanceTwl: inactiveTotals.buyerBalanceTwl,
        buyerTotalReceived: inactiveTotals.buyerTotalReceived,
        buyerCancel: inactiveTotals.buyerCancel,
        buyerBalanceReceived: inactiveTotals.buyerBalanceReceived,
        costingSupplierInvoice: inactiveTotals.costingSupplierInvoice,
        costingTwlInvoice: inactiveTotals.costingTwlInvoice,
        profit: inactiveTotals.profit,
        inGoing: inactiveTotals.inGoing,
        outGoing: inactiveTotals.outGoing,
        calCharges: inactiveTotals.calCharges,
        other: inactiveTotals.other,
        foreignBankCharges: inactiveTotals.foreignBankCharges,
        loanInterest: inactiveTotals.loanInterest,
        freightChargesCost: inactiveTotals.freightChargesCost,
        totalExpenses: inactiveTotals.totalExpenses,
        netProfit: inactiveTotals.netProfit
      });
    }
    
    // Calculate Grand Total (Active + Inactive) - CHANGED CALCULATION
    const grandTotal = {
      supplierInvoiceAmount: activeTotals.supplierInvoiceAmount + inactiveTotals.supplierInvoiceAmount,
      supplierCreditNote: activeTotals.supplierCreditNote + inactiveTotals.supplierCreditNote,
      supplierFinalInvoice: activeTotals.supplierFinalInvoice + inactiveTotals.supplierFinalInvoice,
      loanAmount: activeTotals.loanAmount + inactiveTotals.loanAmount,
      twlContributionAdv: activeTotals.twlContributionAdv + inactiveTotals.twlContributionAdv,
      totalPaymentAdv: activeTotals.totalPaymentAdv + inactiveTotals.totalPaymentAdv,
      balanceAmountAdv: activeTotals.balanceAmountAdv + inactiveTotals.balanceAmountAdv,
      supplierBalanceLoanAmount: activeTotals.supplierBalanceLoanAmount + inactiveTotals.supplierBalanceLoanAmount,
      twlContributionBal: activeTotals.twlContributionBal + inactiveTotals.twlContributionBal,
      totalPaymentBal: activeTotals.totalPaymentBal + inactiveTotals.totalPaymentBal,
      supplierTotalAmount: activeTotals.supplierTotalAmount + inactiveTotals.supplierTotalAmount,
      supplierCancelAmount: activeTotals.supplierCancelAmount + inactiveTotals.supplierCancelAmount,
      supplierBalancePayment: activeTotals.supplierBalancePayment + inactiveTotals.supplierBalancePayment,
      twlInvoiceAmount: activeTotals.twlInvoiceAmount + inactiveTotals.twlInvoiceAmount,
      buyerCreditNote: activeTotals.buyerCreditNote + inactiveTotals.buyerCreditNote,
      bankInterest: activeTotals.bankInterest + inactiveTotals.bankInterest,
      freightCharges: activeTotals.freightCharges + inactiveTotals.freightCharges,
      commission: activeTotals.commission + inactiveTotals.commission,
      buyerFinalInvoice: activeTotals.buyerFinalInvoice + inactiveTotals.buyerFinalInvoice,
      buyerAdvanceTwl: activeTotals.buyerAdvanceTwl + inactiveTotals.buyerAdvanceTwl,
      buyerAdvanceBalance: activeTotals.buyerAdvanceBalance + inactiveTotals.buyerAdvanceBalance,
      buyerBalanceTwl: activeTotals.buyerBalanceTwl + inactiveTotals.buyerBalanceTwl,
      buyerTotalReceived: activeTotals.buyerTotalReceived + inactiveTotals.buyerTotalReceived,
      buyerCancel: activeTotals.buyerCancel + inactiveTotals.buyerCancel,
      buyerBalanceReceived: activeTotals.buyerBalanceReceived + inactiveTotals.buyerBalanceReceived,
      costingSupplierInvoice: activeTotals.costingSupplierInvoice + inactiveTotals.costingSupplierInvoice,
      costingTwlInvoice: activeTotals.costingTwlInvoice + inactiveTotals.costingTwlInvoice,
      profit: activeTotals.profit + inactiveTotals.profit,
      inGoing: activeTotals.inGoing + inactiveTotals.inGoing,
      outGoing: activeTotals.outGoing + inactiveTotals.outGoing,
      calCharges: activeTotals.calCharges + inactiveTotals.calCharges,
      other: activeTotals.other + inactiveTotals.other,
      foreignBankCharges: activeTotals.foreignBankCharges + inactiveTotals.foreignBankCharges,
      loanInterest: activeTotals.loanInterest + inactiveTotals.loanInterest,
      freightChargesCost: activeTotals.freightChargesCost + inactiveTotals.freightChargesCost,
      totalExpenses: activeTotals.totalExpenses + inactiveTotals.totalExpenses,
      netProfit: activeTotals.netProfit + inactiveTotals.netProfit
    };
    
    // Add Total row - CHANGED LABEL FROM "GRAND TOTAL" TO "TOTAL"
    const grandTotalRow = worksheet.addRow({
      projectNo: '',
      projectName: '',
      projectDate: '',
      status: `TOTAL (${projects.length} projects)`,
      supplierInvoiceAmount: grandTotal.supplierInvoiceAmount,
      supplierCreditNote: grandTotal.supplierCreditNote,
      supplierFinalInvoice: grandTotal.supplierFinalInvoice,
      loanAmount: grandTotal.loanAmount,
      twlContributionAdv: grandTotal.twlContributionAdv,
      totalPaymentAdv: grandTotal.totalPaymentAdv,
      balanceAmountAdv: grandTotal.balanceAmountAdv,
      supplierBalanceLoanAmount: grandTotal.supplierBalanceLoanAmount,
      twlContributionBal: grandTotal.twlContributionBal,
      totalPaymentBal: grandTotal.totalPaymentBal,
      supplierTotalAmount: grandTotal.supplierTotalAmount,
      supplierCancelAmount: grandTotal.supplierCancelAmount,
      supplierBalancePayment: grandTotal.supplierBalancePayment,
      twlInvoiceAmount: grandTotal.twlInvoiceAmount,
      buyerCreditNote: grandTotal.buyerCreditNote,
      bankInterest: grandTotal.bankInterest,
      freightCharges: grandTotal.freightCharges,
      commission: grandTotal.commission,
      buyerFinalInvoice: grandTotal.buyerFinalInvoice,
      buyerAdvanceTwl: grandTotal.buyerAdvanceTwl,
      buyerAdvanceBalance: grandTotal.buyerAdvanceBalance,
      buyerBalanceTwl: grandTotal.buyerBalanceTwl,
      buyerTotalReceived: grandTotal.buyerTotalReceived,
      buyerCancel: grandTotal.buyerCancel,
      buyerBalanceReceived: grandTotal.buyerBalanceReceived,
      costingSupplierInvoice: grandTotal.costingSupplierInvoice,
      costingTwlInvoice: grandTotal.costingTwlInvoice,
      profit: grandTotal.profit,
      inGoing: grandTotal.inGoing,
      outGoing: grandTotal.outGoing,
      calCharges: grandTotal.calCharges,
      other: grandTotal.other,
      foreignBankCharges: grandTotal.foreignBankCharges,
      loanInterest: grandTotal.loanInterest,
      freightChargesCost: grandTotal.freightChargesCost,
      totalExpenses: grandTotal.totalExpenses,
      netProfit: grandTotal.netProfit
    });

    // Style Active Total row
    activeTotalRow.eachCell((cell, colNumber) => {
      cell.font = { bold: true, color: { argb: 'FF047857' }, size: 11 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD1FAE5' }
      };
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
      };
      if (typeof cell.value === 'number') {
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        cell.numFmt = '$#,##0.00';
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      }
    });
    
    // Style Inactive Total row (if exists)
    if (inactiveTotalRow) {
      inactiveTotalRow.eachCell((cell, colNumber) => {
        cell.font = { bold: true, color: { argb: 'FFDC2626' }, size: 11 };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFEF2F2' }
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
        };
        if (typeof cell.value === 'number') {
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
          cell.numFmt = '$#,##0.00';
        } else {
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        }
      });
    }
    
    // Style Grand Total row - UPDATED COMMENT
    grandTotalRow.eachCell((cell, colNumber) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1F2937' }
      };
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF000000' } },
        bottom: { style: 'medium', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
      };
      if (typeof cell.value === 'number') {
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        cell.numFmt = '$#,##0.00';
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      }
    });

    console.log('Adding section headers...');

    // Insert a row at the top for section headers
    worksheet.spliceRows(1, 0, []);
    
    // Define section header ranges (column positions)
    const sections = [
      { start: 1, end: 4, title: 'PROJECT INFO' },
      { start: 5, end: 9, title: 'SUPPLIER - PROFORMA INVOICE' },
      { start: 10, end: 15, title: 'SUPPLIER - ADVANCE PAYMENT' },
      { start: 16, end: 20, title: 'SUPPLIER - BALANCE PAYMENT' },
      { start: 21, end: 23, title: 'SUPPLIER - SUMMARY' },
      { start: 24, end: 32, title: 'BUYER - PROFORMA INVOICE' },
      { start: 33, end: 36, title: 'BUYER - ADVANCE PAYMENT' },
      { start: 37, end: 39, title: 'BUYER - BALANCE PAYMENT' },
      { start: 40, end: 42, title: 'BUYER - SUMMARY' },
      { start: 43, end: 54, title: 'COSTING' }
    ];

    // Add section headers with merged cells
    const sectionRow = worksheet.getRow(1);
    sectionRow.height = 30;
    
    sections.forEach(section => {
      // Merge cells for this section
      worksheet.mergeCells(1, section.start, 1, section.end);
      
      // Style the merged cell
      const cell = worksheet.getCell(1, section.start);
      cell.value = section.title;
      cell.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1F2937' } // Dark gray background
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF000000' } },
        bottom: { style: 'medium', color: { argb: 'FF000000' } },
        left: { style: 'medium', color: { argb: 'FF000000' } },
        right: { style: 'medium', color: { argb: 'FF000000' } }
      };
    });

    console.log('Styling the worksheet...');

    // Style column header row (now row 2) with colors
    const headerRow = worksheet.getRow(2);
    headerRow.height = 35;
    
    const colorMap = [
      // Project (4) - Gray  // UPDATE COMMENT FROM 3 TO 4
      'FF4A5568', 'FF4A5568', 'FF4A5568', 'FF4A5568',  // ADD ONE MORE
      // Supplier Proforma (5) - Green shades
      'FF10B981', 'FF10B981', 'FF10B981', 'FF10B981', 'FF10B981',
      // Supplier Advance (6) - Darker green
      'FF059669', 'FF059669', 'FF059669', 'FF059669', 'FF059669', 'FF059669',
      // Supplier Balance (5) - Even darker green
      'FF047857', 'FF047857', 'FF047857', 'FF047857', 'FF047857',
      // Supplier Summary (3) - Darkest green
      'FF065F46', 'FF065F46', 'FF065F46',
      // Buyer Proforma (9) - Blue shades
      'FF3B82F6', 'FF3B82F6', 'FF3B82F6', 'FF3B82F6', 'FF3B82F6', 'FF3B82F6', 'FF3B82F6', 'FF3B82F6', 'FF3B82F6',
      // Buyer Advance (4) - Darker blue
      'FF2563EB', 'FF2563EB', 'FF2563EB', 'FF2563EB',
      // Buyer Balance (3) - Even darker blue
      'FF1E40AF', 'FF1E40AF', 'FF1E40AF',
      // Buyer Summary (3) - Darkest blue
      'FF1E3A8A', 'FF1E3A8A', 'FF1E3A8A',
      // Costing (12) - Yellow and red
      'FFFBBF24', 'FFFBBF24', 'FFF59E0B', 'FFEF4444', 'FFEF4444', 'FFEF4444', 'FFEF4444', 'FFEF4444', 'FFEF4444', 'FFEF4444', 'FFDC2626', 'FF16A34A'
    ];

    headerRow.eachCell((cell, colNumber) => {
      cell.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: colorMap[colNumber - 1] || 'FF4A5568' }
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF000000' } },
        bottom: { style: 'medium', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };
    });

    // Style data rows
    const totalRowsCount = inactiveProjects.length > 0 ? 4 : 3; // Empty row + Active + Inactive (optional) + Grand Total
    const lastDataRow = worksheet.rowCount - totalRowsCount;
    
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber <= 2) return; // Skip section header and column header rows
      if (rowNumber > lastDataRow) return; // Skip total rows (already styled)
      
      row.height = 25;
      row.eachCell((cell, colNumber) => {
        // Borders
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
        };

        // Number formatting
        if (typeof cell.value === 'number') {
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
          cell.numFmt = '$#,##0.00';
        } else {
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        }

        // Alternate row colors (data rows start at 3, so adjust logic)
        if ((rowNumber - 2) % 2 === 0) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF9FAFB' }
          };
        }

        // NET PROFIT column highlighting (last column = 54)
        if (colNumber === 54) {
          const netProfit = cell.value || 0;
          if (netProfit >= 0) {
            cell.font = { bold: true, color: { argb: 'FF047857' }, size: 11 };
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFD1FAE5' }
            };
          } else {
            cell.font = { bold: true, color: { argb: 'FFDC2626' }, size: 11 };
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFEE2E2' }
            };
          }
        }
      });
    });

    // Freeze panes (section header and column header rows)
    worksheet.views = [
      { state: 'frozen', ySplit: 2 }
    ];

    // Auto-filter on column headers (row 2)
    worksheet.autoFilter = {
      from: { row: 2, column: 1 },
      to: { row: 2, column: 54 }
    };

    console.log('Generating Excel file...');

    // Generate Excel file to buffer first (more reliable than streaming)
    const buffer = await workbook.xlsx.writeBuffer();
    
    console.log(`Excel buffer created, size: ${buffer.length} bytes`);

    // Set headers and send buffer
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=TWL_Projects_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    res.setHeader('Content-Length', buffer.length);

    res.send(buffer);

    console.log('Excel export completed successfully');

  } catch (error) {
    console.error('Error exporting to Excel:', error);
    console.error('Stack trace:', error.stack);
    
    // Only send JSON error if headers haven't been sent yet
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Failed to export to Excel', error: error.message });
    }
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