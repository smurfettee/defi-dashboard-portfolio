// Supported networks
export const SUPPORTED_NETWORKS = {
  mainnet: {
    id: 1,
    name: 'Ethereum Mainnet',
    chainId: '0x1',
    rpcUrl: 'https://ethereum.publicnode.com',
    explorer: 'https://etherscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  sepolia: {
    id: 11155111,
    name: 'Sepolia Testnet',
    chainId: '0xaa36a7',
    rpcUrl: 'https://ethereum-sepolia.publicnode.com',
    explorer: 'https://sepolia.etherscan.io',
    nativeCurrency: {
      name: 'Sepolia Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },
} as const;

// Default network (can be changed for testing)
export const DEFAULT_NETWORK = 'sepolia' as keyof typeof SUPPORTED_NETWORKS;

// Token configurations for different networks
export const TOKEN_CONFIGS = {
  mainnet: [
    {
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      coinGeckoId: 'usd-coin',
    },
    {
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
      coinGeckoId: 'tether',
    },
    {
      address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      decimals: 18,
      coinGeckoId: 'dai',
    },
    {
      address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
      symbol: 'WBTC',
      name: 'Wrapped BTC',
      decimals: 8,
      coinGeckoId: 'wrapped-bitcoin',
    },
    {
      address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      symbol: 'WETH',
      name: 'Wrapped Ether',
      decimals: 18,
      coinGeckoId: 'weth',
    },
    {
      address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
      symbol: 'UNI',
      name: 'Uniswap',
      decimals: 18,
      coinGeckoId: 'uniswap',
    },
    {
      address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
      symbol: 'AAVE',
      name: 'Aave Token',
      decimals: 18,
      coinGeckoId: 'aave',
    },
    {
      address: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
      symbol: 'LINK',
      name: 'ChainLink Token',
      decimals: 18,
      coinGeckoId: 'chainlink',
    },
  ],
  sepolia: [
    {
      address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
      symbol: 'USDC',
      name: 'USD Coin (Sepolia)',
      decimals: 6,
      coinGeckoId: 'usd-coin',
    },
    {
      address: '0x779877A7B0D9E8603169DdbD7836e478b4624789',
      symbol: 'LINK',
      name: 'ChainLink Token (Sepolia)',
      decimals: 18,
      coinGeckoId: 'chainlink',
    },
    {
      address: '0x097D90c9d3E0B50Ca60e1ae45F6A81010f9FB534',
      symbol: 'WETH',
      name: 'Wrapped Ether (Sepolia)',
      decimals: 18,
      coinGeckoId: 'weth',
    },
    {
      address: '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9',
      symbol: 'USDT',
      name: 'Tether USD (Sepolia)',
      decimals: 6,
      coinGeckoId: 'tether',
    },
  ],
} as const;

// Popular ERC-20 tokens to check for balances (mainnet addresses)
export const POPULAR_TOKENS = [...TOKEN_CONFIGS.mainnet] as Array<{
  address: `0x${string}`;
  symbol: string;
  name: string;
  decimals: number;
  coinGeckoId: string;
}>;

// RPC URLs (you may want to use environment variables for these)
export const RPC_URLS = {
  ethereum: 'https://eth.llamarpc.com',
  fallback: 'https://cloudflare-eth.com',
};

// CoinGecko API base URL
export const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';

// Error messages
export const ERROR_MESSAGES = {
  WALLET_NOT_FOUND: 'MetaMask not found. Please install MetaMask.',
  CONNECTION_REJECTED: 'Connection rejected. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNKNOWN_ERROR: 'An unknown error occurred.',
  PRICE_FETCH_ERROR: 'Failed to fetch token prices.',
  BALANCE_FETCH_ERROR: 'Failed to fetch token balances.',
} as const;