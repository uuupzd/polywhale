import useSWR from 'swr';
import { useMemo } from 'react';

// Transformed whale trade for display (same format as Polymarket)
export interface KalshiTrade {
  id: string;
  market: string;
  outcome: string;
  amount: number;
  side: 'BUY' | 'SELL';
  time: string;
  timeAgo: string;
  makerAddress: string;
  slug: string;
  eventSlug: string;
  conditionId: string;
  timestamp: number;
  platform: 'kalshi';
}

// Fetcher function for SWR - calls our Next.js API route
const fetcher = async (url: string): Promise<KalshiTrade[]> => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data;
};

/**
 * Custom hook to fetch and filter whale trades from Kalshi
 * @param threshold - Minimum trade amount in USD (default: 1000)
 * @returns Whale trades data, loading state, and error
 */
export const useKalshiTrades = (threshold: number = 1000) => {
  const { data, error, isLoading } = useSWR<KalshiTrade[]>(
    `/api/kalshi/trades?limit=200`,
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
      dedupingInterval: 10000, // Dedupe requests within 10 seconds
    }
  );

  // Memoize the whale trades to prevent unnecessary re-renders
  const whaleTrades = useMemo(() => {
    if (isLoading || !data) {
      return [];
    }

    if (error) {
      return [];
    }

    // Filter by threshold
    const trades = Array.isArray(data) ? data : [];
    return trades.filter((trade) => trade.amount >= threshold).slice(0, 50);
  }, [data, threshold, isLoading, error]);

  return {
    trades: whaleTrades,
    loading: isLoading || !data,
    error: error || null,
  };
};
