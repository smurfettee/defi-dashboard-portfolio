import React, { useState } from 'react';
import { Wallet, AlertCircle, Coins, History, TrendingUp, Shield, FileText, Activity } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { usePortfolio } from '../hooks/usePortfolio';
import PortfolioSummary from './PortfolioSummary';
import TokenList from './TokenList';
import TestnetInfo from './TestnetInfo';
import TransactionHistory from './TransactionHistory';
import { AnalyticsOverview } from './analytics';
import { DeFiProtocols } from './DeFiProtocols';
import { TaxReporting } from './TaxReporting';
import { RiskAssessment } from './RiskAssessment';
import clsx from 'clsx';

type DashboardTab = 'overview' | 'analytics' | 'transactions' | 'defi' | 'tax' | 'risk';

const Dashboard: React.FC = () => {
  const { isConnected, address } = useWallet();
  const portfolio = usePortfolio();
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');

  const tabs = [
    { id: 'overview' as DashboardTab, label: 'Overview', icon: Coins },
    { id: 'analytics' as DashboardTab, label: 'Analytics', icon: TrendingUp },
    { id: 'transactions' as DashboardTab, label: 'Transactions', icon: History },
    { id: 'defi' as DashboardTab, label: 'DeFi', icon: Activity },
    { id: 'tax' as DashboardTab, label: 'Tax', icon: FileText },
    { id: 'risk' as DashboardTab, label: 'Risk', icon: Shield }
  ];

  // Show welcome screen when wallet is not connected
  if (!isConnected || !address) {
    return (
      <div className="text-center py-16">
        <div className="max-w-md mx-auto">
          <div className="bg-primary-100 dark:bg-primary-900 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
            <Wallet className="w-12 h-12 text-primary-600 dark:text-primary-400" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            Welcome to DeFi Portfolio
          </h2>
          
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Connect your MetaMask wallet to view your cryptocurrency portfolio, 
            track token balances, and monitor your total portfolio value in real-time.
          </p>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                  Before you start
                </h3>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Make sure MetaMask is installed and unlocked</li>
                  <li>• Connect to Ethereum mainnet</li>
                  <li>• Your wallet data is read-only and secure</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (portfolio.error) {
    return (
      <div className="text-center py-16">
        <div className="max-w-md mx-auto">
          <div className="bg-red-100 dark:bg-red-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Failed to load portfolio
          </h2>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {portfolio.error}
          </p>

          <button
            onClick={portfolio.refresh}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-8">
            {/* Portfolio Summary */}
            <PortfolioSummary
              totalValue={portfolio.totalValue}
              ethBalance={portfolio.ethBalance}
              ethBalanceFormatted={portfolio.ethBalanceFormatted}
              ethUsdValue={portfolio.ethUsdValue}
              loading={portfolio.loading}
              onRefresh={portfolio.refresh}
            />

            {/* Token Holdings */}
            <TokenList
              tokens={portfolio.tokens}
              totalValue={portfolio.totalValue}
              loading={portfolio.loading}
            />
          </div>
        );
      
      case 'analytics':
        return <AnalyticsOverview />;
      
      case 'transactions':
        return <TransactionHistory />;
      
      case 'defi':
        return <DeFiProtocols />;
      
      case 'tax':
        return <TaxReporting />;
      
      case 'risk':
        return <RiskAssessment />;
      
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Testnet Information */}
      <TestnetInfo />
      
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  'flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                )}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {renderTabContent()}
    </div>
  );
};

export default Dashboard;