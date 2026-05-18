const Income = require('../models/Income');
const Expense = require('../models/Expense');
const ExcelJS = require('exceljs');
const excelHelper = require('../utils/excelHelper');

class ReportService {
  // Generate monthly income report
  async generateMonthlyIncomeReport(year, month) {
    const incomes = await Income.find({ year, month }).sort({ date: 1 });
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`Income ${month}-${year}`); // Changed / to -

    // Set column headers
    worksheet.columns = [
      { header: 'Date', key: 'date', width: 12 },
      { header: 'Description', key: 'description', width: 35 },
      { header: 'Reference No', key: 'referenceNo', width: 18 },
      { header: 'Currency', key: 'currency', width: 10 },
      { header: 'Rate', key: 'rate', width: 12 },
      { header: 'Amount', key: 'amount', width: 15 },
      { header: 'USD Amount', key: 'usdAmount', width: 15 }
    ];

    // Style header row
    excelHelper.styleHeaderRow(worksheet.getRow(1));

    // Add data rows
    incomes.forEach(income => {
      const row = worksheet.addRow({
        date: new Date(income.date).toLocaleDateString(),
        description: income.description,
        referenceNo: income.referenceNo,
        currency: income.currency,
        rate: income.rate.toFixed(4),
        amount: income.amount.toFixed(2),
        usdAmount: income.usdAmount.toFixed(2)
      });

      // Format amount columns
      row.getCell('amount').numFmt = '#,##0.00';
      row.getCell('usdAmount').numFmt = '$#,##0.00';
      row.getCell('rate').numFmt = '0.0000';
    });

    // Add total row
    const totalUSD = incomes.reduce((sum, inc) => sum + inc.usdAmount, 0);
    const totalRow = worksheet.addRow({
      date: '',
      description: '',
      referenceNo: '',
      currency: '',
      rate: '',
      amount: 'TOTAL:',
      usdAmount: totalUSD.toFixed(2)
    });

    excelHelper.styleTotalRow(totalRow);
    totalRow.getCell('usdAmount').numFmt = '$#,##0.00';

    // Add borders to all cells
    excelHelper.addBordersToSheet(worksheet);

