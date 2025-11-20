import { useMemo } from 'react';
import { WhaleTrade } from './useWhaleTrades';

export interface WalletStats {
  address: string;
  totalTrades: number;
  totalVolume: number;
  averageTradeSize: number;
  buyCount: number;
  sellCount: number;
  buyVolume: number;
  sellVolume: number;
  favoriteCategory: string;
  categoryDistribution: Record<string, number>;
  recentTrades: WhaleTrade[];
  firstTradeTime: string;
  lastTradeTime: string;
  tradingDays: number;
  averageTradesPerDay: number;
}

/**
 * Calculate comprehensive statistics for a specific wallet
 */
export const calculateWalletStats = (
  address: string,
  allTrades: WhaleTrade[]
): WalletStats | null => {
  // Filter trades for this wallet
  const walletTrades = allTrades.filter(
    (trade) => trade.makerAddress.toLowerCase() === address.toLowerCase()
  );

  if (walletTrades.length === 0) {
    return null;
  }

  // Sort by timestamp
  const sortedTrades = [...walletTrades].sort((a, b) => a.timestamp - b.timestamp);

  // Calculate basic stats
  const totalTrades = walletTrades.length;
  const totalVolume = walletTrades.reduce((sum, trade) => sum + trade.amount, 0);
  const averageTradeSize = totalVolume / totalTrades;

  // Buy/Sell analysis
  const buyTrades = walletTrades.filter((t) => t.side === 'BUY');
  const sellTrades = walletTrades.filter((t) => t.side === 'SELL');
  const buyCount = buyTrades.length;
  const sellCount = sellTrades.length;
  const buyVolume = buyTrades.reduce((sum, t) => sum + t.amount, 0);
  const sellVolume = sellTrades.reduce((sum, t) => sum + t.amount, 0);

  // Category distribution
  const categoryDistribution: Record<string, number> = {};
  walletTrades.forEach((trade) => {
    const category = trade.category || 'Other';
    categoryDistribution[category] = (categoryDistribution[category] || 0) + trade.amount;
  });

  // Find favorite category (by volume)
  let favoriteCategory = 'Other';
  let maxVolume = 0;
  Object.entries(categoryDistribution).forEach(([category, volume]) => {
    if (volume > maxVolume) {
      maxVolume = volume;
      favoriteCategory = category;
    }
  });

  // Time analysis
  const firstTradeTime = sortedTrades[0].time;
  const lastTradeTime = sortedTrades[sortedTrades.length - 1].time;
  const firstTimestamp = sortedTrades[0].timestamp;
  const lastTimestamp = sortedTrades[sortedTrades.length - 1].timestamp;
  const tradingDays = Math.max(1, Math.ceil((lastTimestamp - firstTimestamp) / 86400));
  const averageTradesPerDay = totalTrades / tradingDays;

  return {
    address,
    totalTrades,
    totalVolume,
    averageTradeSize,
    buyCount,
    sellCount,
    buyVolume,
    sellVolume,
    favoriteCategory,
    categoryDistribution,
    recentTrades: sortedTrades.slice(-20).reverse(), // Last 20 trades
    firstTradeTime,
    lastTradeTime,
    tradingDays,
    averageTradesPerDay,
  };
};

/**
 * Hook to get statistics for a specific wallet
 */
export const useWalletStats = (address: string, allTrades: WhaleTrade[]) => {
  const stats = useMemo(() => {
    return calculateWalletStats(address, allTrades);
  }, [address, allTrades]);

  return stats;
};

/**
 * Get top wallets by various metrics
 */
export const getTopWallets = (
  allTrades: WhaleTrade[],
  limit: number = 10
): {
  byVolume: WalletStats[];
  byTrades: WalletStats[];
  byAverageSize: WalletStats[];
} => {
  // Group trades by wallet
  const walletMap = new Map<string, WhaleTrade[]>();
  allTrades.forEach((trade) => {
    const address = trade.makerAddress.toLowerCase();
    if (!walletMap.has(address)) {
      walletMap.set(address, []);
    }
    walletMap.get(address)!.push(trade);
  });

  // Calculate stats for each wallet
  const allWalletStats: WalletStats[] = [];
  walletMap.forEach((trades, address) => {
    const stats = calculateWalletStats(address, allTrades);
    if (stats) {
      allWalletStats.push(stats);
    }
  });

  // Sort by different metrics
  const byVolume = [...allWalletStats]
    .sort((a, b) => b.totalVolume - a.totalVolume)
    .slice(0, limit);

  const byTrades = [...allWalletStats]
    .sort((a, b) => b.totalTrades - a.totalTrades)
    .slice(0, limit);

  const byAverageSize = [...allWalletStats]
    .sort((a, b) => b.averageTradeSize - a.averageTradeSize)
    .slice(0, limit);

  return {
    byVolume,
    byTrades,
    byAverageSize,
  };
};
