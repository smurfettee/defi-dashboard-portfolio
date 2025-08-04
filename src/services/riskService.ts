import { Token, RiskMetrics, TokenCategory, PortfolioOptimization, OptimizationRecommendation } from '../types';
import { getTokenHistoricalPrices, getMultipleTokenHistoricalPrices } from './tokenService';

// Token categories for diversification analysis
const TOKEN_CATEGORIES: TokenCategory[] = [
  {
    id: 'layer1',
    name: 'Layer 1 Blockchains',
    description: 'Base layer blockchain protocols',
    tokens: ['ETH', 'BTC', 'SOL', 'ADA', 'DOT', 'AVAX'],
    riskLevel: 'medium',
    marketCap: 1000000000000,
    volatility: 0.8,
  },
  {
    id: 'defi',
    name: 'DeFi Protocols',
    description: 'Decentralized finance protocols',
    tokens: ['UNI', 'AAVE', 'COMP', 'CRV', 'BAL', 'SUSHI'],
    riskLevel: 'high',
    marketCap: 50000000000,
    volatility: 1.2,
  },
  {
    id: 'stablecoins',
    name: 'Stablecoins',
    description: 'Price-stable cryptocurrencies',
    tokens: ['USDC', 'USDT', 'DAI', 'BUSD', 'FRAX'],
    riskLevel: 'low',
    marketCap: 100000000000,
    volatility: 0.1,
  },
  {
    id: 'meme',
    name: 'Meme Coins',
    description: 'Community-driven tokens',
    tokens: ['DOGE', 'SHIB', 'PEPE', 'FLOKI'],
    riskLevel: 'high',
    marketCap: 10000000000,
    volatility: 2.0,
  },
  {
    id: 'infrastructure',
    name: 'Infrastructure',
    description: 'Blockchain infrastructure and tools',
    tokens: ['LINK', 'MATIC', 'ATOM', 'NEAR', 'FTM'],
    riskLevel: 'medium',
    marketCap: 20000000000,
    volatility: 0.9,
  },
];

/**
 * Calculate portfolio volatility using historical price data
 */
export const calculatePortfolioVolatility = async (
  tokens: Token[],
  period: '30d' | '90d' | '1y' = '30d'
): Promise<number> => {
  try {
    if (tokens.length === 0) return 0;

    // Get historical prices for all tokens
    const coinIds = tokens.map(token => {
      // Map common token symbols to CoinGecko IDs
      const symbolToId: Record<string, string> = {
        'ETH': 'ethereum',
        'WETH': 'weth',
        'USDC': 'usd-coin',
        'USDT': 'tether',
        'DAI': 'dai',
        'WBTC': 'wrapped-bitcoin',
        'UNI': 'uniswap',
        'AAVE': 'aave',
        'LINK': 'chainlink',
      };
      return symbolToId[token.symbol] || token.symbol.toLowerCase();
    });

    const historicalData = await getMultipleTokenHistoricalPrices(coinIds, period);
    
    // Calculate daily returns for each token
    const dailyReturns: Record<string, number[]> = {};
    
    for (const [tokenId, prices] of Object.entries(historicalData)) {
      const returns: number[] = [];
      for (let i = 1; i < prices.length; i++) {
        const return_ = (prices[i].price - prices[i - 1].price) / prices[i - 1].price;
        returns.push(return_);
      }
      dailyReturns[tokenId] = returns;
    }

    // Calculate portfolio weights
    const totalValue = tokens.reduce((sum, token) => sum + (token.usdValue || 0), 0);
    const weights = tokens.map(token => (token.usdValue || 0) / totalValue);

    // Calculate portfolio variance using the covariance matrix
    let portfolioVariance = 0;
    
    for (let i = 0; i < tokens.length; i++) {
      for (let j = 0; j < tokens.length; j++) {
        const weightI = weights[i];
        const weightJ = weights[j];
        
        if (weightI > 0 && weightJ > 0) {
          const covariance = calculateCovariance(
            dailyReturns[coinIds[i]] || [],
            dailyReturns[coinIds[j]] || []
          );
          portfolioVariance += weightI * weightJ * covariance;
        }
      }
    }

    // Convert to annualized volatility
    const dailyVolatility = Math.sqrt(portfolioVariance);
    const annualizedVolatility = dailyVolatility * Math.sqrt(365);

    return annualizedVolatility;
  } catch (error) {
    console.error('Error calculating portfolio volatility:', error);
    return 0;
  }
};

