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