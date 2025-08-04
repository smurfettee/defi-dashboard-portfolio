export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: bigint;
  balanceFormatted: string;
  usdValue?: number;
  price?: number;
  logoURI?: string;
}

export interface Portfolio {
  totalValue: number;
  ethBalance: bigint;
  ethBalanceFormatted: string;
  ethUsdValue: number;
  tokens: Token[];
  loading: boolean;
  error?: string;
}

export interface WalletState {
  address?: string;
  isConnected: boolean;
  isConnecting: boolean;
  error?: string;
}

export interface CoinGeckoPrice {
  [tokenId: string]: {
    usd: number;
  };
}

export type CoinGeckoPriceResponse = Record<string, { usd: number }>;

export interface TokenListResponse {
  tokens: Array<{
    address: string;
    chainId: number;
    decimals: number;
    logoURI: string;
    name: string;
    symbol: string;
  }>;
}

export interface ERC20Token {
  address: `0x${string}`;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
}

export type Theme = 'light' | 'dark' | 'system';

// Transaction History Types
export interface TransactionBase {
  hash: string;
  blockNumber: bigint;
  blockHash: string;
  transactionIndex: number;
  timestamp: number;
  from: string;
  to: string | null;
  value: bigint;
  gasPrice: bigint;
  gasUsed?: bigint;
  gasLimit: bigint;
  status: 'success' | 'failed' | 'pending';
  nonce: number;
  input: string;
  confirmations?: number;
  type: TransactionType;
}

export interface EthTransaction extends TransactionBase {
  type: 'eth_transfer' | 'contract_interaction';
  direction: 'in' | 'out' | 'self';
  ethValue: string;
  usdValue?: number;
  methodName?: string;
}

export interface TokenTransfer extends TransactionBase {
  type: 'token_transfer';
  direction: 'in' | 'out';
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  tokenDecimals: number;
  tokenValue: string;
  tokenAmount: bigint;
  usdValue?: number;
  logIndex: number;
}

export type Transaction = EthTransaction | TokenTransfer;

export type TransactionType = 
  | 'eth_transfer'
  | 'token_transfer' 
  | 'contract_interaction'
  | 'swap'
  | 'defi';

export interface TransactionFilter {
  type?: TransactionType | 'all';
  direction?: 'in' | 'out' | 'all';
  status?: 'success' | 'failed' | 'pending' | 'all';
  dateFrom?: Date;
  dateTo?: Date;
  tokenAddress?: string;
  search?: string;
}

export interface TransactionHistoryState {
  transactions: Transaction[];
  loading: boolean;
  hasMore: boolean;
  error?: string;
  filter: TransactionFilter;
  page: number;
  totalCount?: number;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  fromBlock?: bigint;
  toBlock?: bigint;
}

// Portfolio Analytics Types
export type TimePeriod = '24h' | '7d' | '30d' | '90d' | '1y' | 'all';

export interface PriceChange {
  absolute: number;
  percentage: number;
  period: TimePeriod;
}

export interface HistoricalPrice {
  timestamp: number;
  price: number;
  date: string;
}

export interface TokenPerformance {
  token: Token;
  priceChanges: {
    '24h': PriceChange;
    '7d': PriceChange;
    '30d': PriceChange;
  };
  allocation: number; // Percentage of total portfolio
  unrealizedGainLoss?: {
    absolute: number;
    percentage: number;
  };
  historicalPrices: HistoricalPrice[];
}

export interface PortfolioMetrics {
  totalValue: number;
  totalChange24h: PriceChange;
  totalChange7d: PriceChange;
  totalChange30d: PriceChange;
  allTimeHigh?: {
    value: number;
    date: string;
  };
  allTimeLow?: {
    value: number;
    date: string;
  };
  numberOfTokens: number;
  largestHoldingPercentage: number;
  bestPerformer?: {
    symbol: string;
    change: PriceChange;
  };
  worstPerformer?: {
    symbol: string;
    change: PriceChange;
  };
}

export interface ChartDataPoint {
  timestamp: number;
  date: string;
  value: number;
  tokens?: { [symbol: string]: number };
}

export interface PortfolioAnalytics {
  metrics: PortfolioMetrics;
  tokenPerformance: TokenPerformance[];
  historicalData: ChartDataPoint[];
  allocationData: {
    symbol: string;
    value: number;
    percentage: number;
    color?: string;
  }[];
  loading: boolean;
  error?: string;
  lastUpdated?: number;
}

export interface AnalyticsCacheData {
  data: any;
  timestamp: number;
  expiry: number;
}

export interface CoinGeckoHistoricalResponse {
  prices: [number, number][];
  market_caps?: [number, number][];
  total_volumes?: [number, number][];
}