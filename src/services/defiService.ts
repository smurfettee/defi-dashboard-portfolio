import { readContract } from 'viem/actions';
import { createPublicClient, http, Address, getAddress } from 'viem';
import { mainnet, sepolia } from 'viem/chains';
import { formatUnits, parseUnits } from 'viem';
import { DeFiPosition, DeFiProtocol, DeFiPositionType, DeFiReward, DeFiProtocolData } from '../types';
import { SUPPORTED_NETWORKS } from '../utils/constants';
import { createPublicClientForNetwork } from './walletService';

// Cache store for DeFi data
class DeFiCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  set(key: string, data: any, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > cached.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  clear(): void {
    this.cache.clear();
  }

  // Cache keys
  static getWalletPositionsKey(walletAddress: string, network: string): string {
    return `defi_positions_${walletAddress}_${network}`;
  }

  static getProtocolDataKey(address: string, network: string): string {
    return `defi_protocol_${address}_${network}`;
  }

  static getPortfolioValueKey(address: string, network: string): string {
    return `defi_portfolio_${address}_${network}`;
  }
}

// Global cache instance
const defiCache = new DeFiCache();

// Real DeFi Protocol Addresses (Mainnet)
const PROTOCOL_ADDRESSES = {
  mainnet: {
    uniswap_v2_factory: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
    uniswap_v3_factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
    uniswap_v3_position_manager: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
    aave_lending_pool: '0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9',
    aave_lending_pool_addresses_provider: '0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5',
    compound_comptroller: '0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B',
    compound_cusdc: '0x39AA39c021dfbaE8faC545936693aC917d5E7563',
    compound_cdai: '0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643',
  },
  sepolia: {
    uniswap_v2_factory: '0x7E0987E5b3a30e3f2828572Bb659A548460a3003',
    uniswap_v3_factory: '0x0227628f3F023bb0B980b67D528571c9510c8C8e',
    uniswap_v3_position_manager: '0x1238536071E1c677A632429e3655c799b22cDA52',
    aave_lending_pool: '0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951',
    aave_lending_pool_addresses_provider: '0x178113104fEcbcD7fF8669a0150721e231F0FD4B',
    compound_comptroller: '0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B',
    compound_cusdc: '0x39AA39c021dfbaE8faC545936693aC917d5E7563',
    compound_cdai: '0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643',
  },
} as const;

// DeFi Protocol ABIs
const UNISWAP_V2_FACTORY_ABI = [
  {
    name: 'allPairs',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'index', type: 'uint256' }],
    outputs: [{ type: 'address' }],
  },
  {
    name: 'allPairsLength',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'getPair',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'tokenA', type: 'address' },
      { name: 'tokenB', type: 'address' },
    ],
    outputs: [{ type: 'address' }],
  },
] as const;

const UNISWAP_V2_PAIR_ABI = [
  {
    name: 'token0',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address' }],
  },
  {
    name: 'token1',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address' }],
  },
  {
    name: 'getReserves',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { type: 'uint112' },
      { type: 'uint112' },
      { type: 'uint32' },
    ],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'totalSupply',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
] as const;

const UNISWAP_V3_POSITION_MANAGER_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'tokenOfOwnerByIndex',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'index', type: 'uint256' },
    ],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'positions',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [
      { name: 'nonce', type: 'uint96' },
      { name: 'operator', type: 'address' },
      { name: 'token0', type: 'address' },
      { name: 'token1', type: 'address' },
      { name: 'fee', type: 'uint24' },
      { name: 'tickLower', type: 'int24' },
      { name: 'tickUpper', type: 'int24' },
      { name: 'liquidity', type: 'uint128' },
      { name: 'feeGrowthInside0LastX128', type: 'uint256' },
      { name: 'feeGrowthInside1LastX128', type: 'uint256' },
      { name: 'tokensOwed0', type: 'uint128' },
      { name: 'tokensOwed1', type: 'uint128' },
    ],
  },
] as const;

const AAVE_LENDING_POOL_ABI = [
  {
    name: 'getReserveData',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'asset', type: 'address' }],
    outputs: [
      { name: 'configuration', type: 'uint256' },
      { name: 'liquidityIndex', type: 'uint128' },
      { name: 'variableBorrowIndex', type: 'uint128' },
      { name: 'currentLiquidityRate', type: 'uint128' },
      { name: 'currentVariableBorrowRate', type: 'uint128' },
      { name: 'currentStableBorrowRate', type: 'uint128' },
      { name: 'lastUpdateTime', type: 'uint40' },
      { name: 'aTokenAddress', type: 'address' },
      { name: 'stableDebtTokenAddress', type: 'address' },
      { name: 'variableDebtTokenAddress', type: 'address' },
      { name: 'interestRateStrategyAddress', type: 'address' },
      { name: 'id', type: 'uint8' },
    ],
  },
] as const;

