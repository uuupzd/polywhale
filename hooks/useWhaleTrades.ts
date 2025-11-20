import useSWR from 'swr';
import { useMemo } from 'react';

// Type definitions for Polymarket API response
interface PolymarketTrade {
  proxyWallet: string;
  side: 'BUY' | 'SELL';
  asset: string;
  conditionId: string;
  size: number;
  price: number;
  timestamp: number;
  title: string;
  slug: string;
  icon?: string;
  eventSlug: string;
  outcome: string;
  outcomeIndex: number;
  name?: string;
  pseudonym?: string;
  bio?: string;
  profileImage?: string;
  profileImageOptimized?: string;
  transactionHash: string;
}

type PolymarketApiResponse = PolymarketTrade[];

// Transformed whale trade for display
export interface WhaleTrade {
  id: string;
  market: string;
  outcome: string;
  amount: number;
  side: 'BUY' | 'SELL';
  time: string;
  timeAgo: string;
  makerAddress: string;
  category?: string; // Market category
  slug: string; // For category lookup
  eventSlug: string; // For category lookup
  conditionId: string; // For category lookup
  timestamp: number; // Unix timestamp for filtering
  platform: 'polymarket' | 'kalshi'; // Platform identifier
}

const API_URL = 'https://data-api.polymarket.com/trades?limit=200';

// Fetcher function for SWR
const fetcher = async (url: string): Promise<PolymarketApiResponse> => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data;
};

/**
 * Custom hook to fetch and filter whale trades from Polymarket
 * @param threshold - Minimum trade amount in USD (default: 1000)
 * @returns Whale trades data, loading state, and error
 */
export const useWhaleTrades = (threshold: number = 1000) => {
  const { data, error, isLoading } = useSWR<PolymarketApiResponse>(
    API_URL,
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

    // Filter and transform trades
    const trades = Array.isArray(data) ? data : [];

    return trades
      .map((trade) => {
        // Calculate USD amount: size * price
        const amount = trade.size * trade.price;

        return {
          id: trade.transactionHash || `${trade.timestamp}-${trade.asset}`,
          market: trade.title || 'Unknown Market',
          outcome: trade.outcome || 'Unknown',
          amount: amount,
          side: trade.side,
          time: new Date(trade.timestamp * 1000).toISOString(),
          timeAgo: getTimeAgo(trade.timestamp),
          makerAddress: trade.proxyWallet,
          slug: trade.slug,
          eventSlug: trade.eventSlug,
          conditionId: trade.conditionId,
          timestamp: trade.timestamp,
          platform: 'polymarket' as const,
        };
      })
      .filter((trade) => trade.amount >= threshold)
      .slice(0, 50); // Limit to 50 most recent trades
  }, [data, threshold, isLoading, error]);

  return {
    trades: whaleTrades,
    loading: isLoading || !data,
    error: error || null,
  };
};

/**
 * Calculate time ago string
 * @param timestamp - Unix timestamp in seconds
 */
function getTimeAgo(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) {
    return `${diffSec}s ago`;
  } else if (diffMin < 60) {
    return `${diffMin}m ago`;
  } else if (diffHour < 24) {
    return `${diffHour}h ago`;
  } else {
    return `${diffDay}d ago`;
  }
}