/**
 * Calculate covariance between two return series
 */
const calculateCovariance = (returns1: number[], returns2: number[]): number => {
  if (returns1.length !== returns2.length || returns1.length === 0) return 0;

  const mean1 = returns1.reduce((sum, r) => sum + r, 0) / returns1.length;
  const mean2 = returns2.reduce((sum, r) => sum + r, 0) / returns2.length;

  let covariance = 0;
  for (let i = 0; i < returns1.length; i++) {
    covariance += (returns1[i] - mean1) * (returns2[i] - mean2);
  }

  return covariance / returns1.length;
};

/**
 * Calculate Value at Risk (VaR) at 95% confidence level
 */
export const calculateVaR = async (
  tokens: Token[],
  confidenceLevel: number = 0.95
): Promise<number> => {
  try {
    const volatility = await calculatePortfolioVolatility(tokens);
    const totalValue = tokens.reduce((sum, token) => sum + (token.usdValue || 0), 0);
    
    // Using normal distribution assumption
    // For 95% confidence, z-score is approximately 1.645
    const zScore = confidenceLevel === 0.95 ? 1.645 : 2.326; // 99% confidence
    
    const varValue = totalValue * volatility * zScore;
    
    return varValue;
  } catch (error) {
    console.error('Error calculating VaR:', error);
    return 0;
  }
};

/**
 * Calculate maximum drawdown
 */
export const calculateMaxDrawdown = async (
  tokens: Token[],
  period: '30d' | '90d' | '1y' = '30d'
): Promise<number> => {
  try {
    if (tokens.length === 0) return 0;

    // Get historical portfolio values
    const portfolioValues = await calculateHistoricalPortfolioValues(tokens, period);
    
    let maxDrawdown = 0;
    let peak = portfolioValues[0]?.value || 0;

    for (const dataPoint of portfolioValues) {
      if (dataPoint.value > peak) {
        peak = dataPoint.value;
      }
      
      const drawdown = (peak - dataPoint.value) / peak;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    return maxDrawdown * 100; // Convert to percentage
  } catch (error) {
    console.error('Error calculating max drawdown:', error);
    return 0;
  }
};

/**
 * Calculate historical portfolio values
 */
const calculateHistoricalPortfolioValues = async (
  tokens: Token[],
  period: '30d' | '90d' | '1y' = '30d'
): Promise<Array<{ timestamp: number; value: number }>> => {
  try {
    const coinIds = tokens.map(token => {
      const symbolToId: Record<string, string> = {
        'ETH': 'ethereum',
        'WETH': 'weth',
        'USDC': 'usd-coin',
        'USDT': 'tether',
        'DAI': 'dai',
        'WBTC': 'wrapped-bitcoin',
        'UNI': 'uniswap',
        'AAVE': 'aave',
        'LINK': 'chainlink',
      };
      return symbolToId[token.symbol] || token.symbol.toLowerCase();
    });

    const historicalData = await getMultipleTokenHistoricalPrices(coinIds, period);
    
    // Get the shortest price series length
    const minLength = Math.min(...Object.values(historicalData).map(prices => prices.length));
    
    const portfolioValues: Array<{ timestamp: number; value: number }> = [];
    
    for (let i = 0; i < minLength; i++) {
      let portfolioValue = 0;
      const timestamp = Object.values(historicalData)[0][i].timestamp;
      
      for (let j = 0; j < tokens.length; j++) {
        const token = tokens[j];
        const prices = historicalData[coinIds[j]];
        if (prices && prices[i]) {
          const tokenValue = (token.usdValue || 0) * (prices[i].price / (token.price || 1));
          portfolioValue += tokenValue;
        }
      }
      
      portfolioValues.push({ timestamp, value: portfolioValue });
    }
    
    return portfolioValues;
  } catch (error) {
    console.error('Error calculating historical portfolio values:', error);
    return [];
  }
};

/**
 * Calculate correlation matrix between tokens
 */
export const calculateCorrelationMatrix = async (
  tokens: Token[]
): Promise<Record<string, Record<string, number>>> => {
  try {
    if (tokens.length === 0) return {};

    const coinIds = tokens.map(token => {
      const symbolToId: Record<string, string> = {
        'ETH': 'ethereum',
        'WETH': 'weth',
        'USDC': 'usd-coin',
        'USDT': 'tether',
        'DAI': 'dai',
        'WBTC': 'wrapped-bitcoin',
        'UNI': 'uniswap',
        'AAVE': 'aave',
        'LINK': 'chainlink',
      };
      return symbolToId[token.symbol] || token.symbol.toLowerCase();
    });

    const historicalData = await getMultipleTokenHistoricalPrices(coinIds, '30d');
    
    const correlationMatrix: Record<string, Record<string, number>> = {};
    
    for (let i = 0; i < tokens.length; i++) {
      correlationMatrix[tokens[i].symbol] = {};
      
      for (let j = 0; j < tokens.length; j++) {
        if (i === j) {
          correlationMatrix[tokens[i].symbol][tokens[j].symbol] = 1;
        } else {
          const returns1 = calculateReturns(historicalData[coinIds[i]] || []);
          const returns2 = calculateReturns(historicalData[coinIds[j]] || []);
          const correlation = calculateCorrelation(returns1, returns2);
          correlationMatrix[tokens[i].symbol][tokens[j].symbol] = correlation;
        }
      }
    }
    
    return correlationMatrix;
  } catch (error) {
    console.error('Error calculating correlation matrix:', error);
    return {};
  }
};

/**
 * Calculate returns from price data
 */
const calculateReturns = (prices: Array<{ price: number }>): number[] => {
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    const return_ = (prices[i].price - prices[i - 1].price) / prices[i - 1].price;
    returns.push(return_);
  }
  return returns;
};

