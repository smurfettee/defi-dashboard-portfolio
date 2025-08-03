import { createPublicClient, http, formatUnits } from 'viem';
import { mainnet, sepolia } from 'viem/chains';
import { SUPPORTED_NETWORKS, ERROR_MESSAGES } from '../utils/constants';

// Create public client factory for different networks
export const createPublicClientForNetwork = (networkKey: keyof typeof SUPPORTED_NETWORKS) => {
  const network = SUPPORTED_NETWORKS[networkKey];
  
  let chain;
  switch (networkKey) {
    case 'mainnet':
      chain = mainnet;
      break;
    case 'sepolia':
      chain = sepolia;
      break;
    default:
      chain = mainnet;
  }

  return createPublicClient({
    chain,
    transport: http(network.rpcUrl, {
      timeout: 10000, // 10 second timeout
      retryCount: 2,  // Retry failed requests
    }),
  });
};

/**
 * Check if MetaMask is installed
 */
export const isMetaMaskInstalled = (): boolean => {
  return typeof window !== 'undefined' && Boolean(window.ethereum?.isMetaMask);
};

/**
 * Connect to MetaMask wallet
 */
export const connectWallet = async (targetNetwork: keyof typeof SUPPORTED_NETWORKS = 'mainnet'): Promise<string> => {
  if (!isMetaMaskInstalled()) {
    throw new Error(ERROR_MESSAGES.WALLET_NOT_FOUND);
  }

  try {
    // Request account access
    const accounts = await window.ethereum!.request({
      method: 'eth_requestAccounts',
    }) as string[];

    if (!accounts || accounts.length === 0) {
      throw new Error(ERROR_MESSAGES.CONNECTION_REJECTED);
    }

    // Switch to target network
    const targetNetworkInfo = SUPPORTED_NETWORKS[targetNetwork];
    try {
      await window.ethereum!.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetNetworkInfo.chainId }],
      });
    } catch (switchError: any) {
      // Chain doesn't exist, try to add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum!.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: targetNetworkInfo.chainId,
              chainName: targetNetworkInfo.name,
              nativeCurrency: targetNetworkInfo.nativeCurrency,
              rpcUrls: [targetNetworkInfo.rpcUrl],
              blockExplorerUrls: [targetNetworkInfo.explorer],
            }],
          });
        } catch (addError: any) {
          throw new Error(`Failed to add ${targetNetworkInfo.name}. Please add it manually in MetaMask.`);
        }
      } else {
        throw new Error(`Failed to switch to ${targetNetworkInfo.name}`);
      }
    }

    return accounts[0];
  } catch (error: any) {
    if (error.code === 4001) {
      throw new Error(ERROR_MESSAGES.CONNECTION_REJECTED);
    }
    throw new Error(error.message || ERROR_MESSAGES.UNKNOWN_ERROR);
  }
};

/**
 * Get current connected account
 */
export const getCurrentAccount = async (): Promise<string | null> => {
  if (!isMetaMaskInstalled()) {
    return null;
  }

  try {
    const accounts = await window.ethereum!.request({
      method: 'eth_accounts',
    }) as string[];

    return accounts.length > 0 ? accounts[0] : null;
  } catch (error) {
    console.error('Error getting current account:', error);
    return null;
  }
};

/**
 * Get ETH balance for an address
 */
export const getEthBalance = async (
  address: string, 
  networkKey: keyof typeof SUPPORTED_NETWORKS = 'mainnet'
): Promise<{ balance: bigint; formatted: string }> => {
  try {
    const publicClient = createPublicClientForNetwork(networkKey);
    const balance = await publicClient.getBalance({
      address: address as `0x${string}`,
    });

    const formatted = formatUnits(balance, 18);

    return {
      balance,
      formatted,
    };
  } catch (error) {
    console.error('Error fetching ETH balance:', error);
    throw new Error(ERROR_MESSAGES.BALANCE_FETCH_ERROR);
  }
};

/**
 * Listen for account changes
 */
export const onAccountsChanged = (callback: (accounts: string[]) => void): (() => void) => {
  if (!isMetaMaskInstalled()) {
    return () => {};
  }

  const handleAccountsChanged = (accounts: string[]) => {
    callback(accounts);
  };

  window.ethereum!.on('accountsChanged', handleAccountsChanged);

  // Return cleanup function
  return () => {
    window.ethereum!.removeListener('accountsChanged', handleAccountsChanged);
  };
};

/**
 * Listen for chain changes
 */
export const onChainChanged = (callback: (chainId: string) => void): (() => void) => {
  if (!isMetaMaskInstalled()) {
    return () => {};
  }

  const handleChainChanged = (chainId: string) => {
    callback(chainId);
  };

  window.ethereum!.on('chainChanged', handleChainChanged);

  // Return cleanup function
  return () => {
    window.ethereum!.removeListener('chainChanged', handleChainChanged);
  };
};

// Extend window interface for TypeScript
declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (data: any) => void) => void;
      removeListener: (event: string, callback: (data: any) => void) => void;
    };
  }
}