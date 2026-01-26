/**
 * Convert number to words in Indian numbering system
 * Supports Lakhs and Crores
 */

const ones = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen'
];

const tens = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
];

const convertToWords = (n: number): string => {
  if (n === 0) return '';
  if (n < 20) return ones[n];
  if (n < 100) {
    return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
  }
  if (n < 1000) {
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convertToWords(n % 100) : '');
  }
  if (n < 100000) {
    return convertToWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convertToWords(n % 1000) : '');
  }
  if (n < 10000000) {
    return convertToWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convertToWords(n % 100000) : '');
  }
  return convertToWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convertToWords(n % 10000000) : '');
};

/**
 * Convert a number to Indian Rupees in words
 * @param num - The number to convert (can include decimals for paise)
 * @returns String representation in Indian currency format
 * @example numberToWordsIndian(51600) => "Fifty One Thousand Six Hundred Rupees Only"
 * @example numberToWordsIndian(1234.50) => "One Thousand Two Hundred Thirty Four Rupees and Fifty Paise Only"
 */
export const numberToWordsIndian = (num: number): string => {
  if (num === 0) return 'Zero Rupees Only';

  const rupees = Math.floor(Math.abs(num));
  const paise = Math.round((Math.abs(num) - rupees) * 100);

  let result = '';

  if (rupees > 0) {
    result = convertToWords(rupees) + ' Rupees';
  }

  if (paise > 0) {
    if (result) {
      result += ' and ';
    }
    result += convertToWords(paise) + ' Paise';
  }

  result += ' Only';

  // Handle negative numbers
  if (num < 0) {
    result = 'Minus ' + result;
  }

  return result;
};

export default numberToWordsIndian;
