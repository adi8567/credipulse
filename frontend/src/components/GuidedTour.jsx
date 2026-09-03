import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  Play,
  CheckCircle2,
  Layers,
  Bot,
  Wallet,
  ShieldAlert,
  Zap,
} from 'lucide-react';

const TOUR_STEPS = [
  {
    step: 1,
    title: '1. Ingest Razorpay Telemetry',
    path: '/',
    badge: 'Dashboard',
    icon: Layers,
    description:
      'CreditPulse connects directly to Razorpay Payments & Settlement APIs to ingest daily customer payments, capture settlement turnaround, and compute available working capital in real-time.',
    keyMetric: 'Available Balance: ₹28,500 | Safety Buffer: ₹15,000',
  },
  {
    step: 2,
    title: '2. Detect Thursday Liquidity Risk',
    path: '/risk',
    badge: 'Risk Alerts',
    icon: ShieldAlert,
    description:
      'The forecasting engine models 14-day cash trajectories using EWMA + day-of-week seasonality. It flags a critical shortfall on Thursday where balance falls to ₹11,702 (breaching the ₹15,000 threshold).',
    keyMetric: 'Deficit Gap: ₹2,963 | Status: HIGH RISK',
  },
  {
    step: 3,
    title: '3. AI Grounded Diagnosis',
    path: '/copilot',
    badge: 'AI Copilot',
    icon: Bot,
    description:
      'The AI Copilot diagnoses why the shortfall happens: heavy Thursday supplier disbursements combined with a T+2 settlement lag. It formulates a concrete working capital recommendation with 0 hallucinations.',
    keyMetric: 'Root Cause: Outflow Timing + Settlement Delay',
  },
  {
    step: 4,
    title: '4. Simulate Working Capital Advance',
    path: '/simulator',
    badge: 'WC Simulator',
    icon: Wallet,
    description:
      'The merchant tests a ₹20,000 working capital injection. The dual-series comparative forecast immediately verifies that the minimum projected balance rises to ₹31,702, completely neutralizing the crisis!',
    keyMetric: 'HIGH RISK ➔ HEALTHY (100% Resolved)',
  },
  {
    step: 5,
    title: '5. Real-Time Webhook Pipeline',
    path: '/',
    badge: 'Live Stream',
    icon: Zap,
    description:
      'Whenever new Razorpay payments are captured or webhooks arrive, CreditPulse dynamically updates the database and pushes recalculations to the UI via Server-Sent Events (SSE) instantly.',
    keyMetric: 'Zero Manual Refresh | Sub-second Reactivity',
  },
];

export default function GuidedTour({ isOpen, onClose }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const navigate = useNavigate();

  if (!isOpen) return null;

  const current = TOUR_STEPS[currentStepIndex];
  const Icon = current.icon;

  const handleGoToStep = (index) => {
    setCurrentStepIndex(index);
    navigate(TOUR_STEPS[index].path);
  };

  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      handleGoToStep(currentStepIndex + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      handleGoToStep(currentStepIndex - 1);
    }
  };

  return (
    <div className="fixed bottom-6 right-8 z-50 w-96 bg-navy-900/95 border-2 border-indigo-500/40 rounded-2xl p-5 shadow-2xl backdrop-blur-xl animate-fade-in text-xs">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-mint-500 flex items-center justify-center text-white">
            <Sparkles size={14} />
          </div>
          <div>
            <h4 className="font-bold text-white text-xs">Buildathon Demo Guide</h4>
            <span className="text-[10px] text-indigo-400">Step {current.step} of {TOUR_STEPS.length}</span>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
          <X size={16} />
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Icon size={16} className="text-mint-400" />
          <h5 className="font-bold text-white text-sm">{current.title}</h5>
        </div>

        <p className="text-slate-300 leading-relaxed text-[11px]">
          {current.description}
        </p>

        <div className="p-2.5 rounded-xl bg-navy-950/80 border border-indigo-500/20 text-indigo-300 font-semibold text-[11px]">
          🎯 {current.keyMetric}
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800">
        <button
          onClick={handlePrev}
          disabled={currentStepIndex === 0}
          className="px-2.5 py-1.5 rounded-lg bg-navy-800 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer flex items-center gap-1 text-[11px]"
        >
          <ChevronLeft size={13} /> Back
        </button>

        <div className="flex gap-1">
          {TOUR_STEPS.map((_, i) => (
            <span
              key={i}
              onClick={() => handleGoToStep(i)}
              className={`w-2 h-2 rounded-full cursor-pointer transition-all ${
                i === currentStepIndex ? 'bg-indigo-400 w-4' : 'bg-slate-700 hover:bg-slate-500'
              }`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold cursor-pointer flex items-center gap-1 text-[11px] shadow-md shadow-indigo-600/30"
        >
          <span>{currentStepIndex === TOUR_STEPS.length - 1 ? 'Finish Tour' : 'Next Step'}</span>
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}
