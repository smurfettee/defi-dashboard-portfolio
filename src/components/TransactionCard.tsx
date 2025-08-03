import React from 'react';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  ArrowLeftRight,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Transaction } from '../types';
import { useNetwork } from '../contexts/NetworkContext';
import { formatTokenBalance } from '../utils/format';

interface TransactionCardProps {
  transaction: Transaction;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}

const TransactionCard: React.FC<TransactionCardProps> = ({
  transaction: tx,
  isExpanded,
  onToggleExpanded
}) => {
  const { networkInfo } = useNetwork();

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const formatAmount = () => {
    if (tx.type === 'token_transfer') {
      const tokenTx = tx as any;
      return {
        amount: tokenTx.tokenValue,
        symbol: tokenTx.tokenSymbol,
        full: `${tokenTx.tokenValue} ${tokenTx.tokenSymbol}`
      };
    } else if (tx.type === 'eth_transfer') {
      const ethTx = tx as any;
      const amount = parseFloat(ethTx.ethValue).toFixed(6);
      return {
        amount,
        symbol: 'ETH',
        full: `${amount} ETH`
      };
    }
    return { amount: '-', symbol: '', full: '-' };
  };

  const getTransactionIcon = () => {
    const direction = (tx as any).direction;
    const iconClass = "w-5 h-5";
    
    if (tx.type === 'contract_interaction') {
      return <ArrowLeftRight className={`${iconClass} text-purple-500`} />;
    }
    
    if (direction === 'in') {
      return <ArrowDownLeft className={`${iconClass} text-green-500`} />;
    } else if (direction === 'out') {
      return <ArrowUpRight className={`${iconClass} text-red-500`} />;
    }
    
    return <ArrowLeftRight className={`${iconClass} text-gray-500`} />;
  };

  const getStatusIcon = () => {
    switch (tx.status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getDirectionColor = () => {
    const direction = (tx as any).direction;
    if (direction === 'in') return 'text-green-600 dark:text-green-400';
    if (direction === 'out') return 'text-red-600 dark:text-red-400';
    return 'text-purple-600 dark:text-purple-400';
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getExplorerUrl = () => {
    return `${networkInfo.explorer}/tx/${tx.hash}`;
  };

  const { date, time } = formatDate(tx.timestamp);
  const amount = formatAmount();

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
      {/* Header Row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          {getTransactionIcon()}
          <div>
            <div className="flex items-center space-x-2">
              <span className={`text-sm font-medium ${getDirectionColor()}`}>
                {tx.type.replace('_', ' ').toUpperCase()}
              </span>
              {getStatusIcon()}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {date} at {time}
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className={`text-lg font-semibold ${getDirectionColor()}`}>
            {amount.full}
          </div>
          {tx.type === 'token_transfer' && (tx as any).usdValue && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              ${(tx as any).usdValue.toFixed(2)}
            </div>
          )}
        </div>
      </div>

      {/* Transaction Hash and Actions */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <span className="font-medium">Hash:</span> {truncateAddress(tx.hash)}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={onToggleExpanded}
            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </button>
          
          <a
            href={getExplorerUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ExternalLink className="w-4 h-4 text-blue-500" />
          </a>
        </div>
      </div>

      {/* Addresses */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-500 dark:text-gray-400">From:</span>
          <div className="font-mono text-gray-900 dark:text-white">
            {truncateAddress(tx.from)}
          </div>
        </div>
        
        {tx.to && (
          <div>
            <span className="text-gray-500 dark:text-gray-400">To:</span>
            <div className="font-mono text-gray-900 dark:text-white">
              {truncateAddress(tx.to)}
            </div>
          </div>
        )}
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                Transaction Details
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Block:</span>
                  <span className="font-mono">{tx.blockNumber.toString()}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Nonce:</span>
                  <span className="font-mono">{tx.nonce}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Gas Used:</span>
                  <span className="font-mono">{tx.gasUsed?.toString() || 'N/A'}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Gas Price:</span>
                  <span className="font-mono">{formatTokenBalance(tx.gasPrice, 9)} Gwei</span>
                </div>
                
                {tx.type === 'contract_interaction' && (tx as any).methodName && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Method:</span>
                    <span className="font-mono">{(tx as any).methodName}</span>
                  </div>
                )}
              </div>
            </div>

            {tx.type === 'token_transfer' && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  Token Details
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Token:</span>
                    <span>{(tx as any).tokenName}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Symbol:</span>
                    <span className="font-mono">{(tx as any).tokenSymbol}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Contract:</span>
                    <span className="font-mono">{truncateAddress((tx as any).tokenAddress)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Amount:</span>
                    <span className="font-mono">{(tx as any).tokenValue}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionCard;