const axios = require('axios');
const logger = require('../utils/logger');

class CurrencyService {
  constructor() {
    this.exchangeRateApiUrl = 'https://api.exchangerate-api.com/v4/latest';
    this.cache = new Map();
    this.cacheExpiry = 1000 * 60 * 60; // 1 hour in milliseconds
  }

  // Fetch exchange rates for a base currency
  async getExchangeRates(baseCurrency = 'USD') {
    const cacheKey = `rates_${baseCurrency}`;
    const cached = this.cache.get(cacheKey);
    
    // Check if we have valid cached data
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }
    
    try {
      const response = await axios.get(`${this.exchangeRateApiUrl}/${baseCurrency}`);
      const rates = response.data.rates;
      
      // Cache the data
      this.cache.set(cacheKey, {
        data: rates,
        timestamp: Date.now()
      });
      
      return rates;
    } catch (error) {
      logger.error('Error fetching exchange rates:', error);
      throw new Error('Failed to fetch exchange rates');
    }
  }

  // Convert amount from one currency to another
  async convertCurrency(amount, fromCurrency, toCurrency) {
    // If currencies are the same, no conversion needed
    if (fromCurrency === toCurrency) {
      return amount;
    }
    
    try {
      // Get exchange rates with USD as base
      const rates = await this.getExchangeRates('USD');
      
      // Convert to USD first if needed
      let amountInUSD = amount;
      if (fromCurrency !== 'USD') {
        const fromRate = rates[fromCurrency];
        if (!fromRate) {
          throw new Error(`Exchange rate not found for currency: ${fromCurrency}`);
        }
        amountInUSD = amount / fromRate;
      }
      
      // Convert from USD to target currency
      if (toCurrency === 'USD') {
        return amountInUSD;
      }
      
      const toRate = rates[toCurrency];
      if (!toRate) {
        throw new Error(`Exchange rate not found for currency: ${toCurrency}`);
      }
      
      return amountInUSD * toRate;
    } catch (error) {
      logger.error('Error converting currency:', error);
      throw new Error(`Failed to convert currency from ${fromCurrency} to ${toCurrency}`);
    }
  }

  // Get supported currencies
  getSupportedCurrencies() {
    // These are common currencies that should be supported
    return [
      'USD', 'EUR', 'GBP', 'KES', 'UGX', 'TZS', 'RWF', 'BWP', 'ZAR', 'ZMW',
      'GHS', 'NGN', 'KES', 'UGX', 'TZS', 'RWF', 'BWP', 'ZAR', 'ZMW', 'GHS', 'NGN'
    ];
  }

  // Format currency amount
  formatCurrency(amount, currency) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }
}

module.exports = new CurrencyService();