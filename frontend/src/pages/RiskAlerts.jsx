import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Sparkles,
  Calendar,
  ArrowRight,
  TrendingDown,
  Info,
  ChevronRight,
  Zap,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import Header from '../components/Header';
import ThreeRiskReactor from '../components/ThreeRiskReactor';
import { fetchRisk, fetchForecast, updateSafetyBuffer } from '../utils/api';
import { useRealtime } from '../hooks/useRealtime';

export default function RiskAlerts() {
  const navigate = useNavigate();
  const [riskData, setRiskData] = useState(null);
  const [forecastData, setForecastData] = useState([]);
  const [safetyBufferInput, setSafetyBufferInput] = useState(15000);
  const [savingBuffer, setSavingBuffer] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rsk, fc] = await Promise.all([fetchRisk(), fetchForecast()]);
      setRiskData(rsk);
      setForecastData(fc.forecast || []);
      setSafetyBufferInput(rsk.safety_buffer || 15000);
    } catch (err) {
      console.error('Error loading risk data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useRealtime(() => {
    loadData();
  });

  const handleBufferChange = async (newVal) => {
    setSafetyBufferInput(newVal);
    try {
      setSavingBuffer(true);
      const res = await updateSafetyBuffer(newVal);
      setRiskData(res.risk);
      const fc = await fetchForecast();
      setForecastData(fc.forecast || []);
    } catch (err) {
      console.error('Failed to update buffer:', err);
    } finally {
      setSavingBuffer(false);
    }
  };

  const isHighRisk = riskData?.overall_risk === 'HIGH_RISK';
  const isWatch = riskData?.overall_risk === 'WATCH';
  const breach = riskData?.first_breach;

  return (
    <div className="min-h-screen pb-12 flex flex-col">
      <Header
        onRefresh={loadData}
        title="Liquidity Risk Engine"
        subtitle="Automated cash buffer monitoring, shortfall detection, and dynamic stress testing"
      />

      <div className="p-8 space-y-8 flex-1">
        {/* Risk Status Hero Banner */}
        <div
          className={`p-6 rounded-2xl border shadow-2xl relative overflow-hidden transition-all ${
            isHighRisk
              ? 'bg-gradient-to-r from-rose-950/80 via-navy-900 to-navy-900 border-rose-500/40 glow-rose'
              : isWatch
              ? 'bg-gradient-to-r from-amber-950/80 via-navy-900 to-navy-900 border-amber-500/40 glow-amber'
              : 'bg-gradient-to-r from-mint-950/80 via-navy-900 to-navy-900 border-mint-500/40 glow-mint'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-5">
              <div
                className={`w-16 h-16 rounded-2xl border flex items-center justify-center shrink-0 ${
                  isHighRisk
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                    : isWatch
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                    : 'bg-mint-500/20 border-mint-500/40 text-mint-400'
                }`}
              >
                {isHighRisk ? (
                  <AlertTriangle size={32} className="animate-pulse" />
                ) : isWatch ? (
                  <ShieldAlert size={32} />
                ) : (
                  <CheckCircle2 size={32} />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
                      isHighRisk
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : isWatch
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-mint-500/20 text-mint-300 border border-mint-500/30'
                    }`}
                  >
                    {riskData?.overall_risk || 'CALCULATING'}
                  </span>
                  <span className="text-xs text-slate-400">
                    Health Score: <strong className="text-white">{riskData?.health_score}/100</strong>
                  </span>
                </div>

                <h2 className="text-xl font-bold text-white mt-1.5">
                  {isHighRisk
                    ? `Liquidity Shortfall Projected on ${breach?.day_of_week} (${breach?.date})`
                    : isWatch
                    ? 'Caution: Approaching Minimum Safety Threshold'
                    : 'All 14 Days Safe Above Buffer'}
                </h2>

                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  {isHighRisk
                    ? `Your projected balance dips to ₹${breach?.projected_balance?.toLocaleString('en-IN')} on Day ${breach?.day_number}, falling ₹${breach?.liquidity_gap?.toLocaleString('en-IN')} below your configured ₹${safetyBufferInput?.toLocaleString('en-IN')} threshold.`
                    : 'Your business is operating with adequate cash reserves to cover anticipated operational expenses and supplier obligations.'}
                </p>
              </div>
            </div>

            {isHighRisk && (
              <button
                onClick={() => navigate('/simulator')}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-mint-500 hover:from-indigo-600 hover:to-mint-600 text-white font-bold text-xs flex items-center gap-2 shadow-xl shadow-indigo-500/30 transition-all cursor-pointer shrink-0"
              >
                <Sparkles size={16} />
                <span>Simulate Working Capital Solution</span>
              </button>
            )}
          </div>
        </div>

        {/* 3D Risk Reactor + Breach Metrics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 3D Three.js Risk Reactor */}
          <div className="glass-card p-6 flex flex-col justify-between">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <Zap size={16} className="text-rose-400" />
              <span>3D Liquidity Stress Core</span>
            </h3>
            <ThreeRiskReactor
              riskLevel={riskData?.overall_risk || 'HIGH_RISK'}
              liquidityGap={riskData?.max_liquidity_gap || 0}
              breachDate={breach?.day_of_week || 'No breach'}
            />
          </div>

          {/* Breach Breakdown (2 Cols) */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="glass-card p-5 border-rose-500/20 flex flex-col justify-between">
              <span className="text-xs text-slate-400">First Projected Breach</span>
              <div className="text-2xl font-black text-rose-400 mt-2 flex items-center gap-2">
                <Calendar size={22} />
                <span>{breach?.day_of_week}, {breach?.date}</span>
              </div>
              <span className="text-xs text-slate-400 mt-2">Due to supplier invoice clearance</span>
            </div>

            <div className="glass-card p-5 border-rose-500/20 flex flex-col justify-between">
              <span className="text-xs text-slate-400">Projected Trough Balance</span>
              <div className="text-2xl font-black text-rose-400 mt-2">
                ₹{riskData?.min_projected_balance?.toLocaleString('en-IN')}
              </div>
              <span className="text-xs text-slate-400 mt-2">Lowest point in 14-day window</span>
            </div>

            <div className="glass-card p-5 border-rose-500/20 flex flex-col justify-between">
              <span className="text-xs text-slate-400">Deficit Below Safety Buffer</span>
              <div className="text-2xl font-black text-rose-400 mt-2">
                -₹{riskData?.max_liquidity_gap?.toLocaleString('en-IN')}
              </div>
              <span className="text-xs text-slate-400 mt-2">Required capital bridge</span>
            </div>

            <div className="glass-card p-5 flex flex-col justify-between">
              <span className="text-xs text-slate-400">Breach Window Duration</span>
              <div className="text-2xl font-black text-amber-300 mt-2">
                {riskData?.breach_count || 1} of 14 Days
              </div>
              <span className="text-xs text-slate-400 mt-2">Recovers after customer payments clear</span>
            </div>
          </div>
        </div>

        {/* Forecast Curve vs Safety Threshold */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Projected Cash Runway vs Safety Threshold</h3>
              <p className="text-xs text-slate-400 mt-0.5">Areas below the red line indicate liquidity stress</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-indigo-500 inline-block" />
                <span className="text-slate-300">Projected Balance</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 border-t-2 border-dashed border-rose-400 inline-block" />
                <span className="text-rose-400">Safety Buffer (₹{safetyBufferInput.toLocaleString('en-IN')})</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="day_of_week" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0a1628', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '10px' }}
                  formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Projected Balance']}
                />
                <ReferenceLine
                  y={safetyBufferInput}
                  stroke="#f43f5e"
                  strokeDasharray="4 4"
                  strokeWidth={2}
                  label={{ value: `Safety Buffer ₹${safetyBufferInput.toLocaleString('en-IN')}`, fill: '#f43f5e', fontSize: 11, position: 'insideTopLeft' }}
                />
                <Area type="monotone" dataKey="projected_balance" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#riskGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dynamic Safety Buffer Configurator */}
        <div className="glass-card p-6 bg-gradient-to-r from-navy-900 via-navy-900 to-navy-950 border-indigo-500/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Sliders size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Interactive Safety Buffer Stress Tester</h3>
                <p className="text-xs text-slate-400">Adjust your merchant safety reserve to re-evaluate liquidity threshold</p>
              </div>
            </div>
            <span className="text-sm font-bold text-indigo-300">
              ₹{safetyBufferInput.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="space-y-4">
            <input
              type="range"
              min={5000}
              max={50000}
              step={2500}
              value={safetyBufferInput}
              onChange={(e) => handleBufferChange(Number(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer h-2 bg-navy-950 rounded-lg appearance-none"
            />
            <div className="flex justify-between text-xs text-slate-400">
              <span>₹5,000 (Aggressive)</span>
              <span>₹15,000 (Default)</span>
              <span>₹30,000 (Conservative)</span>
              <span>₹50,000 (High Cushion)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
