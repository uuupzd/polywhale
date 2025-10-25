'use client';

import { useState, useEffect, useRef } from 'react';
import { useWhaleTrades, WhaleTrade } from '@/hooks/useWhaleTrades';
import TradeTable from '@/components/TradeTable';

export default function Home() {
  const [threshold, setThreshold] = useState(1000);
  const [currentPage, setCurrentPage] = useState(1);
  const [countdown, setCountdown] = useState(30);
  const [accumulatedTrades, setAccumulatedTrades] = useState<WhaleTrade[]>([]);
  const lastFetchTime = useRef<number>(Date.now());

  const { trades, loading, error } = useWhaleTrades(threshold);

  // Accumulate trades when new data arrives
  useEffect(() => {
    if (trades.length > 0) {
      setAccumulatedTrades((prev) => {
        // Create a map of existing trades by ID for quick lookup
        const existingIds = new Set(prev.map((t) => t.id));

        // Add only new trades that don't exist
        const newTrades = trades.filter((t) => !existingIds.has(t.id));

        // Combine and sort by time (newest first)
        const combined = [...newTrades, ...prev];

        // Remove duplicates and sort
        const uniqueTrades = Array.from(
          new Map(combined.map((t) => [t.id, t])).values()
        ).sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

        return uniqueTrades;
      });

      // Reset countdown when new data arrives
      lastFetchTime.current = Date.now();
      setCountdown(30);
    }
  }, [trades]);

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - lastFetchTime.current) / 1000);
      const remaining = Math.max(0, 30 - elapsed);
      setCountdown(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Reset accumulated trades when threshold changes
  useEffect(() => {
    setAccumulatedTrades([]);
    setCurrentPage(1);
  }, [threshold]);

  const thresholdOptions = [
    { label: '$500+', value: 500 },
    { label: '$1,000+', value: 1000 },
    { label: '$5,000+', value: 5000 },
    { label: '$10,000+', value: 10000 },
  ];

  // Pagination logic
  const itemsPerPage = 20;
  const totalPages = Math.ceil(accumulatedTrades.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTrades = accumulatedTrades.slice(startIndex, endIndex);

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
              Real-time Polymarket Whale Trade Alert
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Monitoring large trades on prediction markets • Updates every 30 seconds
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 rounded-lg shadow-xl p-6 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <label className="text-gray-300 font-medium">
                Minimum Trade Size:
              </label>
              <div className="flex gap-2">
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

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-gray-400">
                <div
                  className={`w-3 h-3 rounded-full ${
                    loading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'
                  }`}
                />
                <span className="text-sm">
                  {loading ? 'Fetching...' : 'Live'}
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
                  Next refresh: {countdown}s
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-800 rounded-lg shadow-xl p-6">
            <div className="text-gray-400 text-sm mb-1">Total Whale Trades</div>
            <div className="text-3xl font-bold text-white">{accumulatedTrades.length}</div>
          </div>
          <div className="bg-gray-800 rounded-lg shadow-xl p-6">
            <div className="text-gray-400 text-sm mb-1">Total Volume</div>
            <div className="text-3xl font-bold text-green-400">
              $
              {accumulatedTrades
                .reduce((sum, trade) => sum + trade.amount, 0)
                .toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg shadow-xl p-6">
            <div className="text-gray-400 text-sm mb-1">Average Trade</div>
            <div className="text-3xl font-bold text-blue-400">
              $
              {accumulatedTrades.length > 0
                ? (
                    accumulatedTrades.reduce((sum, trade) => sum + trade.amount, 0) /
                    accumulatedTrades.length
                  ).toLocaleString('en-US', { maximumFractionDigits: 0 })
                : '0'}
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900 border border-red-700 text-red-200 rounded-lg p-4 mb-6">
            <p className="font-medium">Error loading trades:</p>
            <p className="text-sm">{error.message || 'Unknown error occurred'}</p>
          </div>
        )}

        {/* Trades Table */}
        <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">
              Whale Trades History
            </h2>
            <div className="text-sm text-gray-400">
              Showing {startIndex + 1}-{Math.min(endIndex, accumulatedTrades.length)} of {accumulatedTrades.length} trades
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
                Previous
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
                Next
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
              href="https://github.com/yourusername/polywhale"
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
              Data from Polymarket public API • Updates every 30 seconds • Not financial advice
            </p>
            <p className="mt-2">
              Built with Next.js, TypeScript, and Tailwind CSS
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
