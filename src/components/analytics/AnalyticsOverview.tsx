import React, { useState } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  PieChart, 
  BarChart3, 
  Download,
  RefreshCw,
  Clock
} from 'lucide-react';
import { TimePeriod } from '../../types';
import { usePortfolioAnalytics } from '../../hooks/usePortfolioAnalytics';
import TimePeriodSelector from './TimePeriodSelector';
import MetricCard from './MetricCard';
import PerformanceChart from './PerformanceChart';
import AllocationChart from './AllocationChart';
import TokenPerformanceList from './TokenPerformanceList';
// formatCurrency is used indirectly through MetricCard component
import clsx from 'clsx';

interface AnalyticsOverviewProps {
  className?: string;
}

const AnalyticsOverview: React.FC<AnalyticsOverviewProps> = ({ className }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('30d');
  const analytics = usePortfolioAnalytics(selectedPeriod);

  const handleExport = () => {
    analytics.exportToCSV();
  };

  const handleRefresh = () => {
    analytics.refresh();
  };

  return (
    <div className={clsx('space-y-6', className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Portfolio Analytics
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Comprehensive analysis of your DeFi portfolio performance
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={analytics.loading}
            className="btn-secondary flex items-center gap-2"
            title="Refresh analytics data"
          >
            <RefreshCw className={clsx('w-4 h-4', analytics.loading && 'animate-spin')} />
            Refresh
          </button>
          
          <button
            onClick={handleExport}
            disabled={analytics.loading || analytics.tokenPerformance.length === 0}
            className="btn-primary flex items-center gap-2"
            title="Export portfolio data to CSV"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Time Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <TimePeriodSelector
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
          className="w-full sm:w-auto"
        />
        
        {analytics.lastUpdated && (
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Clock className="w-4 h-4" />
            Last updated: {new Date(analytics.lastUpdated).toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Error State */}
      {analytics.error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-red-600 dark:text-red-400">⚠️</div>
            <div>
              <h3 className="font-medium text-red-900 dark:text-red-100 mb-1">
                Failed to load analytics
              </h3>
              <p className="text-sm text-red-800 dark:text-red-200">
                {analytics.error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Portfolio Value"
          value={analytics.metrics.totalValue}
          change={analytics.metrics.totalChange24h}
          icon={<DollarSign className="w-6 h-6" />}
          isLoading={analytics.loading}
        />
        
        <MetricCard
          title="7d Performance"
          value={`${analytics.metrics.totalChange7d.percentage >= 0 ? '+' : ''}${analytics.metrics.totalChange7d.percentage.toFixed(2)}%`}
          change={analytics.metrics.totalChange7d}
          icon={<TrendingUp className="w-6 h-6" />}
          isLoading={analytics.loading}
          showTrend={false}
          valueClassName={clsx(
            analytics.metrics.totalChange7d.percentage >= 0 
              ? 'text-green-600 dark:text-green-400' 
              : 'text-red-600 dark:text-red-400'
          )}
        />
        
        <MetricCard
          title="Number of Assets"
          value={analytics.metrics.numberOfTokens}
          icon={<PieChart className="w-6 h-6" />}
          isLoading={analytics.loading}
          showTrend={false}
        />
        
        <MetricCard
          title="Largest Holding"
          value={`${analytics.metrics.largestHoldingPercentage.toFixed(1)}%`}
          icon={<BarChart3 className="w-6 h-6" />}
          isLoading={analytics.loading}
          showTrend={false}
        />
      </div>

      {/* Best/Worst Performers */}
      {(analytics.metrics.bestPerformer || analytics.metrics.worstPerformer) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {analytics.metrics.bestPerformer && (
            <MetricCard
              title="Best Performer (24h)"
              value={analytics.metrics.bestPerformer.symbol}
              change={analytics.metrics.bestPerformer.change}
              isLoading={analytics.loading}
              className="border-green-200 dark:border-green-800"
            />
          )}
          
          {analytics.metrics.worstPerformer && (
            <MetricCard
              title="Worst Performer (24h)"
              value={analytics.metrics.worstPerformer.symbol}
              change={analytics.metrics.worstPerformer.change}
              isLoading={analytics.loading}
              className="border-red-200 dark:border-red-800"
            />
          )}
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Portfolio Performance Chart */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Portfolio Performance
            </h3>
            <PerformanceChart
              data={analytics.historicalData}
              isLoading={analytics.loading}
              height={350}
            />
          </div>
        </div>

        {/* Allocation Chart */}
        <div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Asset Allocation
            </h3>
            <AllocationChart
              data={analytics.allocationData}
              isLoading={analytics.loading}
              height={350}
              showLegend={false}
            />
          </div>
        </div>
      </div>

      {/* Token Performance Table */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Token Performance
          </h3>
          {analytics.tokenPerformance.length > 10 && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Top 10 tokens by value
            </span>
          )}
        </div>
        <TokenPerformanceList
          data={analytics.tokenPerformance}
          isLoading={analytics.loading}
          maxItems={10}
        />
      </div>

      {/* Auto-refresh Status */}
      {analytics.isAutoRefreshing && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Auto-refresh enabled
              </p>
              <p className="text-xs text-blue-800 dark:text-blue-200">
                Data refreshes every 60 seconds
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsOverview;