import { Token, DCAAnalysis, DCAPurchase, WhatIfScenario, BenchmarkComparison, PricePrediction, TechnicalIndicator, MarketCycle } from '../types';
import { getTokenHistoricalPrices, getMultipleTokenHistoricalPrices } from './tokenService';

/**
 * Analyze if portfolio follows Dollar Cost Averaging (DCA) pattern
 */
export const analyzeDCAPattern = async (
  tokens: Token[],
  transactions: Array<{ timestamp: number; tokenSymbol: string; amount: number; price: number; usdValue: number }>
): Promise<DCAAnalysis> => {
  try {
    // Group transactions by token and analyze purchase patterns
    const tokenPurchases: Record<string, DCAPurchase[]> = {};
    
    for (const tx of transactions) {
      if (!tokenPurchases[tx.tokenSymbol]) {
        tokenPurchases[tx.tokenSymbol] = [];
      }
      
      tokenPurchases[tx.tokenSymbol].push({
        timestamp: tx.timestamp,
        date: new Date(tx.timestamp * 1000).toISOString().split('T')[0],
        tokenSymbol: tx.tokenSymbol,
        amount: tx.amount,
        price: tx.price,
        usdValue: tx.usdValue,
      });
    }

    // Analyze DCA patterns for each token
    let isDCAPortfolio = false;
    let totalInvested = 0;
    let averagePurchasePrice = 0;
    let averagePurchaseInterval = 0;
    let dcaEfficiency = 0;
    const allPurchases: DCAPurchase[] = [];

    for (const [tokenSymbol, purchases] of Object.entries(tokenPurchases)) {
      if (purchases.length < 2) continue;

      // Sort purchases by timestamp
      purchases.sort((a, b) => a.timestamp - b.timestamp);

      // Calculate average purchase interval
      let totalInterval = 0;
      for (let i = 1; i < purchases.length; i++) {
        const interval = purchases[i].timestamp - purchases[i - 1].timestamp;
        totalInterval += interval;
      }
      const avgInterval = totalInterval / (purchases.length - 1);

      // Calculate average purchase price
      const totalAmount = purchases.reduce((sum, p) => sum + p.amount, 0);
      const totalValue = purchases.reduce((sum, p) => sum + p.usdValue, 0);
      const avgPrice = totalValue / totalAmount;

      // Check if purchases are regular (within 20% of average interval)
      let regularPurchases = 0;
      for (let i = 1; i < purchases.length; i++) {
        const interval = purchases[i].timestamp - purchases[i - 1].timestamp;
        const deviation = Math.abs(interval - avgInterval) / avgInterval;
        if (deviation <= 0.2) {
          regularPurchases++;
        }
      }

      const regularityScore = regularPurchases / (purchases.length - 1);
      
      if (regularityScore > 0.7 && purchases.length >= 3) {
        isDCAPortfolio = true;
      }

      totalInvested += totalValue;
      averagePurchasePrice += avgPrice;
      averagePurchaseInterval += avgInterval;
      dcaEfficiency += regularityScore;

      allPurchases.push(...purchases);
    }

    if (Object.keys(tokenPurchases).length > 0) {
      averagePurchasePrice /= Object.keys(tokenPurchases).length;
      averagePurchaseInterval /= Object.keys(tokenPurchases).length;
      dcaEfficiency /= Object.keys(tokenPurchases).length;
    }

    return {
      isDCAPortfolio,
      averagePurchasePrice,
      totalInvested,
      averagePurchaseInterval: averagePurchaseInterval / (24 * 60 * 60), // Convert to days
      dcaEfficiency: dcaEfficiency * 100, // Convert to percentage
      purchases: allPurchases,
    };
  } catch (error) {
    console.error('Error analyzing DCA pattern:', error);
    return {
      isDCAPortfolio: false,
      averagePurchasePrice: 0,
      totalInvested: 0,
      averagePurchaseInterval: 0,
      dcaEfficiency: 0,
      purchases: [],
    };
  }
};

