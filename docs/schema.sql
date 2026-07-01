-- ============================================
-- Valorant Tourney Platform - Database Schema
-- ============================================

CREATE DATABASE IF NOT EXISTS valorant_tourney;
USE valorant_tourney;

-- ---------- USUÁRIOS ----------
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    riot_id VARCHAR(100),         -- ex: "Gustavin#BR1"
    tipo ENUM('jogador', 'organizador', 'admin') DEFAULT 'jogador',
    avatar_url VARCHAR(255),
    banner_preset TINYINT DEFAULT 0,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ---------- TIMES ----------
CREATE TABLE times (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    tag VARCHAR(10),               -- ex: "GVB"
    logo_url VARCHAR(255),
    capitao_id INT NOT NULL,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (capitao_id) REFERENCES usuarios(id)
);

CREATE TABLE membros_time (
    id INT AUTO_INCREMENT PRIMARY KEY,
    time_id INT NOT NULL,
    usuario_id INT NOT NULL,
    funcao ENUM('titular', 'reserva') DEFAULT 'titular',
    entrou_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (time_id) REFERENCES times(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    UNIQUE KEY unico_membro (time_id, usuario_id)
);

-- ---------- TORNEIOS ----------
CREATE TABLE torneios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    descricao TEXT,
    formato ENUM('eliminacao_simples', 'eliminacao_dupla', 'pontos_corridos') DEFAULT 'eliminacao_simples',
    max_times INT DEFAULT 8,
    organizador_id INT NOT NULL,
    status ENUM('inscricoes_abertas', 'em_andamento', 'finalizado', 'cancelado') DEFAULT 'inscricoes_abertas',
    data_inicio DATETIME,
    data_fim DATETIME,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organizador_id) REFERENCES usuarios(id)
);

CREATE TABLE inscricoes_torneio (
    id INT AUTO_INCREMENT PRIMARY KEY,
    torneio_id INT NOT NULL,
    time_id INT NOT NULL,
    status ENUM('pendente', 'aprovada', 'rejeitada') DEFAULT 'pendente',
    inscrito_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (torneio_id) REFERENCES torneios(id) ON DELETE CASCADE,
    FOREIGN KEY (time_id) REFERENCES times(id) ON DELETE CASCADE,
    UNIQUE KEY unica_inscricao (torneio_id, time_id)
);

-- ---------- PARTIDAS ----------
CREATE TABLE partidas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    torneio_id INT NOT NULL,
    fase VARCHAR(50),              -- ex: "Quartas de final", "Final"
    time_a_id INT NOT NULL,
    time_b_id INT NOT NULL,
    mapa VARCHAR(50),
    placar_a INT DEFAULT 0,
    placar_b INT DEFAULT 0,
    vencedor_id INT,
    status ENUM('agendada', 'em_andamento', 'finalizada') DEFAULT 'agendada',
    data_partida DATETIME,
    FOREIGN KEY (torneio_id) REFERENCES torneios(id) ON DELETE CASCADE,
    FOREIGN KEY (time_a_id) REFERENCES times(id),
    FOREIGN KEY (time_b_id) REFERENCES times(id),
    FOREIGN KEY (vencedor_id) REFERENCES times(id)
);

-- ---------- STATS (puxado da API externa de Valorant) ----------
CREATE TABLE stats_jogador (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    rank_atual VARCHAR(50),
    kd_ratio DECIMAL(4,2),
    win_rate DECIMAL(5,2),
    headshot_pct DECIMAL(5,2),
    partidas_analisadas INT,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Índices úteis para queries frequentes
CREATE INDEX idx_torneio_status ON torneios(status);
CREATE INDEX idx_partida_torneio ON partidas(torneio_id);
CREATE INDEX idx_stats_usuario ON stats_jogador(usuario_id);