const AAVE_ATOKEN_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'totalSupply',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
] as const;

const COMPOUND_COMPTROLLER_ABI = [
  {
    name: 'getAssetsIn',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'address[]' }],
  },
  {
    name: 'getAccountSnapshot',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [
      { type: 'uint256' },
      { type: 'uint256' },
      { type: 'uint256' },
      { type: 'uint256' },
    ],
  },
] as const;

const COMPOUND_CTOKEN_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'borrowBalanceStored',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'exchangeRateStored',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
] as const;

// Protocol metadata
const PROTOCOL_METADATA = {
  uniswap_v2: {
    name: 'Uniswap V2',
    description: 'Automated Market Maker',
    logo: '🦄',
    website: 'https://uniswap.org',
    color: '#FF007A',
  },
  uniswap_v3: {
    name: 'Uniswap V3',
    description: 'Concentrated Liquidity AMM',
    logo: '🦄',
    website: 'https://uniswap.org',
    color: '#FF007A',
  },
  aave: {
    name: 'Aave',
    description: 'Lending & Borrowing Protocol',
    logo: '🦇',
    website: 'https://aave.com',
    color: '#B6509E',
  },
  compound: {
    name: 'Compound',
    description: 'Lending & Borrowing Protocol',
    logo: '🏦',
    website: 'https://compound.finance',
    color: '#00D395',
  },
  curve: {
    name: 'Curve Finance',
    description: 'Efficient Stablecoin Trading',
    logo: '📈',
    website: 'https://curve.fi',
    color: '#3465A4',
  },
  balancer: {
    name: 'Balancer',
    description: 'Automated Portfolio Manager',
    logo: '⚖️',
    website: 'https://balancer.fi',
    color: '#1E1E1E',
  },
  sushiswap: {
    name: 'SushiSwap',
    description: 'Community-Driven DEX',
    logo: '🍣',
    website: 'https://sushi.com',
    color: '#F38BA8',
  },
  yearn: {
    name: 'Yearn Finance',
    description: 'Yield Aggregator',
    logo: '🏦',
    website: 'https://yearn.finance',
    color: '#006AE3',
  },
  convex: {
    name: 'Convex Finance',
    description: 'Boosted Curve Rewards',
    logo: '📊',
    website: 'https://convexfinance.com',
    color: '#FF6B6B',
  },
  lido: {
    name: 'Lido',
    description: 'Liquid Staking',
    logo: '🏊',
    website: 'https://lido.fi',
    color: '#00D4AA',
  },
  rocketpool: {
    name: 'Rocket Pool',
    description: 'Decentralized Staking',
    logo: '🚀',
    website: 'https://rocketpool.net',
    color: '#FF6B35',
  },
} as const;

// Common token addresses for efficient checking
const COMMON_TOKENS = {
  mainnet: {
    USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    WBTC: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    UNI: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
  },
  sepolia: {
    USDC: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F', // Add DAI for sepolia
    WETH: '0x097D90c9d3E0B50Ca60e1ae45F6A81010f9FB534',
    LINK: '0x779877A7B0D9E8603169DdbD7836e478b4624789',
  },
} as const;

/**
 * Efficiently get all DeFi positions for a wallet with caching
 */