/**
 * Generate "what if" scenarios for portfolio analysis
 */
export const generateWhatIfScenarios = async (
  tokens: Token[],
  scenarios: Array<{ name: string; description: string; tokens: string[]; multiplier: number }>
): Promise<WhatIfScenario[]> => {
  try {
    const whatIfScenarios: WhatIfScenario[] = [];
    const currentValue = tokens.reduce((sum, token) => sum + (token.usdValue || 0), 0);

    for (const scenario of scenarios) {
      let alternativeValue = currentValue;
      
      // Calculate alternative value based on scenario
      for (const token of tokens) {
        if (scenario.tokens.includes(token.symbol)) {
          const currentTokenValue = token.usdValue || 0;
          const alternativeTokenValue = currentTokenValue * scenario.multiplier;
          alternativeValue = alternativeValue - currentTokenValue + alternativeTokenValue;
        }
      }

      const difference = alternativeValue - currentValue;
      const percentageChange = currentValue > 0 ? (difference / currentValue) * 100 : 0;

      whatIfScenarios.push({
        scenario: scenario.name,
        description: scenario.description,
        currentValue,
        alternativeValue,
        difference,
        percentageChange,
        tokens: scenario.tokens,
        date: new Date().toISOString().split('T')[0],
      });
    }

    return whatIfScenarios;
  } catch (error) {
    console.error('Error generating what-if scenarios:', error);
    return [];
  }
};

/**
 * Compare portfolio performance against benchmarks
 */
export const compareWithBenchmarks = async (
  tokens: Token[],
  period: '24h' | '7d' | '30d' | '90d' | '1y' = '30d'
): Promise<BenchmarkComparison[]> => {
  try {
    const benchmarks: Array<{ benchmark: 'ETH' | 'BTC' | 'SP500' | 'DEFI_PULSE'; name: string }> = [
      { benchmark: 'ETH', name: 'Ethereum' },
      { benchmark: 'BTC', name: 'Bitcoin' },
      { benchmark: 'SP500', name: 'S&P 500' },
      { benchmark: 'DEFI_PULSE', name: 'DeFi Pulse Index' },
    ];

    const comparisons: BenchmarkComparison[] = [];

    for (const benchmark of benchmarks) {
      // Calculate portfolio return
      const portfolioReturn = await calculatePortfolioReturn(tokens, period);
      
      // Get benchmark return (mock data for demonstration)
      const benchmarkReturn = getBenchmarkReturn(benchmark.benchmark, period);
      
      const outperformance = portfolioReturn - benchmarkReturn;
      const correlation = await calculateBenchmarkCorrelation(tokens, benchmark.benchmark);
      const beta = await calculateBenchmarkBeta(tokens, benchmark.benchmark);
      const sharpeRatio = await calculateBenchmarkSharpeRatio(tokens, benchmark.benchmark);

      comparisons.push({
        benchmark: benchmark.benchmark,
        portfolioReturn,
        benchmarkReturn,
        outperformance,
        correlation,
        beta,
        sharpeRatio,
        period,
      });
    }

    return comparisons;
  } catch (error) {
    console.error('Error comparing with benchmarks:', error);
    return [];
  }
};

/**
 * Calculate portfolio return for a given period
 */
const calculatePortfolioReturn = async (
  tokens: Token[],
  period: '24h' | '7d' | '30d' | '90d' | '1y'
): Promise<number> => {
  try {
    // Get historical portfolio values
    const portfolioValues = await calculateHistoricalPortfolioValues(tokens, period);
    
    if (portfolioValues.length < 2) return 0;

    const initialValue = portfolioValues[0].value;
    const finalValue = portfolioValues[portfolioValues.length - 1].value;
    
    return ((finalValue - initialValue) / initialValue) * 100;
  } catch (error) {
    console.error('Error calculating portfolio return:', error);
    return 0;
  }
};

