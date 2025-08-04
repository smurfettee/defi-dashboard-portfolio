import { SUPPORTED_NETWORKS } from '../utils/constants';

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

// ===== ADVANCED FEATURES TYPES =====

// DeFi Protocol Integration Types
export interface DeFiPosition {
  id: string;
  protocol: DeFiProtocol;
  type: DeFiPositionType;
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  tokenDecimals: number;
  balance: bigint;
  balanceFormatted: string;
  usdValue: number;
  apy?: number;
  rewards?: DeFiReward[];
  impermanentLoss?: number;
  entryPrice?: number;
  currentPrice?: number;
  timestamp: number;
  contractAddress: string;
  poolAddress?: string;
  pairTokens?: string[];
  liquidity?: {
    token0: string;
    token1: string;
    amount0: bigint;
    amount1: bigint;
    share: number;
  };
}

export type DeFiProtocol = 
  | 'uniswap_v2'
  | 'uniswap_v3'
  | 'aave'
  | 'compound'
  | 'curve'
  | 'balancer'
  | 'sushiswap'
  | 'yearn'
  | 'convex'
  | 'lido'
  | 'rocketpool';

export type DeFiPositionType = 
  | 'liquidity_provider'
  | 'lending'
  | 'borrowing'
  | 'staking'
  | 'yield_farming'
  | 'vault'
  | 'governance';

export interface DeFiReward {
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  amount: bigint;
  amountFormatted: string;
  usdValue: number;
  isClaimed: boolean;
  apy: number;
}

export interface DeFiProtocolData {
  protocol: DeFiProtocol;
  name: string;
  description: string;
  logoURI: string;
  website: string;
  tvl: number;
  apy: number;
  positions: DeFiPosition[];
  totalValue: number;
  rewards: DeFiReward[];
  unclaimedRewards: number;
}

// Tax Reporting Types
export interface TaxTransaction {
  id: string;
  hash: string;
  timestamp: number;
  date: string;
  type: TaxTransactionType;
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  amount: bigint;
  amountFormatted: string;
  priceAtTime: number;
  usdValue: number;
  gasUsed: bigint;
  gasPrice: bigint;
  gasCost: number;
  costBasis: number;
  proceeds: number;
  gainLoss: number;
  gainLossPercentage: number;
  holdingPeriod: number; // in days
  isLongTerm: boolean;
  fifoCostBasis: number;
  lifoCostBasis: number;
  method: 'FIFO' | 'LIFO' | 'SPECIFIC_ID';
}

export type TaxTransactionType = 
  | 'buy'
  | 'sell'
  | 'transfer_in'
  | 'transfer_out'
  | 'airdrop'
  | 'stake'
  | 'unstake'
  | 'reward'
  | 'swap';

export interface TaxReport {
  year: number;
  totalProceeds: number;
  totalCostBasis: number;
  totalGainLoss: number;
  shortTermGainLoss: number;
  longTermGainLoss: number;
  transactions: TaxTransaction[];
  summary: {
    totalTransactions: number;
    buyTransactions: number;
    sellTransactions: number;
    averageHoldingPeriod: number;
    bestPerformingToken: string;
    worstPerformingToken: string;
  };
}

export interface TaxSettings {
  method: 'FIFO' | 'LIFO' | 'SPECIFIC_ID';
  includeGasFees: boolean;
  includeAirdrops: boolean;
  includeStakingRewards: boolean;
  longTermThreshold: number; // days
  taxYear: number;
}

// Portfolio Risk Assessment Types
export interface RiskMetrics {
  volatility: number;
  riskScore: 'low' | 'medium' | 'high';
  var95: number; // Value at Risk (95% confidence)
  maxDrawdown: number;
  sharpeRatio: number;
  beta: number;
  correlationMatrix: Record<string, Record<string, number>>;
  diversificationScore: number;
  concentrationRisk: number;
  sectorAllocation: Record<string, number>;
}

export interface TokenCategory {
  id: string;
  name: string;
  description: string;
  tokens: string[];
  riskLevel: 'low' | 'medium' | 'high';
  marketCap: number;
  volatility: number;
}

export interface PortfolioOptimization {
  currentAllocation: Record<string, number>;
  suggestedAllocation: Record<string, number>;
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  expectedReturn: number;
  expectedRisk: number;
  rebalancingNeeded: boolean;
  rebalancingCost: number;
  recommendations: OptimizationRecommendation[];
}

