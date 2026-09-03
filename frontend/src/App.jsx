import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import ThreeBackground from './components/ThreeBackground';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import CashFlow from './pages/CashFlow';
import RiskAlerts from './pages/RiskAlerts';
import AICopilot from './pages/AICopilot';
import Simulator from './pages/Simulator';

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen overflow-hidden relative" style={{ background: '#050a1f' }}>
        {/* Global Ambient 3D Three.js Background */}
        <ThreeBackground />

        {/* Sidebar Navigation */}
        <Sidebar />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto relative z-10">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/cashflow" element={<CashFlow />} />
            <Route path="/risk" element={<RiskAlerts />} />
            <Route path="/copilot" element={<AICopilot />} />
            <Route path="/simulator" element={<Simulator />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
