import { 
  getBlock,
  getTransaction,
  getTransactionReceipt,
  getLogs
} from 'viem/actions';
import { formatUnits, parseAbiItem } from 'viem';
import { createPublicClientForNetwork } from './walletService';
import { 
  Transaction, 
  EthTransaction, 
  TokenTransfer, 
  PaginationOptions,
  TransactionFilter 
} from '../types';
import { SUPPORTED_NETWORKS } from '../utils/constants';

// ERC-20 Transfer event signature
const ERC20_TRANSFER_EVENT = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)');

interface RawTransaction {
  hash: `0x${string}`;
  blockNumber: bigint;
  blockHash: `0x${string}`;
  transactionIndex: number;
  from: `0x${string}`;
  to: `0x${string}` | null;
  value: bigint;
  gasPrice: bigint;
  gas: bigint;
  input: `0x${string}`;
  nonce: number;
}

interface RawTransactionReceipt {
  status: 'success' | 'reverted';
  gasUsed: bigint;
  effectiveGasPrice: bigint;
}

/**
 * Get transaction history for a wallet address
 */
export const getTransactionHistory = async (
  address: `0x${string}`,
  networkKey: keyof typeof SUPPORTED_NETWORKS,
  options: PaginationOptions = { page: 0, limit: 50 }
): Promise<{ transactions: Transaction[]; hasMore: boolean }> => {
  const publicClient = createPublicClientForNetwork(networkKey);
  
  try {
    const latestBlock = await publicClient.getBlockNumber();
    const fromBlock = options.fromBlock || (latestBlock - BigInt(10000)); // Last ~10k blocks
    const toBlock = options.toBlock || latestBlock;
    
    // Get ETH transactions and token transfers in parallel
    const [ethTransactions, tokenTransfers] = await Promise.all([
      getEthTransactions(address, networkKey, fromBlock, toBlock, options),
      getTokenTransfers(address, networkKey, fromBlock, toBlock, options)
    ]);

    // Combine and sort by block number (descending)
    const allTransactions = [...ethTransactions, ...tokenTransfers]
      .sort((a, b) => Number(b.blockNumber - a.blockNumber));

    // Apply pagination
    const startIndex = options.page * options.limit;
    const endIndex = startIndex + options.limit;
    const paginatedTransactions = allTransactions.slice(startIndex, endIndex);
    
    return {
      transactions: paginatedTransactions,
      hasMore: endIndex < allTransactions.length
    };
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    throw new Error('Failed to fetch transaction history');
  }
};

/**
 * Get ETH transactions (native transfers and contract interactions)
 */
const getEthTransactions = async (
  address: `0x${string}`,
  networkKey: keyof typeof SUPPORTED_NETWORKS,
  fromBlock: bigint,
  toBlock: bigint,
  options: PaginationOptions
): Promise<EthTransaction[]> => {
  const publicClient = createPublicClientForNetwork(networkKey);
  const transactions: EthTransaction[] = [];

  try {
    // For public RPC endpoints, we'll use a more conservative approach
    // Get recent blocks and filter transactions (limited to last 50 blocks for performance)
    const blockCount = Math.min(Number(toBlock - fromBlock), 50);
    
    for (let i = 0; i < blockCount; i++) {
      const blockNumber = toBlock - BigInt(i);
      try {
        const block = await publicClient.getBlock({ 
          blockNumber, 
          includeTransactions: true 
        });
        
        if (block && block.transactions) {
          for (const tx of block.transactions) {
            if (typeof tx === 'object' && 
                (tx.from.toLowerCase() === address.toLowerCase() || //from address
                 tx.to?.toLowerCase() === address.toLowerCase())) {
              
              try {
                const receipt = await publicClient.getTransactionReceipt({ hash: tx.hash });
                
                const ethTransaction: EthTransaction = {
                  hash: tx.hash,
                  blockNumber: tx.blockNumber!,
                  blockHash: tx.blockHash!,
                  transactionIndex: tx.transactionIndex!,
                  timestamp: Number(block.timestamp),
                  from: tx.from,
                  to: tx.to,
                  value: tx.value,
                  gasPrice: tx.gasPrice || BigInt(0),
                  gasUsed: receipt.gasUsed,
                  gasLimit: tx.gas,
                  status: receipt.status === 'success' ? 'success' : 'failed',
                  nonce: tx.nonce,
                  input: tx.input,
                  type: tx.value > 0 ? 'eth_transfer' : 'contract_interaction',
                  direction: tx.from.toLowerCase() === address.toLowerCase() ? 'out' : 'in',
                  ethValue: formatUnits(tx.value, 18),
                  methodName: await getMethodName(tx.input)
                };
                
                transactions.push(ethTransaction);
              } catch (error) {
                console.error('Error processing transaction:', tx.hash, error);
              }
            }
          }
        }
      } catch (error) {
        console.error(`Error fetching block ${blockNumber}:`, error);
        // Continue with other blocks
      }
    }
    
    return transactions;
  } catch (error) {
    console.error('Error fetching ETH transactions:', error);
    return [];
  }
};

/**
 * Get ERC-20 token transfers
 */
