import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  Calendar,
  Clock,
  Activity,
  BarChart3,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
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
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import Header from '../components/Header';
import { fetchAnalysisSummary, fetchHistoricalAnalysis } from '../utils/api';
import { useRealtime } from '../hooks/useRealtime';

export default function CashFlow() {
  const [analysis, setAnalysis] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [selectedRange, setSelectedRange] = useState(60);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sum, hist] = await Promise.all([
        fetchAnalysisSummary(),
        fetchHistoricalAnalysis(selectedRange),
      ]);
      setAnalysis(sum);
      setHistoricalData(hist.summaries || []);
    } catch (err) {
      console.error('Error fetching cash flow data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedRange]);

  useRealtime(() => {
    loadData();
  });

  const dowNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dowData = (analysis?.dow_pattern || [1, 1, 1, 1, 1, 1, 1]).map((mult, idx) => ({
    day: dowNames[idx],
    multiplier: Math.round(mult * 100) / 100,
    volume: Math.round((analysis?.inflow?.avg_inflow || 0) * mult),
  }));

  const settlement = analysis?.settlement || { t1_pct: 0, t2_pct: 0, t3_pct: 0, avg_delay: 0 };
  const settlementPieData = [
    { name: 'T+1 Day', value: settlement.t1_pct, color: '#34d399' },
    { name: 'T+2 Days', value: settlement.t2_pct, color: '#818cf8' },
    { name: 'T+3+ Days', value: settlement.t3_pct, color: '#fbbf24' },
  ];

  return (
    <div className="min-h-screen pb-12 flex flex-col">
      <Header
        onRefresh={loadData}
        title="Cash Flow & Settlement Diagnostics"
        subtitle="Deep analysis of historical payment cycles, seasonal rhythms, and cash volatility"
      />

      <div className="p-8 space-y-8 flex-1">
        {/* Top 4 Metrics Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="glass-card p-5">
            <span className="text-xs text-slate-400">Monthly Avg Daily Inflow</span>
            <div className="text-2xl font-extrabold text-mint-400 mt-1">
              ₹{Math.round(analysis?.inflow?.avg_inflow || 0).toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-slate-400">Peak: ₹{Math.round(analysis?.inflow?.max_inflow || 0).toLocaleString('en-IN')}</span>
          </div>

          <div className="glass-card p-5">
            <span className="text-xs text-slate-400">Monthly Avg Daily Outflow</span>
            <div className="text-2xl font-extrabold text-rose-400 mt-1">
              ₹{Math.round(analysis?.outflow?.avg_outflow || 0).toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-slate-400">Fixed + inventory runs</span>
          </div>

          <div className="glass-card p-5">
            <span className="text-xs text-slate-400">Avg Settlement Turnaround</span>
            <div className="text-2xl font-extrabold text-indigo-300 mt-1">
              {settlement.avg_delay} Days
            </div>
            <span className="text-[11px] text-mint-400">{settlement.t1_pct}% cleared within T+1</span>
          </div>

          <div className="glass-card p-5">
            <span className="text-xs text-slate-400">Cash Flow Volatility</span>
            <div className="text-2xl font-extrabold text-amber-300 mt-1">
              {analysis?.volatility?.cv ?? 0}% CV
            </div>
            <span className="text-[11px] text-slate-400">Moderate predictable flow</span>
          </div>
        </div>

        {/* 90-Day Historical Trend Area Chart */}
        <div className="glass-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Historical Cash Flow Trajectory</span>
                <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Razorpay Ingested
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Daily total captured inflows vs daily operational disbursements</p>
            </div>

            {/* Range Pills */}
            <div className="flex items-center gap-2 bg-navy-950 p-1 rounded-xl border border-slate-800 text-xs">
              {[30, 60, 90].map((r) => (
                <button
                  key={r}
                  onClick={() => setSelectedRange(r)}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    selectedRange === r
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Last {r} Days
                </button>
              ))}
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historicalData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="inflowGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="outflowGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fb7185" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#fb7185" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  tickLine={false}
                  tickFormatter={(d) => d.slice(5)}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                />
                <YAxis
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0a1628',
                    border: '1px solid rgba(99,102,241,0.3)',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                  formatter={(val, name) => [`₹${Number(val).toLocaleString('en-IN')}`, name === 'total_inflow' ? 'Daily Inflow' : 'Daily Outflow']}
                />
                <Area
                  type="monotone"
                  dataKey="total_inflow"
                  stroke="#34d399"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#inflowGrad)"
                  name="total_inflow"
                />
                <Area
                  type="monotone"
                  dataKey="total_outflow"
                  stroke="#fb7185"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#outflowGrad)"
                  name="total_outflow"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottom 2 Diagnostics: Day-of-Week Pattern & Settlement Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Day-of-Week Rhythm */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
              <Calendar size={16} className="text-indigo-400" />
              Day-of-Week Inflow Multiplier
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Identifies peak revenue days for inventory stocking and promotional scheduling
            </p>

            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dowData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0a1628', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '8px' }}
                    formatter={(val) => [`${val}x multiplier`, 'Index']}
                  />
                  <Bar dataKey="multiplier" fill="#818cf8" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-slate-400 mt-3 text-center">
              Peak days are computed from synced Razorpay daily inflows.
            </p>
          </div>

          {/* Settlement Speed Breakdown */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
              <Clock size={16} className="text-mint-400" />
              Razorpay Settlement Cycle Distribution
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Speed of funds clearing from Razorpay gateway to merchant bank account
            </p>

            <div className="grid grid-cols-2 items-center">
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={settlementPieData}
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {settlementPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0a1628', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '8px', fontSize: '11px' }}
                      formatter={(v) => [`${v}%`, 'Share']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-3 text-xs">
                {settlementPieData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between p-2 rounded-lg bg-navy-950/60 border border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-300 font-medium">{item.name}</span>
                    </div>
                    <span className="font-bold text-white">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
