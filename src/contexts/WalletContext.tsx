import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { WalletState } from '../types';
import { useNetwork } from './NetworkContext';
import {
  connectWallet,
  getCurrentAccount,
  onAccountsChanged,
  onChainChanged,
  isMetaMaskInstalled,
} from '../services/walletService';

interface WalletContextType extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const { currentNetwork } = useNetwork();
  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false,
    isConnecting: false,
  });

  // Check for existing connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (!isMetaMaskInstalled()) {
        setWallet(prev => ({
          ...prev,
          error: 'MetaMask not found. Please install MetaMask.',
        }));
        return;
      }

      // Check if user has manually disconnected
      const isDisconnected = localStorage.getItem('wallet-disconnected') === 'true';
      if (isDisconnected) {
        return;
      }

      try {
        const account = await getCurrentAccount();
        if (account) {
          setWallet({
            address: account,
            isConnected: true,
            isConnecting: false,
          });
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    };

    checkConnection();
  }, []);

  // Listen for account and chain changes
  useEffect(() => {
    if (!isMetaMaskInstalled()) return;

    const cleanupAccounts = onAccountsChanged((accounts: string[]) => {
      if (accounts.length === 0) {
        // User disconnected
        setWallet({
          isConnected: false,
          isConnecting: false,
        });
        // Mark as manually disconnected
        localStorage.setItem('wallet-disconnected', 'true');
      } else {
        // User switched accounts
        setWallet(prev => ({
          ...prev,
          address: accounts[0],
          isConnected: true,
          error: undefined,
        }));
        // Clear disconnected flag
        localStorage.removeItem('wallet-disconnected');
      }
    });

    const cleanupChain = onChainChanged((chainId: string) => {
      // For now, we only support Ethereum mainnet
      if (chainId !== '0x1') {
        setWallet(prev => ({
          ...prev,
          error: 'Please switch to Ethereum mainnet',
        }));
      } else {
        setWallet(prev => ({
          ...prev,
          error: undefined,
        }));
      }
    });

    return () => {
      cleanupAccounts();
      cleanupChain();
    };
  }, []);

  const connect = async (): Promise<void> => {
    setWallet(prev => ({
      ...prev,
      isConnecting: true,
      error: undefined,
    }));

    try {
      const address = await connectWallet(currentNetwork);
      setWallet({
        address,
        isConnected: true,
        isConnecting: false,
      });
      // Clear disconnected flag when manually connecting
      localStorage.removeItem('wallet-disconnected');
    } catch (error: any) {
      setWallet({
        isConnected: false,
        isConnecting: false,
        error: error.message,
      });
    }
  };

  const disconnect = (): void => {
    setWallet({
      isConnected: false,
      isConnecting: false,
    });
    // Mark as manually disconnected
    localStorage.setItem('wallet-disconnected', 'true');
  };

  const contextValue: WalletContextType = {
    ...wallet,
    connect,
    disconnect,
  };

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};