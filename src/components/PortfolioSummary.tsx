import React from 'react';
import { TrendingUp, Wallet, RefreshCw } from 'lucide-react';
import { formatUSD } from '../utils/format';

interface PortfolioSummaryProps {
  totalValue: number;
  ethBalance: bigint;
  ethBalanceFormatted: string;
  ethUsdValue: number;
  loading: boolean;
  onRefresh: () => void;
}

const PortfolioSummary: React.FC<PortfolioSummaryProps> = ({
  totalValue,
  ethBalance,
  ethBalanceFormatted,
  ethUsdValue,
  loading,
  onRefresh,
}) => {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Portfolio Overview
        </h2>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          title="Refresh portfolio"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Total Portfolio Value */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg p-6 text-white">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5" />
            <span className="text-primary-100 font-medium">Total Value</span>
          </div>
          <div className="text-3xl font-bold">
            {loading ? (
              <div className="animate-pulse bg-primary-400 rounded h-8 w-32"></div>
            ) : (
              formatUSD(totalValue)
            )}
          </div>
        </div>

        {/* ETH Balance */}
        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="text-gray-600 dark:text-gray-400 font-medium">
              ETH Balance
            </span>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {loading ? (
                <div className="animate-pulse bg-gray-300 dark:bg-gray-600 rounded h-7 w-24"></div>
              ) : (
                `${ethBalanceFormatted} ETH`
              )}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {loading ? (
                <div className="animate-pulse bg-gray-300 dark:bg-gray-600 rounded h-4 w-16"></div>
              ) : (
                formatUSD(ethUsdValue)
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Loading indicator for content */}
      {loading && (
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading portfolio data...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioSummary;