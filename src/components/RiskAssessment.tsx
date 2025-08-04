import React, { useState, useEffect } from 'react';
import { RiskMetrics, PortfolioOptimization } from '../types';
import { calculateRiskMetrics, generatePortfolioOptimization } from '../services/riskService';
import { usePortfolio } from '../hooks/usePortfolio';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Info,
  ChevronDown,
  ChevronRight,
  TrendingDown,
  BarChart3
} from 'lucide-react';

interface RiskAssessmentProps {
  className?: string;
}

export const RiskAssessment: React.FC<RiskAssessmentProps> = ({ className = '' }) => {
  const portfolio = usePortfolio();
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics | null>(null);
  const [optimization, setOptimization] = useState<PortfolioOptimization | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']));
  const [riskTolerance, setRiskTolerance] = useState<'conservative' | 'moderate' | 'aggressive'>('moderate');

  useEffect(() => {
    const fetchRiskMetrics = async () => {
      if (!portfolio.tokens.length) return;

      setLoading(true);
      setError(null);

      try {
        const metrics = await calculateRiskMetrics(portfolio.tokens);
        const optimizationResult = await generatePortfolioOptimization(portfolio.tokens, riskTolerance);
        
        setRiskMetrics(metrics);
        setOptimization(optimizationResult);
      } catch (err: any) {
        setError(err.message || 'Failed to calculate risk metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchRiskMetrics();
  }, [portfolio.tokens, riskTolerance]);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const getRiskScoreColor = (score: 'low' | 'medium' | 'high') => {
    switch (score) {
      case 'low': return 'text-green-600 dark:text-green-400';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400';
      case 'high': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getRiskScoreIcon = (score: 'low' | 'medium' | 'high') => {
    switch (score) {
      case 'low': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'medium': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'high': return <XCircle className="h-5 w-5 text-red-600" />;
      default: return <Info className="h-5 w-5 text-gray-600" />;
    }
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

  const formatNumber = (value: number, decimals: number = 2) => {
    return value.toFixed(decimals);
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
          <AlertTriangle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!riskMetrics) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 ${className}`}>
        <div className="text-center text-gray-500 dark:text-gray-400">
          <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No Risk Data Available</h3>
          <p className="text-sm">Connect your wallet to view risk assessment</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Risk Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div 
          className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          onClick={() => toggleSection('overview')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="h-5 w-5 text-blue-600" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Portfolio Risk Assessment
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Comprehensive risk analysis and metrics
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className={`text-lg font-semibold ${getRiskScoreColor(riskMetrics.riskScore)}`}>
                  {riskMetrics.riskScore.toUpperCase()} RISK
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatPercentage(riskMetrics.volatility * 100)} Volatility
                </p>
              </div>
              
              {expandedSections.has('overview') ? (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-400" />
              )}
            </div>
          </div>
        </div>

        {expandedSections.has('overview') && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-blue-600 dark:text-blue-400">Volatility</p>
                    <p className="text-lg font-semibold text-blue-800 dark:text-blue-200">
                      {formatPercentage(riskMetrics.volatility * 100)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="text-sm text-red-600 dark:text-red-400">VaR (95%)</p>
                    <p className="text-lg font-semibold text-red-800 dark:text-red-200">
                      {formatCurrency(riskMetrics.var95)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <TrendingDown className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="text-sm text-yellow-600 dark:text-yellow-400">Max Drawdown</p>
                    <p className="text-lg font-semibold text-yellow-800 dark:text-yellow-200">
                      {formatPercentage(riskMetrics.maxDrawdown)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-green-600 dark:text-green-400">Sharpe Ratio</p>
                    <p className="text-lg font-semibold text-green-800 dark:text-green-200">
                      {formatNumber(riskMetrics.sharpeRatio)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Risk Metrics</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Beta (vs ETH):</span>
                    <span className="font-medium">{formatNumber(riskMetrics.beta)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Diversification Score:</span>
                    <span className="font-medium">{formatPercentage(riskMetrics.diversificationScore)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Concentration Risk:</span>
                    <span className="font-medium">{formatPercentage(riskMetrics.concentrationRisk)}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Risk Assessment</h4>
                <div className="flex items-center space-x-2 mb-2">
                  {getRiskScoreIcon(riskMetrics.riskScore)}
                  <span className={`font-medium ${getRiskScoreColor(riskMetrics.riskScore)}`}>
                    {riskMetrics.riskScore.toUpperCase()} RISK PORTFOLIO
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {riskMetrics.riskScore === 'low' && 'Your portfolio shows low risk characteristics with good diversification.'}
                  {riskMetrics.riskScore === 'medium' && 'Your portfolio has moderate risk with room for optimization.'}
                  {riskMetrics.riskScore === 'high' && 'Your portfolio has high risk. Consider rebalancing for better diversification.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sector Allocation */}
      {Object.keys(riskMetrics.sectorAllocation).length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div 
            className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            onClick={() => toggleSection('sectors')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Shield className="h-5 w-5 text-purple-600" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Sector Allocation
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Portfolio breakdown by token categories
                  </p>
                </div>
              </div>
              
              {expandedSections.has('sectors') ? (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-400" />
              )}
            </div>
          </div>

          {expandedSections.has('sectors') && (
            <div className="border-t border-gray-200 dark:border-gray-700 p-4">
              <div className="space-y-3">
                {Object.entries(riskMetrics.sectorAllocation).map(([sector, percentage]) => (
                  <div key={sector} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <span className="font-medium text-gray-900 dark:text-white">{sector}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-32 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div 
                          className="bg-purple-500 h-2 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {formatPercentage(percentage)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Portfolio Optimization */}
      {optimization && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div 
            className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            onClick={() => toggleSection('optimization')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Shield className="h-5 w-5 text-green-600" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Portfolio Optimization
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Recommendations for {riskTolerance} risk tolerance
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <select
                  value={riskTolerance}
                  onChange={(e) => setRiskTolerance(e.target.value as 'conservative' | 'moderate' | 'aggressive')}
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="conservative">Conservative</option>
                  <option value="moderate">Moderate</option>
                  <option value="aggressive">Aggressive</option>
                </select>
                
                {expandedSections.has('optimization') ? (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                )}
              </div>
            </div>
          </div>

          {expandedSections.has('optimization') && (
            <div className="border-t border-gray-200 dark:border-gray-700 p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Expected Performance</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Expected Return:</span>
                      <span className="font-medium">{formatPercentage(optimization.expectedReturn * 100)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Expected Risk:</span>
                      <span className="font-medium">{formatPercentage(optimization.expectedRisk * 100)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Rebalancing Cost:</span>
                      <span className="font-medium">{formatCurrency(optimization.rebalancingCost)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Optimization Status</h4>
                  <div className="flex items-center space-x-2 mb-2">
                    {optimization.rebalancingNeeded ? (
                      <XCircle className="h-5 w-5 text-red-600" />
                    ) : (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    )}
                    <span className={`font-medium ${optimization.rebalancingNeeded ? 'text-red-600' : 'text-green-600'}`}>
                      {optimization.rebalancingNeeded ? 'Rebalancing Needed' : 'Portfolio Optimized'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {optimization.rebalancingNeeded 
                      ? 'Your portfolio could benefit from rebalancing to match your risk tolerance.'
                      : 'Your portfolio is well-optimized for your current risk tolerance.'
                    }
                  </p>
                </div>
              </div>

              {/* Recommendations */}
              {optimization.recommendations.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Recommendations</h4>
                  <div className="space-y-3">
                    {optimization.recommendations.map((rec, index) => (
                      <div key={index} className={`p-3 rounded-lg border ${
                        rec.priority === 'high' 
                          ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
                          : rec.priority === 'medium'
                          ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                          : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-2 h-2 rounded-full ${
                              rec.priority === 'high' ? 'bg-red-500' : 
                              rec.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                            }`}></div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {rec.type.toUpperCase()} {rec.tokenSymbol}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {rec.reason}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {formatCurrency(rec.amount)}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                              {rec.priority} priority
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
      )}
    </div>
  );
}; 