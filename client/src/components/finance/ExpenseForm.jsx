import { useState, useEffect } from 'react';
import './ExpenseForm.css';
import API_URL from '../../config/api';

const ExpenseForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    date: '',
    description: '',
    category: 'Operations',
    referenceNo: '',
    currency: 'USD',
    rate: '1.00',
    amount: '',
    usdAmount: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-fetch exchange rate when date or currency changes
  useEffect(() => {
    if (formData.date && formData.currency !== 'USD') {
      fetchExchangeRate();
    } else if (formData.currency === 'USD') {
      setFormData(prev => ({ ...prev, rate: '1.00' }));
    }
  }, [formData.date, formData.currency]);

  // Auto-calculate USD amount
  useEffect(() => {
    if (formData.amount && formData.rate) {
      const usd = parseFloat(formData.amount) / parseFloat(formData.rate);
      setFormData(prev => ({
        ...prev,
        usdAmount: usd.toFixed(2)
      }));
    }
  }, [formData.amount, formData.rate]);

  const fetchExchangeRate = async () => {
    const date = new Date(formData.date);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_URL}/api/expense/rate/${formData.currency}/${year}/${month}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      const data = await response.json();
      if (data.success) {
        setFormData(prev => ({ ...prev, rate: data.rate.toFixed(4) }));
      }
    } catch (err) {
      console.error('Failed to fetch rate:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/expense`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        // Reset form
        setFormData({
          date: '',
          description: '',
          category: 'Operations',
          referenceNo: '',
          currency: 'USD',
          rate: '1.00',
          amount: '',
          usdAmount: ''
        });
        onSuccess?.();
      } else {
        setError(data.error || 'Failed to create expense');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="finance-form" onSubmit={handleSubmit}>
      <h3>💸 Add Expense</h3>
      
      {error && <div className="alert alert-error">{error}</div>}

      <div className="form-grid">
        <div className="form-group">
          <label>Date *</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({...formData, date: e.target.value})}
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label>Description *</label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            placeholder="Office rent payment"
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label>Category *</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({...formData, category: e.target.value})}
            disabled={loading}
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
        </div>

        <div className="form-group">
          <label>Reference No *</label>
          <input
            type="text"
            value={formData.referenceNo}
            onChange={(e) => setFormData({...formData, referenceNo: e.target.value})}
            placeholder="EXP-2025-001"
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label>Currency *</label>
          <select
            value={formData.currency}
            onChange={(e) => setFormData({...formData, currency: e.target.value})}
            disabled={loading}
          >
            <option value="USD">USD - US Dollar</option>
            <option value="LKR">LKR - Sri Lankan Rupee</option>
            <option value="EUR">EUR - Euro</option>
            <option value="GBP">GBP - British Pound</option>
            <option value="AUD">AUD - Australian Dollar</option>
            <option value="CAD">CAD - Canadian Dollar</option>
            <option value="JPY">JPY - Japanese Yen</option>
            <option value="CNY">CNY - Chinese Yuan</option>
            <option value="INR">INR - Indian Rupee</option>
          </select>
        </div>

        <div className="form-group">
          <label>Exchange Rate (to USD)</label>
          <input
            type="number"
            value={formData.rate}
            onChange={(e) => setFormData({...formData, rate: e.target.value})}
            step="0.0001"
            min="0"
            readOnly={formData.currency === 'USD'}
            disabled={loading}
          />
          <small className="field-hint">Auto-fetched for {new Date(formData.date).toLocaleDateString()}</small>
        </div>

        <div className="form-group">
          <label>Amount ({formData.currency}) *</label>
          <input
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({...formData, amount: e.target.value})}
            placeholder="0.00"
            step="0.01"
            min="0"
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label>USD Amount (Auto-calculated)</label>
          <input
            type="number"
            value={formData.usdAmount}
            readOnly
            placeholder="0.00"
            className="readonly-field"
            disabled
          />
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" disabled={loading} className="submit-button">
          {loading ? 'Adding...' : '➕ Add Expense'}
        </button>
      </div>
    </form>
  );
};

export default ExpenseForm;
