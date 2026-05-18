const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const incomeController = require('../controllers/incomeController');

// All routes require admin authentication
router.use(auth, adminOnly);

// Currency rate lookup (must be before /:id)
router.get('/rate/:currency/:year/:month', incomeController.getExchangeRate);

// Excel export (must be before /:id)
router.get('/export/monthly/:year/:month', incomeController.exportMonthlyExcel);
router.get('/export/yearly/:year', incomeController.exportYearlyExcel);

// CRUD operations
router.post('/', incomeController.createIncome);
router.get('/', incomeController.getAllIncomes);
router.get('/monthly/:year/:month', incomeController.getMonthlyIncomes);
router.get('/yearly/:year', incomeController.getYearlyIncomes);
router.get('/:id', incomeController.getIncomeById);
router.put('/:id', incomeController.updateIncome);
router.delete('/:id', incomeController.deleteIncome);

module.exports = router;