export const getAllDeFiPositions = async (
  walletAddress: `0x${string}`,
  networkKey: keyof typeof SUPPORTED_NETWORKS = 'mainnet'
): Promise<DeFiPosition[]> => {
  try {
    // Check cache first
    const cacheKey = DeFiCache.getWalletPositionsKey(walletAddress, networkKey);
    const cached = defiCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const publicClient = createPublicClientForNetwork(networkKey);
    const positions: DeFiPosition[] = [];

    // Use a more defensive approach - only check if wallet has any positions
    // For now, let's create some mock positions to demonstrate the functionality
    // In a real implementation, you would:
    // 1. Check if wallet has any LP tokens from major DEXes
    // 2. Check if wallet has any lending positions
    // 3. Check if wallet has any yield farming positions

    // For demonstration, let's create some sample positions
    const samplePositions: DeFiPosition[] = [
      {
        id: 'uni_v2_sample_1',
        protocol: 'uniswap_v2',
        type: 'liquidity_provider',
        tokenAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' as `0x${string}`,
        tokenSymbol: 'WETH/USDC LP',
        tokenName: 'Uniswap V2 WETH/USDC LP',
        tokenDecimals: 18,
        balance: BigInt('1000000000000000000'), // 1 LP token
        balanceFormatted: '1.0',
        usdValue: 2500,
        apy: 12.5,
        impermanentLoss: -2.3,
        entryPrice: 2400,
        currentPrice: 2500,
        timestamp: Date.now(),
        contractAddress: '0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc' as `0x${string}`,
        poolAddress: '0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc' as `0x${string}`,
        pairTokens: [
          '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
          '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
        ],
        liquidity: {
          token0: 'WETH',
          token1: 'USDC',
          amount0: BigInt('500000000000000000'), // 0.5 WETH
          amount1: BigInt('1250000000'), // 1250 USDC (6 decimals)
          share: 0.1
        },
        rewards: []
      },
      {
        id: 'aave_sample_1',
        protocol: 'aave',
        type: 'lending',
        tokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as `0x${string}`,
        tokenSymbol: 'aUSDC',
        tokenName: 'Aave USDC',
        tokenDecimals: 6,
        balance: BigInt('1000000'), // 1 USDC
        balanceFormatted: '1.0',
        usdValue: 1.0,
        apy: 3.2,
        impermanentLoss: 0,
        entryPrice: 1.0,
        currentPrice: 1.0,
        timestamp: Date.now(),
        contractAddress: '0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9' as `0x${string}`,
        poolAddress: '0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9' as `0x${string}`,
        pairTokens: [],
        liquidity: undefined,
        rewards: [
          {
            tokenAddress: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9' as `0x${string}`,
            tokenSymbol: 'AAVE',
            tokenName: 'Aave Token',
            amount: BigInt('100000000000000000'), // 0.1 AAVE
            amountFormatted: '0.1',
            usdValue: 8.5,
            isClaimed: false,
            apy: 0
          }
        ]
      },
      {
        id: 'compound_sample_1',
        protocol: 'compound',
        type: 'lending',
        tokenAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F' as `0x${string}`,
        tokenSymbol: 'cDAI',
        tokenName: 'Compound DAI',
        tokenDecimals: 18,
        balance: BigInt('1000000000000000000000'), // 1000 DAI
        balanceFormatted: '1000.0',
        usdValue: 1000.0,
        apy: 4.1,
        impermanentLoss: 0,
        entryPrice: 1.0,
        currentPrice: 1.0,
        timestamp: Date.now(),
        contractAddress: '0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643' as `0x${string}`,
        poolAddress: '0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643' as `0x${string}`,
        pairTokens: [],
        liquidity: undefined,
        rewards: []
      }
    ];

    // Add sample positions
    positions.push(...samplePositions);

    // Cache the results
    defiCache.set(cacheKey, positions);
    return positions;

  } catch (error) {
    console.error('Error fetching DeFi positions:', error);
    return [];
  }
};

/**
 * Get DeFi protocol data summary with caching
 */
export const getDeFiProtocolData = async (
  address: Address,
  network: string
): Promise<DeFiProtocolData[]> => {
  try {
    const cacheKey = DeFiCache.getProtocolDataKey(address, network);
    const cached = defiCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const positions = await getAllDeFiPositions(address, network as keyof typeof SUPPORTED_NETWORKS);
    
    // Group positions by protocol
    const protocolGroups = positions.reduce((acc, position) => {
      if (!acc[position.protocol]) {
        acc[position.protocol] = [];
      }
      acc[position.protocol].push(position);
      return acc;
    }, {} as Record<DeFiProtocol, DeFiPosition[]>);

    // Calculate protocol summaries
    const protocolData: DeFiProtocolData[] = Object.entries(protocolGroups).map(([protocol, protocolPositions]) => {
      const totalValue = protocolPositions.reduce((sum, pos) => sum + pos.usdValue, 0);
      const allRewards = protocolPositions.flatMap(pos => pos.rewards || []);
      const unclaimedRewards = allRewards
        .filter(reward => !reward.isClaimed)
        .reduce((sum, reward) => sum + reward.usdValue, 0);
      
      const avgApy = protocolPositions.length > 0 
        ? protocolPositions.reduce((sum, pos) => sum + (pos.apy || 0), 0) / protocolPositions.length
        : 0;

      const metadata = PROTOCOL_METADATA[protocol as DeFiProtocol];
      return {
        protocol: protocol as DeFiProtocol,
        name: metadata.name,
        description: metadata.description,
        logoURI: metadata.logo,
        website: metadata.website,
        tvl: 0,
        apy: avgApy,
        positions: protocolPositions,
        totalValue,
        rewards: allRewards,
        unclaimedRewards,
      };
    });

    // Cache the results
    defiCache.set(cacheKey, protocolData);

    return protocolData;
  } catch (error) {
    console.error('Error fetching DeFi protocol data:', error);
    return [];
  }
};

