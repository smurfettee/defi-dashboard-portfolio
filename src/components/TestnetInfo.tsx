import React from 'react';
import { useNetwork } from '../contexts/NetworkContext';
import { ExternalLink, Info } from 'lucide-react';

const TestnetInfo: React.FC = () => {
  const { isTestnet, networkInfo } = useNetwork();

  if (!isTestnet) return null;

  const faucetLinks = {
    sepolia: [
      {
        name: 'Alchemy Sepolia Faucet',
        url: 'https://sepoliafaucet.com/',
        description: 'Get Sepolia ETH from Alchemy',
      },
      {
        name: 'Infura Sepolia Faucet',
        url: 'https://www.infura.io/faucet/sepolia',
        description: 'Get Sepolia ETH from Infura',
      },
    ],
    goerli: [
      {
        name: 'Goerli Faucet',
        url: 'https://goerlifaucet.com/',
        description: 'Get Goerli ETH',
      },
      {
        name: 'Chainlink Faucet',
        url: 'https://faucets.chain.link/',
        description: 'Get testnet tokens from Chainlink',
      },
    ],
  };

  const currentFaucets = faucetLinks[networkInfo.name.toLowerCase().includes('sepolia') ? 'sepolia' : 'goerli'];

  return (
    <div className="card mb-6">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <Info className="w-5 h-5 text-blue-500" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Testnet Information
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            You're currently connected to {networkInfo.name}. To test the dashboard, you'll need some testnet tokens.
          </p>
          
          <div className="space-y-3">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                Get Testnet ETH:
              </h4>
              <div className="space-y-2">
                {currentFaucets.map((faucet) => (
                  <a
                    key={faucet.name}
                    href={faucet.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>{faucet.name}</span>
                    <span className="text-gray-500 dark:text-gray-400">- {faucet.description}</span>
                  </a>
                ))}
              </div>
            </div>
            
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Note:</strong> Testnet tokens have no real value and are only for testing purposes. 
                Make sure you're on the correct network in MetaMask.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestnetInfo; 