import { formatUnits } from 'viem';
import { Transaction, TokenTransfer, TaxTransaction, TaxTransactionType, TaxReport, TaxSettings, Token } from '../types';
import { getTokenPrices } from './tokenService';

// Tax calculation utilities
export class TaxCalculator {
  private transactions: TaxTransaction[] = [];
  private settings: TaxSettings;
  private tokenBalances: Map<string, { amount: bigint; costBasis: number }> = new Map();

  constructor(settings: TaxSettings) {
    this.settings = settings;
  }

  /**
   * Add a transaction to the tax calculation
   */
  addTransaction(transaction: TaxTransaction): void {
    this.transactions.push(transaction);
    this.updateTokenBalances(transaction);
  }

  /**
   * Update token balances and cost basis using FIFO/LIFO method
   */
  private updateTokenBalances(transaction: TaxTransaction): void {
    const tokenKey = transaction.tokenAddress.toLowerCase();
    const currentBalance = this.tokenBalances.get(tokenKey) || { amount: BigInt(0), costBasis: 0 };

    if (transaction.type === 'buy' || transaction.type === 'transfer_in' || transaction.type === 'airdrop') {
      // Add to balance
      const newAmount = currentBalance.amount + transaction.amount;
      const newCostBasis = currentBalance.costBasis + transaction.costBasis;
      this.tokenBalances.set(tokenKey, { amount: newAmount, costBasis: newCostBasis });
    } else if (transaction.type === 'sell' || transaction.type === 'transfer_out') {
      // Remove from balance using FIFO/LIFO
      const remainingAmount = currentBalance.amount - transaction.amount;
      if (remainingAmount < BigInt(0)) {
        throw new Error(`Insufficient balance for transaction: ${transaction.hash}`);
      }
      
      // Calculate cost basis for sold amount
      const costBasisRatio = Number(transaction.amount) / Number(currentBalance.amount);
      const soldCostBasis = currentBalance.costBasis * costBasisRatio;
      const remainingCostBasis = currentBalance.costBasis - soldCostBasis;
      
      this.tokenBalances.set(tokenKey, { 
        amount: remainingAmount, 
        costBasis: remainingCostBasis 
      });
    }
  }

  /**
   * Calculate FIFO cost basis for a transaction
   */
  private calculateFIFOCostBasis(transaction: TaxTransaction): number {
    if (transaction.type !== 'sell' && transaction.type !== 'transfer_out') {
      return transaction.costBasis;
    }

    // For FIFO, we use the oldest purchases first
    const relevantTransactions = this.transactions
      .filter(t => 
        t.tokenAddress.toLowerCase() === transaction.tokenAddress.toLowerCase() &&
        (t.type === 'buy' || t.type === 'transfer_in' || t.type === 'airdrop') &&
        t.timestamp < transaction.timestamp
      )
      .sort((a, b) => a.timestamp - b.timestamp);

    let remainingAmount = Number(transaction.amount);
    let costBasis = 0;

    for (const tx of relevantTransactions) {
      const txAmount = Number(tx.amount);
      if (remainingAmount <= 0) break;

      const amountToUse = Math.min(remainingAmount, txAmount);
      const costBasisRatio = amountToUse / txAmount;
      costBasis += tx.costBasis * costBasisRatio;
      remainingAmount -= amountToUse;
    }

    return costBasis;
  }

  /**
   * Calculate LIFO cost basis for a transaction
   */
  private calculateLIFOCostBasis(transaction: TaxTransaction): number {
    if (transaction.type !== 'sell' && transaction.type !== 'transfer_out') {
      return transaction.costBasis;
    }

    // For LIFO, we use the newest purchases first
    const relevantTransactions = this.transactions
      .filter(t => 
        t.tokenAddress.toLowerCase() === transaction.tokenAddress.toLowerCase() &&
        (t.type === 'buy' || t.type === 'transfer_in' || t.type === 'airdrop') &&
        t.timestamp < transaction.timestamp
      )
      .sort((a, b) => b.timestamp - a.timestamp);

    let remainingAmount = Number(transaction.amount);
    let costBasis = 0;

    for (const tx of relevantTransactions) {
      const txAmount = Number(tx.amount);
      if (remainingAmount <= 0) break;

      const amountToUse = Math.min(remainingAmount, txAmount);
      const costBasisRatio = amountToUse / txAmount;
      costBasis += tx.costBasis * costBasisRatio;
      remainingAmount -= amountToUse;
    }

    return costBasis;
  }

