const Expense = require('../models/Expense');
const currencyService = require('../services/currencyService');
const reportService = require('../services/reportService');

// Create new expense
exports.createExpense = async (req, res) => {
  try {
    const { date, description, referenceNo, currency, rate, amount, category } = req.body;

    // Calculate USD amount
    const usdAmount = amount / rate;

    // Extract year and month from date
    const expenseDate = new Date(date);
    const year = expenseDate.getFullYear();
    const month = expenseDate.getMonth() + 1;

    const expense = new Expense({
      date,
      description,
      referenceNo,
      currency,
      rate,
      amount,
      usdAmount,
      category: category || 'Other',
      year,
      month,
      createdBy: req.user.id
    });

    await expense.save();

    res.status(201).json({
      success: true,
      message: 'Expense created successfully',
      data: expense
    });
  } catch (error) {
    console.error('Create expense error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Reference number already exists'
      });
    }

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get all expenses
exports.getAllExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find()
      .sort({ date: -1 })
      .populate('createdBy', 'name email');

    res.json({
      success: true,
      count: expenses.length,
      data: expenses
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get monthly expenses
exports.getMonthlyExpenses = async (req, res) => {
  try {
    const { year, month } = req.params;

    const expenses = await Expense.find({
      year: parseInt(year),
      month: parseInt(month)
    })
      .sort({ date: 1 })
      .populate('createdBy', 'name email');

    const total = expenses.reduce((sum, expense) => sum + expense.usdAmount, 0);

    // Group by category
    const byCategory = {};
    expenses.forEach(expense => {
      if (!byCategory[expense.category]) {
        byCategory[expense.category] = { count: 0, total: 0 };
      }
      byCategory[expense.category].count++;
      byCategory[expense.category].total += expense.usdAmount;
    });

    res.json({
      success: true,
      count: expenses.length,
      total: parseFloat(total.toFixed(2)),
      byCategory,
      data: expenses
    });
  } catch (error) {
    console.error('Get monthly expenses error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get yearly expenses
exports.getYearlyExpenses = async (req, res) => {
  try {
    const { year } = req.params;

    const expenses = await Expense.find({
      year: parseInt(year)
    })
      .sort({ date: 1 })
      .populate('createdBy', 'name email');

    // Group by month
    const monthlyData = {};
    for (let i = 1; i <= 12; i++) {
      monthlyData[i] = {
        month: i,
        count: 0,
        total: 0,
        items: []
      };
    }

    expenses.forEach(expense => {
      monthlyData[expense.month].count++;
      monthlyData[expense.month].total += expense.usdAmount;
      monthlyData[expense.month].items.push(expense);
    });

    const yearTotal = expenses.reduce((sum, expense) => sum + expense.usdAmount, 0);

    res.json({
      success: true,
      year: parseInt(year),
      totalCount: expenses.length,
      yearTotal: parseFloat(yearTotal.toFixed(2)),
      total: parseFloat(yearTotal.toFixed(2)),
      monthlyData,
      data: expenses
    });
  } catch (error) {
    console.error('Get yearly expenses error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get expense by ID
exports.getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!expense) {
      return res.status(404).json({
        success: false,
        error: 'Expense not found'
      });
    }

    res.json({
      success: true,
      data: expense
    });
  } catch (error) {
    console.error('Get expense error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Update expense
exports.updateExpense = async (req, res) => {
  try {
    const { date, description, referenceNo, currency, rate, amount, category } = req.body;

    // Calculate USD amount
    const usdAmount = amount / rate;

    // Extract year and month from date
    const expenseDate = new Date(date);
    const year = expenseDate.getFullYear();
    const month = expenseDate.getMonth() + 1;

    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      {
        date,
        description,
        referenceNo,
        currency,
        rate,
        amount,
        usdAmount,
        category: category || 'Other',
        year,
        month
      },
      { returnDocument: 'after', runValidators: true }
    );

    if (!expense) {
      return res.status(404).json({
        success: false,
        error: 'Expense not found'
      });
    }

    res.json({
      success: true,
      message: 'Expense updated successfully',
      data: expense
    });
  } catch (error) {
    console.error('Update expense error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Reference number already exists'
      });
    }

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Delete expense
exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        error: 'Expense not found'
      });
    }

    res.json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get exchange rate
exports.getExchangeRate = async (req, res) => {
  try {
    const { currency, year, month } = req.params;

    const rate = await currencyService.getMonthlyRate(
      currency,
      parseInt(year),
      parseInt(month)
    );

    res.json({
      success: true,
      currency,
      year: parseInt(year),
      month: parseInt(month),
      rate
    });
  } catch (error) {
    console.error('Get exchange rate error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Export monthly Excel
exports.exportMonthlyExcel = async (req, res) => {
  try {
    const { year, month } = req.params;

    const buffer = await reportService.generateMonthlyExpenseReport(
      parseInt(year),
      parseInt(month)
    );

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Expense_${year}-${month.toString().padStart(2, '0')}.xlsx`
    );

    res.send(buffer);
  } catch (error) {
    console.error('Export monthly expense error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Export yearly Excel
exports.exportYearlyExcel = async (req, res) => {
  try {
    const { year } = req.params;

    const buffer = await reportService.generateYearlyExpenseReport(parseInt(year));

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Expense_${year}.xlsx`
    );

    res.send(buffer);
  } catch (error) {
    console.error('Export yearly expense error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