export interface OptimizationRecommendation {
  type: 'buy' | 'sell' | 'hold';
  tokenSymbol: string;
  amount: number;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

// Advanced Analytics Types
export interface DCAAnalysis {
  isDCAPortfolio: boolean;
  averagePurchasePrice: number;
  totalInvested: number;
  averagePurchaseInterval: number;
  dcaEfficiency: number;
  purchases: DCAPurchase[];
}

export interface DCAPurchase {
  timestamp: number;
  date: string;
  tokenSymbol: string;
  amount: number;
  price: number;
  usdValue: number;
}

export interface WhatIfScenario {
  scenario: string;
  description: string;
  currentValue: number;
  alternativeValue: number;
  difference: number;
  percentageChange: number;
  tokens: string[];
  date: string;
}

export interface BenchmarkComparison {
  benchmark: 'ETH' | 'BTC' | 'SP500' | 'DEFI_PULSE';
  portfolioReturn: number;
  benchmarkReturn: number;
  outperformance: number;
  correlation: number;
  beta: number;
  sharpeRatio: number;
  period: TimePeriod;
}

// Social and Comparison Features
export interface PortfolioShare {
  id: string;
  name: string;
  description: string;
  isPublic: boolean;
  shareUrl: string;
  createdAt: number;
  performance: {
    totalReturn: number;
    period: TimePeriod;
  };
  privacySettings: {
    hideBalances: boolean;
    hideAddresses: boolean;
    allowCopying: boolean;
  };
}

export interface SocialMetrics {
  sentiment: 'bullish' | 'bearish' | 'neutral';
  socialScore: number;
  mentions: number;
  engagement: number;
  influencers: string[];
  trending: boolean;
}

// Predictive Analytics Types
export interface PricePrediction {
  tokenSymbol: string;
  currentPrice: number;
  predictedPrice: number;
  confidence: number;
  timeframe: '1d' | '7d' | '30d' | '90d';
  factors: PredictionFactor[];
  lastUpdated: number;
}

export interface PredictionFactor {
  name: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number;
  description: string;
}

export interface TechnicalIndicator {
  name: string;
  value: number;
  signal: 'buy' | 'sell' | 'hold';
  strength: number;
  description: string;
}

export interface MarketCycle {
  phase: 'bull' | 'bear' | 'accumulation' | 'distribution';
  confidence: number;
  indicators: string[];
  duration: number;
  description: string;
}

// Machine Learning Types
export interface MLModel {
  id: string;
  name: string;
  type: 'price_prediction' | 'portfolio_optimization' | 'risk_assessment';
  accuracy: number;
  lastTrained: number;
  features: string[];
  predictions: MLPrediction[];
}

export interface MLPrediction {
  id: string;
  modelId: string;
  input: Record<string, any>;
  output: Record<string, any>;
  confidence: number;
  timestamp: number;
}

// Database and Caching Types
export interface UserPreferences {
  userId: string;
  theme: Theme;
  defaultNetwork: keyof typeof SUPPORTED_NETWORKS;
  taxSettings: TaxSettings;
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  notifications: NotificationSettings;
  dashboardLayout: DashboardLayout;
  privacySettings: PrivacySettings;
}

export interface NotificationSettings {
  priceAlerts: boolean;
  portfolioChanges: boolean;
  taxEvents: boolean;
  defiRewards: boolean;
  riskAlerts: boolean;
  email: boolean;
  push: boolean;
}

export interface DashboardLayout {
  widgets: WidgetConfig[];
  columns: number;
  theme: 'compact' | 'comfortable' | 'spacious';
}

export interface WidgetConfig {
  id: string;
  type: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  settings: Record<string, any>;
}

export interface PrivacySettings {
  shareAnalytics: boolean;
  sharePerformance: boolean;
  allowTracking: boolean;
  dataRetention: number; // days
}

// API and Service Types
export interface APIConfig {
  baseUrl: string;
  apiKey?: string;
  rateLimit: number;
  timeout: number;
}

export interface CacheConfig {
  ttl: number;
  maxSize: number;
  strategy: 'lru' | 'fifo' | 'ttl';
}

export interface SubscriptionTier {
  id: string;
  name: string;
  price: number;
  features: string[];
  limits: Record<string, number>;
  isActive: boolean;
}

// Error and Status Types
export interface ServiceError {
  code: string;
  message: string;
  details?: any;
  timestamp: number;
  retryable: boolean;
}

export interface ServiceStatus {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime: number;
  lastCheck: number;
  error?: ServiceError;
}