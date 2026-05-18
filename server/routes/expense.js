const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const expenseController = require('../controllers/expenseController');

// All routes require admin authentication
router.use(auth, adminOnly);

// Currency rate lookup (must be before /:id)
router.get('/rate/:currency/:year/:month', expenseController.getExchangeRate);

// Excel export (must be before /:id)
router.get('/export/monthly/:year/:month', expenseController.exportMonthlyExcel);
router.get('/export/yearly/:year', expenseController.exportYearlyExcel);

// CRUD operations
router.post('/', expenseController.createExpense);
router.get('/', expenseController.getAllExpenses);
router.get('/monthly/:year/:month', expenseController.getMonthlyExpenses);
router.get('/yearly/:year', expenseController.getYearlyExpenses);
router.get('/:id', expenseController.getExpenseById);
router.put('/:id', expenseController.updateExpense);
router.delete('/:id', expenseController.deleteExpense);

module.exports = router;

