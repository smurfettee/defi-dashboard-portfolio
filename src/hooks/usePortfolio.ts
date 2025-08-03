import { useState, useEffect, useCallback } from 'react';
import { Portfolio, Token } from '../types';
import { useWallet } from '../contexts/WalletContext';
import { useNetwork } from '../contexts/NetworkContext';
import { getEthBalance } from '../services/walletService';
import {
  getTokenBalances,
  getTokenPrices,
  getEthPrice,
  getCoinGeckoIds,
} from '../services/tokenService';
import { formatTokenBalance } from '../utils/format';

export const usePortfolio = () => {
  const { address, isConnected } = useWallet();
  const { currentNetwork, tokens: networkTokens } = useNetwork();
  const [portfolio, setPortfolio] = useState<Portfolio>({
    totalValue: 0,
    ethBalance: BigInt(0),
    ethBalanceFormatted: '0',
    ethUsdValue: 0,
    tokens: [],
    loading: false,
  });

  const fetchPortfolioData = useCallback(async () => {
    if (!address || !isConnected) {
      setPortfolio({
        totalValue: 0,
        ethBalance: BigInt(0),
        ethBalanceFormatted: '0',
        ethUsdValue: 0,
        tokens: [],
        loading: false,
      });
      return;
    }

    setPortfolio(prev => ({ ...prev, loading: true, error: undefined }));

    try {
      // Fetch ETH balance and token balances in parallel
      const [ethData, tokens] = await Promise.all([
        getEthBalance(address, currentNetwork),
        getTokenBalances(address as `0x${string}`, currentNetwork),
      ]);

      // Get coin IDs for price fetching
      const coinIds = getCoinGeckoIds(tokens, currentNetwork);
      
      // Fetch prices for tokens and ETH in parallel
      const [tokenPrices, ethPrice] = await Promise.all([
        coinIds.length > 0 ? getTokenPrices(coinIds) : Promise.resolve({} as Record<string, { usd: number }>),
        getEthPrice(),
      ]);

      // Calculate USD values for tokens
      const tokensWithPrices: Token[] = tokens.map((token) => {
        const popularToken = networkTokens.find(
          (pt) => pt.address.toLowerCase() === token.address.toLowerCase()
        );

        let price = 0;
        let usdValue = 0;

        if (popularToken && tokenPrices[popularToken.coinGeckoId]) {
          price = tokenPrices[popularToken.coinGeckoId].usd;
          usdValue = parseFloat(token.balanceFormatted) * price;
        }

        return {
          ...token,
          price,
          usdValue,
        };
      });

      // Calculate ETH USD value
      const ethUsdValue = parseFloat(ethData.formatted) * ethPrice;

      // Calculate total portfolio value
      const totalTokenValue = tokensWithPrices.reduce(
        (sum, token) => sum + (token.usdValue || 0),
        0
      );
      const totalValue = ethUsdValue + totalTokenValue;

      setPortfolio({
        totalValue,
        ethBalance: ethData.balance,
        ethBalanceFormatted: formatTokenBalance(ethData.balance, 18),
        ethUsdValue,
        tokens: tokensWithPrices,
        loading: false,
      });
    } catch (error: any) {
      console.error('Error fetching portfolio data:', error);
      setPortfolio(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to fetch portfolio data',
      }));
    }
  }, [address, isConnected, currentNetwork, networkTokens]);

  // Fetch data when wallet connects or address changes
  useEffect(() => {
    fetchPortfolioData();
  }, [fetchPortfolioData, currentNetwork]);

  // Refresh function for manual updates
  const refresh = useCallback(() => {
    fetchPortfolioData();
  }, [fetchPortfolioData]);

  return {
    ...portfolio,
    refresh,
  };
};