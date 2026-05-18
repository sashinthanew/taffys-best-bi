import { useState, useEffect } from 'react';
import incomeService from '../../services/incomeService';
import expenseService from '../../services/expenseService';
import './FinanceSummary.css';

const TransactionList = ({ type, year, month, onUpdate }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    fetchTransactions();
  }, [type, year, month]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      let result;
      if (type === 'income') {
        if (year && month) {
          result = await incomeService.getMonthlyIncomes(year, month);
        } else {
          result = await incomeService.getAllIncomes();
        }
      } else {
        if (year && month) {
          result = await expenseService.getMonthlyExpenses(year, month);
        } else {
          result = await expenseService.getAllExpenses();
        }
      }
      
      if (result.success) {
        setTransactions(result.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;

    try {
      const result = type === 'income' 
        ? await incomeService.deleteIncome(id)
        : await expenseService.deleteExpense(id);
      
      if (result.success) {
        await fetchTransactions();
        onUpdate?.();
      }
    } catch (err) {
      alert('Failed to delete transaction');
    }
  };

  const handleEdit = (transaction) => {
    setEditingId(transaction._id);
    setEditForm({
      date: transaction.date.split('T')[0],
      description: transaction.description,
      category: transaction.category || '',
      referenceNo: transaction.referenceNo,
      currency: transaction.currency,
      rate: transaction.rate.toString(),
      amount: transaction.amount.toString()
    });
  };

  const handleUpdate = async (id) => {
    try {
      const result = type === 'income'
        ? await incomeService.updateIncome(id, editForm)
        : await expenseService.updateExpense(id, editForm);
      
      if (result.success) {
        setEditingId(null);
        await fetchTransactions();
        onUpdate?.();
      }
    } catch (err) {
      alert('Failed to update transaction');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount);
  };

  return (
    <div className="transaction-list">
      <div className="list-header">
        <h3>{type === 'income' ? '💰 Income' : '💸 Expenses'} Transactions</h3>
        <div className="filter-info">
          {year && month ? `${year}-${month.toString().padStart(2, '0')}` : 'All'}
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Loading...</div>
      ) : transactions.length === 0 ? (
        <div className="empty-state">No transactions found</div>
      ) : (
        <div className="table-container">
          <table className="transactions-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Reference</th>
                <th>Description</th>
                {type === 'expense' && <th>Category</th>}
                <th>Currency</th>
                <th>Rate</th>
                <th>Amount</th>
                <th>USD Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction._id}>
                  {editingId === transaction._id ? (
                    <>
                      <td>
                        <input
                          type="date"
                          value={editForm.date}
                          onChange={(e) => setEditForm({...editForm, date: e.target.value})}
                          className="edit-input"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={editForm.referenceNo}
                          onChange={(e) => setEditForm({...editForm, referenceNo: e.target.value})}
                          className="edit-input"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={editForm.description}
                          onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                          className="edit-input"
                        />
                      </td>
                      {type === 'expense' && (
                        <td>
                          <select
                            value={editForm.category}
                            onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                            className="edit-input"
                          >
                            <option value="Operations">Operations</option>
                            <option value="Salaries">Salaries</option>
                            <option value="Rent">Rent</option>
                            <option value="Utilities">Utilities</option>
                            <option value="Marketing">Marketing</option>
                            <option value="Equipment">Equipment</option>
                            <option value="Travel">Travel</option>
                            <option value="Professional Services">Professional Services</option>
                            <option value="Insurance">Insurance</option>
                            <option value="Taxes">Taxes</option>
                            <option value="Other">Other</option>
                          </select>
                        </td>
                      )}
                      <td>
                        <select
                          value={editForm.currency}
                          onChange={(e) => setEditForm({...editForm, currency: e.target.value})}
                          className="edit-input"
                        >
                          <option value="USD">USD</option>
                          <option value="LKR">LKR</option>
                          <option value="EUR">EUR</option>
                          <option value="GBP">GBP</option>
                          <option value="AUD">AUD</option>
                          <option value="CAD">CAD</option>
                          <option value="JPY">JPY</option>
                          <option value="CNY">CNY</option>
                          <option value="INR">INR</option>
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          value={editForm.rate}
                          onChange={(e) => setEditForm({...editForm, rate: e.target.value})}
                          step="0.0001"
                          className="edit-input"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={editForm.amount}
                          onChange={(e) => setEditForm({...editForm, amount: e.target.value})}
                          step="0.01"
                          className="edit-input"
                        />
                      </td>
                      <td>{formatCurrency(parseFloat(editForm.amount) / parseFloat(editForm.rate), 'USD')}</td>
                      <td>
                        <button onClick={() => handleUpdate(transaction._id)} className="btn-save">✓</button>
                        <button onClick={handleCancel} className="btn-cancel">✗</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{new Date(transaction.date).toLocaleDateString()}</td>
                      <td>{transaction.referenceNo}</td>
                      <td>{transaction.description}</td>
                      {type === 'expense' && <td><span className="category-badge">{transaction.category}</span></td>}
                      <td>{transaction.currency}</td>
                      <td>{transaction.rate.toFixed(4)}</td>
                      <td>{formatCurrency(transaction.amount, transaction.currency)}</td>
                      <td className="usd-amount">{formatCurrency(transaction.usdAmount, 'USD')}</td>
                      <td>
                        <button onClick={() => handleEdit(transaction)} className="btn-edit">✏️</button>
                        <button onClick={() => handleDelete(transaction._id)} className="btn-delete">🗑️</button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TransactionList;