/**
 * Calculate correlation between two return series
 */
const calculateCorrelation = (returns1: number[], returns2: number[]): number => {
  if (returns1.length !== returns2.length || returns1.length === 0) return 0;

  const covariance = calculateCovariance(returns1, returns2);
  const stdDev1 = Math.sqrt(calculateVariance(returns1));
  const stdDev2 = Math.sqrt(calculateVariance(returns2));

  if (stdDev1 === 0 || stdDev2 === 0) return 0;

  return covariance / (stdDev1 * stdDev2);
};

/**
 * Calculate variance of a return series
 */
const calculateVariance = (returns: number[]): number => {
  if (returns.length === 0) return 0;

  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  
  return variance;
};

/**
 * Calculate diversification score
 */
export const calculateDiversificationScore = (tokens: Token[]): number => {
  try {
    if (tokens.length === 0) return 0;

    // Calculate Herfindahl-Hirschman Index (HHI)
    const totalValue = tokens.reduce((sum, token) => sum + (token.usdValue || 0), 0);
    let hhi = 0;

    for (const token of tokens) {
      const weight = (token.usdValue || 0) / totalValue;
      hhi += weight * weight;
    }

    // Convert HHI to diversification score (0-100)
    // Lower HHI = higher diversification
    const diversificationScore = Math.max(0, 100 - (hhi * 100));

    return diversificationScore;
  } catch (error) {
    console.error('Error calculating diversification score:', error);
    return 0;
  }
};

/**
 * Calculate sector allocation
 */
export const calculateSectorAllocation = (tokens: Token[]): Record<string, number> => {
  const sectorAllocation: Record<string, number> = {};
  const totalValue = tokens.reduce((sum, token) => sum + (token.usdValue || 0), 0);

  for (const token of tokens) {
    const category = TOKEN_CATEGORIES.find(cat => 
      cat.tokens.includes(token.symbol)
    );

    if (category) {
      const currentValue = sectorAllocation[category.name] || 0;
      sectorAllocation[category.name] = currentValue + (token.usdValue || 0);
    } else {
      const currentValue = sectorAllocation['Other'] || 0;
      sectorAllocation['Other'] = currentValue + (token.usdValue || 0);
    }
  }

  // Convert to percentages
  for (const sector in sectorAllocation) {
    sectorAllocation[sector] = (sectorAllocation[sector] / totalValue) * 100;
  }

  return sectorAllocation;
};