/**
 * Calculate total DeFi portfolio value with caching
 */
export const getDeFiPortfolioValue = async (
  address: Address,
  network: string
): Promise<{
  totalValue: number;
  totalRewards: number;
  totalUnclaimedRewards: number;
  averageApy: number;
}> => {
  try {
    const cacheKey = DeFiCache.getPortfolioValueKey(address, network);
    const cached = defiCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const positions = await getAllDeFiPositions(address, network as keyof typeof SUPPORTED_NETWORKS);
    const totalValue = positions.reduce((sum, pos) => sum + pos.usdValue, 0);
    const allRewards = positions.flatMap(pos => pos.rewards || []);
    const totalRewards = allRewards.reduce((sum, reward) => sum + reward.usdValue, 0);
    const totalUnclaimedRewards = allRewards
      .filter(reward => !reward.isClaimed)
      .reduce((sum, reward) => sum + reward.usdValue, 0);
    
    const positionsWithApy = positions.filter(pos => pos.apy !== undefined);
    const averageApy = positionsWithApy.length > 0
      ? positionsWithApy.reduce((sum, pos) => sum + (pos.apy || 0), 0) / positionsWithApy.length
      : 0;

    const result = {
      totalValue,
      totalRewards,
      totalUnclaimedRewards,
      averageApy,
    };

    // Cache the results
    defiCache.set(cacheKey, result);

    return result;
  } catch (error) {
    console.error('Error calculating DeFi portfolio value:', error);
    return {
      totalValue: 0,
      totalRewards: 0,
      totalUnclaimedRewards: 0,
      averageApy: 0,
    };
  }
};

/**
 * Get total unclaimed rewards across all protocols
 */
export const getTotalUnclaimedRewards = async (
  walletAddress: `0x${string}`,
  networkKey: keyof typeof SUPPORTED_NETWORKS = 'mainnet'
): Promise<DeFiReward[]> => {
  try {
    const positions = await getAllDeFiPositions(walletAddress, networkKey);
    const allRewards = positions.flatMap(pos => pos.rewards || []);
    return allRewards.filter(reward => !reward.isClaimed);
  } catch (error) {
    console.error('Error fetching unclaimed rewards:', error);
    return [];
  }
};

/**
 * Clear DeFi cache (useful for testing or manual refresh)
 */
export const clearDeFiCache = (): void => {
  defiCache.clear();
};

/**
 * Get all Uniswap V2 pairs for a wallet
 */
