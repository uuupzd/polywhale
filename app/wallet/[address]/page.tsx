'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useWalletStats, WalletStats } from '@/hooks/useWalletStats';
import { WhaleTrade } from '@/hooks/useWhaleTrades';
import TradeTable from '@/components/TradeTable';
import { formatAmount } from '@/utils/formatAmount';

export default function WalletDetailPage() {
  const params = useParams();
  const router = useRouter();
  const address = params.address as string;

  const [allTrades, setAllTrades] = useState<WhaleTrade[]>([]);
  const [loading, setLoading] = useState(true);

  // Load trades from localStorage
  useEffect(() => {
    try {
      const savedPolymarket = localStorage.getItem('polymarket_trades');

      const polymarketTrades = savedPolymarket ? JSON.parse(savedPolymarket) : [];

      setAllTrades(polymarketTrades);
      setLoading(false);
    } catch (error) {
      console.error('Error loading trades:', error);
      setLoading(false);
    }
  }, []);

  const stats = useWalletStats(address, allTrades);

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse text-gray-400 text-xl">加载钱包数据中...</div>
          </div>
        </div>
      </main>
    );
  }

  if (!stats) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <button
            onClick={() => router.push('/')}
            className="mb-6 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            ← 返回首页
          </button>
          <div className="bg-red-900 border border-red-700 text-red-200 rounded-lg p-6 text-center">
            <h2 className="text-2xl font-bold mb-2">未找到钱包</h2>
            <p>未找到该地址的交易数据：{address}</p>
          </div>
        </div>
      </main>
    );
  }

  // Calculate category percentages
  const totalCategoryVolume = Object.values(stats.categoryDistribution).reduce(
    (sum, vol) => sum + vol,
    0
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/')}
            className="mb-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors inline-flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            返回首页
          </button>
          <h1 className="text-4xl font-bold text-white mb-2">巨鲸钱包画像</h1>
          <div className="bg-gray-800 rounded-lg p-4 inline-block">
            <p className="text-gray-400 text-sm mb-1">钱包地址：</p>
            <p className="text-white font-mono text-lg break-all">{stats.address}</p>
          </div>
        </div>

        {/* Overview Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-lg shadow-xl p-6 border border-blue-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-blue-700 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                  />
                </svg>
              </div>
              <div>
                <div className="text-blue-300 text-sm">总交易次数</div>
                <div className="text-3xl font-bold text-white">{stats.totalTrades}</div>
              </div>
            </div>
            <div className="text-blue-200 text-xs mt-2">
              日均 {stats.averageTradesPerDay.toFixed(1)} 笔交易
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-900 to-green-800 rounded-lg shadow-xl p-6 border border-green-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-green-700 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <div className="text-green-300 text-sm">总交易量</div>
                <div className="text-3xl font-bold text-white">
                  {formatAmount(stats.totalVolume)}
                </div>
              </div>
            </div>
            <div className="text-green-200 text-xs mt-2">
              平均 {formatAmount(stats.averageTradeSize)}/笔
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-900 to-purple-800 rounded-lg shadow-xl p-6 border border-purple-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-purple-700 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
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
              </div>
              <div>
                <div className="text-purple-300 text-sm">最爱品类</div>
                <div className="text-xl font-bold text-white truncate">
                  {stats.favoriteCategory}
                </div>
              </div>
            </div>
            <div className="text-purple-200 text-xs mt-2">
              占总交易量 {(
                (stats.categoryDistribution[stats.favoriteCategory] / totalCategoryVolume) *
                100
              ).toFixed(0)}%
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-900 to-orange-800 rounded-lg shadow-xl p-6 border border-orange-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-orange-700 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
              <div>
                <div className="text-orange-300 text-sm">交易周期</div>
                <div className="text-3xl font-bold text-white">{stats.tradingDays}天</div>
              </div>
            </div>
            <div className="text-orange-200 text-xs mt-2">
              {new Date(stats.firstTradeTime).toLocaleDateString('zh-CN')} - {new Date(stats.lastTradeTime).toLocaleDateString('zh-CN')}
            </div>
          </div>
        </div>

        {/* Buy/Sell Analysis */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-800 rounded-lg shadow-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">买入/卖出分布</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-green-400 font-medium">买入</span>
                  <span className="text-white font-bold">
                    {stats.buyCount} 笔 ({((stats.buyCount / stats.totalTrades) * 100).toFixed(0)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-green-600 to-green-400 h-4 rounded-full transition-all"
                    style={{ width: `${(stats.buyCount / stats.totalTrades) * 100}%` }}
                  />
                </div>
                <div className="text-gray-400 text-sm mt-1">
                  交易量: {formatAmount(stats.buyVolume)}
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-red-400 font-medium">卖出</span>
                  <span className="text-white font-bold">
                    {stats.sellCount} 笔 ({((stats.sellCount / stats.totalTrades) * 100).toFixed(0)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-red-600 to-red-400 h-4 rounded-full transition-all"
                    style={{ width: `${(stats.sellCount / stats.totalTrades) * 100}%` }}
                  />
                </div>
                <div className="text-gray-400 text-sm mt-1">
                  交易量: {formatAmount(stats.sellVolume)}
                </div>
              </div>
            </div>
          </div>

          {/* Category Distribution */}
          <div className="bg-gray-800 rounded-lg shadow-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">品类分布</h2>
            <div className="space-y-3">
              {Object.entries(stats.categoryDistribution)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([category, volume]) => {
                  const percentage = (volume / totalCategoryVolume) * 100;
                  return (
                    <div key={category}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-gray-300 font-medium">{category}</span>
                        <span className="text-white font-bold">{percentage.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-600 to-purple-500 h-3 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="text-gray-400 text-xs mt-1">
                        {formatAmount(volume)}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Recent Trades */}
        <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700">
            <h2 className="text-xl font-bold text-white">最近交易（最新20笔）</h2>
          </div>
          <TradeTable trades={stats.recentTrades} loading={false} />
        </div>
      </div>
    </main>
  );
}
