import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { TokenPerformance } from '../../types';
import { formatCurrency, formatPercentage } from '../../utils/format';
import clsx from 'clsx';

interface TokenPerformanceListProps {
  data: TokenPerformance[];
  isLoading?: boolean;
  className?: string;
  maxItems?: number;
}

interface PerformanceRowProps {
  performance: TokenPerformance;
  rank: number;
}

const getTrendIcon = (percentage: number) => {
  if (percentage > 0) return <TrendingUp className="w-4 h-4" />;
  if (percentage < 0) return <TrendingDown className="w-4 h-4" />;
  return <Minus className="w-4 h-4" />;
};

const getTrendColor = (percentage: number) => {
  if (percentage > 0) return 'text-green-600 dark:text-green-400';
  if (percentage < 0) return 'text-red-600 dark:text-red-400';
  return 'text-gray-500 dark:text-gray-400';
};

const PerformanceRow: React.FC<PerformanceRowProps> = ({ performance, rank }) => {
  const { token, priceChanges, allocation } = performance;

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 dark:text-gray-400 font-medium w-6">
            {rank}
          </span>
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100">
              {token.symbol}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-32">
              {token.name}
            </div>
          </div>
        </div>
      </td>
      
      <td className="px-4 py-3 text-right">
        <div className="font-medium text-gray-900 dark:text-gray-100">
          {formatCurrency(token.price || 0)}
        </div>
      </td>
      
      <td className="px-4 py-3 text-right">
        <div className="font-medium text-gray-900 dark:text-gray-100">
          {token.balanceFormatted}
        </div>
      </td>
      
      <td className="px-4 py-3 text-right">
        <div className="font-medium text-gray-900 dark:text-gray-100">
          {formatCurrency(token.usdValue || 0)}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {formatPercentage(allocation)}
        </div>
      </td>
      
      <td className="px-4 py-3 text-right">
        <div className={clsx(
          'flex items-center justify-end gap-1 text-sm font-medium',
          getTrendColor(priceChanges['24h'].percentage)
        )}>
          {getTrendIcon(priceChanges['24h'].percentage)}
          {formatPercentage(Math.abs(priceChanges['24h'].percentage))}
        </div>
      </td>
      
      <td className="px-4 py-3 text-right">
        <div className={clsx(
          'flex items-center justify-end gap-1 text-sm font-medium',
          getTrendColor(priceChanges['7d'].percentage)
        )}>
          {getTrendIcon(priceChanges['7d'].percentage)}
          {formatPercentage(Math.abs(priceChanges['7d'].percentage))}
        </div>
      </td>
      
      <td className="px-4 py-3 text-right">
        <div className={clsx(
          'flex items-center justify-end gap-1 text-sm font-medium',
          getTrendColor(priceChanges['30d'].percentage)
        )}>
          {getTrendIcon(priceChanges['30d'].percentage)}
          {formatPercentage(Math.abs(priceChanges['30d'].percentage))}
        </div>
      </td>
    </tr>
  );
};

const LoadingRow: React.FC = () => (
  <tr className="animate-pulse">
    <td className="px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="w-6 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div>
          <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded mb-1"></div>
          <div className="w-24 h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    </td>
    <td className="px-4 py-3 text-right">
      <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded ml-auto"></div>
    </td>
    <td className="px-4 py-3 text-right">
      <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded ml-auto"></div>
    </td>
    <td className="px-4 py-3 text-right">
      <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded ml-auto mb-1"></div>
      <div className="w-12 h-3 bg-gray-200 dark:bg-gray-700 rounded ml-auto"></div>
    </td>
    <td className="px-4 py-3 text-right">
      <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded ml-auto"></div>
    </td>
    <td className="px-4 py-3 text-right">
      <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded ml-auto"></div>
    </td>
    <td className="px-4 py-3 text-right">
      <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded ml-auto"></div>
    </td>
  </tr>
);

const TokenPerformanceList: React.FC<TokenPerformanceListProps> = ({
  data,
  isLoading = false,
  className,
  maxItems
}) => {
  const displayData = maxItems ? data.slice(0, maxItems) : data;

  return (
    <div className={clsx('bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Token
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Price
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Balance
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Value
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                24h
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                7d
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                30d
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {isLoading ? (
              // Show loading rows
              Array.from({ length: 5 }, (_, index) => (
                <LoadingRow key={index} />
              ))
            ) : displayData.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center">
                  <div className="text-gray-500 dark:text-gray-400">
                    <div className="text-lg mb-2">📊</div>
                    <p>No token performance data available</p>
                  </div>
                </td>
              </tr>
            ) : (
              displayData.map((performance, index) => (
                <PerformanceRow
                  key={performance.token.address}
                  performance={performance}
                  rank={index + 1}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {maxItems && data.length > maxItems && (
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            Showing {maxItems} of {data.length} tokens
          </p>
        </div>
      )}
    </div>
  );
};

export default TokenPerformanceList;