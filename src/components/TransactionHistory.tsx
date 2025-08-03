import React, { useState } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  ArrowLeftRight,
  ExternalLink,
  Filter,
  Download,
  RefreshCw,
  Search,
  Calendar,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  Smartphone,
  Monitor
} from 'lucide-react';
import { useTransactionHistory } from '../hooks/useTransactionHistory';
import { useNetwork } from '../contexts/NetworkContext';
import { Transaction, TransactionFilter } from '../types';
import { formatTokenBalance } from '../utils/format';
import TransactionCard from './TransactionCard';

const TransactionHistory: React.FC = () => {
  const { 
    transactions, 
    loading, 
    hasMore, 
    error, 
    filter,
    loadMore, 
    refresh, 
    setFilter,
    resetFilter,
    exportToCSV,
    stats
  } = useTransactionHistory();
  
  const { networkInfo } = useNetwork();
  const [expandedTx, setExpandedTx] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>(() => {
    // Auto-detect mobile devices and default to card view
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768 ? 'cards' : 'table';
    }
    return 'table';
  });

  const handleFilterChange = (key: keyof TransactionFilter, value: any) => {
    setFilter({ [key]: value });
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString() + ' ' + 
           new Date(timestamp * 1000).toLocaleTimeString();
  };

  const formatAmount = (tx: Transaction) => {
    if (tx.type === 'token_transfer') {
      const tokenTx = tx as any;
      return `${tokenTx.tokenValue} ${tokenTx.tokenSymbol}`;
    } else if (tx.type === 'eth_transfer') {
      const ethTx = tx as any;
      return `${parseFloat(ethTx.ethValue).toFixed(6)} ETH`;
    }
    return '-';
  };

  const getTransactionIcon = (tx: Transaction) => {
    const direction = (tx as any).direction;
    const iconClass = "w-4 h-4";
    
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

  const getStatusIcon = (status: string) => {
    switch (status) {
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

  const getExplorerUrl = (hash: string) => {
    return `${networkInfo.explorer}/tx/${hash}`;
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const toggleExpanded = (hash: string) => {
    setExpandedTx(expandedTx === hash ? null : hash);
  };

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center space-x-2 text-red-500">
          <AlertCircle className="w-5 h-5" />
          <span>Error loading transactions: {error}</span>
        </div>
        <button
          onClick={refresh}
          className="mt-4 mx-auto block px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Transaction History
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {stats.filtered} of {stats.total} transactions
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* View Mode Toggle */}
            <div className="hidden md:flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-md p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1 rounded ${viewMode === 'table' 
                  ? 'bg-white dark:bg-gray-600 shadow-sm' 
                  : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                } transition-colors`}
                title="Table view"
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1 rounded ${viewMode === 'cards' 
                  ? 'bg-white dark:bg-gray-600 shadow-sm' 
                  : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                } transition-colors`}
                title="Card view"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title="Toggle filters"
            >
              <Filter className="w-4 h-4" />
            </button>
            
            <button
              onClick={exportToCSV}
              className="p-2 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title="Export to CSV"
              disabled={transactions.length === 0}
            >
              <Download className="w-4 h-4" />
            </button>
            
            <button
              onClick={refresh}
              disabled={loading}
              className="p-2 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
              title="Refresh"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Transaction Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Type
                </label>
                <select
                  value={filter.type || 'all'}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="eth_transfer">ETH Transfers</option>
                  <option value="token_transfer">Token Transfers</option>
                  <option value="contract_interaction">Contract Interactions</option>
                </select>
              </div>

              {/* Direction Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Direction
                </label>
                <select
                  value={filter.direction || 'all'}
                  onChange={(e) => handleFilterChange('direction', e.target.value)}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                >
                  <option value="all">All Directions</option>
                  <option value="in">Incoming</option>
                  <option value="out">Outgoing</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={filter.status || 'all'}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="success">Success</option>
                  <option value="failed">Failed</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Hash, address, token..."
                    value={filter.search || ''}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 pl-10 pr-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={resetFilter}
                className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Transaction List */}
      <div>
        {transactions.length === 0 && !loading ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No transactions found matching your criteria.
          </div>
        ) : (
          <>
            {/* Mobile/Card View */}
            <div className={`${viewMode === 'cards' ? 'block' : 'hidden'} md:${viewMode === 'cards' ? 'block' : 'hidden'} space-y-4 p-6`}>
              {transactions.map((tx) => (
                <TransactionCard
                  key={tx.hash}
                  transaction={tx}
                  isExpanded={expandedTx === tx.hash}
                  onToggleExpanded={() => toggleExpanded(tx.hash)}
                />
              ))}
            </div>

            {/* Desktop/Table View */}
            <div className={`${viewMode === 'table' ? 'block' : 'hidden'} overflow-x-auto`}>
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Transaction
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      From/To
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {transactions.map((tx) => (
                    <React.Fragment key={tx.hash}>
                      <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            {getTransactionIcon(tx)}
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {truncateAddress(tx.hash)}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                Block {tx.blockNumber.toString()}
                              </div>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {tx.type.replace('_', ' ')}
                          </span>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {formatAmount(tx)}
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          <div>{truncateAddress(tx.from)}</div>
                          {tx.to && (
                            <div>→ {truncateAddress(tx.to)}</div>
                          )}
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(tx.timestamp)}
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(tx.status)}
                            <span className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                              {tx.status}
                            </span>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => toggleExpanded(tx.hash)}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                            >
                              {expandedTx === tx.hash ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                            <a
                              href={getExplorerUrl(tx.hash)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </div>
                        </td>
                      </tr>
                      
                      {/* Expanded Row */}
                      {expandedTx === tx.hash && (
                        <tr>
                          <td colSpan={7} className="px-6 py-4 bg-gray-50 dark:bg-gray-700">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                                  Transaction Details
                                </h4>
                                <div className="space-y-1">
                                  <div><span className="font-medium">Hash:</span> {tx.hash}</div>
                                  <div><span className="font-medium">Nonce:</span> {tx.nonce}</div>
                                  <div><span className="font-medium">Gas Used:</span> {tx.gasUsed?.toString() || 'N/A'}</div>
                                  <div><span className="font-medium">Gas Price:</span> {formatTokenBalance(tx.gasPrice, 9)} Gwei</div>
                                </div>
                              </div>
                              
                              {tx.type === 'token_transfer' && (
                                <div>
                                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                                    Token Details
                                  </h4>
                                  <div className="space-y-1">
                                    <div><span className="font-medium">Token:</span> {(tx as any).tokenName}</div>
                                    <div><span className="font-medium">Symbol:</span> {(tx as any).tokenSymbol}</div>
                                    <div><span className="font-medium">Address:</span> {(tx as any).tokenAddress}</div>
                                    <div><span className="font-medium">Amount:</span> {(tx as any).tokenValue}</div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Load More Button */}
      {hasMore && !loading && transactions.length > 0 && (
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 text-center">
          <button
            onClick={loadMore}
            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Load More Transactions
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="p-6 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" />
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Loading transactions...
          </p>
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;