import React, { useEffect, useState } from 'react';
import { Check, Link2, RefreshCw, Radio, KeyRound, ExternalLink } from 'lucide-react';
import { connectRazorpay, createRazorpaySeedLinks, fetchRazorpayStatus, syncRazorpay } from '../utils/api';

export default function Header({ onRefresh, title, subtitle }) {
  const [loadingAction, setLoadingAction] = useState(false);
  const [notification, setNotification] = useState(null);
  const [status, setStatus] = useState(null);
  const [links, setLinks] = useState([]);
  const [form, setForm] = useState({ key_id: '', key_secret: '', merchant_name: '' });

  const showToast = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const refreshStatus = async () => {
    try {
      setStatus(await fetchRazorpayStatus());
    } catch (err) {
      setStatus({ connected: false, sync_error: err.message });
    }
  };

  useEffect(() => {
    refreshStatus();
  }, []);

  const handleConnect = async (event) => {
    event.preventDefault();
    try {
      setLoadingAction(true);
      const next = await connectRazorpay(form);
      setStatus(next);
      setForm({ key_id: '', key_secret: '', merchant_name: '' });
      showToast('Razorpay Test Mode connected.');
      if (onRefresh) onRefresh();
    } catch (err) {
      showToast(err.response?.data?.error || err.message, 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleSync = async () => {
    try {
      setLoadingAction(true);
      const result = await syncRazorpay();
      showToast(`Synced ${result.payments} payments, ${result.orders} orders, ${result.settlements} settlements.`);
      await refreshStatus();
      if (onRefresh) onRefresh();
    } catch (err) {
      showToast(err.response?.data?.error || err.message, 'error');
      await refreshStatus();
    } finally {
      setLoadingAction(false);
    }
  };

  const handleSeedLinks = async () => {
    try {
      setLoadingAction(true);
      const result = await createRazorpaySeedLinks(5);
      setLinks(result.links || []);
      showToast('Created real Razorpay test payment links.');
    } catch (err) {
      showToast(err.response?.data?.error || err.message, 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <header className="border-b border-indigo-500/10 bg-navy-900/70 backdrop-blur-xl px-8 py-3.5 sticky top-0 z-30 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
            {title || 'Merchant Intelligence'}
            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Source: Razorpay Test Mode
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {subtitle || 'Predictive liquidity analytics from synced Razorpay data'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {notification && (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border animate-pulse ${
              notification.type === 'error'
                ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                : 'bg-mint-500/15 text-mint-300 border-mint-500/30'
            }`}>
              <Check size={14} />
              <span>{notification.msg}</span>
            </div>
          )}

          <button
            onClick={handleSeedLinks}
            disabled={!status?.connected || loadingAction}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-navy-800 hover:bg-navy-700 text-indigo-300 border border-indigo-500/30 disabled:opacity-50 transition-all cursor-pointer"
            title="Create real Razorpay Test Mode payment links"
          >
            <Link2 size={14} />
            <span>Create Test Links</span>
          </button>

          <button
            onClick={handleSync}
            disabled={!status?.connected || loadingAction}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/20 border border-indigo-400/30 disabled:opacity-50 cursor-pointer"
            title="Pull Orders, Payments, and Settlements from Razorpay"
          >
            <RefreshCw size={14} className={loadingAction ? 'animate-spin' : ''} />
            <span>Sync Razorpay</span>
          </button>

          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-medium bg-navy-950/80 border border-slate-800 text-slate-300">
            <Radio size={12} className={status?.connected ? 'text-mint-400' : 'text-amber-400'} />
            <span>{status?.connected ? 'Connected' : 'Not connected'}</span>
          </div>
        </div>
      </div>

      {!status?.connected && (
        <form onSubmit={handleConnect} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-2 text-xs">
          <input className="bg-navy-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none" placeholder="Razorpay Test Key ID" value={form.key_id} onChange={(e) => setForm({ ...form, key_id: e.target.value })} />
          <input className="bg-navy-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none" placeholder="Razorpay Test Key Secret" type="password" value={form.key_secret} onChange={(e) => setForm({ ...form, key_secret: e.target.value })} />
          <input className="bg-navy-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none" placeholder="Merchant name" value={form.merchant_name} onChange={(e) => setForm({ ...form, merchant_name: e.target.value })} />
          <button disabled={loadingAction} className="px-3 py-2 rounded-xl bg-mint-600 hover:bg-mint-500 text-white font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50">
            <KeyRound size={14} />
            Connect
          </button>
        </form>
      )}

      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
        <span>Last synced: {status?.last_synced_at ? new Date(status.last_synced_at).toLocaleString('en-IN') : 'Never'}</span>
        {status?.sync_error && <span className="text-rose-300">Razorpay error: {status.sync_error}</span>}
        {links.map((link) => (
          <a key={link.id} href={link.short_url} target="_blank" rel="noreferrer" className="text-indigo-300 hover:text-indigo-200 inline-flex items-center gap-1">
            Pay INR {link.amount.toLocaleString('en-IN')} <ExternalLink size={11} />
          </a>
        ))}
      </div>
    </header>
  );
}