    return await workbook.xlsx.writeBuffer();
  }

  // Generate monthly expense report
  async generateMonthlyExpenseReport(year, month) {
    const expenses = await Expense.find({ year, month }).sort({ date: 1 });
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`Expenses ${month}-${year}`); // Changed / to -

    // Set column headers
    worksheet.columns = [
      { header: 'Date', key: 'date', width: 12 },
      { header: 'Description', key: 'description', width: 35 },
      { header: 'Reference No', key: 'referenceNo', width: 18 },
      { header: 'Category', key: 'category', width: 15 },
      { header: 'Currency', key: 'currency', width: 10 },
      { header: 'Rate', key: 'rate', width: 12 },
      { header: 'Amount', key: 'amount', width: 15 },
      { header: 'USD Amount', key: 'usdAmount', width: 15 }
    ];

    // Style header row
    excelHelper.styleHeaderRow(worksheet.getRow(1));

    // Add data rows
    expenses.forEach(expense => {
      const row = worksheet.addRow({
        date: new Date(expense.date).toLocaleDateString(),
        description: expense.description,
        referenceNo: expense.referenceNo,
        category: expense.category,
        currency: expense.currency,
        rate: expense.rate.toFixed(4),
        amount: expense.amount.toFixed(2),
        usdAmount: expense.usdAmount.toFixed(2)
      });

      // Format amount columns
      row.getCell('amount').numFmt = '#,##0.00';
      row.getCell('usdAmount').numFmt = '$#,##0.00';
      row.getCell('rate').numFmt = '0.0000';
    });

    // Add total row
    const totalUSD = expenses.reduce((sum, exp) => sum + exp.usdAmount, 0);
    const totalRow = worksheet.addRow({
      date: '',
      description: '',
      referenceNo: '',
      category: '',
      currency: '',
      rate: '',
      amount: 'TOTAL:',
      usdAmount: totalUSD.toFixed(2)
    });

    excelHelper.styleTotalRow(totalRow);
    totalRow.getCell('usdAmount').numFmt = '$#,##0.00';

    // Add borders to all cells
    excelHelper.addBordersToSheet(worksheet);

    return await workbook.xlsx.writeBuffer();
  }

  // Generate yearly income report (with monthly sheets)
  async generateYearlyIncomeReport(year) {
    const workbook = new ExcelJS.Workbook();
    
    // Create summary sheet
    const summarySheet = workbook.addWorksheet(`${year} Income Summary`);
    summarySheet.columns = [
      { header: 'Month', key: 'month', width: 15 },
      { header: 'Total Income (USD)', key: 'total', width: 20 },
      { header: 'Count', key: 'count', width: 10 }
    ];

    excelHelper.styleHeaderRow(summarySheet.getRow(1));

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];
    
    for (let month = 1; month <= 12; month++) {
      const incomes = await Income.find({ year, month }).sort({ date: 1 });
      const expenses = await Expense.find({ year, month }).sort({ date: 1 });
      const incomeTotal = incomes.reduce((sum, inc) => sum + inc.usdAmount, 0);
      
      // Add to summary
      summarySheet.addRow({
        month: monthNames[month - 1],
        total: incomeTotal.toFixed(2),
        count: incomes.length
      });

      // Create monthly sheet with BOTH income and expenses
      const monthSheet = workbook.addWorksheet(`${monthNames[month - 1]} ${year}`);
      
      // ==== INCOME SECTION ====
      let currentRow = 1;
      
      // Income Title
      const incomeTitleRow = monthSheet.getRow(currentRow);
      monthSheet.mergeCells(currentRow, 1, currentRow, 8);
      incomeTitleRow.getCell(1).value = `INCOME - ${monthNames[month - 1]} ${year}`;
      incomeTitleRow.getCell(1).font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
      incomeTitleRow.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF28a745' }
      };
      incomeTitleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
      incomeTitleRow.height = 25;
      currentRow++;

      // Income Headers
      monthSheet.getRow(currentRow).values = ['Date', 'Description', 'Reference No', 'Currency', 'Rate', 'Amount', 'USD Amount'];
      excelHelper.styleHeaderRow(monthSheet.getRow(currentRow));
      currentRow++;

      // Income Data
      if (incomes.length > 0) {
        incomes.forEach(income => {
          const row = monthSheet.getRow(currentRow);
          row.values = [
            income.date.toISOString().split('T')[0],
            income.description,
            income.referenceNo,
            income.currency,
            income.rate.toFixed(2),
            income.amount.toFixed(2),
            income.usdAmount.toFixed(2)
          ];
          row.getCell(6).numFmt = '#,##0.00';
          row.getCell(7).numFmt = '$#,##0.00';
          currentRow++;
        });

        // Income Total
        const incomeTotalRow = monthSheet.getRow(currentRow);
        incomeTotalRow.getCell(6).value = 'TOTAL:';
        incomeTotalRow.getCell(7).value = incomeTotal.toFixed(2);
        excelHelper.styleTotalRow(incomeTotalRow);
        incomeTotalRow.getCell(7).numFmt = '$#,##0.00';
        currentRow++;
      } else {
        monthSheet.getRow(currentRow).getCell(1).value = 'No income records for this month';
        currentRow++;
      }

      // Empty row separator
      currentRow++;

      // ==== EXPENSE SECTION ====
      
      // Expense Title
      const expenseTitleRow = monthSheet.getRow(currentRow);
      monthSheet.mergeCells(currentRow, 1, currentRow, 8);
      expenseTitleRow.getCell(1).value = `EXPENSES - ${monthNames[month - 1]} ${year}`;
      expenseTitleRow.getCell(1).font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
      expenseTitleRow.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFdc3545' }
      };
      expenseTitleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
      expenseTitleRow.height = 25;
      currentRow++;

      // Expense Headers
      monthSheet.getRow(currentRow).values = ['Date', 'Description', 'Reference No', 'Category', 'Currency', 'Rate', 'Amount', 'USD Amount'];
      excelHelper.styleHeaderRow(monthSheet.getRow(currentRow));
      currentRow++;

      // Expense Data
      const expenseTotal = expenses.reduce((sum, exp) => sum + exp.usdAmount, 0);
      
      if (expenses.length > 0) {
        expenses.forEach(expense => {
          const row = monthSheet.getRow(currentRow);
          row.values = [
            expense.date.toISOString().split('T')[0],
            expense.description,
            expense.referenceNo,
            expense.category,
            expense.currency,
            expense.rate.toFixed(2),
            expense.amount.toFixed(2),
            expense.usdAmount.toFixed(2)
          ];
          row.getCell(7).numFmt = '#,##0.00';
          row.getCell(8).numFmt = '$#,##0.00';
          currentRow++;
        });

        // Expense Total
        const expenseTotalRow = monthSheet.getRow(currentRow);
        expenseTotalRow.getCell(7).value = 'TOTAL:';
        expenseTotalRow.getCell(8).value = expenseTotal.toFixed(2);
        excelHelper.styleTotalRow(expenseTotalRow);
        expenseTotalRow.getCell(8).numFmt = '$#,##0.00';
        currentRow++;
      } else {
        monthSheet.getRow(currentRow).getCell(1).value = 'No expense records for this month';
        currentRow++;
      }

      // Empty row separator
      currentRow++;

      // ==== NET INCOME SECTION ====
      const netIncome = incomeTotal - expenseTotal;
      const netRow = monthSheet.getRow(currentRow);
      monthSheet.mergeCells(currentRow, 1, currentRow, 7);
      netRow.getCell(1).value = 'NET INCOME:';
      netRow.getCell(1).font = { bold: true, size: 12 };
      netRow.getCell(1).alignment = { horizontal: 'right' };
      netRow.getCell(8).value = netIncome.toFixed(2);
      netRow.getCell(8).font = { bold: true, size: 12, color: { argb: netIncome >= 0 ? 'FF28a745' : 'FFdc3545' } };
      netRow.getCell(8).numFmt = '$#,##0.00';

      // Set column widths
      monthSheet.getColumn(1).width = 12;
      monthSheet.getColumn(2).width = 35;
      monthSheet.getColumn(3).width = 18;
      monthSheet.getColumn(4).width = 15;
      monthSheet.getColumn(5).width = 10;
      monthSheet.getColumn(6).width = 12;
      monthSheet.getColumn(7).width = 15;
      monthSheet.getColumn(8).width = 15;
    }

    excelHelper.addBordersToSheet(summarySheet);
    return await workbook.xlsx.writeBuffer();
  }

  // Generate yearly expense report (with monthly sheets)
  async generateYearlyExpenseReport(year) {
    const workbook = new ExcelJS.Workbook();
    
    const summarySheet = workbook.addWorksheet(`${year} Expense Summary`);
    summarySheet.columns = [
      { header: 'Month', key: 'month', width: 15 },
      { header: 'Total Expenses (USD)', key: 'total', width: 20 },
      { header: 'Count', key: 'count', width: 10 }
    ];

    excelHelper.styleHeaderRow(summarySheet.getRow(1));

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];
    
    for (let month = 1; month <= 12; month++) {
      const incomes = await Income.find({ year, month }).sort({ date: 1 });
      const expenses = await Expense.find({ year, month }).sort({ date: 1 });
      const expenseTotal = expenses.reduce((sum, exp) => sum + exp.usdAmount, 0);
      
      summarySheet.addRow({
        month: monthNames[month - 1],
        total: expenseTotal.toFixed(2),
        count: expenses.length
      });

      // Create monthly sheet with BOTH income and expenses
      const monthSheet = workbook.addWorksheet(`${monthNames[month - 1]} ${year}`);
      
      let currentRow = 1;
      
      // ==== INCOME SECTION ====
      const incomeTitleRow = monthSheet.getRow(currentRow);
      monthSheet.mergeCells(currentRow, 1, currentRow, 8);
      incomeTitleRow.getCell(1).value = `INCOME - ${monthNames[month - 1]} ${year}`;
      incomeTitleRow.getCell(1).font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
      incomeTitleRow.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF28a745' }
      };
      incomeTitleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
      incomeTitleRow.height = 25;
      currentRow++;

      monthSheet.getRow(currentRow).values = ['Date', 'Description', 'Reference No', 'Currency', 'Rate', 'Amount', 'USD Amount'];
      excelHelper.styleHeaderRow(monthSheet.getRow(currentRow));
      currentRow++;

      const incomeTotal = incomes.reduce((sum, inc) => sum + inc.usdAmount, 0);
      
      if (incomes.length > 0) {
        incomes.forEach(income => {
          const row = monthSheet.getRow(currentRow);
          row.values = [
            income.date.toISOString().split('T')[0],
            income.description,
            income.referenceNo,
            income.currency,
            income.rate.toFixed(2),
            income.amount.toFixed(2),
            income.usdAmount.toFixed(2)
          ];
          row.getCell(6).numFmt = '#,##0.00';
          row.getCell(7).numFmt = '$#,##0.00';
          currentRow++;
        });

        const incomeTotalRow = monthSheet.getRow(currentRow);
        incomeTotalRow.getCell(6).value = 'TOTAL:';
        incomeTotalRow.getCell(7).value = incomeTotal.toFixed(2);
        excelHelper.styleTotalRow(incomeTotalRow);
        incomeTotalRow.getCell(7).numFmt = '$#,##0.00';
        currentRow++;
      } else {
        monthSheet.getRow(currentRow).getCell(1).value = 'No income records for this month';
        currentRow++;
      }

      currentRow++;

      // ==== EXPENSE SECTION ====
      const expenseTitleRow = monthSheet.getRow(currentRow);
      monthSheet.mergeCells(currentRow, 1, currentRow, 8);
      expenseTitleRow.getCell(1).value = `EXPENSES - ${monthNames[month - 1]} ${year}`;
      expenseTitleRow.getCell(1).font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
      expenseTitleRow.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFdc3545' }
      };
      expenseTitleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
      expenseTitleRow.height = 25;
      currentRow++;

      monthSheet.getRow(currentRow).values = ['Date', 'Description', 'Reference No', 'Category', 'Currency', 'Rate', 'Amount', 'USD Amount'];
      excelHelper.styleHeaderRow(monthSheet.getRow(currentRow));
      currentRow++;

      if (expenses.length > 0) {
        expenses.forEach(expense => {
          const row = monthSheet.getRow(currentRow);
          row.values = [
            expense.date.toISOString().split('T')[0],
            expense.description,
            expense.referenceNo,
            expense.category,
            expense.currency,
            expense.rate.toFixed(2),
            expense.amount.toFixed(2),
            expense.usdAmount.toFixed(2)
          ];
          row.getCell(7).numFmt = '#,##0.00';
          row.getCell(8).numFmt = '$#,##0.00';
          currentRow++;
        });

        const expenseTotalRow = monthSheet.getRow(currentRow);
        expenseTotalRow.getCell(7).value = 'TOTAL:';
        expenseTotalRow.getCell(8).value = expenseTotal.toFixed(2);
        excelHelper.styleTotalRow(expenseTotalRow);
        expenseTotalRow.getCell(8).numFmt = '$#,##0.00';
        currentRow++;
      } else {
        monthSheet.getRow(currentRow).getCell(1).value = 'No expense records for this month';
        currentRow++;
      }

      currentRow++;

      // ==== NET INCOME ====
      const netIncome = incomeTotal - expenseTotal;
      const netRow = monthSheet.getRow(currentRow);
      monthSheet.mergeCells(currentRow, 1, currentRow, 7);
      netRow.getCell(1).value = 'NET INCOME:';
      netRow.getCell(1).font = { bold: true, size: 12 };
      netRow.getCell(1).alignment = { horizontal: 'right' };
      netRow.getCell(8).value = netIncome.toFixed(2);
      netRow.getCell(8).font = { bold: true, size: 12, color: { argb: netIncome >= 0 ? 'FF28a745' : 'FFdc3545' } };
      netRow.getCell(8).numFmt = '$#,##0.00';

      monthSheet.getColumn(1).width = 12;
      monthSheet.getColumn(2).width = 35;
      monthSheet.getColumn(3).width = 18;
      monthSheet.getColumn(4).width = 15;
      monthSheet.getColumn(5).width = 10;
      monthSheet.getColumn(6).width = 12;
      monthSheet.getColumn(7).width = 15;
      monthSheet.getColumn(8).width = 15;
    }

    excelHelper.addBordersToSheet(summarySheet);
    return await workbook.xlsx.writeBuffer();
  }

  // Generate combined monthly report (Income + Expenses)
  async generateMonthlyFinanceReport(year, month) {
    const workbook = new ExcelJS.Workbook();
    
    // Income sheet
    const incomes = await Income.find({ year, month }).sort({ date: 1 });
    const incomeSheet = workbook.addWorksheet('Income');
    
    incomeSheet.columns = [
      { header: 'Date', key: 'date', width: 12 },
      { header: 'Description', key: 'description', width: 35 },
      { header: 'Reference No', key: 'referenceNo', width: 18 },
      { header: 'Currency', key: 'currency', width: 10 },
      { header: 'Rate', key: 'rate', width: 12 },
      { header: 'Amount', key: 'amount', width: 15 },
      { header: 'USD Amount', key: 'usdAmount', width: 15 }
    ];

    excelHelper.styleHeaderRow(incomeSheet.getRow(1));

    let totalIncome = 0;
    incomes.forEach(income => {
      const row = incomeSheet.addRow({
        date: new Date(income.date).toLocaleDateString(),
        description: income.description,
        referenceNo: income.referenceNo,
        currency: income.currency,
        rate: income.rate.toFixed(4),
        amount: income.amount.toFixed(2),
        usdAmount: income.usdAmount.toFixed(2)
      });
      row.getCell('amount').numFmt = '#,##0.00';
      row.getCell('usdAmount').numFmt = '$#,##0.00';
      totalIncome += income.usdAmount;
    });

    const incomeTotalRow = incomeSheet.addRow({
      date: '', description: '', referenceNo: '', currency: '', rate: '',
      amount: 'TOTAL:', usdAmount: totalIncome.toFixed(2)
    });
    excelHelper.styleTotalRow(incomeTotalRow);
    incomeTotalRow.getCell('usdAmount').numFmt = '$#,##0.00';
    excelHelper.addBordersToSheet(incomeSheet);

    // Expense sheet
    const expenses = await Expense.find({ year, month }).sort({ date: 1 });
    const expenseSheet = workbook.addWorksheet('Expenses');
    
    expenseSheet.columns = [
      { header: 'Date', key: 'date', width: 12 },
      { header: 'Description', key: 'description', width: 35 },
      { header: 'Reference No', key: 'referenceNo', width: 18 },
      { header: 'Category', key: 'category', width: 15 },
      { header: 'Currency', key: 'currency', width: 10 },
      { header: 'Rate', key: 'rate', width: 12 },
      { header: 'Amount', key: 'amount', width: 15 },
      { header: 'USD Amount', key: 'usdAmount', width: 15 }
    ];

    excelHelper.styleHeaderRow(expenseSheet.getRow(1));

    let totalExpense = 0;
    expenses.forEach(expense => {
      const row = expenseSheet.addRow({
        date: new Date(expense.date).toLocaleDateString(),
        description: expense.description,
        referenceNo: expense.referenceNo,
        category: expense.category,
        currency: expense.currency,
        rate: expense.rate.toFixed(4),
        amount: expense.amount.toFixed(2),
        usdAmount: expense.usdAmount.toFixed(2)
      });
      row.getCell('amount').numFmt = '#,##0.00';
      row.getCell('usdAmount').numFmt = '$#,##0.00';
      totalExpense += expense.usdAmount;
    });

    const expenseTotalRow = expenseSheet.addRow({
      date: '', description: '', referenceNo: '', category: '', currency: '', rate: '',
      amount: 'TOTAL:', usdAmount: totalExpense.toFixed(2)
    });
    excelHelper.styleTotalRow(expenseTotalRow);
    expenseTotalRow.getCell('usdAmount').numFmt = '$#,##0.00';
    excelHelper.addBordersToSheet(expenseSheet);

    // Summary sheet
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.columns = [
      { header: 'Item', key: 'item', width: 25 },
      { header: 'Amount (USD)', key: 'amount', width: 20 }
    ];

    excelHelper.styleHeaderRow(summarySheet.getRow(1));

    const incomeRow = summarySheet.addRow({ item: 'Total Income', amount: totalIncome.toFixed(2) });
    incomeRow.getCell('amount').numFmt = '$#,##0.00';
    incomeRow.getCell('amount').font = { color: { argb: 'FF00AA00' }, bold: true };

    const expenseRow = summarySheet.addRow({ item: 'Total Expenses', amount: totalExpense.toFixed(2) });
    expenseRow.getCell('amount').numFmt = '$#,##0.00';
    expenseRow.getCell('amount').font = { color: { argb: 'FFAA0000' }, bold: true };

    const netRow = summarySheet.addRow({ item: 'Net Income', amount: (totalIncome - totalExpense).toFixed(2) });
    excelHelper.styleTotalRow(netRow);
    netRow.getCell('amount').numFmt = '$#,##0.00';

    excelHelper.addBordersToSheet(summarySheet);

    return await workbook.xlsx.writeBuffer();
  }
}

module.exports = new ReportService();
