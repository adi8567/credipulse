import React, { useEffect, useState, useRef } from 'react';
import {
  Bot,
  Sparkles,
  Send,
  MessageCircle,
  Lightbulb,
  TrendingDown,
  ShieldCheck,
  RefreshCw,
  Copy,
  Check,
  CornerDownLeft,
  Zap,
} from 'lucide-react';
import Header from '../components/Header';
import { fetchCopilotInsights, sendCopilotMessage } from '../utils/api';
import { useRealtime } from '../hooks/useRealtime';

const SUGGESTED_PROMPTS = [
  'What drives my forecast range?',
  'Can I afford a ₹25,000 inventory order this week?',
  'What working capital advance covers the computed gap?',
  'How do my settlement delays affect my cash flow?',
];

export default function AICopilot() {
  const [insights, setInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(true);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        'Hello! I am **CreditPulse Copilot**, your real-time financial copilot. I analyze your live Razorpay payment records, settlement timings, and upcoming supplier commitments to give you accurate, data-backed cash flow advice. How can I help you today?',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [copiedSection, setCopiedSection] = useState(null);
  const chatBottomRef = useRef(null);

  const loadInsights = async () => {
    try {
      setLoadingInsights(true);
      const data = await fetchCopilotInsights();
      setInsights(data);
    } catch (err) {
      console.error('Error fetching copilot insights:', err);
    } finally {
      setLoadingInsights(false);
    }
  };

  useEffect(() => {
    loadInsights();
  }, []);

  useRealtime(() => {
    loadInsights();
  });

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const handleSendMessage = async (userMsg) => {
    const text = userMsg || inputValue;
    if (!text.trim() || isSending) return;

    const newHistory = [...messages, { role: 'user', content: text }];
    setMessages(newHistory);
    setInputValue('');
    setIsSending(true);

    try {
      const response = await sendCopilotMessage(text, messages);
      setMessages([...newHistory, { role: 'assistant', content: response.reply }]);
    } catch (err) {
      setMessages([
        ...newHistory,
        {
          role: 'assistant',
          content: '⚠️ I encountered an issue analyzing your transaction telemetry. Please try again.',
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const copyToClipboard = (text, section) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  return (
    <div className="min-h-screen pb-12 flex flex-col">
      <Header
        onRefresh={loadInsights}
        title="AI Merchant Copilot"
        subtitle="Conversational financial intelligence grounded strictly in verified Razorpay transaction data"
      />

      <div className="p-8 space-y-8 flex-1">
        {/* Hard Constraint Badge */}
        <div className="flex items-center justify-between p-3 px-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs">
          <div className="flex items-center gap-2 text-indigo-300">
            <ShieldCheck size={16} className="text-mint-400" />
            <span>
              <strong>Guaranteed Grounded Context:</strong> The Copilot reasons strictly over calculated Razorpay balances, settlement lags, and predicted cash trajectories.
            </span>
          </div>
          <button
            onClick={loadInsights}
            disabled={loadingInsights}
            className="text-xs text-indigo-400 hover:text-indigo-200 flex items-center gap-1 cursor-pointer font-medium"
          >
            <RefreshCw size={12} className={loadingInsights ? 'animate-spin' : ''} />
            <span>Refresh Diagnostics</span>
          </button>
        </div>

        {/* 3 Structured Insights Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 1. What is Happening */}
          <div className="glass-card p-5 flex flex-col justify-between border-rose-500/20 relative group">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/15 text-rose-400 flex items-center justify-center">
                    <TrendingDown size={16} />
                  </div>
                  <h3 className="text-sm font-bold text-white">What is Happening</h3>
                </div>
                <button
                  onClick={() => copyToClipboard(insights?.what_is_happening, 'what')}
                  className="text-slate-400 hover:text-white p-1 rounded transition-colors"
                >
                  {copiedSection === 'what' ? <Check size={14} className="text-mint-400" /> : <Copy size={14} />}
                </button>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed min-h-[85px]">
                {loadingInsights ? (
                  <span className="animate-pulse">Synthesizing telemetry data...</span>
                ) : (
                  insights?.what_is_happening ||
                  'No computed insight is available yet. Connect and sync Razorpay Test Mode data first.'
                )}
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-800 text-[11px] text-rose-300 font-medium">
              Current Risk: {insights?.context?.risk?.level || 'HIGH_RISK'}
            </div>
          </div>

          {/* 2. Why it is Happening */}
          <div className="glass-card p-5 flex flex-col justify-between border-amber-500/20 relative group">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center">
                    <Lightbulb size={16} />
                  </div>
                  <h3 className="text-sm font-bold text-white">Why it is Happening</h3>
                </div>
                <button
                  onClick={() => copyToClipboard(insights?.why_it_is_happening, 'why')}
                  className="text-slate-400 hover:text-white p-1 rounded transition-colors"
                >
                  {copiedSection === 'why' ? <Check size={14} className="text-mint-400" /> : <Copy size={14} />}
                </button>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed min-h-[85px]">
                {loadingInsights ? (
                  <span className="animate-pulse">Analyzing root cause drivers...</span>
                ) : (
                  insights?.why_it_is_happening ||
                  'CreditPulse will not explain missing data using demo assumptions.'
                )}
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-800 text-[11px] text-amber-300 font-medium">
              Driver: Weekly Outflow Timing
            </div>
          </div>

          {/* 3. What You Can Do */}
          <div className="glass-card p-5 flex flex-col justify-between border-mint-500/20 relative group">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-mint-500/15 text-mint-400 flex items-center justify-center">
                    <Sparkles size={16} />
                  </div>
                  <h3 className="text-sm font-bold text-white">Recommended Action</h3>
                </div>
                <button
                  onClick={() => copyToClipboard(insights?.what_to_do, 'action')}
                  className="text-slate-400 hover:text-white p-1 rounded transition-colors"
                >
                  {copiedSection === 'action' ? <Check size={14} className="text-mint-400" /> : <Copy size={14} />}
                </button>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed min-h-[85px]">
                {loadingInsights ? (
                  <span className="animate-pulse">Generating actionable playbook...</span>
                ) : (
                  insights?.what_to_do ||
                  'Create and pay real Razorpay test payment links, sync, then re-run the computed forecast.'
                )}
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-800 text-[11px] text-mint-300 font-medium">
              Suggested action is computed after sync
            </div>
          </div>
        </div>

        {/* Ask CreditPulse Interactive Chat Box */}
        <div className="glass-card flex flex-col h-[480px] overflow-hidden">
          <div className="p-4 px-6 border-b border-slate-800 flex items-center justify-between bg-navy-950/60">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <MessageCircle size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Ask CreditPulse</h3>
                <p className="text-[11px] text-slate-400">Ask questions regarding your cash runway, invoices, and working capital</p>
              </div>
            </div>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold bg-mint-500/15 text-mint-300 border border-mint-500/30">
              Active Context
            </span>
          </div>

          {/* Chat Messages Log */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-3 max-w-3xl ${
                  m.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    m.role === 'user'
                      ? 'bg-indigo-600 text-white font-bold text-[11px]'
                      : 'bg-navy-800 border border-indigo-500/30 text-indigo-400'
                  }`}
                >
                  {m.role === 'user' ? 'ME' : <Bot size={14} />}
                </div>
                <div
                  className={`p-3.5 rounded-2xl leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-navy-950/90 text-slate-200 border border-slate-800 rounded-tl-none'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {isSending && (
              <div className="flex gap-3 max-w-3xl mr-auto items-center">
                <div className="w-7 h-7 rounded-lg bg-navy-800 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
                  <Bot size={14} />
                </div>
                <div className="p-3 px-4 rounded-2xl bg-navy-950/90 border border-slate-800 text-slate-400 text-xs flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]" />
                  <span className="text-[11px] ml-1">Analyzing Razorpay telemetry...</span>
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Suggested Prompts Pills */}
          <div className="p-2 px-6 bg-navy-950/40 border-t border-slate-800/60 flex items-center gap-2 overflow-x-auto">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold shrink-0">
              Suggested:
            </span>
            {SUGGESTED_PROMPTS.map((p, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(p)}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-navy-800/80 hover:bg-indigo-600/30 text-slate-300 hover:text-indigo-200 border border-slate-700/60 whitespace-nowrap transition-all cursor-pointer"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Chat Input Field */}
          <div className="p-4 px-6 border-t border-slate-800 bg-navy-950/90 flex items-center gap-3">
            <input
              type="text"
              placeholder="Ask CreditPulse anything about your synced Razorpay cash flow"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={isSending}
              className="flex-1 bg-navy-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || isSending}
              className="p-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-indigo-600/20 cursor-pointer"
            >
              <span>Send</span>
              <Send size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
