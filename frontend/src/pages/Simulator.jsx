import React, { useEffect, useState } from 'react';
import {
  Wallet,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Info,
  TrendingUp,
  CheckCircle2,
  RefreshCw,
  Orbit,
} from 'lucide-react';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts';
import Header from '../components/Header';
import ThreeSimulatorSphere from '../components/ThreeSimulatorSphere';
import { runSimulation } from '../utils/api';
import { useRealtime } from '../hooks/useRealtime';

const PRESET_AMOUNTS = [10000, 15000, 20000, 30000, 40000];

export default function Simulator() {
  const [advanceAmount, setAdvanceAmount] = useState(20000);
  const [simResult, setSimResult] = useState(null);
  const [loading, setLoading] = useState(true);

  const executeSimulation = async (amount) => {
    try {
      setLoading(true);
      const res = await runSimulation(amount);
      setSimResult(res);
    } catch (err) {
      console.error('Simulation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    executeSimulation(advanceAmount);
  }, [advanceAmount]);

  useRealtime(() => {
    executeSimulation(advanceAmount);
  });

  const baselineRisk = simResult?.baseline?.risk;
  const simulatedRisk = simResult?.simulated?.risk;
  const safetyBuffer = simResult?.safety_buffer || 15000;

  const combinedForecast = (simResult?.baseline?.forecast || []).map((b, i) => {
    const s = simResult?.simulated?.forecast?.[i] || {};
    return {
      date: b.date,
      day_of_week: b.day_of_week,
      day_number: b.day_number,
      baseline_balance: b.projected_balance,
      simulated_balance: s.projected_balance,
      safety_buffer: safetyBuffer,
      diff: (s.projected_balance || 0) - (b.projected_balance || 0),
    };
  });

  const isResolved = baselineRisk?.has_breach && !simulatedRisk?.has_breach;

  return (
    <div className="min-h-screen pb-12 flex flex-col">
      <Header
        onRefresh={() => executeSimulation(advanceAmount)}
        title="Working Capital Simulator"
        subtitle="Model working capital advances to proactively solve projected cash flow shortfalls"
      />

      <div className="p-8 space-y-8 flex-1">
        {/* Compliance Disclaimer */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs">
          <Info size={18} className="text-indigo-400 shrink-0 mt-0.5" />
          <div className="text-slate-300 leading-relaxed">
            <strong className="text-white">SIMULATION & FORECASTING ONLY:</strong> CreditPulse models hypothetical liquidity outcomes based on historical Razorpay transaction trends. CreditPulse does not originate, disburse, or service loans.
          </div>
        </div>

        {/* Hero Interactive Advance Selector with 3D Sphere Integration */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Slider & Presets (2 Cols) */}
          <div className="lg:col-span-2 glass-card p-6 bg-gradient-to-r from-navy-900 via-navy-900 to-navy-950 border-indigo-500/30 flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Wallet size={20} className="text-indigo-400" />
                    <span>Working Capital Advance Selector</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Test different capital injections to evaluate real-time liquidity recovery
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-3xl font-black gradient-text tracking-tight">
                    ₹{advanceAmount.toLocaleString('en-IN')}
                  </div>
                  <span className="text-[11px] text-slate-400">Short-term capital buffer</span>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <input
                  type="range"
                  min={5000}
                  max={50000}
                  step={2500}
                  value={advanceAmount}
                  onChange={(e) => setAdvanceAmount(Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer h-2.5 bg-navy-950 rounded-lg appearance-none"
                />

                <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
                  <span className="text-xs text-slate-400">Quick Sizing Presets:</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {PRESET_AMOUNTS.map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setAdvanceAmount(amt)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          advanceAmount === amt
                            ? 'bg-gradient-to-r from-indigo-500 to-mint-500 text-white shadow-lg shadow-indigo-500/20'
                            : 'bg-navy-800 text-slate-300 hover:text-white border border-slate-700/60'
                        }`}
                      >
                        +₹{(amt / 1000).toFixed(0)}k
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Optimal sizing follows the computed maximum liquidity gap.</span>
              <span className="text-mint-400 font-semibold flex items-center gap-1">
                <CheckCircle2 size={14} /> 100% Deficit Cleared
              </span>
            </div>
          </div>

          {/* 3D Three.js Simulator Orb */}
          <div className="glass-card p-6 flex flex-col justify-between border-mint-500/20">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <Orbit size={16} className="text-mint-400" />
              <span>3D Capital Dynamics</span>
            </h3>
            <ThreeSimulatorSphere advanceAmount={advanceAmount} isResolved={Boolean(isResolved)} />
          </div>
        </div>

        {/* Before vs After Side-by-Side Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* BEFORE: Baseline Trajectory */}
          <div className="glass-card p-6 border-rose-500/30 bg-gradient-to-b from-rose-950/20 to-navy-900/60 relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-ping" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Before (Baseline)</h3>
              </div>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {baselineRisk?.overall_risk || 'HIGH_RISK'}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between p-2.5 rounded-xl bg-navy-950/80 border border-rose-500/10">
                <span className="text-slate-400">Projected Minimum Balance:</span>
                <span className="font-bold text-rose-400">₹{baselineRisk?.min_projected_balance?.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-navy-950/80 border border-rose-500/10">
                <span className="text-slate-400">Breach Status:</span>
                <span className="font-bold text-rose-300">Shortfall of ₹{baselineRisk?.first_breach?.liquidity_gap?.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-navy-950/80 border border-rose-500/10">
                <span className="text-slate-400">Safety Buffer Cushion:</span>
                <span className="font-bold text-rose-400">-₹{baselineRisk?.max_liquidity_gap?.toLocaleString('en-IN')} below buffer</span>
              </div>
            </div>
          </div>

          {/* AFTER: With Advance Simulation */}
          <div className="glass-card p-6 border-mint-500/40 bg-gradient-to-b from-mint-950/20 to-navy-900/60 relative glow-mint">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-mint-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  After (+₹{advanceAmount.toLocaleString('en-IN')} Advance)
                </h3>
              </div>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full uppercase bg-mint-500/20 text-mint-300 border border-mint-500/30">
                {simulatedRisk?.overall_risk || 'HEALTHY'}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between p-2.5 rounded-xl bg-navy-950/80 border border-mint-500/20">
                <span className="text-slate-400">Projected Minimum Balance:</span>
                <span className="font-bold text-mint-300">₹{simulatedRisk?.min_projected_balance?.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-navy-950/80 border border-mint-500/20">
                <span className="text-slate-400">Breach Status:</span>
                <span className="font-bold text-mint-300 flex items-center gap-1">
                  <CheckCircle2 size={13} className="text-mint-400" /> Fully Resolved (Zero Deficit)
                </span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-navy-950/80 border border-mint-500/20">
                <span className="text-slate-400">Safety Buffer Cushion:</span>
                <span className="font-bold text-mint-300">
                  +₹{((simulatedRisk?.min_projected_balance || 0) - safetyBuffer).toLocaleString('en-IN')} above buffer
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Dual-Series Overlaid Comparative Chart */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Before vs After Trajectory Comparison</span>
                {isResolved && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-mint-500/20 text-mint-300 border border-mint-500/30 font-semibold">
                    100% Deficit Resolved
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Baseline (without advance) vs Simulated (with +₹{advanceAmount.toLocaleString('en-IN')} injection)
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-rose-400 inline-block" />
                <span className="text-rose-300">Baseline Trajectory</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1 bg-mint-400 inline-block rounded" />
                <span className="text-mint-300">Simulated Trajectory</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 border-t border-dashed border-slate-500 inline-block" />
                <span className="text-slate-400">Buffer (₹{safetyBuffer.toLocaleString('en-IN')})</span>
              </div>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={combinedForecast} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="simGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0.0} />
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
                  contentStyle={{ backgroundColor: '#0a1628', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '10px', fontSize: '11px' }}
                  formatter={(val, name) => [
                    `₹${Number(val).toLocaleString('en-IN')}`,
                    name === 'baseline_balance' ? 'Baseline Balance' : 'Simulated Balance (+Adv)',
                  ]}
                />
                <ReferenceLine
                  y={safetyBuffer}
                  stroke="#f43f5e"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                />
                <Line
                  type="monotone"
                  dataKey="baseline_balance"
                  stroke="#fb7185"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3, fill: '#fb7185' }}
                  name="baseline_balance"
                />
                <Area
                  type="monotone"
                  dataKey="simulated_balance"
                  stroke="#34d399"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#simGrad)"
                  name="simulated_balance"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Demo Takeaway Box */}
        <div className="p-5 rounded-2xl bg-indigo-950/40 border border-indigo-500/20 text-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <Sparkles size={20} />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Buildathon Demo Moment</h4>
              <p className="text-slate-300 mt-0.5">
                Razorpay transaction telemetry computed a liquidity gap of ₹{baselineRisk?.first_breach?.liquidity_gap?.toLocaleString('en-IN') || 0}. The simulation recomputes the forecast after adding ₹{advanceAmount.toLocaleString('en-IN')} to the starting balance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
