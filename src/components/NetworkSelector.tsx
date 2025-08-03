import React from 'react';
import { useNetwork } from '../contexts/NetworkContext';
import { SUPPORTED_NETWORKS } from '../utils/constants';
import { Network, TestTube } from 'lucide-react';

const NetworkSelector: React.FC = () => {
  const { currentNetwork, setNetwork, isTestnet } = useNetwork();

  const networks = Object.entries(SUPPORTED_NETWORKS).map(([key, network]) => ({
    key: key as keyof typeof SUPPORTED_NETWORKS,
    ...network,
  }));

  return (
    <div className="flex items-center space-x-2">
      <div className="flex items-center space-x-1">
        {isTestnet ? (
          <TestTube className="w-4 h-4 text-orange-500" />
        ) : (
          <Network className="w-4 h-4 text-green-500" />
        )}
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Network:
        </span>
      </div>
      
      <select
        value={currentNetwork}
        onChange={(e) => setNetwork(e.target.value as keyof typeof SUPPORTED_NETWORKS)}
        className="text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
      >
        {networks.map((network) => (
          <option key={network.key} value={network.key}>
            {network.name}
          </option>
        ))}
      </select>
      
      {isTestnet && (
        <div className="flex items-center space-x-1 px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded-md text-xs">
          <TestTube className="w-3 h-3" />
          <span>Testnet</span>
        </div>
      )}
    </div>
  );
};

export default NetworkSelector; 