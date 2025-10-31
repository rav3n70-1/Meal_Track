// Currency utilities for Bangladesh Taka
export const CURRENCY_SYMBOL = '৳';

/**
 * Format amount with Bangladesh Taka symbol
 * @param {number} amount - Amount to format
 * @param {boolean} spaceBefore - Add space before symbol
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, spaceBefore = false) => {
  const formatted = parseFloat(amount || 0).toFixed(2);
  return spaceBefore ? `${CURRENCY_SYMBOL} ${formatted}` : `${CURRENCY_SYMBOL}${formatted}`;
};

/**
 * Format amount in Bangla numerals
 * @param {number} amount - Amount to format
 * @returns {string} Amount in Bangla numerals
 */
export const formatBanglaNumber = (amount) => {
  const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  const formatted = parseFloat(amount || 0).toFixed(2);
  return formatted.split('').map(char => {
    if (char >= '0' && char <= '9') {
      return banglaDigits[parseInt(char)];
    }
    return char;
  }).join('');
};

/**
 * Format currency in Bangla
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency in Bangla
 */
export const formatBanglaCurrency = (amount) => {
  return `${CURRENCY_SYMBOL}${formatBanglaNumber(amount)}`;
};