export const getUniswapV2Positions = async (
  walletAddress: `0x${string}`,
  networkKey: keyof typeof SUPPORTED_NETWORKS = 'mainnet'
): Promise<DeFiPosition[]> => {
  try {
    const publicClient = createPublicClientForNetwork(networkKey);
    const factoryAddress = PROTOCOL_ADDRESSES[networkKey].uniswap_v2_factory;
    const positions: DeFiPosition[] = [];

    // Get total number of pairs
    const totalPairs = await readContract(publicClient, {
      address: factoryAddress as `0x${string}`,
      abi: UNISWAP_V2_FACTORY_ABI,
      functionName: 'allPairsLength',
    });

    // Check first 100 pairs for LP tokens (in production, you'd want to index this)
    const maxPairsToCheck = Math.min(Number(totalPairs), 100);
    
    for (let i = 0; i < maxPairsToCheck; i++) {
      try {
        // Get pair address
                 const pairAddress = await readContract(publicClient, {
           address: factoryAddress as `0x${string}`,
           abi: UNISWAP_V2_FACTORY_ABI,
           functionName: 'allPairs',
           args: [BigInt(i.toString())],
         });

        // Check if wallet has LP tokens
        const lpBalance = await readContract(publicClient, {
          address: pairAddress as `0x${string}`,
          abi: UNISWAP_V2_PAIR_ABI,
          functionName: 'balanceOf',
          args: [walletAddress],
        });

        if (lpBalance > BigInt(0)) {
          // Get pair tokens
          const [token0, token1] = await Promise.all([
            readContract(publicClient, {
              address: pairAddress as `0x${string}`,
              abi: UNISWAP_V2_PAIR_ABI,
              functionName: 'token0',
            }),
            readContract(publicClient, {
              address: pairAddress as `0x${string}`,
              abi: UNISWAP_V2_PAIR_ABI,
              functionName: 'token1',
            }),
          ]);

          // Get reserves
          const [reserve0, reserve1] = await readContract(publicClient, {
            address: pairAddress as `0x${string}`,
            abi: UNISWAP_V2_PAIR_ABI,
            functionName: 'getReserves',
          });

          // Get total supply
          const totalSupply = await readContract(publicClient, {
            address: pairAddress as `0x${string}`,
            abi: UNISWAP_V2_PAIR_ABI,
            functionName: 'totalSupply',
          });

          // Calculate user's share
          const userShare = Number(lpBalance) / Number(totalSupply);
          const userToken0Amount = Number(reserve0) * userShare;
          const userToken1Amount = Number(reserve1) * userShare;

          // For now, we'll use a placeholder USD value
          // In production, you'd fetch real token prices
          const estimatedUsdValue = Number(lpBalance) * 0.01; // Placeholder

          const position: DeFiPosition = {
            id: `uni_v2_${pairAddress}`,
            protocol: 'uniswap_v2',
            type: 'liquidity_provider',
            tokenAddress: pairAddress as `0x${string}`,
            tokenSymbol: 'LP',
            tokenName: 'Uniswap V2 LP',
            tokenDecimals: 18,
            balance: lpBalance,
            balanceFormatted: formatUnits(lpBalance, 18),
            usdValue: estimatedUsdValue,
            apy: 0, // Would need to calculate from fees
            impermanentLoss: 0, // Would need historical data
            entryPrice: 0,
            currentPrice: 0,
            timestamp: Date.now(),
            contractAddress: pairAddress as `0x${string}`,
            poolAddress: pairAddress as `0x${string}`,
            pairTokens: [token0 as `0x${string}`, token1 as `0x${string}`],
            liquidity: {
              token0: token0 as `0x${string}`,
              token1: token1 as `0x${string}`,
              amount0: BigInt(Math.floor(userToken0Amount).toString()),
              amount1: BigInt(Math.floor(userToken1Amount).toString()),
              share: userShare,
            },
            rewards: [],
          };

          positions.push(position);
        }
      } catch (error) {
        // Skip pairs that fail to load
        console.warn(`Failed to load pair ${i}:`, error);
        continue;
      }
    }

    return positions;
  } catch (error) {
    console.error('Error fetching Uniswap V2 positions:', error);
    return [];
  }
};

/**
 * Get Uniswap V3 positions for a wallet
 */
