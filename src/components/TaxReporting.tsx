import React, { useState, useEffect } from 'react';
import { TaxReport, TaxSettings, Token } from '../types';
import { 
  TaxCalculator, 
  convertToTaxTransactions, 
  generateTaxCSV, 
  calculateUnrealizedGains, 
  getDefaultTaxSettings 
} from '../services/taxService';
import { useWallet } from '../contexts/WalletContext';
import { usePortfolio } from '../hooks/usePortfolio';
import { useTransactionHistory } from '../hooks/useTransactionHistory';
import { 
  FileText, 
  Download, 
  Settings, 
  TrendingUp, 
  ChevronDown, 
  ChevronRight, 
  ChevronUp,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface TaxReportingProps {
  className?: string;
}

export const TaxReporting: React.FC<TaxReportingProps> = ({ className = '' }) => {
  const { address } = useWallet();
  const portfolio = usePortfolio();
  const { transactions } = useTransactionHistory();
  const [taxSettings, setTaxSettings] = useState<TaxSettings>(getDefaultTaxSettings());
  const [taxReport, setTaxReport] = useState<TaxReport | null>(null);
  const [unrealizedGains, setUnrealizedGains] = useState<Array<{
    token: Token;
    unrealizedGainLoss: number;
    unrealizedGainLossPercentage: number;
    averageCostBasis: number;
  }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    const generateTaxReport = async () => {
      if (!address || !portfolio.tokens.length || !transactions.length) return;

      setLoading(true);
      setError(null);

      try {
        // Convert transactions to tax transactions
        const taxTransactions = await convertToTaxTransactions(transactions, taxSettings);
        
        // Calculate unrealized gains
        const gains = await calculateUnrealizedGains(portfolio.tokens, taxSettings);
        
        // Generate tax report
        const calculator = new TaxCalculator(taxSettings);
        taxTransactions.forEach(tx => calculator.addTransaction(tx));
        const report = calculator.generateTaxReport(taxSettings.taxYear);
        
        setTaxReport(report);
        setUnrealizedGains(gains);
      } catch (err: any) {
        setError(err.message || 'Failed to generate tax report');
      } finally {
        setLoading(false);
      }
    };

    generateTaxReport();
  }, [address, portfolio.tokens, transactions, taxSettings]);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handleSettingsChange = (key: keyof TaxSettings, value: any) => {
    setTaxSettings(prev => ({ ...prev, [key]: value }));
  };

  const exportTaxReport = () => {
    if (!taxReport) return;

    const csv = generateTaxCSV(taxReport);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tax-report-${taxSettings.taxYear}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportSummary = () => {
    if (!taxReport) return;

    const summary = generateTaxCSV(taxReport); // Assuming generateTaxCSV can handle summary generation
    const blob = new Blob([summary], { type: 'text/csv' }); // Or 'text/plain' if generateTaxCSV returns plain text
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tax-summary-${taxSettings.taxYear}.csv`; // Changed to .csv for consistency
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

  const getGainLossColor = (value: number) => {
    if (value > 0) return 'text-green-600 dark:text-green-400';
    if (value < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getGainLossIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="h-4 w-4" />;
    if (value < 0) return null; // Removed TrendingDown as it's no longer imported
    return null;
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 ${className}`}>
        <div className="flex items-center space-x-2 text-red-500">
          <XCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Tax Reporting
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Generate tax reports and track realized/unrealized gains
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </button>
            
            {taxReport && (
              <button
                onClick={exportTaxReport}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Export CSV</span>
              </button>
            )}
          </div>
        </div>

        {/* Tax Settings */}
        {showSettings && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Tax Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cost Basis Method
                </label>
                <select
                  value={taxSettings.method}
                  onChange={(e) => handleSettingsChange('method', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="FIFO">FIFO (First In, First Out)</option>
                  <option value="LIFO">LIFO (Last In, First Out)</option>
                  <option value="SPECIFIC_ID">Specific Identification</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tax Year
                </label>
                <input
                  type="number"
                  value={taxSettings.taxYear}
                  onChange={(e) => handleSettingsChange('taxYear', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  min="2010"
                  max={new Date().getFullYear() + 1}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Long-term Threshold (days)
                </label>
                <input
                  type="number"
                  value={taxSettings.longTermThreshold}
                  onChange={(e) => handleSettingsChange('longTermThreshold', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  min="0"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includeGasFees"
                  checked={taxSettings.includeGasFees}
                  onChange={(e) => handleSettingsChange('includeGasFees', e.target.checked)}
                  className="rounded border-gray-300 dark:border-gray-600"
                />
                <label htmlFor="includeGasFees" className="text-sm text-gray-700 dark:text-gray-300">
                  Include gas fees in cost basis
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includeAirdrops"
                  checked={taxSettings.includeAirdrops}
                  onChange={(e) => handleSettingsChange('includeAirdrops', e.target.checked)}
                  className="rounded border-gray-300 dark:border-gray-600"
                />
                <label htmlFor="includeAirdrops" className="text-sm text-gray-700 dark:text-gray-300">
                  Include airdrops
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includeStakingRewards"
                  checked={taxSettings.includeStakingRewards}
                  onChange={(e) => handleSettingsChange('includeStakingRewards', e.target.checked)}
                  className="rounded border-gray-300 dark:border-gray-600"
                />
                <label htmlFor="includeStakingRewards" className="text-sm text-gray-700 dark:text-gray-300">
                  Include staking rewards
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tax Summary */}
      {taxReport && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div 
            className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            onClick={() => toggleSection('summary')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Tax Summary for {taxReport.year}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {taxReport.summary.totalTransactions} transactions processed
                  </p>
                </div>
              </div>
              
              {expandedSections.has('summary') ? (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-400" />
              )}
            </div>
          </div>

          {expandedSections.has('summary') && (
            <div className="border-t border-gray-200 dark:border-gray-700 p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-blue-600 dark:text-blue-400">Total Proceeds</p>
                      <p className="text-lg font-semibold text-blue-800 dark:text-blue-200">
                        {formatCurrency(taxReport.totalProceeds)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Cost Basis</p>
                      <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                        {formatCurrency(taxReport.totalCostBasis)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className={`border rounded-lg p-4 ${
                  taxReport.totalGainLoss > 0 
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}>
                  <div className="flex items-center space-x-2">
                    {getGainLossIcon(taxReport.totalGainLoss)}
                    <div>
                      <p className={`text-sm ${getGainLossColor(taxReport.totalGainLoss)}`}>
                        Total Gain/Loss
                      </p>
                      <p className={`text-lg font-semibold ${getGainLossColor(taxReport.totalGainLoss)}`}>
                        {formatCurrency(taxReport.totalGainLoss)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-sm text-purple-600 dark:text-purple-400">Avg Holding Period</p>
                      <p className="text-lg font-semibold text-purple-800 dark:text-purple-200">
                        {taxReport.summary.averageHoldingPeriod.toFixed(1)} days
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Transaction Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Total Transactions:</span>
                      <span className="font-medium">{taxReport.summary.totalTransactions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Buy Transactions:</span>
                      <span className="font-medium">{taxReport.summary.buyTransactions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Sell Transactions:</span>
                      <span className="font-medium">{taxReport.summary.sellTransactions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Best Performer:</span>
                      <span className="font-medium">{taxReport.summary.bestPerformingToken}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Worst Performer:</span>
                      <span className="font-medium">{taxReport.summary.worstPerformingToken}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Gain/Loss Breakdown</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Short-term:</span>
                      <span className={`font-medium ${getGainLossColor(taxReport.shortTermGainLoss)}`}>
                        {formatCurrency(taxReport.shortTermGainLoss)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Long-term:</span>
                      <span className={`font-medium ${getGainLossColor(taxReport.longTermGainLoss)}`}>
                        {formatCurrency(taxReport.longTermGainLoss)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex space-x-2">
                <button
                  onClick={exportSummary}
                  className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  <span>Export Summary</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Unrealized Gains */}
      {unrealizedGains.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div 
            className="flex items-center justify-between p-4 cursor-pointer"
            onClick={() => toggleSection('unrealized')}
          >
            <div className="flex items-center space-x-3">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Unrealized Gains/Losses
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Current market value vs. cost basis
                </p>
              </div>
            </div>
            {expandedSections.has('unrealized') ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </div>
          
          {expandedSections.has('unrealized') && (
            <div className="border-t border-gray-200 dark:border-gray-700 p-4">
              <div className="space-y-3">
                {unrealizedGains.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold">{item.token.symbol}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {item.token.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Cost Basis: {formatCurrency(item.averageCostBasis)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className={`font-semibold ${getGainLossColor(item.unrealizedGainLoss)}`}>
                        {formatCurrency(item.unrealizedGainLoss)}
                      </p>
                      <p className={`text-sm ${getGainLossColor(item.unrealizedGainLossPercentage)}`}>
                        {formatPercentage(item.unrealizedGainLossPercentage)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* No Data State */}
      {!taxReport && !loading && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No Tax Data Available</h3>
            <p className="text-sm">Connect your wallet and have transaction history to generate tax reports</p>
          </div>
        </div>
      )}
    </div>
  );
}; 