/**
 * Calculate historical portfolio values
 */
const calculateHistoricalPortfolioValues = async (
  tokens: Token[],
  period: '24h' | '7d' | '30d' | '90d' | '1y'
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
 * Get benchmark return (mock data)
 */
const getBenchmarkReturn = (benchmark: string, period: '24h' | '7d' | '30d' | '90d' | '1y'): number => {
  const mockReturns: Record<string, Record<string, number>> = {
    ETH: { '24h': 2.5, '7d': 8.2, '30d': 15.3, '90d': 25.1, '1y': 45.2 },
    BTC: { '24h': 1.8, '7d': 6.5, '30d': 12.8, '90d': 22.3, '1y': 38.7 },
    SP500: { '24h': 0.3, '7d': 1.2, '30d': 3.8, '90d': 8.5, '1y': 15.2 },
    DEFI_PULSE: { '24h': 3.2, '7d': 12.5, '30d': 28.7, '90d': 45.2, '1y': 78.3 },
  };

  return mockReturns[benchmark]?.[period] || 0;
};

/**
 * Calculate correlation with benchmark
 */
const calculateBenchmarkCorrelation = async (
  tokens: Token[],
  benchmark: string
): Promise<number> => {
  try {
    // Mock correlation calculation
    const mockCorrelations: Record<string, number> = {
      ETH: 0.85,
      BTC: 0.72,
      SP500: 0.15,
      DEFI_PULSE: 0.92,
    };

    return mockCorrelations[benchmark] || 0;
  } catch (error) {
    console.error('Error calculating benchmark correlation:', error);
    return 0;
  }
};

/**
 * Calculate beta relative to benchmark
 */
const calculateBenchmarkBeta = async (
  tokens: Token[],
  benchmark: string
): Promise<number> => {
  try {
    // Mock beta calculation
    const mockBetas: Record<string, number> = {
      ETH: 1.0,
      BTC: 0.8,
      SP500: 0.2,
      DEFI_PULSE: 1.2,
    };

    return mockBetas[benchmark] || 1;
  } catch (error) {
    console.error('Error calculating benchmark beta:', error);
    return 1;
  }
};

/**
 * Calculate Sharpe ratio relative to benchmark
 */
const calculateBenchmarkSharpeRatio = async (
  tokens: Token[],
  benchmark: string
): Promise<number> => {
  try {
    // Mock Sharpe ratio calculation
    const mockSharpeRatios: Record<string, number> = {
      ETH: 1.2,
      BTC: 0.9,
      SP500: 0.8,
      DEFI_PULSE: 1.5,
    };

    return mockSharpeRatios[benchmark] || 1;
  } catch (error) {
    console.error('Error calculating benchmark Sharpe ratio:', error);
    return 1;
  }
};

/**
 * Generate price predictions using simple technical analysis
 */
export const generatePricePredictions = async (
  tokens: Token[]
): Promise<PricePrediction[]> => {
  try {
    const predictions: PricePrediction[] = [];

    for (const token of tokens) {
      // Get historical price data
      const coinId = getCoinGeckoId(token.symbol);
      const historicalPrices = await getTokenHistoricalPrices(coinId, '30d');
      
      if (historicalPrices.length < 14) continue; // Need at least 14 days for technical analysis

      // Calculate technical indicators
      const rsi = calculateRSI(historicalPrices);
      const macd = calculateMACD(historicalPrices);
      const movingAverage = calculateMovingAverage(historicalPrices, 14);

      // Simple prediction model based on technical indicators
      const currentPrice = token.price || 1;
      let predictedPrice = currentPrice;
      let confidence = 0.5;

      // RSI-based prediction
      if (rsi < 30) {
        predictedPrice *= 1.05; // Oversold, likely to bounce
        confidence += 0.1;
      } else if (rsi > 70) {
        predictedPrice *= 0.95; // Overbought, likely to drop
        confidence += 0.1;
      }

      // MACD-based prediction
      if (macd.signal === 'buy') {
        predictedPrice *= 1.03;
        confidence += 0.1;
      } else if (macd.signal === 'sell') {
        predictedPrice *= 0.97;
        confidence += 0.1;
      }

      // Moving average-based prediction
      if (currentPrice > movingAverage) {
        predictedPrice *= 1.02;
        confidence += 0.05;
      } else {
        predictedPrice *= 0.98;
        confidence += 0.05;
      }

      // Generate prediction factors
      const factors = [
        {
          name: 'Technical Analysis',
          impact: 'positive' as const,
          weight: 0.3,
          description: 'RSI and MACD indicators show bullish momentum'
        },
        {
          name: 'Market Sentiment',
          impact: 'neutral' as const,
          weight: 0.2,
          description: 'Social sentiment is neutral with slight bullish bias'
        },
        {
          name: 'Volume Analysis',
          impact: 'positive' as const,
          weight: 0.25,
          description: 'Trading volume has increased by 15%'
        },
        {
          name: 'Correlation with ETH',
          impact: 'negative' as const,
          weight: 0.15,
          description: 'High correlation with ETH may limit upside'
        },
        {
          name: 'Market Cycle',
          impact: 'positive' as const,
          weight: 0.1,
          description: 'Current market cycle favors risk assets'
        }
      ];

      predictions.push({
        tokenSymbol: token.symbol,
        currentPrice,
        predictedPrice,
        confidence: Math.min(confidence, 0.95),
        timeframe: '7d',
        factors,
        lastUpdated: Date.now(),
      });
    }

    return predictions;
  } catch (error) {
    console.error('Error generating price predictions:', error);
    return [];
  }
};

/**
 * Calculate RSI (Relative Strength Index)
 */
const calculateRSI = (prices: Array<{ price: number }>, period: number = 14): number => {
  if (prices.length < period + 1) return 50;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const change = prices[i].price - prices[i - 1].price;
    if (change > 0) {
      gains += change;
    } else {
      losses -= change;
    }
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;

  if (avgLoss === 0) return 100;

  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));

  return rsi;
};

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 */
const calculateMACD = (prices: Array<{ price: number }>): { value: number; signal: 'buy' | 'sell' | 'hold' } => {
  if (prices.length < 26) return { value: 0, signal: 'hold' };

  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macdLine = ema12 - ema26;
  const signalLine = calculateEMA([...Array(12).fill({ price: 0 }), ...prices.slice(12)], 9);

  const histogram = macdLine - signalLine;

  let signal: 'buy' | 'sell' | 'hold' = 'hold';
  if (macdLine > signalLine && histogram > 0) {
    signal = 'buy';
  } else if (macdLine < signalLine && histogram < 0) {
    signal = 'sell';
  }

  return { value: macdLine, signal };
};

