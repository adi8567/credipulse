import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Sparkles,
  Bot,
  Calendar,
  CreditCard,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  Zap,
  Activity,
  Orbit,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ComposedChart,
} from 'recharts';
import Header from '../components/Header';
import CashFlowHologram from '../components/CashFlowHologram';
import {
  fetchBalance,
  fetchTransactions,
  fetchForecast,
  fetchRisk,
  fetchAnalysisSummary,
  fetchCopilotInsights,
} from '../utils/api';
import { useRealtime } from '../hooks/useRealtime';

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [balanceData, setBalanceData] = useState(null);
  const [forecastData, setForecastData] = useState([]);
  const [riskData, setRiskData] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [copilotSummary, setCopilotSummary] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [bal, fc, rsk, anl, txs, copilot] = await Promise.all([
        fetchBalance(),
        fetchForecast(),
        fetchRisk(),
        fetchAnalysisSummary(),
        fetchTransactions({ limit: 6 }),
        fetchCopilotInsights().catch(() => null),
      ]);

      setBalanceData(bal);
      setForecastData(fc.forecast || []);
      setRiskData(rsk);
      setAnalysisData(anl);
      setTransactions(txs.transactions || []);
      setCopilotSummary(copilot);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useRealtime(() => {
    loadData();
  });

  const isHighRisk = riskData?.overall_risk === 'HIGH_RISK';
  const isWatch = riskData?.overall_risk === 'WATCH';
  const currentBalance = Number(balanceData?.current_balance || 0);
  const safetyBuffer = balanceData?.safety_buffer || 15000;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-navy-900/95 border border-indigo-500/30 p-3.5 rounded-xl shadow-2xl backdrop-blur-md text-xs space-y-1.5 min-w-[190px]">
          <div className="font-semibold text-white flex justify-between items-center border-b border-slate-700/60 pb-1.5 mb-1.5">
            <span>{data.day_of_week}, {data.date}</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                data.risk_level === 'HIGH_RISK'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : data.risk_level === 'WATCH'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-mint-500/20 text-mint-400 border border-mint-500/30'
              }`}
            >
              {data.risk_level}
            </span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Projected Balance:</span>
            <span className="font-bold text-indigo-300">₹{data.projected_balance?.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Predicted Inflow:</span>
            <span className="text-mint-400 font-medium">+₹{data.predicted_inflow?.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Predicted Outflow:</span>
            <span className="text-rose-400 font-medium">-₹{data.predicted_outflow?.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-slate-500 pt-1 border-t border-slate-800 text-[11px]">
            <span>Safety Buffer:</span>
            <span>₹{safetyBuffer.toLocaleString('en-IN')}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen pb-12 flex flex-col">
      <Header
        onRefresh={loadData}
        title="Merchant Cash Flow Intelligence"
        subtitle={`Real-time Razorpay telemetry for ${balanceData?.merchant_name || 'Connected Merchant'}`}
      />

      <div className="p-8 space-y-8 flex-1">
        {/* Risk Banner Alert */}
        {isHighRisk && (
          <div className="p-5 rounded-2xl bg-gradient-to-r from-rose-950/80 via-navy-900 to-navy-900 border border-rose-500/40 shadow-2xl flex flex-wrap items-center justify-between gap-6 relative overflow-hidden animate-fade-in glow-rose">
            <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                <AlertTriangle size={24} className="animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    Liquidity Warning
                  </span>
                  <span className="text-xs text-slate-400">
                    Detected by 14-Day Predictive Engine
                  </span>
                </div>
                <h2 className="text-base font-bold text-white mt-1">
                  Projected Buffer Breach on {riskData?.first_breach?.day_of_week} ({riskData?.first_breach?.date})
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  Projected balance dips to <strong className="text-rose-300">₹{riskData?.first_breach?.projected_balance?.toLocaleString('en-IN')}</strong>, breaching your ₹{safetyBuffer.toLocaleString('en-IN')} safety buffer by <strong className="text-rose-300">₹{riskData?.first_breach?.liquidity_gap?.toLocaleString('en-IN')}</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => navigate('/simulator')}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-mint-500 hover:from-indigo-600 hover:to-mint-600 text-white font-semibold text-xs transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-2 cursor-pointer"
              >
                <Sparkles size={14} />
                <span>Open capital simulator</span>
              </button>
              <button
                onClick={() => navigate('/risk')}
                className="px-4 py-2.5 rounded-xl bg-navy-800 hover:bg-navy-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all cursor-pointer"
              >
                Risk Analysis
              </button>
            </div>
          </div>
        )}

        {/* 4 KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* 1. Current Balance */}
          <div className="glass-card p-5 relative overflow-hidden group hover:border-indigo-500/40 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-400">Available Balance</span>
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Wallet size={18} />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-white tracking-tight">
              ₹{currentBalance.toLocaleString('en-IN')}
            </div>
            <div className="mt-2.5 flex items-center justify-between text-xs">
              <span className="text-slate-400">Safety Buffer:</span>
              <span className="text-slate-300 font-semibold">₹{safetyBuffer.toLocaleString('en-IN')}</span>
            </div>
            <div className="w-full bg-navy-950 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.max(15, (currentBalance / (safetyBuffer * 2)) * 100))}%`,
                  background: isHighRisk ? '#f43f5e' : '#34d399',
                }}
              />
            </div>
          </div>

          {/* 2. 7-Day Inflow */}
          <div className="glass-card p-5 relative overflow-hidden group hover:border-mint-500/40 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-400">Avg Daily Inflow</span>
              <div className="w-9 h-9 rounded-xl bg-mint-500/10 border border-mint-500/20 flex items-center justify-center text-mint-400">
                <TrendingUp size={18} />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-white tracking-tight">
              ₹{Math.round(analysisData?.inflow?.avg_inflow || 0).toLocaleString('en-IN')}
            </div>
            <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-400">
              <span className="text-mint-400 font-semibold flex items-center">
                <ArrowUpRight size={14} /> T+1/T+2
              </span>
              <span>Settlement cycle</span>
            </div>
          </div>

          {/* 3. 7-Day Outflow */}
          <div className="glass-card p-5 relative overflow-hidden group hover:border-rose-500/40 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-400">Avg Daily Outflow</span>
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <TrendingDown size={18} />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-white tracking-tight">
              ₹{Math.round(analysisData?.outflow?.avg_outflow || 0).toLocaleString('en-IN')}
            </div>
            <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-400">
              <span className="text-rose-400 font-semibold">Thu Surge</span>
              <span>Bulk vendor clearances</span>
            </div>
          </div>

          {/* 4. Cash Flow Health Score */}
          <div className="glass-card p-5 relative overflow-hidden group hover:border-amber-500/40 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-400">Liquidity Health</span>
              <div
                className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
                  isHighRisk
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                    : isWatch
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                    : 'bg-mint-500/10 border-mint-500/20 text-mint-400'
                }`}
              >
                <ShieldAlert size={18} />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-extrabold text-white tracking-tight">
                {riskData?.health_score ?? 0}<span className="text-sm font-normal text-slate-400">/100</span>
              </div>
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase ${
                  isHighRisk
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : isWatch
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-mint-500/20 text-mint-300 border border-mint-500/30'
                }`}
              >
                {riskData?.overall_risk || 'HEALTHY'}
              </span>
            </div>
            <p className="mt-2.5 text-xs text-slate-400 truncate">
              {riskData?.message || (isHighRisk ? 'Action needed on projected breach date' : 'Cash runway computed from synced data')}
            </p>
          </div>
        </div>

        {/* Middle Section: 14-Day Forecast Chart + 3D Cash Flow Hologram */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 14-Day Cash Flow Forecast (2 Cols) */}
          <div className="lg:col-span-2 glass-card p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>14-Day Cash Flow Forecast</span>
                  <span className="text-[11px] font-normal px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    EWMA + Seasonality Model
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Projected balance vs. ₹{safetyBuffer.toLocaleString('en-IN')} safety buffer
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-indigo-500 inline-block" />
                  <span className="text-slate-300">Projected Balance</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 border-t-2 border-dashed border-rose-400 inline-block" />
                  <span className="text-rose-400">Safety Buffer</span>
                </div>
              </div>
            </div>

            {/* Recharts Forecast Graph */}
            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={forecastData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis
                    dataKey="day_of_week"
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  />
                  <YAxis
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine
                    y={safetyBuffer}
                    stroke="#f43f5e"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{
                      value: `Buffer ₹${(safetyBuffer / 1000).toFixed(0)}k`,
                      fill: '#fb7185',
                      fontSize: 10,
                      position: 'insideTopLeft',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="projected_balance"
                    stroke="#818cf8"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#balanceGradient)"
                  />
                  <Bar dataKey="predicted_inflow" fill="#34d399" opacity={0.3} barSize={8} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="predicted_outflow" fill="#f43f5e" opacity={0.3} barSize={8} radius={[4, 4, 0, 0]} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>Days 1-4: High risk window</span>
              <button
                onClick={() => navigate('/simulator')}
                className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 cursor-pointer"
              >
                <span>Test Working Capital injection</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* 3D Cash Flow Hologram Widget */}
          <div className="glass-card p-6 flex flex-col justify-between border-indigo-500/30 bg-gradient-to-b from-navy-900 via-navy-900 to-navy-950">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <Orbit size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">3D Liquidity Telemetry</h3>
                    <p className="text-[11px] text-slate-400">Interactive Three.js Core</p>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-mint-500/15 text-mint-400 border border-mint-500/30">
                  REAL-TIME
                </span>
              </div>

              {/* Three.js 3D Hologram Orb */}
              <CashFlowHologram
                balance={currentBalance}
                healthScore={riskData?.health_score ?? 0}
                riskLevel={riskData?.overall_risk || 'HEALTHY'}
              />
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <button
                onClick={() => navigate('/copilot')}
                className="w-full py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/30 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Ask AI Copilot for Advice</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Section: Recent Transactions */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-white">Recent Razorpay Transactions</h3>
              <p className="text-xs text-slate-400 mt-0.5">Live ingested payments & settlement statuses</p>
            </div>
            <button
              onClick={() => navigate('/transactions')}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
            >
              <span>View All Transactions</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-medium pb-2">
                  <th className="pb-3 font-semibold">Payment ID</th>
                  <th className="pb-3 font-semibold">Description</th>
                  <th className="pb-3 font-semibold">Method</th>
                  <th className="pb-3 font-semibold">Date & Time</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 font-mono text-slate-300 text-[11px]">
                      {tx.payment_id}
                    </td>
                    <td className="py-3 text-white font-medium">
                      {tx.description}
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-md font-medium text-[10px] uppercase bg-navy-800 text-slate-300 border border-slate-700/60">
                        {tx.method || 'upi'}
                      </span>
                    </td>
                    <td className="py-3 text-slate-400 text-[11px]">
                      {new Date(tx.created_at).toLocaleString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-mint-500/10 text-mint-400 border border-mint-500/20">
                        <CheckCircle2 size={10} />
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-3 text-right font-bold text-mint-300">
                      +₹{tx.amount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
