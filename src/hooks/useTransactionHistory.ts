import { useState, useEffect, useCallback, useMemo } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { useNetwork } from '../contexts/NetworkContext';
import { 
  Transaction, 
  TransactionHistoryState, 
  TransactionFilter,
  PaginationOptions 
} from '../types';
import { getTransactionHistory, filterTransactions } from '../services/transactionService';

const INITIAL_FILTER: TransactionFilter = {
  type: 'all',
  direction: 'all',
  status: 'all'
};

const INITIAL_STATE: TransactionHistoryState = {
  transactions: [],
  loading: false,
  hasMore: true,
  filter: INITIAL_FILTER,
  page: 0
};

export const useTransactionHistory = () => {
  const { address, isConnected } = useWallet();
  const { currentNetwork } = useNetwork();
  const [state, setState] = useState<TransactionHistoryState>(INITIAL_STATE);
  const [cache, setCache] = useState<Map<string, Transaction[]>>(new Map());

  // Generate cache key for current state
  const cacheKey = useMemo(() => {
    if (!address || !isConnected) return '';
    return `${address}-${currentNetwork}-${state.page}`;
  }, [address, isConnected, currentNetwork, state.page]);

  // Fetch transactions with caching
  const fetchTransactions = useCallback(async (
    page: number = 0,
    append: boolean = false
  ) => {
    if (!address || !isConnected) {
      setState(prev => ({ ...prev, transactions: [], loading: false }));
      return;
    }

    const pageKey = `${address}-${currentNetwork}-${page}`;
    
    // Check cache first
    if (cache.has(pageKey) && !append) {
      const cachedTransactions = cache.get(pageKey)!;
      setState(prev => ({
        ...prev,
        transactions: cachedTransactions,
        loading: false,
        page
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: undefined }));

    try {
      const options: PaginationOptions = {
        page,
        limit: 50
      };

      const result = await getTransactionHistory(
        address as `0x${string}`, 
        currentNetwork, 
        options
      );

      // Update cache
      const newCache = new Map(cache);
      newCache.set(pageKey, result.transactions);
      setCache(newCache);

      setState(prev => ({
        ...prev,
        transactions: append 
          ? [...prev.transactions, ...result.transactions]
          : result.transactions,
        loading: false,
        hasMore: result.hasMore,
        page,
        totalCount: result.transactions.length + (page * 50)
      }));
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to fetch transactions'
      }));
    }
  }, [address, isConnected, currentNetwork, cache]);

  // Load more transactions (pagination)
  const loadMore = useCallback(() => {
    if (!state.loading && state.hasMore) {
      fetchTransactions(state.page + 1, true);
    }
  }, [state.loading, state.hasMore, state.page, fetchTransactions]);

  // Refresh transactions (clear cache and refetch)
  const refresh = useCallback(() => {
    setCache(new Map()); // Clear cache
    fetchTransactions(0, false);
  }, [fetchTransactions]);

  // Update filter
  const setFilter = useCallback((newFilter: Partial<TransactionFilter>) => {
    setState(prev => ({
      ...prev,
      filter: { ...prev.filter, ...newFilter }
    }));
  }, []);

  // Reset filter
  const resetFilter = useCallback(() => {
    setState(prev => ({
      ...prev,
      filter: INITIAL_FILTER
    }));
  }, []);

  // Apply filters to transactions
  const filteredTransactions = useMemo(() => {
    if (!state.transactions.length) return [];
    return filterTransactions(state.transactions, state.filter);
  }, [state.transactions, state.filter]);

  // Initial fetch when dependencies change
  useEffect(() => {
    if (address && isConnected) {
      // Reset state when network or address changes
      setState(INITIAL_STATE);
      setCache(new Map());
      fetchTransactions(0, false);
    } else {
      setState(INITIAL_STATE);
    }
  }, [address, isConnected, currentNetwork]);

  // Get transaction by hash
  const getTransactionByHash = useCallback((hash: string): Transaction | undefined => {
    return state.transactions.find(tx => tx.hash === hash);
  }, [state.transactions]);

  // Get transactions by type
  const getTransactionsByType = useCallback((type: string): Transaction[] => {
    return state.transactions.filter(tx => tx.type === type);
  }, [state.transactions]);

  // Export to CSV functionality
  const exportToCSV = useCallback(() => {
    if (!filteredTransactions.length) return;

    const headers = [
      'Date',
      'Hash',
      'Type',
      'Direction',
      'From',
      'To',
      'Amount',
      'Token',
      'USD Value',
      'Gas Used',
      'Status'
    ];

    const csvData = filteredTransactions.map(tx => {
      const date = new Date(tx.timestamp * 1000).toISOString();
      const direction = tx.type === 'token_transfer' || tx.type === 'eth_transfer' 
        ? (tx as any).direction 
        : '-';
      
      let amount = '';
      let token = '';
      
      if (tx.type === 'token_transfer') {
        const tokenTx = tx as any;
        amount = tokenTx.tokenValue;
        token = tokenTx.tokenSymbol;
      } else if (tx.type === 'eth_transfer') {
        const ethTx = tx as any;
        amount = ethTx.ethValue;
        token = 'ETH';
      }

      return [
        date,
        tx.hash,
        tx.type,
        direction,
        tx.from,
        tx.to || '',
        amount,
        token,
        (tx as any).usdValue?.toFixed(2) || '',
        tx.gasUsed?.toString() || '',
        tx.status
      ];
    });

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transactions-${address}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [filteredTransactions, address]);

  return {
    // State
    transactions: filteredTransactions,
    allTransactions: state.transactions,
    loading: state.loading,
    hasMore: state.hasMore,
    error: state.error,
    filter: state.filter,
    page: state.page,
    totalCount: state.totalCount,
    
    // Actions
    fetchTransactions,
    loadMore,
    refresh,
    setFilter,
    resetFilter,
    getTransactionByHash,
    getTransactionsByType,
    exportToCSV,
    
    // Stats
    stats: {
      total: state.transactions.length,
      filtered: filteredTransactions.length,
      ethTransfers: state.transactions.filter(tx => tx.type === 'eth_transfer').length,
      tokenTransfers: state.transactions.filter(tx => tx.type === 'token_transfer').length,
      contractInteractions: state.transactions.filter(tx => tx.type === 'contract_interaction').length
    }
  };
};