export const getUniswapV3Positions = async (
  walletAddress: `0x${string}`,
  networkKey: keyof typeof SUPPORTED_NETWORKS = 'mainnet'
): Promise<DeFiPosition[]> => {
  try {
    const publicClient = createPublicClientForNetwork(networkKey);
    const positionManagerAddress = PROTOCOL_ADDRESSES[networkKey].uniswap_v3_position_manager;
    const positions: DeFiPosition[] = [];

    // Get total number of positions owned by the wallet
    const balance = await readContract(publicClient, {
      address: positionManagerAddress as `0x${string}`,
      abi: UNISWAP_V3_POSITION_MANAGER_ABI,
      functionName: 'balanceOf',
      args: [walletAddress],
    });

    if (balance > BigInt(0)) {
      // Check first 10 positions (in production, you'd want to index this)
      const maxPositionsToCheck = Math.min(Number(balance), 10);
      
      for (let i = 0; i < maxPositionsToCheck; i++) {
        try {
          // Get token ID for this position
          const tokenId = await readContract(publicClient, {
            address: positionManagerAddress as `0x${string}`,
            abi: UNISWAP_V3_POSITION_MANAGER_ABI,
            functionName: 'tokenOfOwnerByIndex',
            args: [walletAddress, BigInt(i.toString())],
          });

          // Get position data
          const positionData = await readContract(publicClient, {
            address: positionManagerAddress as `0x${string}`,
            abi: UNISWAP_V3_POSITION_MANAGER_ABI,
            functionName: 'positions',
            args: [tokenId],
          });

          const [
            nonce,
            operator,
            token0,
            token1,
            fee,
            tickLower,
            tickUpper,
            liquidity,
            feeGrowthInside0LastX128,
            feeGrowthInside1LastX128,
            tokensOwed0,
            tokensOwed1,
          ] = positionData;

          if (liquidity > BigInt(0)) {
            // Calculate estimated USD value (placeholder)
            const estimatedUsdValue = Number(liquidity) * 0.001; // Placeholder

            const position: DeFiPosition = {
              id: `uni_v3_${tokenId}`,
              protocol: 'uniswap_v3',
              type: 'liquidity_provider',
              tokenAddress: positionManagerAddress as `0x${string}`,
              tokenSymbol: 'UNI-V3',
              tokenName: 'Uniswap V3 Position',
              tokenDecimals: 18,
              balance: liquidity,
              balanceFormatted: formatUnits(liquidity, 18),
              usdValue: estimatedUsdValue,
              apy: 0, // Would need to calculate from fees
              impermanentLoss: 0, // Would need historical data
              entryPrice: 0,
              currentPrice: 0,
              timestamp: Date.now(),
              contractAddress: positionManagerAddress as `0x${string}`,
              poolAddress: '', // Would need to calculate from token0, token1, fee
              pairTokens: [token0 as `0x${string}`, token1 as `0x${string}`],
              liquidity: {
                token0: token0 as `0x${string}`,
                token1: token1 as `0x${string}`,
                amount0: BigInt(0), // Would need to calculate from liquidity and ticks
                amount1: BigInt(0), // Would need to calculate from liquidity and ticks
                share: 0, // Would need to calculate from pool data
              },
              rewards: [
                {
                  tokenAddress: token0 as `0x${string}`,
                  tokenSymbol: 'TOKEN0',
                  tokenName: 'Token 0',
                  amount: tokensOwed0,
                  amountFormatted: formatUnits(tokensOwed0, 18),
                  usdValue: Number(tokensOwed0) * 0.01, // Placeholder
                  isClaimed: false,
                  apy: 0,
                },
                {
                  tokenAddress: token1 as `0x${string}`,
                  tokenSymbol: 'TOKEN1',
                  tokenName: 'Token 1',
                  amount: tokensOwed1,
                  amountFormatted: formatUnits(tokensOwed1, 18),
                  usdValue: Number(tokensOwed1) * 0.01, // Placeholder
                  isClaimed: false,
                  apy: 0,
                },
              ].filter(reward => reward.amount > BigInt(0)),
            };

            positions.push(position);
          }
        } catch (error) {
          // Skip positions that fail to load
          console.warn(`Failed to load Uniswap V3 position ${i}:`, error);
          continue;
        }
      }
    }

    return positions;
  } catch (error) {
    console.error('Error fetching Uniswap V3 positions:', error);
    return [];
  }
};

/**
 * Get Aave lending and borrowing positions for a wallet
 */
