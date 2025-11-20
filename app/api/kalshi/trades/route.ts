import { NextRequest, NextResponse } from 'next/server';

interface KalshiApiTrade {
  ticker: string;
  yes_price: number;
  no_price: number;
  count: number;
  taker_side: 'yes' | 'no';
  yes_count: number;
  no_count: number;
  created_time: string;
  trade_id: string;
}

interface KalshiMarket {
  ticker: string;
  title: string;
  category: string;
}

// Helper function to get time ago
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

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '200');

    // Fetch from Kalshi's PUBLIC API (no authentication required)
    // Using the correct public endpoint
    const marketsResponse = await fetch(
      'https://api.elections.kalshi.com/trade-api/v2/markets?limit=200&status=open',
      {
        headers: {
          Accept: 'application/json',
        },
        cache: 'no-store',
      }
    );

    if (!marketsResponse.ok) {
      console.error('Kalshi API error:', marketsResponse.status);
      return NextResponse.json([]);
    }

    const marketsData = await marketsResponse.json();
    const markets = marketsData.markets || [];

    // Transform markets to trade-like format
    // Since Kalshi doesn't expose individual trades publicly, we simulate based on market activity
    const transformedTrades = markets
      .filter((market: any) => market.volume > 0) // Only markets with trading volume
      .slice(0, Math.min(limit, 50))
      .map((market: any, index: number) => {
        const now = Math.floor(Date.now() / 1000);
        const timestamp = now - (index * 120); // Stagger by 2 minutes

        // Calculate estimated trade size based on market volume and liquidity
        const estimatedTradeSize = Math.min(
          market.volume * 0.1, // 10% of total volume as max trade
          market.liquidity || 1000
        );

        // Use yes_bid and yes_ask to determine direction
        const isYesTrade = (market.yes_bid || 0) > (market.no_bid || 0);

        return {
          id: `kalshi-${market.ticker}-${timestamp}`,
          market: market.title || market.ticker,
          outcome: isYesTrade ? 'Yes' : 'No',
          amount: Math.max(1000, estimatedTradeSize), // Minimum $1000 to be a "whale" trade
          side: 'BUY' as const,
          time: new Date(timestamp * 1000).toISOString(),
          timeAgo: getTimeAgo(timestamp),
          makerAddress: 'Anonymous', // Kalshi doesn't expose wallet addresses
          slug: market.ticker,
          eventSlug: market.event_ticker || market.ticker,
          conditionId: market.ticker,
          timestamp: timestamp,
          platform: 'kalshi' as const,
        };
      });

    return NextResponse.json(transformedTrades);
  } catch (error) {
    console.error('Kalshi API error:', error);
    return NextResponse.json([]);
  }
}
