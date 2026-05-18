const Income = require('../models/Income');
const currencyService = require('../services/currencyService');
const reportService = require('../services/reportService');

// Create new income
exports.createIncome = async (req, res) => {
  try {
    const { date, description, referenceNo, currency, rate, amount } = req.body;

    // Calculate USD amount
    const usdAmount = amount / rate;

    // Extract year and month from date
    const incomeDate = new Date(date);
    const year = incomeDate.getFullYear();
    const month = incomeDate.getMonth() + 1;

    const income = new Income({
      date,
      description,
      referenceNo,
      currency,
      rate,
      amount,
      usdAmount,
      year,
      month,
      createdBy: req.user.id
    });

    await income.save();

    res.status(201).json({
      success: true,
      message: 'Income created successfully',
      data: income
    });
  } catch (error) {
    console.error('Create income error:', error);
    
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

// Get all incomes
exports.getAllIncomes = async (req, res) => {
  try {
    const incomes = await Income.find()
      .sort({ date: -1 })
      .populate('createdBy', 'name email');

    res.json({
      success: true,
      count: incomes.length,
      data: incomes
    });
  } catch (error) {
    console.error('Get incomes error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get monthly incomes
exports.getMonthlyIncomes = async (req, res) => {
  try {
    const { year, month } = req.params;

    const incomes = await Income.find({
      year: parseInt(year),
      month: parseInt(month)
    })
      .sort({ date: 1 })
      .populate('createdBy', 'name email');

    const total = incomes.reduce((sum, income) => sum + income.usdAmount, 0);

    res.json({
      success: true,
      count: incomes.length,
      total: parseFloat(total.toFixed(2)),
      data: incomes
    });
  } catch (error) {
    console.error('Get monthly incomes error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get yearly incomes
exports.getYearlyIncomes = async (req, res) => {
  try {
    const { year } = req.params;

    const incomes = await Income.find({
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

    incomes.forEach(income => {
      monthlyData[income.month].count++;
      monthlyData[income.month].total += income.usdAmount;
      monthlyData[income.month].items.push(income);
    });

    const yearTotal = incomes.reduce((sum, income) => sum + income.usdAmount, 0);

    res.json({
      success: true,
      year: parseInt(year),
      totalCount: incomes.length,
      yearTotal: parseFloat(yearTotal.toFixed(2)),
      total: parseFloat(yearTotal.toFixed(2)),
      monthlyData,
      data: incomes
    });
  } catch (error) {
    console.error('Get yearly incomes error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get income by ID
exports.getIncomeById = async (req, res) => {
  try {
    const income = await Income.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!income) {
      return res.status(404).json({
        success: false,
        error: 'Income not found'
      });
    }

    res.json({
      success: true,
      data: income
    });
  } catch (error) {
    console.error('Get income error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Update income
exports.updateIncome = async (req, res) => {
  try {
    const { date, description, referenceNo, currency, rate, amount } = req.body;

    // Calculate USD amount
    const usdAmount = amount / rate;

    // Extract year and month from date
    const incomeDate = new Date(date);
    const year = incomeDate.getFullYear();
    const month = incomeDate.getMonth() + 1;

    const income = await Income.findByIdAndUpdate(
      req.params.id,
      {
        date,
        description,
        referenceNo,
        currency,
        rate,
        amount,
        usdAmount,
        year,
        month
      },
      { returnDocument: 'after', runValidators: true }
    );

    if (!income) {
      return res.status(404).json({
        success: false,
        error: 'Income not found'
      });
    }

    res.json({
      success: true,
      message: 'Income updated successfully',
      data: income
    });
  } catch (error) {
    console.error('Update income error:', error);
    
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

// Delete income
exports.deleteIncome = async (req, res) => {
  try {
    const income = await Income.findByIdAndDelete(req.params.id);

    if (!income) {
      return res.status(404).json({
        success: false,
        error: 'Income not found'
      });
    }

    res.json({
      success: true,
      message: 'Income deleted successfully'
    });
  } catch (error) {
    console.error('Delete income error:', error);
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

    const buffer = await reportService.generateMonthlyIncomeReport(
      parseInt(year),
      parseInt(month)
    );

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Income_${year}-${month.toString().padStart(2, '0')}.xlsx`
    );

    res.send(buffer);
  } catch (error) {
    console.error('Export monthly income error:', error);
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

    const buffer = await reportService.generateYearlyIncomeReport(parseInt(year));

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Income_${year}.xlsx`
    );

    res.send(buffer);
  } catch (error) {
    console.error('Export yearly income error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
