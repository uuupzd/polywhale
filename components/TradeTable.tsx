import React from 'react';
import Link from 'next/link';
import { WhaleTrade } from '@/hooks/useWhaleTrades';
import { formatAmount, formatAmountCompact } from '@/utils/formatAmount';
import { formatTime } from '@/utils/formatTime';

// Slugify function to convert title to URL-friendly format
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/--+/g, '-') // Replace multiple hyphens with single hyphen
    .trim();
}

interface TradeTableProps {
  trades: WhaleTrade[];
  loading?: boolean;
}

export default function TradeTable({ trades, loading = false }: TradeTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-gray-400">加载巨鲸交易中...</div>
      </div>
    );
  }

  if (trades.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">暂无巨鲸交易，等待大额交易出现...</div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-700">
        <thead className="bg-gray-800">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
            >
              时间
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
            >
              市场
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
            >
              结果
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
            >
              方向
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider"
            >
              金额
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
            >
              交易者
            </th>
          </tr>
        </thead>
        <tbody className="bg-gray-900 divide-y divide-gray-700">
          {trades.map((trade) => (
            <tr key={trade.id} className="hover:bg-gray-800 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex flex-col">
                  <div className="text-sm text-gray-400">{trade.timeAgo}</div>
                  <div className="text-xs text-gray-500">{formatTime(trade.time)}</div>
                </div>
              </td>
              <td className="px-6 py-4">
                <a
                  href={`https://polymarket.com/event/${trade.eventSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-400 hover:text-blue-300 hover:underline max-w-md truncate inline-block transition-colors"
                  title={trade.market}
                >
                  {trade.market}
                </a>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-300">{trade.outcome}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    trade.side === 'BUY'
                      ? 'bg-green-900 text-green-200'
                      : 'bg-red-900 text-red-200'
                  }`}
                >
                  {trade.side === 'BUY' ? '买入' : '卖出'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right">
                <div className="text-sm font-bold text-yellow-400">
                  {formatAmount(trade.amount)}
                </div>
                <div className="text-xs text-gray-500">
                  {formatAmountCompact(trade.amount)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 font-mono">
                      {trade.makerAddress.slice(0, 6)}...{trade.makerAddress.slice(-4)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {trade.platform === 'polymarket' && (
                      <Link
                        href={`/wallet/${trade.makerAddress}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-all transform hover:scale-105"
                        title="查看钱包画像"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        巨鲸画像
                      </Link>
                    )}
                    <a
                      href={trade.platform === 'polymarket'
                        ? `https://polymarket.com/profile/${trade.makerAddress}`
                        : '#'}
                      target={trade.platform === 'polymarket' ? '_blank' : '_self'}
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs font-medium rounded-lg transition-colors"
                      title={trade.platform === 'polymarket' ? '在 Polymarket 查看' : ''}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      查看资料
                    </a>
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