/**
 * Calculate concentration risk
 */
export const calculateConcentrationRisk = (tokens: Token[]): number => {
  try {
    if (tokens.length === 0) return 0;

    const totalValue = tokens.reduce((sum, token) => sum + (token.usdValue || 0), 0);
    
    // Calculate the percentage of the largest holding
    const largestHolding = Math.max(...tokens.map(token => token.usdValue || 0));
    const concentrationRisk = (largestHolding / totalValue) * 100;

    return concentrationRisk;
  } catch (error) {
    console.error('Error calculating concentration risk:', error);
    return 0;
  }
};

/**
 * Calculate Sharpe ratio
 */
export const calculateSharpeRatio = async (
  tokens: Token[],
  riskFreeRate: number = 0.02 // 2% annual risk-free rate
): Promise<number> => {
  try {
    const portfolioValues = await calculateHistoricalPortfolioValues(tokens, '30d');
    
    if (portfolioValues.length < 2) return 0;

    // Calculate daily returns
    const returns: number[] = [];
    for (let i = 1; i < portfolioValues.length; i++) {
      const return_ = (portfolioValues[i].value - portfolioValues[i - 1].value) / portfolioValues[i - 1].value;
      returns.push(return_);
    }

    // Calculate average return and standard deviation
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const stdDev = Math.sqrt(calculateVariance(returns));

    if (stdDev === 0) return 0;

    // Annualize returns and volatility
    const annualizedReturn = avgReturn * 365;
    const annualizedVolatility = stdDev * Math.sqrt(365);

    // Calculate Sharpe ratio
    const sharpeRatio = (annualizedReturn - riskFreeRate) / annualizedVolatility;

    return sharpeRatio;
  } catch (error) {
    console.error('Error calculating Sharpe ratio:', error);
    return 0;
  }
};

/**
 * Calculate beta relative to ETH
 */
export const calculateBeta = async (tokens: Token[]): Promise<number> => {
  try {
    const portfolioValues = await calculateHistoricalPortfolioValues(tokens, '30d');
    const ethPrices = await getTokenHistoricalPrices('ethereum', '30d');
    
    if (portfolioValues.length < 2 || ethPrices.length < 2) return 1;

    // Calculate portfolio returns
    const portfolioReturns: number[] = [];
    for (let i = 1; i < portfolioValues.length; i++) {
      const return_ = (portfolioValues[i].value - portfolioValues[i - 1].value) / portfolioValues[i - 1].value;
      portfolioReturns.push(return_);
    }

    // Calculate ETH returns
    const ethReturns: number[] = [];
    for (let i = 1; i < ethPrices.length; i++) {
      const return_ = (ethPrices[i].price - ethPrices[i - 1].price) / ethPrices[i - 1].price;
      ethReturns.push(return_);
    }

    // Calculate beta
    const covariance = calculateCovariance(portfolioReturns, ethReturns);
    const ethVariance = calculateVariance(ethReturns);
    
    const beta = ethVariance > 0 ? covariance / ethVariance : 1;

    return beta;
  } catch (error) {
    console.error('Error calculating beta:', error);
    return 1;
  }
};

/**
 * Calculate comprehensive risk metrics
 */
