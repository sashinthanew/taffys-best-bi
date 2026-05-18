import API_URL from '../config/api';

class ExpenseService {
  constructor() {
    this.baseUrl = `${API_URL}/api/expense`;
  }

  // Get auth headers
  getHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  // Create expense
  async createExpense(data) {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to create expense: ${error.message}`);
    }
  }

  // Get all expenses
  async getAllExpenses() {
    try {
      const response = await fetch(this.baseUrl, {
        headers: this.getHeaders()
      });
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to fetch expenses: ${error.message}`);
    }
  }

  // Get monthly expenses
  async getMonthlyExpenses(year, month) {
    try {
      const response = await fetch(`${this.baseUrl}/monthly/${year}/${month}`, {
        headers: this.getHeaders()
      });
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to fetch monthly expenses: ${error.message}`);
    }
  }

  // Get yearly expenses
  async getYearlyExpenses(year) {
    try {
      const response = await fetch(`${this.baseUrl}/yearly/${year}`, {
        headers: this.getHeaders()
      });
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to fetch yearly expenses: ${error.message}`);
    }
  }

  // Get expense by ID
  async getExpenseById(id) {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        headers: this.getHeaders()
      });
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to fetch expense: ${error.message}`);
    }
  }

  // Update expense
  async updateExpense(id, data) {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to update expense: ${error.message}`);
    }
  }

  // Delete expense
  async deleteExpense(id) {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to delete expense: ${error.message}`);
    }
  }

  // Get exchange rate
  async getExchangeRate(currency, year, month) {
    try {
      const response = await fetch(
        `${this.baseUrl}/rate/${currency}/${year}/${month}`,
        { headers: this.getHeaders() }
      );
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to fetch exchange rate: ${error.message}`);
    }
  }

  // Export monthly Excel
  async exportMonthlyExcel(year, month) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${this.baseUrl}/export/monthly/${year}/${month}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Expense_${year}-${month.toString().padStart(2, '0')}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      return { success: true };
    } catch (error) {
      throw new Error(`Failed to export: ${error.message}`);
    }
  }

  // Export yearly Excel
  async exportYearlyExcel(year) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${this.baseUrl}/export/yearly/${year}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Expense_${year}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      return { success: true };
    } catch (error) {
      throw new Error(`Failed to export: ${error.message}`);
    }
  }
}

export default new ExpenseService();
