import express from 'express';
import { redirectToDiscord, handleDiscordCallback } from '../controllers/discordController.js';

const router = express.Router();

router.get('/auth', redirectToDiscord);
router.get('/callback', handleDiscordCallback);

export default router;
