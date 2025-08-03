import React from 'react';
import { Wallet, AlertCircle, Loader2 } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { formatAddress } from '../utils/format';

const WalletConnect: React.FC = () => {
  const { address, isConnected, isConnecting, error, connect, disconnect } = useWallet();

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-2 rounded-lg">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm font-medium">{formatAddress(address)}</span>
        </div>
        <button
          onClick={disconnect}
          className="btn-secondary text-sm"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={connect}
        disabled={isConnecting}
        className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isConnecting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Wallet className="w-4 h-4" />
        )}
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </button>
      
      {error && (
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default WalletConnect;