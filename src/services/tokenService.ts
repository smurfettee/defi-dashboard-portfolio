import { formatUnits } from 'viem';
import { readContract } from 'viem/actions';
import { createPublicClientForNetwork } from './walletService';
import { Token, CoinGeckoPriceResponse } from '../types';
import { TOKEN_CONFIGS, COINGECKO_API_BASE, ERROR_MESSAGES, SUPPORTED_NETWORKS } from '../utils/constants';

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