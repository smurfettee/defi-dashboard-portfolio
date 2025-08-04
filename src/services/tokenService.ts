import { formatUnits } from 'viem';
import { readContract } from 'viem/actions';
import { createPublicClientForNetwork } from './walletService';
import { 
  Token, 
  CoinGeckoPriceResponse, 
  CoinGeckoHistoricalResponse, 
  HistoricalPrice, 
  TimePeriod,
  AnalyticsCacheData 
} from '../types';
import { TOKEN_CONFIGS, COINGECKO_API_BASE, ERROR_MESSAGES, SUPPORTED_NETWORKS } from '../utils/constants';
// Using built-in Date methods instead of date-fns for date formatting

// ERC-20 ABI for balance and metadata functions
const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'symbol',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'string' }],
  },
  {
    name: 'name',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'string' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint8' }],
  },
] as const;

/**
 * Get balance for a specific ERC-20 token
 */
export const getTokenBalance = async (
  tokenAddress: `0x${string}`,
  walletAddress: `0x${string}`,
  decimals: number,
  networkKey: keyof typeof SUPPORTED_NETWORKS = 'mainnet'
): Promise<{ balance: bigint; formatted: string }> => {
  try {
    const publicClient = createPublicClientForNetwork(networkKey);
    const balance = await readContract(publicClient, {
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [walletAddress],
    }) as bigint;

    const formatted = formatUnits(balance, decimals);

    return { balance, formatted };
  } catch (error) {
    console.error(`Error fetching balance for token ${tokenAddress}:`, error);
    // Return zero balance instead of throwing error
    return { balance: BigInt(0), formatted: '0' };
  }
};

/**
 * Get token metadata (symbol, name, decimals)
 */
export const getTokenMetadata = async (
  tokenAddress: `0x${string}`,
  networkKey: keyof typeof SUPPORTED_NETWORKS = 'mainnet'
) => {
  try {
    const publicClient = createPublicClientForNetwork(networkKey);
    const [symbol, name, decimals] = await Promise.all([
      readContract(publicClient, {
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'symbol',
      }) as Promise<string>,
      readContract(publicClient, {
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'name',
      }) as Promise<string>,
      readContract(publicClient, {
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'decimals',
      }) as Promise<number>,
    ]);

    return { symbol, name, decimals };
  } catch (error) {
    console.error(`Error fetching metadata for token ${tokenAddress}:`, error);
    return null;
  }
};

/**
 * Get balances for all popular tokens
 */
export const getTokenBalances = async (
  walletAddress: `0x${string}`,
  networkKey: keyof typeof SUPPORTED_NETWORKS = 'mainnet'
): Promise<Token[]> => {
  const tokens: Token[] = [];
  const networkTokens = TOKEN_CONFIGS[networkKey];

  try {
    const balancePromises = networkTokens.map(async (tokenInfo) => {
      try {
        const { balance, formatted } = await getTokenBalance(
          tokenInfo.address,
          walletAddress,
          tokenInfo.decimals,
          networkKey
        );

        // Only include tokens with non-zero balance
        if (balance > BigInt(0)) {
          return {
            address: tokenInfo.address,
            symbol: tokenInfo.symbol,
            name: tokenInfo.name,
            decimals: tokenInfo.decimals,
            balance,
            balanceFormatted: formatted,
          };
        }
        return null;
      } catch (error) {
        console.error(`Error processing token ${tokenInfo.symbol}:`, error);
        return null;
      }
    });

    const results = await Promise.allSettled(balancePromises);
    
    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value) {
        tokens.push(result.value);
      }
    });

    return tokens;
  } catch (error) {
    console.error('Error fetching token balances:', error);
    // Return empty array instead of throwing error
    return [];
  }
};

/**
 * Fetch token prices from CoinGecko
 */
