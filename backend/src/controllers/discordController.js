import { pool } from '../config/database.js';
import axios from 'axios';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// /api/discord/auth
export const redirectToDiscord = (req, res) => {
    // The user needs to pass their JWT token so we know who is linking
    // But OAuth redirects don't easily send headers. 
    // We can pass the user ID or JWT in the "state" parameter!
    const { token } = req.query;
    if (!token) return res.status(401).json({ erro: 'Token não fornecido' });

    const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
    const REDIRECT_URI = encodeURIComponent(process.env.DISCORD_REDIRECT_URI);
    
    // We request the "identify" scope (for discord_id) and "connections" scope (for Riot ID)
    const scope = encodeURIComponent('identify connections');
    
    const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=${scope}&state=${token}`;
    
    res.redirect(authUrl);
};

// /api/discord/callback
export const handleDiscordCallback = async (req, res) => {
    const { code, state: token } = req.query;

    if (!code || !token) {
        return res.redirect(`${FRONTEND_URL}/perfil?erro=discord_oauth_failed`);
    }

    try {
        // 1. Verify who the user is using the state token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        // 2. Exchange code for Discord Access Token
        const params = new URLSearchParams({
            client_id: process.env.DISCORD_CLIENT_ID,
            client_secret: process.env.DISCORD_CLIENT_SECRET,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: process.env.DISCORD_REDIRECT_URI
        });

        const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', params.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const accessToken = tokenResponse.data.access_token;

        // 3. Get Discord User ID
        const userResponse = await axios.get('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        const discordId = userResponse.data.id;

        // 4. Check if this discord is already linked to another user
        const [existing] = await pool.query('SELECT id FROM usuarios WHERE discord_id = ? AND id != ?', [discordId, userId]);
        if (existing.length > 0) {
            return res.redirect(`${FRONTEND_URL}/perfil?erro=discord_already_linked`);
        }

        // 5. Get Discord Connections to find Riot Games
        const connectionsResponse = await axios.get('https://discord.com/api/users/@me/connections', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        const connections = connectionsResponse.data;
        const riotConnection = connections.find(c => c.type === 'riotgames');

        if (!riotConnection) {
            // User doesn't have Riot Games connected to Discord
            // We still save the discord_id so they are linked, but riot is unverified
            await pool.query('UPDATE usuarios SET discord_id = ? WHERE id = ?', [discordId, userId]);
            return res.redirect(`${FRONTEND_URL}/perfil?erro=no_riot_connection`);
        }

        // 6. Save Riot ID and mark as verified!
        const riotId = riotConnection.name; // e.g., "Gustavin#BR1"
        
        // Ensure no one else has this Riot ID to prevent theft across platforms
        const [riotTaken] = await pool.query('SELECT id FROM usuarios WHERE riot_id = ? AND id != ?', [riotId, userId]);
        if (riotTaken.length > 0) {
            return res.redirect(`${FRONTEND_URL}/perfil?erro=riot_id_taken`);
        }

        await pool.query(
            'UPDATE usuarios SET discord_id = ?, riot_id = ?, riot_id_verified = 1 WHERE id = ?',
            [discordId, riotId, userId]
        );

        // Success!
        res.redirect(`${FRONTEND_URL}/perfil?success=discord_linked`);

    } catch (err) {
        console.error('Erro no callback do Discord:', err.message);
        if (err.response) {
            console.error(err.response.data);
        }
        res.redirect(`${FRONTEND_URL}/perfil?erro=discord_server_error`);
    }
};