export const getAavePositions = async (
  walletAddress: `0x${string}`,
  networkKey: keyof typeof SUPPORTED_NETWORKS = 'mainnet'
): Promise<DeFiPosition[]> => {
  try {
    const publicClient = createPublicClientForNetwork(networkKey);
    const lendingPoolAddress = PROTOCOL_ADDRESSES[networkKey].aave_lending_pool;
    const positions: DeFiPosition[] = [];

    // Common Aave assets to check (in production, you'd get this from the protocol)
    const aaveAssets = [
      {
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        aTokenAddress: '0xBcca60bB61934080951369a648Fb03DF4F96263C', // aUSDC
      },
      {
        address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI
        symbol: 'DAI',
        name: 'Dai Stablecoin',
        decimals: 18,
        aTokenAddress: '0x028171bCA77440897B824Ca71D1C56caC55b68A3', // aDAI
      },
      {
        address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
        symbol: 'WETH',
        name: 'Wrapped Ether',
        decimals: 18,
        aTokenAddress: '0x3a3A65aAb0dd2A17E3F194837a161591D6F37D10', // aWETH
      },
    ];

    // Check each asset for lending positions
    for (const asset of aaveAssets) {
      try {
        // Get reserve data
        const reserveData = await readContract(publicClient, {
          address: lendingPoolAddress as `0x${string}`,
          abi: AAVE_LENDING_POOL_ABI,
          functionName: 'getReserveData',
          args: [asset.address as `0x${string}`],
        });

        const [
          configuration,
          liquidityIndex,
          variableBorrowIndex,
          currentLiquidityRate,
          currentVariableBorrowRate,
          currentStableBorrowRate,
          lastUpdateTime,
          aTokenAddress,
          stableDebtTokenAddress,
          variableDebtTokenAddress,
          interestRateStrategyAddress,
          id,
        ] = reserveData;

        // Check aToken balance (lending position)
        const aTokenBalance = await readContract(publicClient, {
          address: aTokenAddress as `0x${string}`,
          abi: AAVE_ATOKEN_ABI,
          functionName: 'balanceOf',
          args: [walletAddress],
        });

        if (aTokenBalance > BigInt(0)) {
          // Calculate APY from liquidity rate
          const apy = Number(currentLiquidityRate) / 1e27 * 100; // Convert from ray to percentage

          const position: DeFiPosition = {
            id: `aave_lending_${asset.address}`,
            protocol: 'aave',
            type: 'lending',
            tokenAddress: asset.address as `0x${string}`,
            tokenSymbol: asset.symbol,
            tokenName: asset.name,
            tokenDecimals: asset.decimals,
            balance: aTokenBalance,
            balanceFormatted: formatUnits(aTokenBalance, asset.decimals),
            usdValue: Number(aTokenBalance) * 0.01, // Placeholder - would need real price
            apy,
            impermanentLoss: 0,
            entryPrice: 0,
            currentPrice: 0,
            timestamp: Date.now(),
            contractAddress: aTokenAddress as `0x${string}`,
            poolAddress: lendingPoolAddress as `0x${string}`,
            pairTokens: [],
            liquidity: undefined,
            rewards: [],
          };

          positions.push(position);
        }

        // Check variable debt token balance (borrowing position)
        const variableDebtBalance = await readContract(publicClient, {
          address: variableDebtTokenAddress as `0x${string}`,
          abi: AAVE_ATOKEN_ABI,
          functionName: 'balanceOf',
          args: [walletAddress],
        });

        if (variableDebtBalance > BigInt(0)) {
          // Calculate APY from borrow rate (negative for borrowing)
          const apy = -Number(currentVariableBorrowRate) / 1e27 * 100; // Convert from ray to percentage

          const position: DeFiPosition = {
            id: `aave_borrowing_${asset.address}`,
            protocol: 'aave',
            type: 'borrowing',
            tokenAddress: asset.address as `0x${string}`,
            tokenSymbol: asset.symbol,
            tokenName: asset.name,
            tokenDecimals: asset.decimals,
            balance: variableDebtBalance,
            balanceFormatted: formatUnits(variableDebtBalance, asset.decimals),
            usdValue: Number(variableDebtBalance) * 0.01, // Placeholder - would need real price
            apy,
            impermanentLoss: 0,
            entryPrice: 0,
            currentPrice: 0,
            timestamp: Date.now(),
            contractAddress: variableDebtTokenAddress as `0x${string}`,
            poolAddress: lendingPoolAddress as `0x${string}`,
            pairTokens: [],
            liquidity: undefined,
            rewards: [],
          };

          positions.push(position);
        }
      } catch (error) {
        // Skip assets that fail to load
        console.warn(`Failed to load Aave asset ${asset.symbol}:`, error);
        continue;
      }
    }

    return positions;
  } catch (error) {
    console.error('Error fetching Aave positions:', error);
    return [];
  }
};

/**
 * Get Compound lending and borrowing positions for a wallet
 */
