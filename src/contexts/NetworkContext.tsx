import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SUPPORTED_NETWORKS, DEFAULT_NETWORK, TOKEN_CONFIGS } from '../utils/constants';

type NetworkKey = keyof typeof SUPPORTED_NETWORKS;

interface NetworkContextType {
  currentNetwork: NetworkKey;
  setNetwork: (network: NetworkKey) => void;
  networkInfo: typeof SUPPORTED_NETWORKS[NetworkKey];
  tokens: typeof TOKEN_CONFIGS[NetworkKey];
  isTestnet: boolean;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

interface NetworkProviderProps {
  children: ReactNode;
}

export const NetworkProvider: React.FC<NetworkProviderProps> = ({ children }) => {
  const [currentNetwork, setCurrentNetwork] = useState<NetworkKey>(DEFAULT_NETWORK);

  const networkInfo = SUPPORTED_NETWORKS[currentNetwork];
  const tokens = TOKEN_CONFIGS[currentNetwork];
  const isTestnet = currentNetwork !== 'mainnet';

  const setNetwork = (network: NetworkKey) => {
    setCurrentNetwork(network);
    // Save to localStorage
    localStorage.setItem('preferred-network', network);
  };

  useEffect(() => {
    // Load preferred network from localStorage
    const savedNetwork = localStorage.getItem('preferred-network') as NetworkKey;
    if (savedNetwork && SUPPORTED_NETWORKS[savedNetwork]) {
      setCurrentNetwork(savedNetwork);
    }
  }, []);

  const contextValue: NetworkContextType = {
    currentNetwork,
    setNetwork,
    networkInfo,
    tokens,
    isTestnet,
  };

  return (
    <NetworkContext.Provider value={contextValue}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = (): NetworkContextType => {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
}; 