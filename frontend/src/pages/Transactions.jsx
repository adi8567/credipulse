import React, { useEffect, useState, useMemo } from 'react';
import {
  ArrowLeftRight,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Download,
  CreditCard,
  QrCode,
  Building,
  Smartphone,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Header from '../components/Header';
import { fetchTransactions } from '../utils/api';
import { useRealtime } from '../hooks/useRealtime';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('ALL');
  const [page, setPage] = useState(0);
  const limit = 20;

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const data = await fetchTransactions({ limit: 100, offset: page * limit });
      setTransactions(data.transactions || []);
      setTotalCount(data.total || 0);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [page]);

  useRealtime(() => {
    loadTransactions();
  });

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchSearch =
        tx.payment_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.id?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchMethod =
        selectedMethod === 'ALL' || tx.method?.toLowerCase() === selectedMethod.toLowerCase();

      return matchSearch && matchMethod;
    });
  }, [transactions, searchTerm, selectedMethod]);

  // Aggregate stats
  const totalVolume = useMemo(() => {
    return transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
  }, [transactions]);

  const avgOrderValue = useMemo(() => {
    return transactions.length ? Math.round(totalVolume / transactions.length) : 0;
  }, [transactions, totalVolume]);

  const successRate = useMemo(() => {
    if (!transactions.length) return 0;
    const successful = transactions.filter((tx) => tx.status === 'captured').length;
    return Math.round((successful / transactions.length) * 1000) / 10;
  }, [transactions]);

  const topPaymentMode = useMemo(() => {
    if (!transactions.length) return 'None';
    const counts = transactions.reduce((acc, tx) => {
      const method = (tx.method || 'unknown').toUpperCase();
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {});
    const [method, count] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return `${method} (${Math.round((count / transactions.length) * 100)}%)`;
  }, [transactions]);

  const getMethodIcon = (method) => {
    switch (method?.toLowerCase()) {
      case 'upi':
        return <QrCode size={13} className="text-mint-400" />;
      case 'card':
        return <CreditCard size={13} className="text-indigo-400" />;
      case 'netbanking':
        return <Building size={13} className="text-amber-400" />;
      default:
        return <Smartphone size={13} className="text-slate-400" />;
    }
  };

  return (
    <div className="min-h-screen pb-12 flex flex-col">
      <Header
        onRefresh={loadTransactions}
        title="Merchant Transactions"
        subtitle="Full Razorpay payment lifecycle, settlement tracking & method distribution"
      />

      <div className="p-8 space-y-6 flex-1">
        {/* Top Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass-card p-4">
            <span className="text-xs text-slate-400">Total Ingested Volume</span>
            <div className="text-xl font-bold text-white mt-1">₹{totalVolume.toLocaleString('en-IN')}</div>
            <span className="text-[11px] text-mint-400">Across {totalCount} total records</span>
          </div>

          <div className="glass-card p-4">
            <span className="text-xs text-slate-400">Average Ticket Size</span>
            <div className="text-xl font-bold text-white mt-1">₹{avgOrderValue.toLocaleString('en-IN')}</div>
            <span className="text-[11px] text-indigo-400">Standard retail basket</span>
          </div>

          <div className="glass-card p-4">
            <span className="text-xs text-slate-400">Settlement Status</span>
            <div className="text-xl font-bold text-mint-300 mt-1">{successRate}% Success</div>
            <span className="text-[11px] text-slate-400">Computed from fetched payments</span>
          </div>

          <div className="glass-card p-4">
            <span className="text-xs text-slate-400">Top Payment Mode</span>
            <div className="text-xl font-bold text-indigo-300 mt-1">{topPaymentMode}</div>
            <span className="text-[11px] text-slate-400">Computed from fetched payments</span>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="glass-card p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-1 max-w-md bg-navy-950/80 px-3.5 py-2 rounded-xl border border-slate-700/60 text-xs">
            <Search size={16} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search payment ID, order ID, description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent text-white placeholder-slate-500 outline-none w-full text-xs"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-400 mr-1 flex items-center gap-1">
              <Filter size={12} /> Method:
            </span>
            {['ALL', 'UPI', 'CARD', 'NETBANKING', 'WALLET'].map((m) => (
              <button
                key={m}
                onClick={() => setSelectedMethod(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedMethod === m
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-navy-800/80 text-slate-400 hover:text-white border border-slate-700/50'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Transactions Table */}
        <div className="glass-card p-6 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="pb-3">Payment ID</th>
                  <th className="pb-3">Description</th>
                  <th className="pb-3">Method</th>
                  <th className="pb-3">Timestamp</th>
                  <th className="pb-3">Settlement</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="py-3.5 font-mono text-slate-300 font-medium text-[11px]">
                      {tx.payment_id}
                    </td>
                    <td className="py-3.5 text-white font-medium">
                      {tx.description}
                    </td>
                    <td className="py-3.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase bg-navy-800 text-slate-200 border border-slate-700/60">
                        {getMethodIcon(tx.method)}
                        {tx.method || 'unknown'}
                      </span>
                    </td>
                    <td className="py-3.5 text-slate-400 text-[11px]">
                      {new Date(tx.created_at).toLocaleString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3.5 text-[11px]">
                      <span className="text-slate-300">
                        {tx.settled_at
                          ? `Settled (${new Date(tx.settled_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })})`
                          : 'T+1 Processing'}
                      </span>
                    </td>
                    <td className="py-3.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-mint-500/10 text-mint-300 border border-mint-500/30">
                        <CheckCircle2 size={11} />
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-right font-bold text-mint-300 text-sm">
                      +₹{tx.amount?.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              Showing {filteredTransactions.length} of {totalCount} transactions
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 rounded-lg bg-navy-800 text-slate-300 hover:text-white border border-slate-700 disabled:opacity-40 cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft size={14} /> Previous
              </button>
              <span className="px-2 font-medium text-white">Page {page + 1}</span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={(page + 1) * limit >= totalCount}
                className="px-3 py-1.5 rounded-lg bg-navy-800 text-slate-300 hover:text-white border border-slate-700 disabled:opacity-40 cursor-pointer flex items-center gap-1"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
