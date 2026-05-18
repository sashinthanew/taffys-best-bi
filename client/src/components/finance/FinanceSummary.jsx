import { useState, useEffect } from 'react';
import incomeService from '../../services/incomeService';
import expenseService from '../../services/expenseService';
import './FinanceSummary.css';

const FinanceSummary = ({ refreshTrigger }) => {
  const [viewType, setViewType] = useState('monthly'); // monthly or yearly
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [summary, setSummary] = useState({
    income: { total: 0, count: 0 },
    expense: { total: 0, count: 0 },
    net: 0
  });
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchSummary();
  }, [viewType, year, month, refreshTrigger]);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      let incomeResult, expenseResult;

      if (viewType === 'monthly') {
        incomeResult = await incomeService.getMonthlyIncomes(year, month);
        expenseResult = await expenseService.getMonthlyExpenses(year, month);
      } else {
        incomeResult = await incomeService.getYearlyIncomes(year);
        expenseResult = await expenseService.getYearlyExpenses(year);
      }

      const incomeTotal = incomeResult.success ? parseFloat(incomeResult.total) || 0 : 0;
      const expenseTotal = expenseResult.success ? parseFloat(expenseResult.total) || 0 : 0;
      const incomeCount = incomeResult.success ? (incomeResult.data?.length || 0) : 0;
      const expenseCount = expenseResult.success ? (expenseResult.data?.length || 0) : 0;

      setSummary({
        income: { total: incomeTotal, count: incomeCount },
        expense: { total: expenseTotal, count: expenseCount },
        net: incomeTotal - expenseTotal
      });
    } catch (err) {
      console.error('Failed to fetch summary:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type) => {
    setExporting(true);
    try {
      if (viewType === 'monthly') {
        if (type === 'income') {
          await incomeService.exportMonthlyExcel(year, month);
        } else if (type === 'expense') {
          await expenseService.exportMonthlyExcel(year, month);
        }
      } else {
        if (type === 'income') {
          await incomeService.exportYearlyExcel(year);
        } else if (type === 'expense') {
          await expenseService.exportYearlyExcel(year);
        }
      }
    } catch (err) {
      alert('Failed to export: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const years = [];
  const currentYear = new Date().getFullYear();
  for (let i = currentYear; i >= currentYear - 5; i--) {
    years.push(i);
  }

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  return (
    <div className="finance-summary">
      <div className="summary-header">
        <h2>📊 Financial Summary</h2>
        
        <div className="controls">
          <button 
            className="refresh-btn" 
            onClick={fetchSummary}
            disabled={loading}
            title="Refresh summary"
          >
            🔄 Refresh
          </button>
          
          <div className="view-toggle">
            <button
              className={viewType === 'monthly' ? 'active' : ''}
              onClick={() => setViewType('monthly')}
            >
              Monthly
            </button>
            <button
              className={viewType === 'yearly' ? 'active' : ''}
              onClick={() => setViewType('yearly')}
            >
              Yearly
            </button>
          </div>

          <div className="date-filters">
            <select value={year} onChange={(e) => setYear(parseInt(e.target.value))}>
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            {viewType === 'monthly' && (
              <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))}>
                {months.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Loading summary...</div>
      ) : (
        <>
          <div className="summary-cards">
            <div className="summary-card income-card">
              <div className="card-icon">💰</div>
              <div className="card-content">
                <h3>Total Income</h3>
                <p className="amount">{formatCurrency(summary.income.total)}</p>
                <p className="count">{summary.income.count} transactions</p>
              </div>
              <button
                className="export-btn"
                onClick={() => handleExport('income')}
                disabled={exporting}
              >
                📥 Export
              </button>
            </div>

            <div className="summary-card expense-card">
              <div className="card-icon">💸</div>
              <div className="card-content">
                <h3>Total Expenses</h3>
                <p className="amount">{formatCurrency(summary.expense.total)}</p>
                <p className="count">{summary.expense.count} transactions</p>
              </div>
              <button
                className="export-btn"
                onClick={() => handleExport('expense')}
                disabled={exporting}
              >
                📥 Export
              </button>
            </div>

            <div className={`summary-card net-card ${summary.net >= 0 ? 'positive' : 'negative'}`}>
              <div className="card-icon">{summary.net >= 0 ? '📈' : '📉'}</div>
              <div className="card-content">
                <h3>Net Income</h3>
                <p className="amount">{formatCurrency(summary.net)}</p>
                <p className="count">
                  {summary.net >= 0 ? 'Profit' : 'Loss'}
                </p>
              </div>
            </div>
          </div>

          <div className="summary-breakdown">
            <div className="breakdown-chart">
              <h4>Income vs Expenses</h4>
              <div className="chart-bars">
                <div className="bar-group">
                  <div className="bar-label">Income</div>
                  <div className="bar-container">
                    <div
                      className="bar income-bar"
                      style={{
                        width: `${summary.income.total > 0 ? (summary.income.total / Math.max(summary.income.total, summary.expense.total)) * 100 : 0}%`
                      }}
                    >
                      {formatCurrency(summary.income.total)}
                    </div>
                  </div>
                </div>
                <div className="bar-group">
                  <div className="bar-label">Expenses</div>
                  <div className="bar-container">
                    <div
                      className="bar expense-bar"
                      style={{
                        width: `${summary.expense.total > 0 ? (summary.expense.total / Math.max(summary.income.total, summary.expense.total)) * 100 : 0}%`
                      }}
                    >
                      {formatCurrency(summary.expense.total)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="breakdown-stats">
              <h4>Quick Stats</h4>
              <div className="stat-row">
                <span>Period:</span>
                <strong>
                  {viewType === 'monthly'
                    ? `${months.find(m => m.value === month)?.label} ${year}`
                    : year}
                </strong>
              </div>
              <div className="stat-row">
                <span>Total Transactions:</span>
                <strong>{summary.income.count + summary.expense.count}</strong>
              </div>
              <div className="stat-row">
                <span>Profit Margin:</span>
                <strong>
                  {summary.income.total > 0
                    ? `${((summary.net / summary.income.total) * 100).toFixed(1)}%`
                    : 'N/A'}
                </strong>
              </div>
              <div className="stat-row">
                <span>Expense Ratio:</span>
                <strong>
                  {summary.income.total > 0
                    ? `${((summary.expense.total / summary.income.total) * 100).toFixed(1)}%`
                    : 'N/A'}
                </strong>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FinanceSummary;
