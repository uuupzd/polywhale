import React from 'react';
import { WhaleTrade } from '@/hooks/useWhaleTrades';
import { formatAmount, formatAmountCompact } from '@/utils/formatAmount';
import { formatTime } from '@/utils/formatTime';

interface TradeTableProps {
  trades: WhaleTrade[];
  loading?: boolean;
}

export default function TradeTable({ trades, loading = false }: TradeTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-gray-400">Loading whale trades...</div>
      </div>
    );
  }

  if (trades.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">No whale trades found. Waiting for large trades...</div>
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
              Time
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
            >
              Market
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
            >
              Outcome
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
            >
              Side
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider"
            >
              Amount
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
            >
              Maker
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
                <div className="text-sm text-white max-w-md truncate" title={trade.market}>
                  {trade.market}
                </div>
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
                  {trade.side}
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
                <div className="text-xs text-gray-400 font-mono">
                  {trade.makerAddress.slice(0, 6)}...{trade.makerAddress.slice(-4)}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