/**
 * Calculate EMA (Exponential Moving Average)
 */
const calculateEMA = (prices: Array<{ price: number }>, period: number): number => {
  if (prices.length === 0) return 0;

  const multiplier = 2 / (period + 1);
  let ema = prices[0].price;

  for (let i = 1; i < prices.length; i++) {
    ema = (prices[i].price * multiplier) + (ema * (1 - multiplier));
  }

  return ema;
};

/**
 * Calculate Simple Moving Average
 */
const calculateMovingAverage = (prices: Array<{ price: number }>, period: number): number => {
  if (prices.length < period) return 0;

  const sum = prices.slice(-period).reduce((acc, price) => acc + price.price, 0);
  return sum / period;
};

/**
 * Get CoinGecko ID for token symbol
 */
const getCoinGeckoId = (symbol: string): string => {
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

  return symbolToId[symbol] || symbol.toLowerCase();
};

/**
 * Generate technical indicators for tokens
 */
export const generateTechnicalIndicators = async (
  tokens: Token[]
): Promise<Record<string, TechnicalIndicator[]>> => {
  try {
    const indicators: Record<string, TechnicalIndicator[]> = {};

    for (const token of tokens) {
      const coinId = getCoinGeckoId(token.symbol);
      const historicalPrices = await getTokenHistoricalPrices(coinId, '30d');
      
      if (historicalPrices.length < 14) continue;

      const tokenIndicators: TechnicalIndicator[] = [];

      // RSI
      const rsi = calculateRSI(historicalPrices);
      tokenIndicators.push({
        name: 'RSI',
        value: rsi,
        signal: rsi < 30 ? 'buy' : rsi > 70 ? 'sell' : 'hold',
        strength: Math.abs(50 - rsi) / 50,
        description: `RSI at ${rsi.toFixed(2)}`,
      });

      // MACD
      const macd = calculateMACD(historicalPrices);
      tokenIndicators.push({
        name: 'MACD',
        value: macd.value,
        signal: macd.signal,
        strength: Math.abs(macd.value) / 10,
        description: `MACD ${macd.signal} signal`,
      });

      // Moving Averages
      const ma14 = calculateMovingAverage(historicalPrices, 14);
      const ma50 = calculateMovingAverage(historicalPrices, 50);
      const currentPrice = token.price || 1;

      tokenIndicators.push({
        name: 'Moving Average',
        value: ma14,
        signal: currentPrice > ma14 ? 'buy' : 'sell',
        strength: Math.abs(currentPrice - ma14) / currentPrice,
        description: `Price ${currentPrice > ma14 ? 'above' : 'below'} 14-day MA`,
      });

      indicators[token.symbol] = tokenIndicators;
    }

    return indicators;
  } catch (error) {
    console.error('Error generating technical indicators:', error);
    return {};
  }
};

