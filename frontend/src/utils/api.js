import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fetchHealth = () => api.get('/health').then(r => r.data);
export const fetchBalance = () => api.get('/data/balance').then(r => r.data);
export const fetchTransactions = (params) => api.get('/data/transactions', { params }).then(r => r.data);
export const fetchSettlements = () => api.get('/data/settlements').then(r => r.data);
export const fetchDailySummaries = (days = 90) => api.get('/data/daily-summaries', { params: { days } }).then(r => r.data);
export const fetchRazorpayStatus = () => api.get('/razorpay/status').then(r => r.data);
export const connectRazorpay = (payload) => api.post('/razorpay/connect', payload).then(r => r.data);
export const syncRazorpay = () => api.post('/razorpay/sync').then(r => r.data);
export const createRazorpaySeedLinks = (count = 5) => api.post('/razorpay/seed-payment-links', { count }).then(r => r.data);

export const fetchAnalysisSummary = () => api.get('/analysis/summary').then(r => r.data);
export const fetchHistoricalAnalysis = (days = 90) => api.get('/analysis/historical', { params: { days } }).then(r => r.data);

export const fetchForecast = () => api.get('/forecast').then(r => r.data);

export const fetchRisk = () => api.get('/risk').then(r => r.data);
export const updateSafetyBuffer = (safety_buffer) => api.post('/risk/buffer', { safety_buffer }).then(r => r.data);

export const fetchCopilotInsights = () => api.get('/copilot/insights').then(r => r.data);
export const sendCopilotMessage = (message, history = []) => api.post('/copilot/chat', { message, history }).then(r => r.data);

export const runSimulation = (advance_amount) => api.post('/simulator/simulate', { advance_amount }).then(r => r.data);

export const simulateIncomingPayment = (payload) => api.post('/webhooks/simulate-incoming', payload).then(r => r.data);
export const resetDemoData = () => api.post('/webhooks/reset-demo').then(r => r.data);

export default api;
