import React from 'react';
import { Coins, ExternalLink } from 'lucide-react';
import { Token } from '../types';
import { formatUSD, formatPercentage, calculatePercentage } from '../utils/format';

interface TokenListProps {
  tokens: Token[];
  totalValue: number;
  loading: boolean;
}

const TokenList: React.FC<TokenListProps> = ({ tokens, totalValue, loading }) => {
  if (loading) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Token Holdings
        </h3>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (tokens.length === 0) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Token Holdings
        </h3>
        <div className="text-center py-8">
          <Coins className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400">
            No tokens found in your wallet
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
            Connect your wallet to see your token holdings
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Token Holdings
        </h3>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {tokens.length} {tokens.length === 1 ? 'token' : 'tokens'}
        </span>
      </div>

      <div className="space-y-3">
        {tokens.map((token) => {
          const percentage = calculatePercentage(token.usdValue || 0, totalValue);
          
          return (
            <div
              key={token.address}
              className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {/* Token Icon Placeholder */}
                <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {token.symbol.slice(0, 2)}
                </div>
                
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {token.symbol}
                    </span>
                    <a
                      href={`https://etherscan.io/token/${token.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      title="View on Etherscan"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {token.name}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {token.balanceFormatted}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {token.usdValue ? formatUSD(token.usdValue) : 'Price unavailable'}
                </div>
                {percentage > 0 && (
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    {formatPercentage(percentage)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TokenList;