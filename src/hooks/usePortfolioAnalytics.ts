import { useState, useEffect, useCallback } from 'react';
import { 
  PortfolioAnalytics, 
  TimePeriod, 
  TokenPerformance, 
  PortfolioMetrics,
  ChartDataPoint,
  PriceChange,
  HistoricalPrice,
  Token
} from '../types';
import { useWallet } from '../contexts/WalletContext';
import { useNetwork } from '../contexts/NetworkContext';
import { usePortfolio } from './usePortfolio';
import {
  getMultipleTokenHistoricalPrices,
  getEthHistoricalPrices,
  getCoinGeckoIds
} from '../services/tokenService';
// Using built-in Date methods for date calculations

// Chart colors for consistent visualization
const CHART_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
];

const DEFAULT_ANALYTICS: PortfolioAnalytics = {
  metrics: {
    totalValue: 0,
    totalChange24h: { absolute: 0, percentage: 0, period: '24h' },
    totalChange7d: { absolute: 0, percentage: 0, period: '7d' },
    totalChange30d: { absolute: 0, percentage: 0, period: '30d' },
    numberOfTokens: 0,
    largestHoldingPercentage: 0
  },
  tokenPerformance: [],
  historicalData: [],
  allocationData: [],
  loading: false
};

export const usePortfolioAnalytics = (timePeriod: TimePeriod = '30d') => {
  const { address, isConnected } = useWallet();
  const { currentNetwork, tokens: networkTokens } = useNetwork();
  const portfolio = usePortfolio();
  
  const [analytics, setAnalytics] = useState<PortfolioAnalytics>(DEFAULT_ANALYTICS);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  // Calculate price change helper
  const calculatePriceChange = (currentPrice: number, historicalPrice: number, period: TimePeriod): PriceChange => {
    const absolute = currentPrice - historicalPrice;
    const percentage = historicalPrice > 0 ? (absolute / historicalPrice) * 100 : 0;
    return { absolute, percentage, period };
  };

  // Get historical price at specific period
  const getHistoricalPriceAtPeriod = (prices: HistoricalPrice[], daysBack: number): number => {
    if (prices.length === 0) return 0;
    
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - daysBack);
    targetDate.setHours(0, 0, 0, 0); // Start of day
    const targetTimestamp = targetDate.getTime();
    
    // Find closest price to target date
    let closestPrice = prices[0];
    let closestDiff = Math.abs(prices[0].timestamp - targetTimestamp);
    
    for (const price of prices) {
      const diff = Math.abs(price.timestamp - targetTimestamp);
      if (diff < closestDiff) {
        closestDiff = diff;
        closestPrice = price;
      }
    }
    
    return closestPrice.price;
  };

  // Calculate token performance
  const calculateTokenPerformance = useCallback((
    tokens: Token[],
    historicalData: Record<string, HistoricalPrice[]>,
    ethHistoricalData: HistoricalPrice[],
    totalPortfolioValue: number
  ): TokenPerformance[] => {
    const performance: TokenPerformance[] = [];

    // Process regular tokens
    tokens.forEach((token) => {
      const popularToken = networkTokens.find(
        (pt) => pt.address.toLowerCase() === token.address.toLowerCase()
      );

      if (!popularToken || !token.price) return;

      const historicalPrices = historicalData[popularToken.coinGeckoId] || [];
      const currentPrice = token.price;

      // Calculate price changes
      const price24hAgo = getHistoricalPriceAtPeriod(historicalPrices, 1);
      const price7dAgo = getHistoricalPriceAtPeriod(historicalPrices, 7);
      const price30dAgo = getHistoricalPriceAtPeriod(historicalPrices, 30);

      const priceChanges = {
        '24h': calculatePriceChange(currentPrice, price24hAgo, '24h'),
        '7d': calculatePriceChange(currentPrice, price7dAgo, '7d'),
        '30d': calculatePriceChange(currentPrice, price30dAgo, '30d')
      };

      // Calculate allocation percentage
      const allocation = totalPortfolioValue > 0 ? ((token.usdValue || 0) / totalPortfolioValue) * 100 : 0;

      performance.push({
        token,
        priceChanges,
        allocation,
        historicalPrices
      });
    });

    // Add ETH if present in portfolio
    if (portfolio.ethBalance > BigInt(0) && portfolio.ethUsdValue > 0) {
      const ethPrice = portfolio.ethUsdValue / parseFloat(portfolio.ethBalanceFormatted);
      
      const price24hAgo = getHistoricalPriceAtPeriod(ethHistoricalData, 1);
      const price7dAgo = getHistoricalPriceAtPeriod(ethHistoricalData, 7);
      const price30dAgo = getHistoricalPriceAtPeriod(ethHistoricalData, 30);

      const priceChanges = {
        '24h': calculatePriceChange(ethPrice, price24hAgo, '24h'),
        '7d': calculatePriceChange(ethPrice, price7dAgo, '7d'),
        '30d': calculatePriceChange(ethPrice, price30dAgo, '30d')
      };

      const allocation = totalPortfolioValue > 0 ? (portfolio.ethUsdValue / totalPortfolioValue) * 100 : 0;

      const ethToken: Token = {
        address: '0x0000000000000000000000000000000000000000',
        symbol: 'ETH',
        name: 'Ethereum',
        decimals: 18,
        balance: portfolio.ethBalance,
        balanceFormatted: portfolio.ethBalanceFormatted,
        price: ethPrice,
        usdValue: portfolio.ethUsdValue
      };

      performance.push({
        token: ethToken,
        priceChanges,
        allocation,
        historicalPrices: ethHistoricalData
      });
    }

    return performance.sort((a, b) => (b.token.usdValue || 0) - (a.token.usdValue || 0));
  }, [networkTokens, portfolio]);

  // Calculate portfolio metrics
  const calculatePortfolioMetrics = useCallback((
    tokenPerformance: TokenPerformance[],
    totalValue: number
  ): PortfolioMetrics => {
    if (tokenPerformance.length === 0) {
      return {
        totalValue,
        totalChange24h: { absolute: 0, percentage: 0, period: '24h' },
        totalChange7d: { absolute: 0, percentage: 0, period: '7d' },
        totalChange30d: { absolute: 0, percentage: 0, period: '30d' },
        numberOfTokens: 0,
        largestHoldingPercentage: 0
      };
    }

    // Calculate weighted portfolio changes
    let totalChange24hWeighted = 0;
    let totalChange7dWeighted = 0;
    let totalChange30dWeighted = 0;

    tokenPerformance.forEach((performance) => {
      const weight = performance.allocation / 100;
      totalChange24hWeighted += performance.priceChanges['24h'].percentage * weight;
      totalChange7dWeighted += performance.priceChanges['7d'].percentage * weight;
      totalChange30dWeighted += performance.priceChanges['30d'].percentage * weight;
    });

    // Calculate absolute changes
    const totalChange24hAbsolute = (totalChange24hWeighted / 100) * totalValue;
    const totalChange7dAbsolute = (totalChange7dWeighted / 100) * totalValue;
    const totalChange30dAbsolute = (totalChange30dWeighted / 100) * totalValue;

    // Find best and worst performers
    const sortedBy24h = [...tokenPerformance].sort((a, b) => 
      b.priceChanges['24h'].percentage - a.priceChanges['24h'].percentage
    );

    const bestPerformer = sortedBy24h[0] ? {
      symbol: sortedBy24h[0].token.symbol,
      change: sortedBy24h[0].priceChanges['24h']
    } : undefined;

    const worstPerformer = sortedBy24h[sortedBy24h.length - 1] ? {
      symbol: sortedBy24h[sortedBy24h.length - 1].token.symbol,
      change: sortedBy24h[sortedBy24h.length - 1].priceChanges['24h']
    } : undefined;

    // Find largest holding
    const largestHoldingPercentage = Math.max(...tokenPerformance.map(p => p.allocation));

    return {
      totalValue,
      totalChange24h: { absolute: totalChange24hAbsolute, percentage: totalChange24hWeighted, period: '24h' },
      totalChange7d: { absolute: totalChange7dAbsolute, percentage: totalChange7dWeighted, period: '7d' },
      totalChange30d: { absolute: totalChange30dAbsolute, percentage: totalChange30dWeighted, period: '30d' },
      numberOfTokens: tokenPerformance.length,
      largestHoldingPercentage,
      bestPerformer,
      worstPerformer
    };
  }, []);

  // Generate chart data
  const generateChartData = useCallback((
    tokenPerformance: TokenPerformance[],
    period: TimePeriod
  ): ChartDataPoint[] => {
    if (tokenPerformance.length === 0) return [];

    // Check if we have historical data
    const hasHistoricalData = tokenPerformance.some(p => p.historicalPrices.length > 0);
    
    if (!hasHistoricalData) {
      // Create a simple current value data point
      const totalValue = tokenPerformance.reduce((sum, p) => sum + (p.token.usdValue || 0), 0);
      const tokens: { [symbol: string]: number } = {};
      
      tokenPerformance.forEach(performance => {
        tokens[performance.token.symbol] = performance.token.usdValue || 0;
      });

      return [{
        timestamp: Date.now(),
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: totalValue,
        tokens
      }];
    }

    // Get all unique timestamps from all tokens
    const allTimestamps = new Set<number>();
    tokenPerformance.forEach(performance => {
      performance.historicalPrices.forEach(price => {
        allTimestamps.add(price.timestamp);
      });
    });

    const sortedTimestamps = Array.from(allTimestamps).sort((a, b) => a - b);

    return sortedTimestamps.map(timestamp => {
      let totalValue = 0;
      const tokens: { [symbol: string]: number } = {};

      tokenPerformance.forEach(performance => {
        const { token, historicalPrices } = performance;
        
        // Find price at this timestamp (or closest)
        let price = 0;
        if (historicalPrices.length > 0) {
          const exactPrice = historicalPrices.find(p => p.timestamp === timestamp);
          if (exactPrice) {
            price = exactPrice.price;
          } else {
            // Find closest price
            const closest = historicalPrices.reduce((prev, curr) => 
              Math.abs(curr.timestamp - timestamp) < Math.abs(prev.timestamp - timestamp) ? curr : prev
            );
            price = closest.price;
          }
        }

        const tokenValue = parseFloat(token.balanceFormatted) * price;
        totalValue += tokenValue;
        tokens[token.symbol] = tokenValue;
      });

      return {
        timestamp,
        date: new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: totalValue,
        tokens
      };
    });
  }, []);

  // Create basic analytics when historical data is not available
  const createBasicAnalytics = useCallback((portfolio: any): TokenPerformance[] => {
    const performance: TokenPerformance[] = [];
    
    // Add tokens with basic data
    portfolio.tokens.forEach((token: Token) => {
      if (token.usdValue && token.usdValue > 0) {
        const allocation = portfolio.totalValue > 0 ? (token.usdValue / portfolio.totalValue) * 100 : 0;
        
        performance.push({
          token,
          priceChanges: {
            '24h': { absolute: 0, percentage: 0, period: '24h' },
            '7d': { absolute: 0, percentage: 0, period: '7d' },
            '30d': { absolute: 0, percentage: 0, period: '30d' }
          },
          allocation,
          historicalPrices: []
        });
      }
    });

    // Add ETH if present
    if (portfolio.ethBalance > BigInt(0) && portfolio.ethUsdValue > 0) {
      const ethPrice = portfolio.ethUsdValue / parseFloat(portfolio.ethBalanceFormatted);
      const allocation = portfolio.totalValue > 0 ? (portfolio.ethUsdValue / portfolio.totalValue) * 100 : 0;

      const ethToken: Token = {
        address: '0x0000000000000000000000000000000000000000',
        symbol: 'ETH',
        name: 'Ethereum',
        decimals: 18,
        balance: portfolio.ethBalance,
        balanceFormatted: portfolio.ethBalanceFormatted,
        price: ethPrice,
        usdValue: portfolio.ethUsdValue
      };

      performance.push({
        token: ethToken,
        priceChanges: {
          '24h': { absolute: 0, percentage: 0, period: '24h' },
          '7d': { absolute: 0, percentage: 0, period: '7d' },
          '30d': { absolute: 0, percentage: 0, period: '30d' }
        },
        allocation,
        historicalPrices: []
      });
    }

    return performance.sort((a, b) => (b.token.usdValue || 0) - (a.token.usdValue || 0));
  }, []);

  // Generate allocation data for pie chart
  const generateAllocationData = useCallback((tokenPerformance: TokenPerformance[]) => {
    return tokenPerformance.map((performance, index) => ({
      symbol: performance.token.symbol,
      value: performance.token.usdValue || 0,
      percentage: performance.allocation,
      color: CHART_COLORS[index % CHART_COLORS.length]
    }));
  }, []);

  // Fetch analytics data
  const fetchAnalyticsData = useCallback(async () => {
    // Debounce rapid calls
    const now = Date.now();
    if (now - lastFetchTime < 5000) { // 5 second debounce
      console.log('Debouncing analytics fetch - too soon since last fetch');
      return;
    }
    setLastFetchTime(now);

    console.log('fetchAnalyticsData called', {
      address,
      isConnected,
      portfolioLoading: portfolio.loading,
      tokensLength: portfolio.tokens.length,
      totalValue: portfolio.totalValue
    });

    if (!address || !isConnected || portfolio.loading) {
      console.log('Early return - missing prerequisites');
      return;
    }

    // Allow analytics to work even with just ETH balance
    if (portfolio.tokens.length === 0 && portfolio.ethBalance <= BigInt(0)) {
      console.log('Early return - no tokens or ETH');
      return;
    }

    setAnalytics(prev => ({ ...prev, loading: true, error: undefined }));

    try {
      // Get coin IDs for portfolio tokens
      const coinIds = getCoinGeckoIds(portfolio.tokens, currentNetwork);
      
      console.log('Coin IDs for analytics:', coinIds);
      
      // Fetch historical data for all tokens and ETH in parallel
      const [tokenHistoricalData, ethHistoricalData] = await Promise.all([
        coinIds.length > 0 ? getMultipleTokenHistoricalPrices(coinIds, timePeriod) : Promise.resolve({}),
        getEthHistoricalPrices(timePeriod)
      ]);

      console.log('Analytics data fetched', {
        coinIds,
        tokenHistoricalDataKeys: Object.keys(tokenHistoricalData),
        ethHistoricalDataLength: ethHistoricalData.length,
        portfolioTokens: portfolio.tokens.length,
        totalValue: portfolio.totalValue
      });

      // Calculate token performance
      const tokenPerformance = calculateTokenPerformance(
        portfolio.tokens,
        tokenHistoricalData,
        ethHistoricalData,
        portfolio.totalValue
      );

      console.log('Token performance calculated', {
        performanceLength: tokenPerformance.length,
        performance: tokenPerformance.map(p => ({
          symbol: p.token.symbol,
          value: p.token.usdValue,
          allocation: p.allocation
        }))
      });

      // If no performance data, create basic analytics from current portfolio
      let finalTokenPerformance = tokenPerformance;
      if (tokenPerformance.length === 0 && (portfolio.tokens.length > 0 || portfolio.ethBalance > BigInt(0))) {
        console.log('Creating basic analytics from current portfolio data');
        finalTokenPerformance = createBasicAnalytics(portfolio);
      }

      // Calculate portfolio metrics
      const metrics = calculatePortfolioMetrics(finalTokenPerformance, portfolio.totalValue);

      // Generate chart data
      const historicalData = generateChartData(finalTokenPerformance, timePeriod);

      // Generate allocation data
      const allocationData = generateAllocationData(finalTokenPerformance);

      setAnalytics({
        metrics,
        tokenPerformance,
        historicalData,
        allocationData,
        loading: false,
        lastUpdated: Date.now()
      });

    } catch (error: any) {
      console.error('Error fetching analytics data:', error);
      setAnalytics(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to fetch analytics data'
      }));
    }
  }, [
    address,
    isConnected,
    portfolio,
    currentNetwork,
    timePeriod,
    calculateTokenPerformance,
    calculatePortfolioMetrics,
    generateChartData,
    generateAllocationData,
    createBasicAnalytics,
    lastFetchTime
  ]);

  // Auto-refresh functionality
  const startAutoRefresh = useCallback(() => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }

    const interval = setInterval(() => {
      console.log('Auto-refresh triggered');
      fetchAnalyticsData();
    }, 60000); // Refresh every 60 seconds instead of 30

    setRefreshInterval(interval);
    return interval;
  }, [fetchAnalyticsData]);

  const stopAutoRefresh = useCallback(() => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
  }, []);

  // Manual refresh
  const refresh = useCallback(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  // Handle time period changes separately
  useEffect(() => {
    if (address && isConnected && !portfolio.loading && portfolio.totalValue >= 0) {
      console.log('Time period changed, refreshing analytics');
      fetchAnalyticsData();
    }
  }, [timePeriod]);

  // Initial fetch and cleanup
  useEffect(() => {
    console.log('Analytics useEffect triggered', {
      address,
      isConnected,
      portfolioLoading: portfolio.loading,
      totalValue: portfolio.totalValue
    });

    if (address && isConnected && !portfolio.loading) {
      // Allow analytics to work even with small portfolio values
      if (portfolio.totalValue >= 0) {
        console.log('Starting analytics data fetch');
        fetchAnalyticsData();
        const interval = startAutoRefresh();
        
        return () => {
          clearInterval(interval);
        };
      } else {
        console.log('Portfolio value too low, setting default analytics');
        setAnalytics(DEFAULT_ANALYTICS);
        stopAutoRefresh();
      }
    } else {
      console.log('Missing prerequisites, setting default analytics');
      setAnalytics(DEFAULT_ANALYTICS);
      stopAutoRefresh();
    }
  }, [address, isConnected, portfolio.loading, portfolio.totalValue]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [refreshInterval]);

  // Export functions
  const exportToCSV = useCallback(() => {
    if (analytics.tokenPerformance.length === 0) return;

    const headers = [
      'Token',
      'Symbol',
      'Current Price',
      'Balance',
      'USD Value',
      'Allocation %',
      '24h Change %',
      '7d Change %',
      '30d Change %'
    ];

    const csvData = analytics.tokenPerformance.map(performance => [
      performance.token.name,
      performance.token.symbol,
      performance.token.price?.toFixed(6) || '0',
      performance.token.balanceFormatted,
      performance.token.usdValue?.toFixed(2) || '0',
      performance.allocation.toFixed(2),
      performance.priceChanges['24h'].percentage.toFixed(2),
      performance.priceChanges['7d'].percentage.toFixed(2),
      performance.priceChanges['30d'].percentage.toFixed(2)
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `portfolio-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [analytics.tokenPerformance]);

  return {
    ...analytics,
    refresh,
    exportToCSV,
    startAutoRefresh,
    stopAutoRefresh,
    isAutoRefreshing: refreshInterval !== null
  };
};