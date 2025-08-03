import React from 'react';
import { Wallet, AlertCircle } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { usePortfolio } from '../hooks/usePortfolio';
import PortfolioSummary from './PortfolioSummary';
import TokenList from './TokenList';
import TestnetInfo from './TestnetInfo';

const Dashboard: React.FC = () => {
  const { isConnected, address } = useWallet();
  const portfolio = usePortfolio();

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

  return (
    <div className="space-y-8">
      {/* Testnet Information */}
      <TestnetInfo />
      
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
};

export default Dashboard;