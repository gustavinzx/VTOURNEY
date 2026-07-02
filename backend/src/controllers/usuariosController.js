import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database.js';

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
            { id: resultado.insertId, email, tipo: 'jogador' },
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

        const token = jwt.sign({ id: usuario.id, email: usuario.email, tipo: usuario.tipo }, JWT_SECRET, { expiresIn: JWT_EXPIRA_EM });

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
