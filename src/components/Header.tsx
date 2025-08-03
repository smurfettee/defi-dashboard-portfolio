import React from 'react';
import { TrendingUp } from 'lucide-react';
import WalletConnect from './WalletConnect';
import ThemeToggle from './ThemeToggle';
import NetworkSelector from './NetworkSelector';

const Header: React.FC = () => {
  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center gap-2">
            <div className="bg-primary-600 rounded-lg p-2">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                DeFi Portfolio
              </h1>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Track your crypto assets
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <NetworkSelector />
            <ThemeToggle />
            <WalletConnect />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;