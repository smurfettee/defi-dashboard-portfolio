import React from 'react';
import { WalletProvider } from './contexts/WalletContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NetworkProvider } from './contexts/NetworkContext';
import ErrorBoundary from './components/ErrorBoundary';
import Header from './components/Header';
import Dashboard from './components/Dashboard';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <NetworkProvider>
          <WalletProvider>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
              <Header />
              <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Dashboard />
              </main>
            </div>
          </WalletProvider>
        </NetworkProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
