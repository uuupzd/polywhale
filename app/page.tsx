'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useWhaleTrades, WhaleTrade } from '@/hooks/useWhaleTrades';
import { useKalshiTrades } from '@/hooks/useKalshiTrades';
import { useMarketCategories, POPULAR_CATEGORIES } from '@/hooks/useMarketCategories';
import TradeTable from '@/components/TradeTable';
import MarketSentiment from '@/components/MarketSentiment';

type Platform = 'polymarket' | 'kalshi';

export default function Home() {
  const [threshold, setThreshold] = useState(1000);
  const [currentPage, setCurrentPage] = useState(1);
  const [countdown, setCountdown] = useState(30);
  const [platform, setPlatform] = useState<Platform>('polymarket');

  // State for trades
  const [polymarketTrades, setPolymarketTrades] = useState<WhaleTrade[]>([]);
  const [kalshiTrades, setKalshiTrades] = useState<WhaleTrade[]>([]);

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('all');
  const lastFetchTime = useRef<number>(Date.now());

  // Fetch trades from both platforms
  const polymarketData = useWhaleTrades(threshold);
  const kalshiData = useKalshiTrades(threshold);

  const { getCategory } = useMarketCategories();

  // Get current data based on selected platform
  const accumulatedTrades = platform === 'polymarket' ? polymarketTrades : kalshiTrades;
  const currentData = platform === 'polymarket' ? polymarketData : kalshiData;
  const { trades, loading, error } = currentData;

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const savedPolymarket = localStorage.getItem('polymarket_trades');
      const savedKalshi = localStorage.getItem('kalshi_trades');

      if (savedPolymarket) {
        setPolymarketTrades(JSON.parse(savedPolymarket));
      }
      if (savedKalshi) {
        setKalshiTrades(JSON.parse(savedKalshi));
      }
    } catch (error) {
      console.error('Error loading trades from localStorage:', error);
    }
  }, []);

  // Enrich Polymarket trades with categories
  const enrichedPolymarketTrades = useMemo(() => {
    return polymarketData.trades.map((trade) => ({
      ...trade,
      category: getCategory(trade.market),
    }));
  }, [polymarketData.trades, getCategory]);


  // Accumulate Polymarket trades
  useEffect(() => {
    if (enrichedPolymarketTrades.length > 0) {
      setPolymarketTrades((prev) => {
        const existingIds = new Set(prev.map((t) => t.id));
        const newTrades = enrichedPolymarketTrades.filter((t) => !existingIds.has(t.id));
        const combined = [...newTrades, ...prev];
        const uniqueTrades = Array.from(
          new Map(combined.map((t) => [t.id, t])).values()
        ).sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

        // Save to localStorage
        try {
          localStorage.setItem('polymarket_trades', JSON.stringify(uniqueTrades));
        } catch (error) {
          console.error('Error saving Polymarket trades:', error);
        }

        return uniqueTrades;
      });

      // Reset countdown when new data arrives
      if (platform === 'polymarket') {
        lastFetchTime.current = Date.now();
        setCountdown(30);
      }
    }
  }, [enrichedPolymarketTrades, platform]);

  // Accumulate Kalshi trades
  useEffect(() => {
    if (kalshiData.trades.length > 0) {
      setKalshiTrades((prev) => {
        const existingIds = new Set(prev.map((t) => t.id));
        const newTrades = kalshiData.trades.filter((t) => !existingIds.has(t.id));
        const combined = [...newTrades, ...prev];
        const uniqueTrades = Array.from(
          new Map(combined.map((t) => [t.id, t])).values()
        ).sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

        // Save to localStorage
        try {
          localStorage.setItem('kalshi_trades', JSON.stringify(uniqueTrades));
        } catch (error) {
          console.error('Error saving Kalshi trades:', error);
        }

        return uniqueTrades;
      });

      // Reset countdown when new data arrives
      if (platform === 'kalshi') {
        lastFetchTime.current = Date.now();
        setCountdown(30);
      }
    }
  }, [kalshiData.trades, platform]);


  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - lastFetchTime.current) / 1000);
      const remaining = Math.max(0, 30 - elapsed);
      setCountdown(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Reset to page 1 when threshold changes
  useEffect(() => {
    setCurrentPage(1);
  }, [threshold]);

  // Reset to page 1 when filters or platform change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedTimeRange, platform]);

  const thresholdOptions = [
    { label: '$500+', value: 500 },
    { label: '$1,000+', value: 1000 },
    { label: '$5,000+', value: 5000 },
    { label: '$10,000+', value: 10000 },
  ];

  const timeRangeOptions = [
    { label: '全部时间', value: 'all' },
    { label: '最近1小时', value: '1h' },
    { label: '最近24小时', value: '24h' },
    { label: '最近7天', value: '7d' },
  ];

  // Filter trades by threshold, category and time range
  const filteredTrades = useMemo(() => {
    let filtered = accumulatedTrades;

    // Filter by threshold (minimum trade amount)
    filtered = filtered.filter((trade) => trade.amount >= threshold);

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter((trade) => trade.category === selectedCategory);
    }

    // Filter by time range
    if (selectedTimeRange !== 'all') {
      const now = Math.floor(Date.now() / 1000);
      let timeThreshold = 0;

      switch (selectedTimeRange) {
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

      filtered = filtered.filter((trade) => trade.timestamp >= timeThreshold);
    }

    return filtered;
  }, [accumulatedTrades, selectedCategory, selectedTimeRange, threshold]);

  // Pagination logic
  const itemsPerPage = 20;
  const totalPages = Math.ceil(filteredTrades.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTrades = filteredTrades.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header with social links */}
        <div className="relative mb-8">
          {/* Social Links - Top Right */}
          <div className="absolute top-0 right-0 flex items-center gap-3">
            <a
              href="https://t.me/dsa885"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-800 hover:bg-blue-600 transition-colors p-2 rounded-lg"
              title="Telegram"
            >
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
              </svg>
            </a>
            <a
              href="https://x.com/hunterweb303"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-800 hover:bg-blue-400 transition-colors p-2 rounded-lg"
              title="Twitter"
            >
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
          </div>

          {/* Title with Logo */}
          <div className="text-center">
            <h1 className="text-5xl font-bold text-white mb-2 flex items-center justify-center gap-3">
              <img
                src="/logoduolai.png"
                alt="PolyWhale Logo"
                className="w-12 h-12 object-contain"
              />
              <span>PolyWhale</span>
            </h1>
            <p className="text-gray-300 text-lg">
              实时监控 {platform === 'polymarket' ? 'Polymarket' : 'Kalshi'} 巨鲸交易
            </p>
            <p className="text-gray-400 text-sm mt-2">
              追踪预测市场大额交易 • 每30秒自动更新
            </p>
          </div>
        </div>

        {/* Platform Selector */}
        <div className="bg-gray-800 rounded-lg shadow-xl p-6 mb-6">
          <label className="text-gray-300 font-medium block mb-3 text-center">
            选择平台：
          </label>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setPlatform('polymarket')}
              className={`flex-1 max-w-xs px-8 py-6 rounded-2xl font-bold text-xl transition-all transform hover:scale-105 ${
                platform === 'polymarket'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-2xl scale-105 border-4 border-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <div className="flex items-center justify-center gap-3">
                <img
                  src="/polymarket.jpg"
                  alt="Polymarket"
                  className="w-10 h-10 rounded-lg object-cover"
                />
                <span>Polymarket</span>
              </div>
            </button>
            <button
              onClick={() => setPlatform('kalshi')}
              className={`flex-1 max-w-xs px-8 py-6 rounded-2xl font-bold text-xl transition-all transform hover:scale-105 ${
                platform === 'kalshi'
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-2xl scale-105 border-4 border-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <div className="flex items-center justify-center gap-3">
                <img
                  src="/kalshi.jpg"
                  alt="Kalshi"
                  className="w-10 h-10 rounded-lg object-cover"
                />
                <span>Kalshi</span>
              </div>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 rounded-lg shadow-xl p-6 mb-6">
          {/* Trade Size Filter */}
          <div className="mb-4 pb-4 border-b border-gray-700">
            <label className="text-gray-300 font-medium block mb-3">
              最小交易金额：
            </label>
            <div className="flex flex-wrap gap-2">
              {thresholdOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setThreshold(option.value)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    threshold === option.value
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter - Only for Polymarket */}
          {platform === 'polymarket' && (
            <div className="mb-4 pb-4 border-b border-gray-700">
              <label className="text-gray-300 font-medium block mb-3">
                市场类别：
              </label>
              <div className="flex flex-wrap gap-2">
                {POPULAR_CATEGORIES.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      selectedCategory === category
                        ? 'bg-purple-600 text-white shadow-lg'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Time Range Filter - Only for Polymarket */}
          {platform === 'polymarket' && (
            <div className="mb-4 pb-4 border-b border-gray-700">
              <label className="text-gray-300 font-medium block mb-3">
                时间范围：
              </label>
              <div className="flex flex-wrap gap-2">
                {timeRangeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedTimeRange(option.value)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      selectedTimeRange === option.value
                        ? 'bg-green-600 text-white shadow-lg'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Status Info */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-gray-400">
                <div
                  className={`w-3 h-3 rounded-full ${
                    loading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'
                  }`}
                />
                <span className="text-sm">
                  {loading ? '获取中...' : '实时'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-400 border-l border-gray-600 pl-4">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-sm font-medium">
                  下次刷新: {countdown}秒
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-800 rounded-lg shadow-xl p-6">
            <div className="text-gray-400 text-sm mb-1">
              {selectedCategory !== 'All' || selectedTimeRange !== 'all' ? '筛选后的' : '总计'} 巨鲸交易
            </div>
            <div className="text-3xl font-bold text-white">{filteredTrades.length}</div>
            {(selectedCategory !== 'All' || selectedTimeRange !== 'all') && (
              <div className="text-gray-500 text-xs mt-1">共 {accumulatedTrades.length} 笔</div>
            )}
          </div>
          <div className="bg-gray-800 rounded-lg shadow-xl p-6">
            <div className="text-gray-400 text-sm mb-1">总交易量</div>
            <div className="text-3xl font-bold text-green-400">
              $
              {filteredTrades
                .reduce((sum, trade) => sum + trade.amount, 0)
                .toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg shadow-xl p-6">
            <div className="text-gray-400 text-sm mb-1">平均交易额</div>
            <div className="text-3xl font-bold text-blue-400">
              $
              {filteredTrades.length > 0
                ? (
                    filteredTrades.reduce((sum, trade) => sum + trade.amount, 0) /
                    filteredTrades.length
                  ).toLocaleString('en-US', { maximumFractionDigits: 0 })
                : '0'}
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900 border border-red-700 text-red-200 rounded-lg p-4 mb-6">
            <p className="font-medium">加载交易数据时出错：</p>
            <p className="text-sm">{error.message || '发生未知错误'}</p>
          </div>
        )}

        {/* Market Sentiment Section - Only for Polymarket */}
        {platform === 'polymarket' && filteredTrades.length > 0 && (
          <div className="mb-6">
            <MarketSentiment trades={filteredTrades} timeRange={selectedTimeRange as '1h' | '24h' | '7d' | 'all'} />
          </div>
        )}

        {/* Trades Table */}
        <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">
              巨鲸交易历史
            </h2>
            <div className="text-sm text-gray-400">
              显示 {filteredTrades.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, filteredTrades.length)} / 共 {filteredTrades.length} 笔交易
              {(selectedCategory !== 'All' || selectedTimeRange !== 'all') && (
                <span className="text-gray-500"> (从 {accumulatedTrades.length} 笔中筛选)</span>
              )}
            </div>
          </div>
          <TradeTable trades={currentTrades} loading={loading && accumulatedTrades.length === 0} />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-700 flex items-center justify-between">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  currentPage === 1
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                上一页
              </button>

              <div className="flex items-center gap-2">
                {/* Page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-10 h-10 rounded-lg font-medium transition-all ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <>
                    <span className="text-gray-500">...</span>
                    <button
                      onClick={() => handlePageChange(totalPages)}
                      className="w-10 h-10 rounded-lg font-medium bg-gray-700 text-gray-300 hover:bg-gray-600"
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  currentPage === totalPages
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                下一页
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8">
          {/* Footer Links */}
          <div className="flex items-center justify-center gap-6 mb-4">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                alert('使用说明：\n\n1. 选择最小交易金额阈值（$500+, $1,000+, $5,000+, $10,000+）\n2. 系统每30秒自动更新数据\n3. 查看实时鲸鱼交易信息，包括交易金额、方向、市场等\n4. 使用分页浏览历史交易记录\n\n注意：本工具仅供参考，不构成投资建议。');
              }}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              title="使用说明"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium">使用说明</span>
            </a>
            <a
              href="https://github.com/duolaAmengweb3/polywhale"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              title="GitHub"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">GitHub</span>
            </a>
          </div>

          {/* Footer Info */}
          <div className="text-center text-gray-500 text-sm">
            <p>
              数据来自 {platform === 'polymarket' ? 'Polymarket' : 'Kalshi'} 公开 API • 每30秒自动更新 • 不构成投资建议
            </p>
            <p className="mt-2">
              使用 Next.js, TypeScript 和 Tailwind CSS 构建
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
