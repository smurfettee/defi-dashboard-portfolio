import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import { formatCurrency, formatPercentage } from '../../utils/format';

interface AllocationData {
  symbol: string;
  value: number;
  percentage: number;
  color?: string;
}

interface AllocationChartProps {
  data: AllocationData[];
  isLoading?: boolean;
  height?: number;
  showLegend?: boolean;
  className?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0].payload;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
        {data.symbol}
      </p>
      <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
        {formatCurrency(data.value)}
      </p>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {formatPercentage(data.percentage)} of portfolio
      </p>
    </div>
  );
};

const CustomLegend: React.FC<{ payload?: any[] }> = ({ payload }) => {
  if (!payload) return null;

  return (
    <div className="grid grid-cols-2 gap-2 mt-4">
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
            {entry.value}
          </span>
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100 ml-auto">
            {formatPercentage(entry.payload.percentage)}
          </span>
        </div>
      ))}
    </div>
  );
};

const LoadingSkeleton: React.FC<{ height: number }> = ({ height }) => (
  <div className="animate-pulse" style={{ height }}>
    <div className="flex items-center justify-center h-full">
      <div className="w-48 h-48 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
    </div>
  </div>
);

const AllocationChart: React.FC<AllocationChartProps> = ({
  data,
  isLoading = false,
  height = 400,
  showLegend = true,
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
          <div className="text-gray-400 dark:text-gray-500 text-lg mb-2">🥧</div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            No allocation data available
          </p>
        </div>
      </div>
    );
  }

  // Filter out very small allocations and group them as "Others"
  const minPercentage = 2; // 2% minimum to show separately
  const significantData = data.filter(item => item.percentage >= minPercentage);
  const smallItems = data.filter(item => item.percentage < minPercentage);
  
  let chartData = [...significantData];
  
  if (smallItems.length > 0) {
    const othersValue = smallItems.reduce((sum, item) => sum + item.value, 0);
    const othersPercentage = smallItems.reduce((sum, item) => sum + item.percentage, 0);
    
    chartData.push({
      symbol: 'Others',
      value: othersValue,
      percentage: othersPercentage,
      color: '#9CA3AF'
    });
  }

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={120}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color || `hsl(${index * 45}, 70%, 60%)`}
                stroke="#ffffff"
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          {showLegend && <Legend content={<CustomLegend />} />}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AllocationChart;