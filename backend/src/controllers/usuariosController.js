import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database.js';
import { fetchAccount } from '../services/valorantApiService.js';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRA_EM = '7d';

// POST /api/usuarios/cadastro
export async function cadastrarUsuario(req, res) {
    try {
        const { nome, email, senha, riot_id } = req.body;

        // Verifica se já existe usuário com esse email
        const [existentes] = await pool.query('SELECT id FROM usuarios WHERE email = ?', [email]);
        if (existentes.length > 0) {
            return res.status(409).json({ erro: 'Já existe um usuário com esse email' });
        }

        const senha_hash = await bcrypt.hash(senha, 10);

        const [resultado] = await pool.query(
            `INSERT INTO usuarios (nome, email, senha_hash, riot_id, tipo) VALUES (?, ?, ?, ?, ?)`,
            [nome, email, senha_hash, riot_id || null, 'jogador']
        );

        const token = jwt.sign(
            { id: resultado.insertId, email, nome, tipo: 'jogador' },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRA_EM }
        );

        res.status(201).json({
            mensagem: 'Usuário cadastrado com sucesso',
            usuario: { id: resultado.insertId, nome, email, riot_id: riot_id || null, tipo: 'jogador' },
            token
        });
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao cadastrar usuário', detalhe: err.message });
    }
}

// POST /api/usuarios/login
export async function loginUsuario(req, res) {
    try {
        const { email, senha } = req.body;

        const [rows] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.status(401).json({ erro: 'Email ou senha inválidos' });
        }

        const usuario = rows[0];
        const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash);

        if (!senhaCorreta) {
            return res.status(401).json({ erro: 'Email ou senha inválidos' });
        }

        const token = jwt.sign({ id: usuario.id, email: usuario.email, nome: usuario.nome, tipo: usuario.tipo }, JWT_SECRET, { expiresIn: JWT_EXPIRA_EM });

        res.json({
            mensagem: 'Login realizado com sucesso',
            usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, riot_id: usuario.riot_id, tipo: usuario.tipo, avatar_url: usuario.avatar_url, banner_preset: usuario.banner_preset, riot_id_verified: !!usuario.riot_id_verified, discord_id: usuario.discord_id },
            token
        });
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao fazer login', detalhe: err.message });
    }
}

// GET /api/usuarios/me  (rota protegida — usa req.usuario setado pelo middleware de auth)
export async function buscarPerfil(req, res) {
    try {
        const [rows] = await pool.query(
            'SELECT id, nome, email, riot_id, tipo, avatar_url, banner_preset, riot_id_verified, discord_id, criado_em FROM usuarios WHERE id = ?',
            [req.usuario.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ erro: 'Usuário não encontrado' });
        }
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao buscar perfil', detalhe: err.message });
    }
}

// PUT /api/usuarios/me  (atualizar o próprio perfil)
export async function atualizarPerfil(req, res) {
    try {
        const { nome, riot_id, avatar_url, banner_preset } = req.body;

        await pool.query(
            `UPDATE usuarios
             SET nome = COALESCE(?, nome),
                 riot_id = COALESCE(?, riot_id),
                 avatar_url = COALESCE(?, avatar_url),
                 banner_preset = COALESCE(?, banner_preset)
             WHERE id = ?`,
            [nome, riot_id, avatar_url, banner_preset, req.usuario.id]
        );

        res.json({ mensagem: 'Perfil atualizado com sucesso' });
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao atualizar perfil', detalhe: err.message });
    }
}

// POST /api/usuarios/me/verificar-riot
export async function verificarRiotID(req, res) {
    try {
        const [rows] = await pool.query('SELECT riot_id, riot_id_verified FROM usuarios WHERE id = ?', [req.usuario.id]);
        if (rows.length === 0) return res.status(404).json({ erro: 'Usuário não encontrado' });
        
        const usuario = rows[0];
        if (!usuario.riot_id) return res.status(400).json({ erro: 'Nenhum Riot ID cadastrado' });
        if (usuario.riot_id_verified) return res.json({ mensagem: 'Riot ID já está verificado' });

        const [nome, tag] = usuario.riot_id.split('#');
        if (!nome || !tag) return res.status(400).json({ erro: 'Riot ID inválido' });

        // Chama a API ignorando o cache
        const data = await fetchAccount(nome, tag, true);
        
        // UUID do "VALORANT Card"
        const VERIFY_CARD_UUID = '9fb348bc-41a0-91ad-8a3e-818035c4e561';

        if (data?.card?.id === VERIFY_CARD_UUID) {
            await pool.query('UPDATE usuarios SET riot_id_verified = 1 WHERE id = ?', [req.usuario.id]);
            return res.json({ mensagem: 'Conta verificada com sucesso!' });
        } else {
            return res.status(400).json({ 
                erro: 'Cartão Incorreto', 
                detalhe: `O card equipado na conta não é o 'VALORANT Card'. A API detectou que o card equipado é: ${data?.card?.id}. Equipe o card correto e aguarde uns segundos.`
            });
        }
    } catch (err) {
        return res.status(500).json({ erro: 'Erro ao verificar conta na Riot Games', detalhe: err.response?.data?.errors?.[0]?.message || err.message });
    }
}
