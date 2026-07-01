import express from 'express';
import { refreshCache } from '../services/agentService.js';

const router = express.Router();

// TODO: Add requireAdmin middleware if implemented in the future
router.post('/refresh-agents', async (req, res) => {
  try {
    const updated = await refreshCache();
    res.json({ success: true, total: Object.keys(updated).length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
