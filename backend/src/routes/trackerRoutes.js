import { Router } from 'express';
import { buscarTracker } from '../controllers/trackerController.js';

const router = Router();

router.get('/:nome/:tag', buscarTracker);

export default router;
