import React from 'react';
import { TimePeriod } from '../../types';
import clsx from 'clsx';

interface TimePeriodSelectorProps {
  selectedPeriod: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
  className?: string;
}

const TIME_PERIODS: { value: TimePeriod; label: string }[] = [
  { value: '24h', label: '24H' },
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: '90d', label: '90D' },
  { value: '1y', label: '1Y' },
  { value: 'all', label: 'ALL' }
];

const TimePeriodSelector: React.FC<TimePeriodSelectorProps> = ({
  selectedPeriod,
  onPeriodChange,
  className
}) => {
  return (
    <div className={clsx('flex rounded-lg border border-gray-200 dark:border-gray-700 p-1 bg-gray-50 dark:bg-gray-800', className)}>
      {TIME_PERIODS.map((period) => (
        <button
          key={period.value}
          onClick={() => onPeriodChange(period.value)}
          className={clsx(
            'px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 flex-1 min-w-0',
            selectedPeriod === period.value
              ? 'bg-primary-600 text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white dark:hover:bg-gray-700'
          )}
        >
          {period.label}
        </button>
      ))}
    </div>
  );
};

export default TimePeriodSelector;