  /**
   * Generate tax report for a specific year
   */
  generateTaxReport(year: number): TaxReport {
    const yearTransactions = this.transactions.filter(t => {
      const transactionYear = new Date(t.timestamp * 1000).getFullYear();
      return transactionYear === year;
    });

    const sellTransactions = yearTransactions.filter(t => 
      t.type === 'sell' || t.type === 'transfer_out'
    );

    const buyTransactions = yearTransactions.filter(t => 
      t.type === 'buy' || t.type === 'transfer_in' || t.type === 'airdrop'
    );

    const totalProceeds = sellTransactions.reduce((sum, t) => sum + t.proceeds, 0);
    const totalCostBasis = sellTransactions.reduce((sum, t) => sum + t.costBasis, 0);
    const totalGainLoss = totalProceeds - totalCostBasis;

    const shortTermTransactions = sellTransactions.filter(t => !t.isLongTerm);
    const longTermTransactions = sellTransactions.filter(t => t.isLongTerm);

    const shortTermGainLoss = shortTermTransactions.reduce((sum, t) => sum + t.gainLoss, 0);
    const longTermGainLoss = longTermTransactions.reduce((sum, t) => sum + t.gainLoss, 0);

    // Calculate summary statistics
    const totalTransactions = yearTransactions.length;
    const averageHoldingPeriod = yearTransactions.length > 0 
      ? yearTransactions.reduce((sum, t) => sum + t.holdingPeriod, 0) / yearTransactions.length
      : 0;

    // Find best and worst performing tokens
    const tokenPerformance = this.calculateTokenPerformance(yearTransactions);
    const bestPerformingToken = tokenPerformance.length > 0 
      ? tokenPerformance[0].tokenSymbol 
      : '';
    const worstPerformingToken = tokenPerformance.length > 0 
      ? tokenPerformance[tokenPerformance.length - 1].tokenSymbol 
      : '';

    return {
      year,
      totalProceeds,
      totalCostBasis,
      totalGainLoss,
      shortTermGainLoss,
      longTermGainLoss,
      transactions: yearTransactions,
      summary: {
        totalTransactions,
        buyTransactions: buyTransactions.length,
        sellTransactions: sellTransactions.length,
        averageHoldingPeriod,
        bestPerformingToken,
        worstPerformingToken,
      },
    };
  }

  /**
   * Calculate performance by token
   */
  private calculateTokenPerformance(transactions: TaxTransaction[]): Array<{
    tokenSymbol: string;
    totalGainLoss: number;
    totalProceeds: number;
  }> {
    const tokenMap = new Map<string, { gainLoss: number; proceeds: number }>();

    for (const tx of transactions) {
      if (tx.type === 'sell' || tx.type === 'transfer_out') {
        const key = tx.tokenSymbol;
        const current = tokenMap.get(key) || { gainLoss: 0, proceeds: 0 };
        current.gainLoss += tx.gainLoss;
        current.proceeds += tx.proceeds;
        tokenMap.set(key, current);
      }
    }

    return Array.from(tokenMap.entries())
      .map(([tokenSymbol, data]) => ({
        tokenSymbol,
        totalGainLoss: data.gainLoss,
        totalProceeds: data.proceeds,
      }))
      .sort((a, b) => b.totalGainLoss - a.totalGainLoss);
  }
}

/**
 * Convert regular transactions to tax transactions
 */
