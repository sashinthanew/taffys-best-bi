const axios = require('axios');

class CurrencyService {
  constructor() {
    // Using exchangerate-api.com (free tier: 1,500 requests/month)
    this.apiKey = process.env.EXCHANGE_RATE_API_KEY;
    this.baseUrl = 'https://v6.exchangerate-api.com/v6';
    this.cache = new Map(); // Cache rates to avoid API limits
  }

  // Get exchange rate for a specific month/year
  async getMonthlyRate(currency, year, month) {
    const cacheKey = `${currency}_${year}_${month}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // If no API key, use fallback immediately
    if (!this.apiKey || this.apiKey === 'undefined') {
      console.log('No API key configured, using fallback rates');
      return this.getFallbackRate(currency);
    }

    try {
      // Get the first day of the month
      const date = new Date(year, month - 1, 1);
      const dateStr = date.toISOString().split('T')[0];

      // Fetch historical rate with timeout
      const response = await axios.get(
        `${this.baseUrl}/${this.apiKey}/history/USD/${year}/${month}/1`,
        { timeout: 3000 } // 3 second timeout
      );

      if (response.data.result === 'success') {
        const rate = response.data.conversion_rates[currency];
        
        // Cache the result
        this.cache.set(cacheKey, rate);
        
        return rate;
      }

      throw new Error('Failed to fetch exchange rate');
    } catch (error) {
      console.error('Currency API Error:', error.message);
      
      // Use fallback rates directly instead of trying another API call
      const fallbackRate = this.getFallbackRate(currency);
      this.cache.set(cacheKey, fallbackRate);
      return fallbackRate;
    }
  }

  // Get current exchange rate
  async getCurrentRate(currency) {
    // If no API key, use fallback immediately
    if (!this.apiKey || this.apiKey === 'undefined') {
      console.log('No API key configured, using fallback rates');
      return this.getFallbackRate(currency);
    }

    try {
      const response = await axios.get(
        `${this.baseUrl}/${this.apiKey}/latest/USD`,
        { timeout: 3000 } // 3 second timeout
      );

      if (response.data.result === 'success') {
        return response.data.conversion_rates[currency];
      }

      throw new Error('Failed to fetch current rate');
    } catch (error) {
      console.error('Currency API Error:', error.message);
      // Return fallback rates
      return this.getFallbackRate(currency);
    }
  }

  // Fallback rates (updated manually)
  getFallbackRate(currency) {
    const fallbackRates = {
      USD: 1,
      LKR: 325.50,
      EUR: 0.92,
      GBP: 0.79,
      AUD: 1.52,
      CAD: 1.36,
      JPY: 148.50,
      CNY: 7.24,
      INR: 83.12
    };
    return fallbackRates[currency] || 1;
  }

  // Convert amount to USD
  convertToUSD(amount, rate) {
    return amount / rate;
  }

  // Clear cache (call this periodically)
  clearCache() {
    this.cache.clear();
  }
}

module.exports = new CurrencyService();