export const getCompoundPositions = async (
  walletAddress: `0x${string}`,
  networkKey: keyof typeof SUPPORTED_NETWORKS = 'mainnet'
): Promise<DeFiPosition[]> => {
  try {
    const publicClient = createPublicClientForNetwork(networkKey);
    const comptrollerAddress = PROTOCOL_ADDRESSES[networkKey].compound_comptroller;
    const positions: DeFiPosition[] = [];

    // Common Compound assets to check (in production, you'd get this from the protocol)
    const compoundAssets = [
      {
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        cTokenAddress: '0x39AA39c021dfbaE8faC545936693aC917d5E7563', // cUSDC
      },
      {
        address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI
        symbol: 'DAI',
        name: 'Dai Stablecoin',
        decimals: 18,
        cTokenAddress: '0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643', // cDAI
      },
    ];

    // Get all assets the user has entered
    const userAssets = await readContract(publicClient, {
      address: comptrollerAddress as `0x${string}`,
      abi: COMPOUND_COMPTROLLER_ABI,
      functionName: 'getAssetsIn',
      args: [walletAddress],
    });

    // Check each asset for positions
    for (const asset of compoundAssets) {
      try {
        // Check if user has entered this market
        if (userAssets.includes(asset.cTokenAddress as `0x${string}`)) {
                     // Get account snapshot
           const snapshot = await readContract(publicClient, {
             address: comptrollerAddress as `0x${string}`,
             abi: COMPOUND_COMPTROLLER_ABI,
             functionName: 'getAccountSnapshot',
             args: [walletAddress],
           });

          const [error, cTokenBalance, borrowBalance, exchangeRate] = snapshot;

          // Check cToken balance (lending position)
          const cTokenBalanceResult = await readContract(publicClient, {
            address: asset.cTokenAddress as `0x${string}`,
            abi: COMPOUND_CTOKEN_ABI,
            functionName: 'balanceOf',
            args: [walletAddress],
          });

          if (cTokenBalanceResult > BigInt(0)) {
            // Calculate underlying balance
            const underlyingBalance = (cTokenBalanceResult * exchangeRate) / BigInt(10 ** 18);

            const position: DeFiPosition = {
              id: `compound_lending_${asset.address}`,
              protocol: 'compound',
              type: 'lending',
              tokenAddress: asset.address as `0x${string}`,
              tokenSymbol: asset.symbol,
              tokenName: asset.name,
              tokenDecimals: asset.decimals,
              balance: underlyingBalance,
              balanceFormatted: formatUnits(underlyingBalance, asset.decimals),
              usdValue: Number(underlyingBalance) * 0.01, // Placeholder - would need real price
              apy: 0, // Would need to calculate from supply rate
              impermanentLoss: 0,
              entryPrice: 0,
              currentPrice: 0,
              timestamp: Date.now(),
              contractAddress: asset.cTokenAddress as `0x${string}`,
              poolAddress: comptrollerAddress as `0x${string}`,
              pairTokens: [],
              liquidity: undefined,
              rewards: [],
            };

            positions.push(position);
          }

          // Check borrow balance (borrowing position)
          const borrowBalanceResult = await readContract(publicClient, {
            address: asset.cTokenAddress as `0x${string}`,
            abi: COMPOUND_CTOKEN_ABI,
            functionName: 'borrowBalanceStored',
            args: [walletAddress],
          });

          if (borrowBalanceResult > BigInt(0)) {
            const position: DeFiPosition = {
              id: `compound_borrowing_${asset.address}`,
              protocol: 'compound',
              type: 'borrowing',
              tokenAddress: asset.address as `0x${string}`,
              tokenSymbol: asset.symbol,
              tokenName: asset.name,
              tokenDecimals: asset.decimals,
              balance: borrowBalanceResult,
              balanceFormatted: formatUnits(borrowBalanceResult, asset.decimals),
              usdValue: Number(borrowBalanceResult) * 0.01, // Placeholder - would need real price
              apy: 0, // Would need to calculate from borrow rate (negative)
              impermanentLoss: 0,
              entryPrice: 0,
              currentPrice: 0,
              timestamp: Date.now(),
              contractAddress: asset.cTokenAddress as `0x${string}`,
              poolAddress: comptrollerAddress as `0x${string}`,
              pairTokens: [],
              liquidity: undefined,
              rewards: [],
            };

            positions.push(position);
          }
        }
      } catch (error) {
        // Skip assets that fail to load
        console.warn(`Failed to load Compound asset ${asset.symbol}:`, error);
        continue;
      }
    }

    return positions;
  } catch (error) {
    console.error('Error fetching Compound positions:', error);
    return [];
  }
};

/**
 * Calculate impermanent loss for a liquidity position
 */
export const calculateImpermanentLoss = (
  initialToken0Amount: number,
  initialToken1Amount: number,
  currentToken0Amount: number,
  currentToken1Amount: number,
  initialToken0Price: number,
  initialToken1Price: number,
  currentToken0Price: number,
  currentToken1Price: number
): number => {
  // Calculate initial portfolio value
  const initialValue = (initialToken0Amount * initialToken0Price) + (initialToken1Amount * initialToken1Price);
  
  // Calculate current portfolio value
  const currentValue = (currentToken0Amount * currentToken0Price) + (currentToken1Amount * currentToken1Price);
  
  // Calculate value if tokens were held instead of provided as liquidity
  const heldValue = (initialToken0Amount * currentToken0Price) + (initialToken1Amount * currentToken1Price);
  
  // Calculate impermanent loss
  const impermanentLoss = ((currentValue - heldValue) / heldValue) * 100;
  
  return impermanentLoss;
}; 