export const convertToTaxTransactions = async (
  transactions: Transaction[],
  settings: TaxSettings
): Promise<TaxTransaction[]> => {
  const taxTransactions: TaxTransaction[] = [];

  for (const tx of transactions) {
    // Skip contract interactions that aren't token transfers
    if (tx.type === 'contract_interaction') {
      continue;
    }

    // Determine transaction type
    let taxType: TaxTransactionType;
    if (tx.type === 'eth_transfer') {
      taxType = tx.direction === 'in' ? 'transfer_in' : 'transfer_out';
    } else if (tx.type === 'token_transfer') {
      taxType = tx.direction === 'in' ? 'transfer_in' : 'transfer_out';
    } else {
      // For other types, we'd need more sophisticated logic
      taxType = 'transfer_out';
    }

    // Get token price at transaction time
    const tokenSymbol = tx.type === 'eth_transfer' ? 'ethereum' : (tx as TokenTransfer).tokenSymbol;
    const priceAtTime = await getHistoricalTokenPrice(tokenSymbol, tx.timestamp);

    // Calculate USD values
    const tokenValue = tx.type === 'eth_transfer' 
      ? Number(formatUnits(tx.value, 18))
      : Number(formatUnits((tx as TokenTransfer).tokenAmount, (tx as TokenTransfer).tokenDecimals));
    
    const usdValue = tokenValue * priceAtTime;
    const gasCost = tx.gasUsed ? Number(formatUnits(tx.gasUsed * tx.gasPrice, 18)) * priceAtTime : 0;

    // Calculate cost basis and proceeds
    let costBasis = 0;
    let proceeds = 0;
    
    if (taxType === 'transfer_in') {
      costBasis = usdValue + (settings.includeGasFees ? gasCost : 0);
    } else if (taxType === 'transfer_out') {
      proceeds = usdValue - (settings.includeGasFees ? gasCost : 0);
    } else if (taxType === 'airdrop') {
      costBasis = usdValue + (settings.includeGasFees ? gasCost : 0);
    } else {
      // Default case
      proceeds = usdValue - (settings.includeGasFees ? gasCost : 0);
    }

    const gainLoss = proceeds - costBasis;
    const gainLossPercentage = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;

    // Calculate holding period
    const holdingPeriod = calculateHoldingPeriod(tx.timestamp);
    const isLongTerm = holdingPeriod >= settings.longTermThreshold;

    // Calculate FIFO/LIFO cost basis
    const fifoCostBasis = settings.method === 'FIFO' ? costBasis : 0;
    const lifoCostBasis = settings.method === 'LIFO' ? costBasis : 0;

    const taxTransaction: TaxTransaction = {
      id: `${tx.hash}_${(tx as TokenTransfer).logIndex || 0}`,
      hash: tx.hash,
      timestamp: tx.timestamp,
      date: new Date(tx.timestamp * 1000).toISOString().split('T')[0],
      type: taxType,
      tokenAddress: tx.type === 'eth_transfer' ? '0x0000000000000000000000000000000000000000' : (tx as TokenTransfer).tokenAddress,
      tokenSymbol: tx.type === 'eth_transfer' ? 'ETH' : (tx as TokenTransfer).tokenSymbol,
      tokenName: tx.type === 'eth_transfer' ? 'Ethereum' : (tx as TokenTransfer).tokenName,
      amount: tx.type === 'eth_transfer' ? tx.value : (tx as TokenTransfer).tokenAmount,
      amountFormatted: tx.type === 'eth_transfer' 
        ? formatUnits(tx.value, 18)
        : formatUnits((tx as TokenTransfer).tokenAmount, (tx as TokenTransfer).tokenDecimals),
      priceAtTime,
      usdValue,
      gasUsed: tx.gasUsed || BigInt(0),
      gasPrice: tx.gasPrice,
      gasCost,
      costBasis,
      proceeds,
      gainLoss,
      gainLossPercentage,
      holdingPeriod,
      isLongTerm,
      fifoCostBasis,
      lifoCostBasis,
      method: settings.method,
    };

    taxTransactions.push(taxTransaction);
  }

  return taxTransactions;
};

/**
 * Get historical token price at a specific timestamp
 */
const getHistoricalTokenPrice = async (
  tokenSymbol: string,
  timestamp: number
): Promise<number> => {
  try {
    // In a real implementation, you would fetch historical price data
    // from CoinGecko, CoinMarketCap, or other APIs
    // For now, we'll use a mock implementation
    
    const mockPrices: Record<string, number> = {
      'ETH': 1800,
      'USDC': 1,
      'USDT': 1,
      'DAI': 1,
      'WBTC': 45000,
      'WETH': 1800,
      'UNI': 15,
      'AAVE': 150,
      'LINK': 25,
    };

    return mockPrices[tokenSymbol] || 1;
  } catch (error) {
    console.error('Error fetching historical price:', error);
    return 1;
  }
};

/**
 * Calculate holding period in days
 */
