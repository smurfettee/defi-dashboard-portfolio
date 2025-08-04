import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { PriceChange } from '../../types';
import { formatCurrency, formatPercentage } from '../../utils/format';
import clsx from 'clsx';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: PriceChange;
  icon?: React.ReactNode;
  isLoading?: boolean;
  className?: string;
  valueClassName?: string;
  showTrend?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  icon,
  isLoading = false,
  className,
  valueClassName,
  showTrend = true
}) => {
  const getTrendIcon = (changeValue: number) => {
    if (changeValue > 0) return <TrendingUp className="w-4 h-4" />;
    if (changeValue < 0) return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const getTrendColor = (changeValue: number) => {
    if (changeValue > 0) return 'text-green-600 dark:text-green-400';
    if (changeValue < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-500 dark:text-gray-400';
  };

  const getBackgroundColor = (changeValue: number) => {
    if (changeValue > 0) return 'bg-green-50 dark:bg-green-900/20';
    if (changeValue < 0) return 'bg-red-50 dark:bg-red-900/20';
    return 'bg-gray-50 dark:bg-gray-800/50';
  };

  if (isLoading) {
    return (
      <div className={clsx(
        'bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700',
        className
      )}>
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
            {icon && (
              <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
            )}
          </div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx(
      'bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700',
      className
    )}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {title}
        </h3>
        {icon && (
          <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400">
            {icon}
          </div>
        )}
      </div>

      <div className="mb-2">
        <span className={clsx(
          'text-2xl font-bold text-gray-900 dark:text-gray-100',
          valueClassName
        )}>
          {typeof value === 'number' ? formatCurrency(value) : value}
        </span>
      </div>

      {change && showTrend && (
        <div className={clsx(
          'flex items-center gap-1 px-2 py-1 rounded-md text-sm font-medium',
          getTrendColor(change.percentage),
          getBackgroundColor(change.percentage)
        )}>
          {getTrendIcon(change.percentage)}
          <span>
            {formatPercentage(Math.abs(change.percentage))} ({change.period})
          </span>
        </div>
      )}
    </div>
  );
};

export default MetricCard;