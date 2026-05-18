import API_URL from '../config/api';

class IncomeService {
  constructor() {
    this.baseUrl = `${API_URL}/api/income`;
  }

  // Get auth headers
  getHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  // Create income
  async createIncome(data) {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to create income: ${error.message}`);
    }
  }

  // Get all incomes
  async getAllIncomes() {
    try {
      const response = await fetch(this.baseUrl, {
        headers: this.getHeaders()
      });
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to fetch incomes: ${error.message}`);
    }
  }

  // Get monthly incomes
  async getMonthlyIncomes(year, month) {
    try {
      const response = await fetch(`${this.baseUrl}/monthly/${year}/${month}`, {
        headers: this.getHeaders()
      });
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to fetch monthly incomes: ${error.message}`);
    }
  }

  // Get yearly incomes
  async getYearlyIncomes(year) {
    try {
      const response = await fetch(`${this.baseUrl}/yearly/${year}`, {
        headers: this.getHeaders()
      });
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to fetch yearly incomes: ${error.message}`);
    }
  }

  // Get income by ID
  async getIncomeById(id) {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        headers: this.getHeaders()
      });
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to fetch income: ${error.message}`);
    }
  }

  // Update income
  async updateIncome(id, data) {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to update income: ${error.message}`);
    }
  }

  // Delete income
  async deleteIncome(id) {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to delete income: ${error.message}`);
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
      a.download = `Income_${year}-${month.toString().padStart(2, '0')}.xlsx`;
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
      a.download = `Income_${year}.xlsx`;
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

export default new IncomeService();