export const getTokenPrices = async (coinIds: string[]): Promise<CoinGeckoPriceResponse> => {
  if (coinIds.length === 0) return {};

  try {
    const idsParam = coinIds.join(',');
    const response = await fetch(
      `${COINGECKO_API_BASE}/simple/price?ids=${idsParam}&vs_currencies=usd`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching token prices:', error);
    throw new Error(ERROR_MESSAGES.PRICE_FETCH_ERROR);
  }
};

/**
 * Get ETH price from CoinGecko
 */
export const getEthPrice = async (): Promise<number> => {
  try {
    const response = await fetch(
      `${COINGECKO_API_BASE}/simple/price?ids=ethereum&vs_currencies=usd`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.ethereum?.usd || 0;
  } catch (error) {
    console.error('Error fetching ETH price:', error);
    return 0;
  }
};

/**
 * Get coin ID mapping for tokens
 */
export const getCoinGeckoIds = (
  tokens: Token[], 
  networkKey: keyof typeof SUPPORTED_NETWORKS = 'mainnet'
): string[] => {
  const coinIds: string[] = [];
  const networkTokens = TOKEN_CONFIGS[networkKey];

  tokens.forEach((token) => {
    const popularToken = networkTokens.find(
      (pt) => pt.address.toLowerCase() === token.address.toLowerCase()
    );
    
    if (popularToken) {
      coinIds.push(popularToken.coinGeckoId);
    }
  });

  return coinIds;
};

// Analytics Cache Management
const ANALYTICS_CACHE_PREFIX = 'portfolio_analytics_';
const CACHE_EXPIRY_HOURS = 1; // 1 hour cache for historical data

/**
 * Get cached data from localStorage
 */
const getCachedData = (key: string): AnalyticsCacheData | null => {
  try {
    const cached = localStorage.getItem(`${ANALYTICS_CACHE_PREFIX}${key}`);
    if (!cached) return null;

    const data: AnalyticsCacheData = JSON.parse(cached);
    if (Date.now() > data.expiry) {
      localStorage.removeItem(`${ANALYTICS_CACHE_PREFIX}${key}`);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error reading from cache:', error);
    return null;
  }
};

/**
 * Set cached data in localStorage
 */
const setCachedData = (key: string, data: any): void => {
  try {
    const cacheData: AnalyticsCacheData = {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + (CACHE_EXPIRY_HOURS * 60 * 60 * 1000)
    };
    localStorage.setItem(`${ANALYTICS_CACHE_PREFIX}${key}`, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error setting cache:', error);
  }
};

/**
 * Get time period in days for CoinGecko API
 */
const getTimePeriodDays = (period: TimePeriod): number => {
  switch (period) {
    case '24h': return 1;
    case '7d': return 7;
    case '30d': return 30;
    case '90d': return 90;
    case '1y': return 365;
    case 'all': return 365 * 5; // 5 years for 'all' period
    default: return 30;
  }
};

/**
 * Fetch historical prices for a single token
 */
export const getTokenHistoricalPrices = async (
  coinId: string,
  period: TimePeriod = '30d'
): Promise<HistoricalPrice[]> => {
  const cacheKey = `historical_${coinId}_${period}`;
  
  // Check cache first
  const cached = getCachedData(cacheKey);
  if (cached) {
    return cached.data;
  }

  try {
    const days = getTimePeriodDays(period);
    const url = period === 'all' 
      ? `${COINGECKO_API_BASE}/coins/${coinId}/market_chart?vs_currency=usd&days=max`
      : `${COINGECKO_API_BASE}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`;

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: CoinGeckoHistoricalResponse = await response.json();
    
    const historicalPrices: HistoricalPrice[] = data.prices.map(([timestamp, price]) => ({
      timestamp,
      price,
      date: new Date(timestamp).toLocaleString('en-CA', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit' 
      }).replace(',', '')
    }));

    // Cache the result
    setCachedData(cacheKey, historicalPrices);

    return historicalPrices;
  } catch (error) {
    console.error(`Error fetching historical prices for ${coinId}:`, error);
    return [];
  }
};

/**
 * Fetch historical prices for multiple tokens
 */
export const getMultipleTokenHistoricalPrices = async (
  coinIds: string[],
  period: TimePeriod = '30d'
): Promise<Record<string, HistoricalPrice[]>> => {
  const promises = coinIds.map(async (coinId) => {
    const prices = await getTokenHistoricalPrices(coinId, period);
    return { coinId, prices };
  });

  try {
    // Use Promise.allSettled to handle individual failures gracefully
    const results = await Promise.allSettled(promises);
    const historicalData: Record<string, HistoricalPrice[]> = {};

    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        historicalData[result.value.coinId] = result.value.prices;
      }
    });

    return historicalData;
  } catch (error) {
    console.error('Error fetching multiple historical prices:', error);
    return {};
  }
};

/**
 * Get ETH historical prices
 */
export const getEthHistoricalPrices = async (period: TimePeriod = '30d'): Promise<HistoricalPrice[]> => {
  return getTokenHistoricalPrices('ethereum', period);
};

/**
 * Fetch price change data for tokens
 */
export const getTokenPriceChanges = async (
  coinIds: string[]
): Promise<Record<string, { price_change_percentage_24h: number; price_change_percentage_7d: number; price_change_percentage_30d: number }>> => {
  if (coinIds.length === 0) return {};

  const cacheKey = `price_changes_${coinIds.join(',').substring(0, 50)}`; // Limit cache key length
  
  // Check cache first
  const cached = getCachedData(cacheKey);
  if (cached) {
    return cached.data;
  }

  try {
    const idsParam = coinIds.join(',');
    const url = `${COINGECKO_API_BASE}/coins/markets?vs_currency=usd&ids=${idsParam}&price_change_percentage=24h,7d,30d`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const priceChanges: Record<string, any> = {};

    data.forEach((coin: any) => {
      priceChanges[coin.id] = {
        price_change_percentage_24h: coin.price_change_percentage_24h || 0,
        price_change_percentage_7d: coin.price_change_percentage_7d_in_currency || 0,
        price_change_percentage_30d: coin.price_change_percentage_30d_in_currency || 0
      };
    });

    // Cache for shorter time since price changes are more volatile
    setCachedData(cacheKey, priceChanges);

    return priceChanges;
  } catch (error) {
    console.error('Error fetching price changes:', error);
    return {};
  }
};

/**
 * Clear analytics cache
 */
export const clearAnalyticsCache = (): void => {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(ANALYTICS_CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error clearing analytics cache:', error);
  }
};