export const calculateRiskMetrics = async (tokens: Token[]): Promise<RiskMetrics> => {
  try {
    const [
      volatility,
      var95,
      maxDrawdown,
      sharpeRatio,
      beta,
      correlationMatrix,
      diversificationScore,
      concentrationRisk,
      sectorAllocation
    ] = await Promise.all([
      calculatePortfolioVolatility(tokens),
      calculateVaR(tokens, 0.95),
      calculateMaxDrawdown(tokens),
      calculateSharpeRatio(tokens),
      calculateBeta(tokens),
      calculateCorrelationMatrix(tokens),
      calculateDiversificationScore(tokens),
      calculateConcentrationRisk(tokens),
      calculateSectorAllocation(tokens),
    ]);

    // Determine risk score
    let riskScore: 'low' | 'medium' | 'high';
    if (volatility < 0.3 && concentrationRisk < 30 && diversificationScore > 70) {
      riskScore = 'low';
    } else if (volatility < 0.6 && concentrationRisk < 50 && diversificationScore > 40) {
      riskScore = 'medium';
    } else {
      riskScore = 'high';
    }

    return {
      volatility,
      riskScore,
      var95,
      maxDrawdown,
      sharpeRatio,
      beta,
      correlationMatrix,
      diversificationScore,
      concentrationRisk,
      sectorAllocation,
    };
  } catch (error) {
    console.error('Error calculating risk metrics:', error);
    return {
      volatility: 0,
      riskScore: 'medium',
      var95: 0,
      maxDrawdown: 0,
      sharpeRatio: 0,
      beta: 1,
      correlationMatrix: {},
      diversificationScore: 0,
      concentrationRisk: 0,
      sectorAllocation: {},
    };
  }
};

/**
 * Generate portfolio optimization recommendations
 */
export const generatePortfolioOptimization = async (
  tokens: Token[],
  riskTolerance: 'conservative' | 'moderate' | 'aggressive' = 'moderate'
): Promise<PortfolioOptimization> => {
  try {
    const riskMetrics = await calculateRiskMetrics(tokens);
    const currentAllocation = tokens.reduce((acc, token) => {
      acc[token.symbol] = (token.usdValue || 0);
      return acc;
    }, {} as Record<string, number>);

    const totalValue = tokens.reduce((sum, token) => sum + (token.usdValue || 0), 0);
    const recommendations: OptimizationRecommendation[] = [];

    // Analyze current allocation and provide recommendations
    for (const token of tokens) {
      const allocation = ((token.usdValue || 0) / totalValue) * 100;
      
      // Check for over-concentration
      if (allocation > 30) {
        recommendations.push({
          type: 'sell',
          tokenSymbol: token.symbol,
          amount: (token.usdValue || 0) * 0.3, // Suggest selling 30% of over-concentrated position
          reason: 'Reduce concentration risk',
          priority: 'high',
        });
      }

      // Check for under-diversification
      if (tokens.length < 5 && allocation < 5) {
        recommendations.push({
          type: 'buy',
          tokenSymbol: token.symbol,
          amount: (token.usdValue || 0) * 0.5, // Suggest increasing position
          reason: 'Improve portfolio diversification',
          priority: 'medium',
        });
      }
    }

    // Add recommendations based on risk tolerance
    if (riskTolerance === 'conservative' && riskMetrics.volatility > 0.4) {
      recommendations.push({
        type: 'sell',
        tokenSymbol: 'HIGH_VOLATILITY_TOKENS',
        amount: totalValue * 0.2,
        reason: 'Reduce portfolio volatility for conservative approach',
        priority: 'high',
      });
    }

    if (riskTolerance === 'aggressive' && riskMetrics.volatility < 0.3) {
      recommendations.push({
        type: 'buy',
        tokenSymbol: 'GROWTH_TOKENS',
        amount: totalValue * 0.1,
        reason: 'Increase portfolio growth potential',
        priority: 'medium',
      });
    }

    // Calculate suggested allocation (simplified)
    const suggestedAllocation = { ...currentAllocation };
    
    // Rebalancing cost estimation (simplified)
    const rebalancingCost = recommendations.reduce((cost, rec) => {
      return cost + (rec.amount * 0.001); // Assume 0.1% transaction cost
    }, 0);

    return {
      currentAllocation,
      suggestedAllocation,
      riskTolerance,
      expectedReturn: 0.08, // Mock expected return
      expectedRisk: riskMetrics.volatility,
      rebalancingNeeded: recommendations.length > 0,
      rebalancingCost,
      recommendations,
    };
  } catch (error) {
    console.error('Error generating portfolio optimization:', error);
    return {
      currentAllocation: {},
      suggestedAllocation: {},
      riskTolerance: 'moderate',
      expectedReturn: 0,
      expectedRisk: 0,
      rebalancingNeeded: false,
      rebalancingCost: 0,
      recommendations: [],
    };
  }
}; 