const getTokenTransfers = async (
  address: `0x${string}`,
  networkKey: keyof typeof SUPPORTED_NETWORKS,
  fromBlock: bigint,
  toBlock: bigint,
  options: PaginationOptions
): Promise<TokenTransfer[]> => {
  const publicClient = createPublicClientForNetwork(networkKey);
  const transfers: TokenTransfer[] = [];

  try {
    // For public RPC endpoints, we'll use a more conservative approach
    // Get logs for specific token addresses that we know about
    const { TOKEN_CONFIGS } = await import('../utils/constants');
    const networkTokens = TOKEN_CONFIGS[networkKey] || [];
    
    const allLogs: any[] = [];
    
    // Get logs for each known token address
    for (const tokenConfig of networkTokens) {
      try {
        // Get incoming transfers (to address) for this specific token
        const incomingLogs = await publicClient.getLogs({
          event: ERC20_TRANSFER_EVENT,
          args: {
            to: address
          },
          address: tokenConfig.address as `0x${string}`,
          fromBlock,
          toBlock
        });

        // Get outgoing transfers (from address) for this specific token
        const outgoingLogs = await publicClient.getLogs({
          event: ERC20_TRANSFER_EVENT,
          args: {
            from: address
          },
          address: tokenConfig.address as `0x${string}`,
          fromBlock,
          toBlock
        });

        allLogs.push(...incomingLogs, ...outgoingLogs);
      } catch (error) {
        console.error(`Error fetching logs for token ${tokenConfig.symbol}:`, error);
        // Continue with other tokens
      }
    }
    
    for (const log of allLogs) {
      try {
        const [tx, receipt] = await Promise.all([
          publicClient.getTransaction({ hash: log.transactionHash }),
          publicClient.getTransactionReceipt({ hash: log.transactionHash })
        ]);

        const block = await publicClient.getBlock({ blockHash: log.blockHash });
        
        // Use token config instead of fetching token info
        const tokenConfig = networkTokens.find(t => 
          t.address.toLowerCase() === log.address.toLowerCase()
        );
        
        if (tokenConfig && log.args) {
          const transfer: TokenTransfer = {
            hash: log.transactionHash,
            blockNumber: log.blockNumber!,
            blockHash: log.blockHash!,
            transactionIndex: log.transactionIndex!,
            timestamp: Number(block.timestamp),
            from: tx.from,
            to: tx.to,
            value: tx.value,
            gasPrice: tx.gasPrice || BigInt(0),
            gasUsed: receipt.gasUsed,
            gasLimit: tx.gas,
            status: receipt.status === 'success' ? 'success' : 'failed',
            nonce: tx.nonce,
            input: tx.input,
            type: 'token_transfer',
            direction: log.args.from?.toLowerCase() === address.toLowerCase() ? 'out' : 'in',
            tokenAddress: log.address,
            tokenSymbol: tokenConfig.symbol,
            tokenName: tokenConfig.name,
            tokenDecimals: tokenConfig.decimals,
            tokenAmount: log.args.value || BigInt(0),
            tokenValue: formatUnits(log.args.value || BigInt(0), tokenConfig.decimals),
            logIndex: log.logIndex!
          };
          
          transfers.push(transfer);
        }
      } catch (error) {
        console.error('Error processing token transfer:', log.transactionHash, error);
      }
    }
    
    return transfers;
  } catch (error) {
    console.error('Error fetching token transfers:', error);
    return [];
  }
};



/**
 * Get method name from transaction input
 */
const getMethodName = async (input: `0x${string}`): Promise<string | undefined> => {
  if (input === '0x' || input.length < 10) {
    return undefined;
  }
  
  // Extract method signature (first 4 bytes)
  const methodSignature = input.slice(0, 10);
  
  // Common method signatures mapping
  const methodMap: Record<string, string> = {
    '0xa9059cbb': 'transfer',
    '0x23b872dd': 'transferFrom',
    '0x095ea7b3': 'approve',
    '0x2e1a7d4d': 'withdraw',
    '0xd0e30db0': 'deposit',
    '0x7ff36ab5': 'swapExactETHForTokens',
    '0x18cbafe5': 'swapExactTokensForETH',
    '0x8803dbee': 'swapTokensForExactTokens'
  };
  
  return methodMap[methodSignature];
};

/**
 * Apply filters to transactions
 */
export const filterTransactions = (
  transactions: Transaction[],
  filter: TransactionFilter
): Transaction[] => {
  return transactions.filter(tx => {
    // Filter by type
    if (filter.type && filter.type !== 'all' && tx.type !== filter.type) {
      return false;
    }
    
    // Filter by direction
    if (filter.direction && filter.direction !== 'all') {
      if (tx.type === 'token_transfer' || tx.type === 'eth_transfer') {
        if ((tx as any).direction !== filter.direction) {
          return false;
        }
      }
    }
    
    // Filter by status
    if (filter.status && filter.status !== 'all' && tx.status !== filter.status) {
      return false;
    }
    
    // Filter by date range
    if (filter.dateFrom && tx.timestamp < filter.dateFrom.getTime() / 1000) {
      return false;
    }
    
    if (filter.dateTo && tx.timestamp > filter.dateTo.getTime() / 1000) {
      return false;
    }
    
    // Filter by token address
    if (filter.tokenAddress && tx.type === 'token_transfer') {
      const tokenTx = tx as TokenTransfer;
      if (tokenTx.tokenAddress.toLowerCase() !== filter.tokenAddress.toLowerCase()) {
        return false;
      }
    }
    
    // Filter by search term
    if (filter.search) {
      const searchTerm = filter.search.toLowerCase();
      const searchableFields = [
        tx.hash.toLowerCase(),
        tx.from.toLowerCase(),
        tx.to?.toLowerCase() || '',
        tx.type.toLowerCase()
      ];
      
      if (tx.type === 'token_transfer') {
        const tokenTx = tx as TokenTransfer;
        searchableFields.push(
          tokenTx.tokenSymbol.toLowerCase(),
          tokenTx.tokenName.toLowerCase(),
          tokenTx.tokenAddress.toLowerCase()
        );
      }
      
      if (!searchableFields.some(field => field.includes(searchTerm))) {
        return false;
      }
    }
    
    return true;
  });
};