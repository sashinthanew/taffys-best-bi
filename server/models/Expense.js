const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    index: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  referenceNo: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  currency: {
    type: String,
    required: true,
    enum: ['USD', 'LKR', 'EUR', 'GBP', 'AUD', 'CAD', 'JPY', 'CNY', 'INR'],
    default: 'USD'
  },
  rate: {
    type: Number,
    required: true,
    min: 0
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  usdAmount: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    enum: ['Operations', 'Salaries', 'Rent', 'Utilities', 'Marketing', 'Travel', 'Equipment', 'Other'],
    default: 'Other'
  },
  year: {
    type: Number,
    required: true,
    index: true
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12,
    index: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for faster queries
expenseSchema.index({ year: 1, month: 1 });
expenseSchema.index({ date: -1 });

module.exports = mongoose.model('Expense', expenseSchema);