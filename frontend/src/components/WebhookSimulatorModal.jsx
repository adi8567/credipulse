import React, { useState } from 'react';
import {
  Send,
  Radio,
  CheckCircle2,
  X,
  CreditCard,
  QrCode,
  Building,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { simulateIncomingPayment } from '../utils/api';

export default function WebhookSimulatorModal({ isOpen, onClose, onPaymentSimulated }) {
  const [amount, setAmount] = useState(12500);
  const [method, setMethod] = useState('upi');
  const [eventType, setEventType] = useState('payment.captured');
  const [description, setDescription] = useState('Store Payment (Customer Checkout)');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [simulatedLogs, setSimulatedLogs] = useState([]);

  if (!isOpen) return null;

  const handleTriggerWebhook = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        amount: Number(amount),
        method,
        description: `${description} #${Math.floor(1000 + Math.random() * 9000)}`,
      };

      const res = await simulateIncomingPayment(payload);

      const logEntry = {
        id: res.transaction_id || `tx_${Date.now()}`,
        time: new Date().toLocaleTimeString(),
        amount: Number(amount),
        method,
        event: eventType,
        risk: res.new_risk?.overall_risk || 'CALCULATED',
      };

      setSimulatedLogs((prev) => [logEntry, ...prev.slice(0, 4)]);
      if (onPaymentSimulated) onPaymentSimulated();
    } catch (err) {
      console.error('Webhook trigger failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-navy-900 border border-indigo-500/30 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="p-4 px-6 border-b border-slate-800 flex items-center justify-between bg-navy-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Zap size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Razorpay Webhook Event Simulator</h3>
              <p className="text-[11px] text-slate-400">Emulate real-time merchant events over Server-Sent Events</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleTriggerWebhook} className="p-6 space-y-4 text-xs">
          {/* Event Type */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Webhook Event Type</label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="w-full bg-navy-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500 text-xs"
            >
              <option value="payment.captured">payment.captured (Instant Credit)</option>
              <option value="settlement.processed">settlement.processed (Batch Payout)</option>
              <option value="order.paid">order.paid (Merchant Store Sale)</option>
            </select>
          </div>

          {/* Amount & Method */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Amount (INR)</label>
              <input
                type="number"
                min="500"
                max="100000"
                step="500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-navy-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500 font-mono text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Payment Method</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full bg-navy-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500 text-xs uppercase"
              >
                <option value="upi">UPI (Instant)</option>
                <option value="card">Credit / Debit Card</option>
                <option value="netbanking">Netbanking</option>
                <option value="wallet">Wallet</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Item / Invoice Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-navy-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500 text-xs"
              required
            />
          </div>

          {/* Trigger Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-mint-500 hover:from-indigo-600 hover:to-mint-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 disabled:opacity-50 cursor-pointer transition-all"
            >
              <Send size={14} className={isSubmitting ? 'animate-spin' : ''} />
              <span>{isSubmitting ? 'Emitting Webhook...' : `Dispatch Webhook (+₹${Number(amount).toLocaleString('en-IN')})`}</span>
            </button>
          </div>

          {/* Recent Simulator Log */}
          {simulatedLogs.length > 0 && (
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Live Dispatched Events
              </span>
              {simulatedLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-2 rounded-lg bg-navy-950/80 border border-slate-800/80 flex items-center justify-between text-[11px]"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-mint-400 animate-ping" />
                    <span className="font-mono text-slate-300">{log.event}</span>
                    <span className="text-slate-500">({log.method.toUpperCase()})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-mint-400">+₹{log.amount.toLocaleString('en-IN')}</span>
                    <span className="text-slate-500">{log.time}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