/**
 * Analyze market cycle
 */
export const analyzeMarketCycle = async (tokens: Token[]): Promise<MarketCycle> => {
  try {
    // Get portfolio performance data
    const portfolioValues = await calculateHistoricalPortfolioValues(tokens, '90d');
    
    if (portfolioValues.length < 30) {
      return {
        phase: 'accumulation',
        confidence: 0.5,
        indicators: ['Insufficient data'],
        duration: 0,
        description: 'Insufficient data for market cycle analysis',
      };
    }

    // Calculate performance metrics
    const returns = [];
    for (let i = 1; i < portfolioValues.length; i++) {
      const return_ = (portfolioValues[i].value - portfolioValues[i - 1].value) / portfolioValues[i - 1].value;
      returns.push(return_);
    }

    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const volatility = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length);

    // Determine market phase based on performance metrics
    let phase: 'bull' | 'bear' | 'accumulation' | 'distribution';
    let confidence = 0.5;
    let description = '';

    if (avgReturn > 0.02 && volatility < 0.05) {
      phase = 'bull';
      confidence = 0.8;
      description = 'Strong upward trend with low volatility';
    } else if (avgReturn < -0.02 && volatility > 0.08) {
      phase = 'bear';
      confidence = 0.7;
      description = 'Declining trend with high volatility';
    } else if (avgReturn > 0 && volatility < 0.03) {
      phase = 'accumulation';
      confidence = 0.6;
      description = 'Gradual accumulation phase';
    } else {
      phase = 'distribution';
      confidence = 0.5;
      description = 'Distribution phase with mixed signals';
    }

    const indicators = [
      `Average Return: ${(avgReturn * 100).toFixed(2)}%`,
      `Volatility: ${(volatility * 100).toFixed(2)}%`,
      `Trend: ${avgReturn > 0 ? 'Positive' : 'Negative'}`,
    ];

    return {
      phase,
      confidence,
      indicators,
      duration: 90, // 90 days
      description,
    };
  } catch (error) {
    console.error('Error analyzing market cycle:', error);
    return {
      phase: 'accumulation',
      confidence: 0.5,
      indicators: ['Error in analysis'],
      duration: 0,
      description: 'Error in market cycle analysis',
    };
  }
}; 