import express from 'express';
import { refreshCache } from '../services/agentService.js';
import { autenticar, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.post('/refresh-agents', autenticar, requireAdmin, async (req, res) => {
  try {
    const updated = await refreshCache();
    res.json({ success: true, total: Object.keys(updated).length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
