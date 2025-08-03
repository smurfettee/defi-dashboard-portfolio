import { formatUnits } from 'viem';

/**
 * Format a wallet address to show first 6 and last 4 characters
 */
export const formatAddress = (address: string): string => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

/**
 * Format a token balance with proper decimal places
 */
export const formatTokenBalance = (balance: bigint, decimals: number, maxDecimals = 6): string => {
  const formatted = formatUnits(balance, decimals);
  const num = parseFloat(formatted);
  
  if (num === 0) return '0';
  
  // For very small numbers, show more precision
  if (num < 0.000001) {
    return num.toExponential(2);
  }
  
  // For small numbers, show up to maxDecimals
  if (num < 1) {
    return num.toFixed(maxDecimals).replace(/\.?0+$/, '');
  }
  
  // For larger numbers, show fewer decimals
  if (num < 1000) {
    return num.toFixed(Math.min(4, maxDecimals)).replace(/\.?0+$/, '');
  }
  
  return num.toFixed(2).replace(/\.?0+$/, '');
};

/**
 * Format USD value with proper formatting
 */
export const formatUSD = (value: number): string => {
  if (value === 0) return '$0.00';
  
  if (value < 0.01) {
    return `$${value.toFixed(6)}`;
  }
  
  if (value < 1) {
    return `$${value.toFixed(4)}`;
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

/**
 * Format percentage with proper decimal places
 */
export const formatPercentage = (value: number): string => {
  if (value === 0) return '0%';
  
  if (value < 0.01) {
    return `${value.toFixed(4)}%`;
  }
  
  return `${value.toFixed(2)}%`;
};

/**
 * Calculate percentage of total
 */
export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return (value / total) * 100;
};