const calculateHoldingPeriod = (timestamp: number): number => {
  const now = Math.floor(Date.now() / 1000);
  const daysDiff = (now - timestamp) / (24 * 60 * 60);
  return Math.floor(daysDiff);
};

/**
 * Generate CSV export for tax reporting
 */
export const generateTaxCSV = (taxReport: TaxReport): string => {
  const headers = [
    'Date',
    'Transaction Hash',
    'Type',
    'Token Symbol',
    'Amount',
    'Price at Time',
    'USD Value',
    'Cost Basis',
    'Proceeds',
    'Gain/Loss',
    'Gain/Loss %',
    'Holding Period (Days)',
    'Long Term',
    'Gas Cost',
  ];

  const rows = taxReport.transactions.map(tx => [
    tx.date,
    tx.hash,
    tx.type,
    tx.tokenSymbol,
    tx.amountFormatted,
    tx.priceAtTime.toFixed(6),
    tx.usdValue.toFixed(2),
    tx.costBasis.toFixed(2),
    tx.proceeds.toFixed(2),
    tx.gainLoss.toFixed(2),
    tx.gainLossPercentage.toFixed(2),
    tx.holdingPeriod,
    tx.isLongTerm ? 'Yes' : 'No',
    tx.gasCost.toFixed(2),
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  return csvContent;
};

/**
 * Generate tax summary report
 */
export const generateTaxSummary = (taxReport: TaxReport): string => {
  const summary = `
Tax Report Summary for ${taxReport.year}

Total Transactions: ${taxReport.summary.totalTransactions}
Buy Transactions: ${taxReport.summary.buyTransactions}
Sell Transactions: ${taxReport.summary.sellTransactions}

Financial Summary:
- Total Proceeds: $${taxReport.totalProceeds.toFixed(2)}
- Total Cost Basis: $${taxReport.totalCostBasis.toFixed(2)}
- Total Gain/Loss: $${taxReport.totalGainLoss.toFixed(2)}
- Short-term Gain/Loss: $${taxReport.shortTermGainLoss.toFixed(2)}
- Long-term Gain/Loss: $${taxReport.longTermGainLoss.toFixed(2)}

Portfolio Analysis:
- Average Holding Period: ${taxReport.summary.averageHoldingPeriod.toFixed(1)} days
- Best Performing Token: ${taxReport.summary.bestPerformingToken}
- Worst Performing Token: ${taxReport.summary.worstPerformingToken}
`;

  return summary;
};

/**
 * Calculate unrealized gains/losses for current holdings
 */
export const calculateUnrealizedGains = async (
  tokens: Token[],
  settings: TaxSettings
): Promise<Array<{
  token: Token;
  unrealizedGainLoss: number;
  unrealizedGainLossPercentage: number;
  averageCostBasis: number;
}>> => {
  const unrealizedGains = [];

  for (const token of tokens) {
    if (!token.usdValue || token.usdValue === 0) continue;

    // In a real implementation, you would calculate the average cost basis
    // from historical transactions. For now, we'll use a mock calculation.
    const mockCostBasis = token.usdValue * 0.8; // Assume 20% gain
    const unrealizedGainLoss = token.usdValue - mockCostBasis;
    const unrealizedGainLossPercentage = (unrealizedGainLoss / mockCostBasis) * 100;

    unrealizedGains.push({
      token,
      unrealizedGainLoss,
      unrealizedGainLossPercentage,
      averageCostBasis: mockCostBasis,
    });
  }

  return unrealizedGains;
};

/**
 * Get default tax settings
 */
export const getDefaultTaxSettings = (): TaxSettings => ({
  method: 'FIFO',
  includeGasFees: true,
  includeAirdrops: true,
  includeStakingRewards: true,
  longTermThreshold: 365, // 1 year
  taxYear: new Date().getFullYear(),
});

/**
 * Validate tax settings
 */
export const validateTaxSettings = (settings: TaxSettings): string[] => {
  const errors: string[] = [];

  if (!['FIFO', 'LIFO', 'SPECIFIC_ID'].includes(settings.method)) {
    errors.push('Invalid cost basis method');
  }

  if (settings.longTermThreshold < 0) {
    errors.push('Long-term threshold must be positive');
  }

  if (settings.taxYear < 2010 || settings.taxYear > new Date().getFullYear() + 1) {
    errors.push('Invalid tax year');
  }

  return errors;
}; 