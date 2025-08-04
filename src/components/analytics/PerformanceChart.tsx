import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { ChartDataPoint } from '../../types';
import { formatCurrency } from '../../utils/format';
// Using built-in Date methods for formatting

interface PerformanceChartProps {
  data: ChartDataPoint[];
  isLoading?: boolean;
  height?: number;
  showTokenBreakdown?: boolean;
  className?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0].payload;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4">
      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
        {new Date(data.timestamp).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}
      </p>
      <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
        {formatCurrency(data.value)}
      </p>
      {data.tokens && (
        <div className="mt-2 space-y-1">
          {Object.entries(data.tokens)
            .filter(([, value]) => (value as number) > 0)
            .sort(([, a], [, b]) => (b as number) - (a as number))
            .slice(0, 5) // Show top 5 tokens
            .map(([symbol, value]) => (
              <div key={symbol} className="flex justify-between items-center text-xs">
                <span className="text-gray-600 dark:text-gray-400">{symbol}:</span>
                <span className="text-gray-900 dark:text-gray-100 font-medium">
                  {formatCurrency(value as number)}
                </span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

const LoadingSkeleton: React.FC<{ height: number }> = ({ height }) => (
  <div className="animate-pulse" style={{ height }}>
    <div className="h-full bg-gray-200 dark:bg-gray-700 rounded"></div>
  </div>
);

const PerformanceChart: React.FC<PerformanceChartProps> = ({
  data,
  isLoading = false,
  height = 400,
  showTokenBreakdown = false,
  className
}) => {
  if (isLoading) {
    return <LoadingSkeleton height={height} />;
  }

  if (!data || data.length === 0) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600"
        style={{ height }}
      >
        <div className="text-center">
          <div className="text-gray-400 dark:text-gray-500 text-lg mb-2">📈</div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            No historical data available
          </p>
        </div>
      </div>
    );
  }

  // Calculate min and max values for better Y-axis scaling
  const values = data.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const padding = (maxValue - minValue) * 0.1;

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 20,
          }}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="#374151" 
            opacity={0.3}
          />
          <XAxis
            dataKey="date"
            stroke="#6B7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#6B7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `$${(value / 1000).toFixed(1)}k`}
            domain={[
              Math.max(0, minValue - padding),
              maxValue + padding
            ]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#3B82F6"
            strokeWidth={2}
            dot={false}
            activeDot={{ 
              r: 6, 
              stroke: '#3B82F6', 
              strokeWidth: 2, 
              fill: '#fff' 
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PerformanceChart;