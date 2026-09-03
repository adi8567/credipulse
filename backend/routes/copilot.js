const express = require('express');
const router = express.Router();
const { generateInsights, getChatResponse, buildContext } = require('../services/aiService');

// GET /api/copilot/insights
router.get('/insights', async (req, res) => {
  try {
    const insights = await generateInsights();
    res.json(insights);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/copilot/context
router.get('/context', (req, res) => {
  try {
    const context = buildContext();
    res.json(context);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/copilot/chat
router.post('/chat', async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }
    const response = await getChatResponse(message, history);
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
