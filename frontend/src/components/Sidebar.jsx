import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  ArrowLeftRight,
  TrendingUp,
  ShieldAlert,
  Bot,
  Wallet,
  Zap,
  Activity
} from 'lucide-react'

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { path: '/cashflow', label: 'Cash Flow', icon: TrendingUp },
  { path: '/risk', label: 'Risk Alerts', icon: ShieldAlert },
  { path: '/copilot', label: 'AI Copilot', icon: Bot },
  { path: '/simulator', label: 'WC Simulator', icon: Wallet },
]

export default function Sidebar() {
  const location = useLocation()

  return (
    <aside
      className="w-64 flex-shrink-0 flex flex-col border-r"
      style={{
        background: 'rgba(10, 22, 40, 0.95)',
        borderColor: 'rgba(99, 102, 241, 0.15)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Logo */}
      <div className="px-6 py-6 border-b" style={{ borderColor: 'rgba(99, 102, 241, 0.15)' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6366f1, #34d399)' }}
          >
            <Activity size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-none">CreditPulse</h1>
            <p className="text-xs mt-0.5" style={{ color: '#818cf8' }}>Cash Intelligence</p>
          </div>
        </div>

        {/* Demo Mode Badge */}
        <div
          className="mt-4 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{ background: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.2)', color: '#34d399' }}
        >
          <Zap size={11} />
          <span>Demo Mode Active</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="px-3 py-2 text-xs font-semibold uppercase tracking-widest" style={{ color: '#1a3360' }}>
          Navigation
        </p>
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(path)

          return (
            <NavLink
              key={path}
              to={path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive ? 'nav-item-active' : 'hover:bg-white/5'
              }`}
              style={{
                color: isActive ? '#a5b4fc' : '#64748b',
              }}
            >
              <Icon
                size={18}
                className="transition-colors duration-200"
                style={{ color: isActive ? '#6366f1' : '#475569' }}
              />
              {label}
              {path === '/risk' && (
                <span
                  className="ml-auto text-xs px-1.5 py-0.5 rounded-full font-semibold"
                  style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#fb7185' }}
                >
                  1
                </span>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Merchant info */}
      <div
        className="px-4 py-4 border-t"
        style={{ borderColor: 'rgba(99, 102, 241, 0.15)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
            style={{ background: 'linear-gradient(135deg, #6366f1, #818cf8)', color: '#fff' }}
          >
            PS
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">Connected Merchant</p>
            <p className="text-xs truncate" style={{ color: '#475569' }}>Razorpay Test Mode</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
