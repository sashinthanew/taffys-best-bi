const axios = require('axios');

class CurrencyService {
  constructor() {
    // Using exchangerate-api.com (free tier: 1,500 requests/month)
    this.apiKey = process.env.EXCHANGE_RATE_API_KEY || 'demo_key';
    this.baseUrl = ' https://v6.exchangerate-api.com/v6/c7b73ee07dcfd1f9f9b6bb73/latest/USD';
    this.cache = new Map(); // Cache rates to avoid API limits
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
  }

  // Get exchange rate for a specific month/year
  async getMonthlyRate(currency, year, month) {
    if (currency === 'USD') {
      return 1.0;
    }

    const cacheKey = `${currency}_${year}_${month}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < this.cacheExpiry)) {
      console.log(`Using cached rate for ${cacheKey}`);
      return cached.rate;
    }

    try {
      // Note: Free tier might not support historical dates
      // For production, use a paid API or maintain your own rate database
      const response = await axios.get(
        `${this.baseUrl}/${this.apiKey}/latest/USD`,
        { timeout: 5000 }
      );

      if (response.data.result === 'success') {
        const rate = response.data.conversion_rates[currency];
        
        if (!rate) {
          console.warn(`Rate not found for ${currency}, using fallback`);
          return this.getFallbackRate(currency);
        }

        // Cache the result
        this.cache.set(cacheKey, {
          rate: rate,
          timestamp: Date.now()
        });
        
        return rate;
      }

      throw new Error('API returned unsuccessful result');
    } catch (error) {
      console.error('Currency API Error:', error.message);
      
      // Return fallback rate
      return this.getFallbackRate(currency);
    }
  }

  // Get current exchange rate
  async getCurrentRate(currency) {
    if (currency === 'USD') {
      return 1.0;
    }

    try {
      const response = await axios.get(
        `${this.baseUrl}/${this.apiKey}/latest/USD`,
        { timeout: 5000 }
      );

      if (response.data.result === 'success') {
        const rate = response.data.conversion_rates[currency];
        return rate || this.getFallbackRate(currency);
      }

      throw new Error('Failed to fetch current rate');
    } catch (error) {
      console.error('Currency API Error:', error.message);
      return this.getFallbackRate(currency);
    }
  }

  // Fallback rates (updated manually - approximate values)
  getFallbackRate(currency) {
    const fallbackRates = {
      USD: 1.0,
      LKR: 325.50,
      EUR: 0.92,
      GBP: 0.79,
      AUD: 1.52,
      CAD: 1.36,
      JPY: 148.50,
      CNY: 7.24,
      INR: 83.12
    };
    
    console.log(`Using fallback rate for ${currency}: ${fallbackRates[currency]}`);
    return fallbackRates[currency] || 1.0;
  }

  // Convert amount to USD
  convertToUSD(amount, rate) {
    return amount / rate;
  }

  // Get all supported currencies
  getSupportedCurrencies() {
    return [
      { code: 'USD', name: 'US Dollar', symbol: '$' },
      { code: 'LKR', name: 'Sri Lankan Rupee', symbol: 'Rs' },
      { code: 'EUR', name: 'Euro', symbol: '€' },
      { code: 'GBP', name: 'British Pound', symbol: '£' },
      { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
      { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
      { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
      { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
      { code: 'INR', name: 'Indian Rupee', symbol: '₹' }
    ];
  }

  // Clear cache (call this periodically)
  clearCache() {
    console.log('Clearing currency cache');
    this.cache.clear();
  }

  // Get cache size
  getCacheSize() {
    return this.cache.size;
  }
}

module.exports = new CurrencyService();