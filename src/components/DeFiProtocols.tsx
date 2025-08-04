import React, { useState, useEffect } from 'react';
import { 
  DeFiProtocolData, 
  DeFiProtocol 
} from '../types';
import { 
  getDeFiProtocolData, 
  getDeFiPortfolioValue 
} from '../services/defiService';
import { useWallet } from '../contexts/WalletContext';
import { useNetwork } from '../contexts/NetworkContext';
import { 
  TrendingUp, 
  DollarSign, 
  Clock, 
  AlertTriangle,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Zap,
  Activity,
  Shield,
  Target,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  Coins
} from 'lucide-react';

interface DeFiProtocolsProps {
  className?: string;
}

export const DeFiProtocols: React.FC<DeFiProtocolsProps> = ({ className = '' }) => {
  const { address } = useWallet();
  const { currentNetwork } = useNetwork();
  const [protocolData, setProtocolData] = useState<DeFiProtocolData[]>([]);
  const [portfolioValue, setPortfolioValue] = useState<{
    totalValue: number;
    totalRewards: number;
    totalUnclaimedRewards: number;
    averageApy: number;
  }>({
    totalValue: 0,
    totalRewards: 0,
    totalUnclaimedRewards: 0,
    averageApy: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedProtocols, setExpandedProtocols] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchDeFiData = async () => {
      // Always fetch data to show sample positions
      setLoading(true);
      setError(null);

      try {
        const demoAddress = (address || '0xa99eb79c24f7a63bd37b97ce78b8c0254bceed00') as `0x${string}`;
        const [protocols, value] = await Promise.all([
          getDeFiProtocolData(demoAddress, currentNetwork),
          getDeFiPortfolioValue(demoAddress, currentNetwork),
        ]);

        setProtocolData(protocols);
        setPortfolioValue(value);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch DeFi data');
      } finally {
        setLoading(false);
      }
    };

    fetchDeFiData();
  }, [address, currentNetwork]);

  const toggleProtocolExpansion = (protocol: DeFiProtocol) => {
    const newExpanded = new Set(expandedProtocols);
    if (newExpanded.has(protocol)) {
      newExpanded.delete(protocol);
    } else {
      newExpanded.add(protocol);
    }
    setExpandedProtocols(newExpanded);
  };

  const getProtocolIcon = (protocol: DeFiProtocol) => {
    const icons: Record<DeFiProtocol, string> = {
      uniswap_v2: '🦄',
      uniswap_v3: '🦄',
      aave: '🦇',
      compound: '🏦',
      curve: '📈',
      balancer: '⚖️',
      sushiswap: '🍣',
      yearn: '🏛️',
      convex: '📊',
      lido: '🏛️',
      rocketpool: '🚀',
    };
    return icons[protocol] || '🔗';
  };

  const getRiskColor = (apy: number) => {
    if (apy > 20) return 'text-red-500';
    if (apy > 10) return 'text-yellow-500';
    return 'text-green-500';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        {/* Loading Portfolio Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>

        {/* Loading Protocol Cards */}
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="animate-pulse p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-1"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 ${className}`}>
        <div className="flex items-center space-x-3 text-red-500">
          <AlertTriangle className="h-6 w-6" />
          <div>
            <h3 className="font-semibold">Error Loading DeFi Data</h3>
            <p className="text-sm text-red-400">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Portfolio Summary */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg p-6 border border-blue-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              DeFi Portfolio Overview
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {address ? 'Your DeFi positions across all protocols' : 'Sample DeFi portfolio data'}
            </p>
          </div>
          <div className="hidden md:flex items-center space-x-2 text-blue-600 dark:text-blue-400">
            <BarChart3 className="h-5 w-5" />
            <span className="text-sm font-medium">Live Data</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90 font-medium">Total Value</p>
                <p className="text-2xl font-bold">{formatCurrency(portfolioValue.totalValue)}</p>
                <p className="text-xs opacity-75 mt-1">Portfolio Value</p>
              </div>
              <DollarSign className="h-10 w-10 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90 font-medium">Total Rewards</p>
                <p className="text-2xl font-bold">{formatCurrency(portfolioValue.totalRewards)}</p>
                <p className="text-xs opacity-75 mt-1">Earned Rewards</p>
              </div>
              <Zap className="h-10 w-10 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90 font-medium">Unclaimed</p>
                <p className="text-2xl font-bold">{formatCurrency(portfolioValue.totalUnclaimedRewards)}</p>
                <p className="text-xs opacity-75 mt-1">Pending Claims</p>
              </div>
              <Clock className="h-10 w-10 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90 font-medium">Avg APY</p>
                <p className="text-2xl font-bold">{formatPercentage(portfolioValue.averageApy)}</p>
                <p className="text-xs opacity-75 mt-1">Annual Yield</p>
              </div>
              <TrendingUp className="h-10 w-10 opacity-80" />
            </div>
          </div>
        </div>

        {!address && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center space-x-2 text-blue-700 dark:text-blue-300">
              <Shield className="h-4 w-4" />
              <span className="text-sm font-medium">Demo Mode</span>
              <span className="text-xs opacity-75">Showing sample data. Connect wallet for real data.</span>
            </div>
          </div>
        )}
      </div>

      {/* Protocol List */}
      <div className="space-y-4">
        {protocolData.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
            <div className="text-gray-500 dark:text-gray-400">
              <Activity className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No DeFi Positions Found</h3>
              <p className="text-sm mb-4">No active DeFi positions detected for this wallet</p>
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
                <Target className="h-4 w-4" />
                <span>Try connecting a different wallet or check other networks</span>
              </div>
            </div>
          </div>
        ) : (
          protocolData.map((protocol) => (
            <div key={protocol.protocol} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-200">
              <div 
                className="p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-xl"
                onClick={() => toggleProtocolExpansion(protocol.protocol)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded-xl flex items-center justify-center text-2xl">
                      {getProtocolIcon(protocol.protocol)}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {protocol.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {protocol.description}
                      </p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full text-gray-600 dark:text-gray-400">
                          {protocol.positions.length} positions
                        </span>
                        <span className="text-xs bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-2 py-1 rounded-full">
                          {formatPercentage(protocol.apy)} APY
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(protocol.totalValue)}
                      </p>
                      <p className={`text-sm font-medium ${getRiskColor(protocol.apy)}`}>
                        {formatPercentage(protocol.apy)} APY
                      </p>
                    </div>
                    
                    {expandedProtocols.has(protocol.protocol) ? (
                      <ChevronDown className="h-6 w-6 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {expandedProtocols.has(protocol.protocol) && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-6 space-y-6">
                  {/* Protocol Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Positions</p>
                      <p className="font-bold text-lg">{protocol.positions.length}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">TVL</p>
                      <p className="font-bold text-lg">{formatCurrency(protocol.tvl)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Unclaimed</p>
                      <p className="font-bold text-lg text-yellow-600">{formatCurrency(protocol.unclaimedRewards)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Website</p>
                      <a 
                        href={protocol.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center space-x-1 font-medium"
                      >
                        <span>Visit</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>

                  {/* Enhanced Positions Section */}
                  {protocol.positions.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-gray-900 dark:text-white text-lg flex items-center space-x-2">
                          <Coins className="h-5 w-5" />
                          <span>Active Positions</span>
                        </h4>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {protocol.positions.length} position{protocol.positions.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {protocol.positions.map((position) => (
                          <div key={position.id} className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all duration-200">
                            {/* Position Header */}
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded-xl flex items-center justify-center">
                                  <span className="text-lg font-bold text-blue-700 dark:text-blue-300">{position.tokenSymbol}</span>
                                </div>
                                <div>
                                  <h5 className="font-bold text-gray-900 dark:text-white text-lg">
                                    {position.tokenName}
                                  </h5>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      position.type === 'liquidity_provider' 
                                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                                        : position.type === 'lending'
                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                                        : 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300'
                                    }`}>
                                      {position.type.replace('_', ' ').toUpperCase()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="text-right">
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                  {formatCurrency(position.usdValue)}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {position.balanceFormatted} {position.tokenSymbol}
                                </p>
                              </div>
                            </div>

                            {/* Position Details Grid */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div className="bg-white dark:bg-gray-600 rounded-lg p-3">
                                <div className="flex items-center space-x-2 mb-1">
                                  <Percent className="h-4 w-4 text-green-500" />
                                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">APY</span>
                                </div>
                                <p className={`text-lg font-bold ${getRiskColor(position.apy || 0)}`}>
                                  {position.apy ? formatPercentage(position.apy) : 'N/A'}
                                </p>
                              </div>
                              
                              <div className="bg-white dark:bg-gray-600 rounded-lg p-3">
                                <div className="flex items-center space-x-2 mb-1">
                                  <TrendingUp className="h-4 w-4 text-blue-500" />
                                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Entry Price</span>
                                </div>
                                <p className="text-lg font-bold text-gray-900 dark:text-white">
                                  {position.entryPrice ? formatCurrency(position.entryPrice) : 'N/A'}
                                </p>
                              </div>
                            </div>

                            {/* Impermanent Loss Warning */}
                            {position.impermanentLoss && position.impermanentLoss < -1 && (
                              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                                  <AlertTriangle className="h-4 w-4" />
                                  <span className="text-sm font-medium">
                                    Impermanent Loss: {position.impermanentLoss.toFixed(2)}%
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Enhanced Rewards Section */}
                            {position.rewards && position.rewards.length > 0 && (
                              <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                                <div className="flex items-center space-x-2 mb-3">
                                  <Zap className="h-4 w-4 text-yellow-500" />
                                  <h6 className="font-semibold text-gray-700 dark:text-gray-300">Rewards</h6>
                                </div>
                                <div className="space-y-2">
                                  {position.rewards.map((reward, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                      <div className="flex items-center space-x-3">
                                        <div className="w-6 h-6 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
                                          <span className="text-xs font-bold text-green-700 dark:text-green-300">
                                            {reward.tokenSymbol.charAt(0)}
                                          </span>
                                        </div>
                                        <div>
                                          <p className="text-sm font-medium text-green-700 dark:text-green-300">
                                            {reward.amountFormatted} {reward.tokenSymbol}
                                          </p>
                                          <p className="text-xs text-green-600 dark:text-green-400">
                                            {formatPercentage(reward.apy)} APY
                                          </p>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <p className="font-bold text-green-800 dark:text-green-200">
                                          {formatCurrency(reward.usdValue)}
                                        </p>
                                        <p className="text-xs text-green-600 dark:text-green-400">
                                          {reward.isClaimed ? 'Claimed' : 'Unclaimed'}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Liquidity Details */}
                            {position.liquidity && (
                              <div className="border-t border-gray-200 dark:border-gray-600 pt-4 mt-4">
                                <div className="flex items-center space-x-2 mb-3">
                                  <Coins className="h-4 w-4 text-blue-500" />
                                  <h6 className="font-semibold text-gray-700 dark:text-gray-300">Liquidity Details</h6>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">{position.liquidity.token0}</p>
                                    <p className="text-sm font-bold text-blue-700 dark:text-blue-300">
                                      {position.liquidity.amount0.toString()}
                                    </p>
                                  </div>
                                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">{position.liquidity.token1}</p>
                                    <p className="text-sm font-bold text-blue-700 dark:text-blue-300">
                                      {position.liquidity.amount1.toString()}
                                    </p>
                                  </div>
                                </div>
                                <div className="mt-3 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                  <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                                    Pool Share: {(position.liquidity.share * 100).toFixed(2)}%
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Rewards Summary */}
                  {protocol.rewards.length > 0 && (
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white mb-4 text-lg">Total Rewards</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {protocol.rewards.map((reward, index) => (
                          <div key={index} className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-bold text-green-800 dark:text-green-200">
                                  {reward.tokenSymbol}
                                </p>
                                <p className="text-sm text-green-600 dark:text-green-400">
                                  {reward.amountFormatted}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-green-800 dark:text-green-200">
                                  {formatCurrency(reward.usdValue)}
                                </p>
                                <p className="text-sm text-green-600 dark:text-green-400">
                                  {formatPercentage(reward.apy)} APY
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}; 