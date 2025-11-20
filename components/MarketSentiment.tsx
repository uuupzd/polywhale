import React, { useMemo } from 'react';
import { WhaleTrade } from '@/hooks/useWhaleTrades';
import { formatAmount } from '@/utils/formatAmount';

interface MarketSentimentProps {
  trades: WhaleTrade[];
  timeRange?: '1h' | '24h' | '7d' | 'all';
}

interface MarketStats {
  market: string;
  slug: string;
  totalVolume: number;
  buyVolume: number;
  sellVolume: number;
  netFlow: number;
  buyPressure: number;
  tradeCount: number;
  whaleCount: number;
}

export default function MarketSentiment({ trades, timeRange = '24h' }: MarketSentimentProps) {
  // Calculate market-level statistics
  const marketStats = useMemo(() => {
    // Filter by time range
    let filteredTrades = trades;
    if (timeRange !== 'all') {
      const now = Math.floor(Date.now() / 1000);
      let timeThreshold = 0;
      switch (timeRange) {
        case '1h':
          timeThreshold = now - 3600;
          break;
        case '24h':
          timeThreshold = now - 86400;
          break;
        case '7d':
          timeThreshold = now - 604800;
          break;
      }
      filteredTrades = trades.filter((trade) => trade.timestamp >= timeThreshold);
    }

    // Group by market
    const marketMap = new Map<string, MarketStats>();

    filteredTrades.forEach((trade) => {
      const key = trade.market;
      if (!marketMap.has(key)) {
        marketMap.set(key, {
          market: trade.market,
          slug: trade.slug,
          totalVolume: 0,
          buyVolume: 0,
          sellVolume: 0,
          netFlow: 0,
          buyPressure: 0,
          tradeCount: 0,
          whaleCount: 0,
        });
      }

      const stats = marketMap.get(key)!;
      stats.totalVolume += trade.amount;
      stats.tradeCount += 1;

      if (trade.side === 'BUY') {
        stats.buyVolume += trade.amount;
      } else {
        stats.sellVolume += trade.amount;
      }
    });

    // Calculate derived metrics
    const statsArray = Array.from(marketMap.values()).map((stats) => {
      stats.netFlow = stats.buyVolume - stats.sellVolume;
      stats.buyPressure =
        stats.totalVolume > 0 ? (stats.buyVolume / stats.totalVolume) * 100 : 50;

      // Count unique whales
      const uniqueWhales = new Set(
        filteredTrades
          .filter((t) => t.market === stats.market)
          .map((t) => t.makerAddress.toLowerCase())
      );
      stats.whaleCount = uniqueWhales.size;

      return stats;
    });

    // Sort by total volume
    return statsArray.sort((a, b) => b.totalVolume - a.totalVolume).slice(0, 10);
  }, [trades, timeRange]);

  // Calculate overall sentiment
  const overallStats = useMemo(() => {
    let filteredTrades = trades;
    if (timeRange !== 'all') {
      const now = Math.floor(Date.now() / 1000);
      let timeThreshold = 0;
      switch (timeRange) {
        case '1h':
          timeThreshold = now - 3600;
          break;
        case '24h':
          timeThreshold = now - 86400;
          break;
        case '7d':
          timeThreshold = now - 604800;
          break;
      }
      filteredTrades = trades.filter((trade) => trade.timestamp >= timeThreshold);
    }

    const totalVolume = filteredTrades.reduce((sum, t) => sum + t.amount, 0);
    const buyVolume = filteredTrades
      .filter((t) => t.side === 'BUY')
      .reduce((sum, t) => sum + t.amount, 0);
    const sellVolume = filteredTrades
      .filter((t) => t.side === 'SELL')
      .reduce((sum, t) => sum + t.amount, 0);

    const netFlow = buyVolume - sellVolume;
    const buyPressure = totalVolume > 0 ? (buyVolume / totalVolume) * 100 : 50;

    return {
      totalVolume,
      buyVolume,
      sellVolume,
      netFlow,
      buyPressure,
    };
  }, [trades, timeRange]);

  const timeRangeLabel = {
    '1h': '最近1小时',
    '24h': '最近24小时',
    '7d': '最近7天',
    'all': '全部时间',
  }[timeRange];

  return (
    <div className="space-y-6">
      {/* Overall Sentiment Header */}
      <div className="bg-gradient-to-r from-purple-900 to-blue-900 rounded-xl shadow-xl p-6 border-2 border-purple-500">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          市场情绪 - {timeRangeLabel}
        </h2>

        {/* Overall Pressure Gauge */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-300 font-medium">整体买入压力</span>
            <span className="text-white font-bold text-xl">
              {overallStats.buyPressure.toFixed(1)}%
            </span>
          </div>
          <div className="relative w-full h-8 bg-gray-800 rounded-full overflow-hidden border-2 border-gray-700">
            <div
              className="absolute h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 transition-all duration-500"
              style={{ width: '100%' }}
            />
            <div
              className="absolute h-full bg-gray-900 transition-all duration-500"
              style={{ width: `${100 - overallStats.buyPressure}%`, right: 0 }}
            />
            <div
              className="absolute top-0 w-1 h-full bg-white shadow-lg"
              style={{ left: `${overallStats.buyPressure}%` }}
            />
          </div>
          <div className="flex justify-between text-sm mt-2">
            <span className="text-red-400">← 卖出压力</span>
            <span className="text-green-400">买入压力 →</span>
          </div>
        </div>

        {/* Net Flow */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-black bg-opacity-30 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">买入交易量</div>
            <div className="text-green-400 text-2xl font-bold">
              {formatAmount(overallStats.buyVolume)}
            </div>
          </div>
          <div className="bg-black bg-opacity-30 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">卖出交易量</div>
            <div className="text-red-400 text-2xl font-bold">
              {formatAmount(overallStats.sellVolume)}
            </div>
          </div>
          <div className="bg-black bg-opacity-30 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">净流入</div>
            <div
              className={`text-2xl font-bold ${
                overallStats.netFlow >= 0 ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {overallStats.netFlow >= 0 ? '+' : ''}
              {formatAmount(overallStats.netFlow)}
            </div>
          </div>
        </div>
      </div>

      {/* Top Active Markets */}
      <div className="bg-gray-800 rounded-xl shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700 bg-gray-850">
          <h3 className="text-xl font-bold text-white">
            交易量前10市场 - {timeRangeLabel}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  排名
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  市场
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  交易量
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                  买入压力
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  净流入
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                  巨鲸数
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {marketStats.map((market, index) => (
                <tr key={market.slug} className="hover:bg-gray-750 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-400 font-bold text-lg">#{index + 1}</div>
                  </td>
                  <td className="px-6 py-4 max-w-md">
                    <div className="text-sm text-gray-300 truncate" title={market.market}>
                      {market.market}
                    </div>
                    <div className="text-xs text-gray-500">{market.tradeCount} 笔交易</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-bold text-yellow-400">
                      {formatAmount(market.totalVolume)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-24 h-3 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            market.buyPressure >= 50
                              ? 'bg-gradient-to-r from-yellow-500 to-green-500'
                              : 'bg-gradient-to-r from-red-500 to-yellow-500'
                          }`}
                          style={{ width: `${market.buyPressure}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-white w-12 text-right">
                        {market.buyPressure.toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div
                      className={`text-sm font-bold ${
                        market.netFlow >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {market.netFlow >= 0 ? '+' : ''}
                      {formatAmount(market.netFlow)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="px-3 py-1 bg-blue-900 text-blue-300 rounded-full text-sm font-bold">
                      {market.whaleCount}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
