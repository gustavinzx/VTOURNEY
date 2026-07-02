-- VTourney Database Schema

CREATE TABLE "inscricoes_torneio" (
  "id" int NOT NULL AUTO_INCREMENT,
  "torneio_id" int NOT NULL,
  "time_id" int NOT NULL,
  "status" enum('pendente','aprovada','rejeitada') DEFAULT 'pendente',
  "inscrito_em" datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  UNIQUE KEY "unica_inscricao" ("torneio_id","time_id"),
  KEY "time_id" ("time_id"),
  CONSTRAINT "inscricoes_torneio_ibfk_1" FOREIGN KEY ("torneio_id") REFERENCES "torneios" ("id") ON DELETE CASCADE,
  CONSTRAINT "inscricoes_torneio_ibfk_2" FOREIGN KEY ("time_id") REFERENCES "times" ("id") ON DELETE CASCADE
);

CREATE TABLE "membros_time" (
  "id" int NOT NULL AUTO_INCREMENT,
  "time_id" int NOT NULL,
  "usuario_id" int NOT NULL,
  "funcao" enum('titular','reserva') DEFAULT 'titular',
  "entrou_em" datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  UNIQUE KEY "unico_membro" ("time_id","usuario_id"),
  KEY "usuario_id" ("usuario_id"),
  CONSTRAINT "membros_time_ibfk_1" FOREIGN KEY ("time_id") REFERENCES "times" ("id") ON DELETE CASCADE,
  CONSTRAINT "membros_time_ibfk_2" FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id") ON DELETE CASCADE
);

CREATE TABLE "partida_mensagens" (
  "id" int NOT NULL AUTO_INCREMENT,
  "partida_id" int NOT NULL,
  "usuario_id" int NOT NULL,
  "usuario_nome" varchar(100) NOT NULL,
  "mensagem" text NOT NULL,
  "criado_em" timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  KEY "partida_id" ("partida_id"),
  KEY "usuario_id" ("usuario_id"),
  CONSTRAINT "partida_mensagens_ibfk_1" FOREIGN KEY ("partida_id") REFERENCES "partidas" ("id") ON DELETE CASCADE,
  CONSTRAINT "partida_mensagens_ibfk_2" FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id") ON DELETE CASCADE
);

CREATE TABLE "partidas" (
  "id" int NOT NULL AUTO_INCREMENT,
  "torneio_id" int NOT NULL,
  "fase" varchar(50) DEFAULT NULL,
  "time_a_id" int NOT NULL,
  "time_b_id" int NOT NULL,
  "mapa" varchar(50) DEFAULT NULL,
  "placar_a" int DEFAULT '0',
  "placar_b" int DEFAULT '0',
  "vencedor_id" int DEFAULT NULL,
  "status" enum('agendada','em_andamento','ao_vivo','finalizada') DEFAULT 'agendada',
  "data_partida" datetime DEFAULT NULL,
  "mapa_jogado" varchar(50) DEFAULT NULL,
  "status_veto" varchar(50) DEFAULT 'pendente',
  "vez_veto_time_id" int DEFAULT NULL,
  PRIMARY KEY ("id"),
  KEY "time_a_id" ("time_a_id"),
  KEY "time_b_id" ("time_b_id"),
  KEY "vencedor_id" ("vencedor_id"),
  KEY "idx_partida_torneio" ("torneio_id"),
  CONSTRAINT "partidas_ibfk_1" FOREIGN KEY ("torneio_id") REFERENCES "torneios" ("id") ON DELETE CASCADE,
  CONSTRAINT "partidas_ibfk_2" FOREIGN KEY ("time_a_id") REFERENCES "times" ("id"),
  CONSTRAINT "partidas_ibfk_3" FOREIGN KEY ("time_b_id") REFERENCES "times" ("id"),
  CONSTRAINT "partidas_ibfk_4" FOREIGN KEY ("vencedor_id") REFERENCES "times" ("id")
);

CREATE TABLE "stats_jogador" (
  "id" int NOT NULL AUTO_INCREMENT,
  "usuario_id" int NOT NULL,
  "rank_atual" varchar(50) DEFAULT NULL,
  "kd_ratio" decimal(4,2) DEFAULT NULL,
  "win_rate" decimal(5,2) DEFAULT NULL,
  "headshot_pct" decimal(5,2) DEFAULT NULL,
  "partidas_analisadas" int DEFAULT NULL,
  "atualizado_em" datetime DEFAULT CURRENT_TIMESTAMP,
  "badges" json DEFAULT NULL,
  PRIMARY KEY ("id"),
  KEY "idx_stats_usuario" ("usuario_id"),
  CONSTRAINT "stats_jogador_ibfk_1" FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id") ON DELETE CASCADE
);

CREATE TABLE "times" (
  "id" int NOT NULL AUTO_INCREMENT,
  "nome" varchar(100) NOT NULL,
  "tag" varchar(10) DEFAULT NULL,
  "logo_url" varchar(255) DEFAULT NULL,
  "capitao_id" int NOT NULL,
  "criado_em" datetime DEFAULT CURRENT_TIMESTAMP,
  "convite_token" varchar(64) DEFAULT NULL,
  PRIMARY KEY ("id"),
  UNIQUE KEY "convite_token" ("convite_token"),
  KEY "capitao_id" ("capitao_id"),
  CONSTRAINT "times_ibfk_1" FOREIGN KEY ("capitao_id") REFERENCES "usuarios" ("id")
);

CREATE TABLE "torneios" (
  "id" int NOT NULL AUTO_INCREMENT,
  "nome" varchar(150) NOT NULL,
  "descricao" text,
  "formato" enum('eliminacao_simples','eliminacao_dupla','pontos_corridos') DEFAULT 'eliminacao_simples',
  "max_times" int DEFAULT '8',
  "organizador_id" int NOT NULL,
  "status" enum('inscricoes_abertas','em_andamento','finalizado','cancelado') DEFAULT 'inscricoes_abertas',
  "data_inicio" datetime DEFAULT NULL,
  "data_fim" datetime DEFAULT NULL,
  "criado_em" datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  KEY "organizador_id" ("organizador_id"),
  KEY "idx_torneio_status" ("status"),
  CONSTRAINT "torneios_ibfk_1" FOREIGN KEY ("organizador_id") REFERENCES "usuarios" ("id")
);

CREATE TABLE "usuarios" (
  "id" int NOT NULL AUTO_INCREMENT,
  "nome" varchar(100) NOT NULL,
  "email" varchar(150) NOT NULL,
  "senha_hash" varchar(255) NOT NULL,
  "riot_id" varchar(100) DEFAULT NULL,
  "tipo" enum('jogador','organizador','admin') DEFAULT 'jogador',
  "avatar_url" varchar(255) DEFAULT NULL,
  "banner_preset" tinyint DEFAULT '0',
  "criado_em" datetime DEFAULT CURRENT_TIMESTAMP,
  "riot_id_verified" tinyint(1) DEFAULT '0',
  "discord_id" varchar(100) DEFAULT NULL,
  "lft_status" tinyint(1) DEFAULT '0',
  "lft_role" varchar(50) DEFAULT NULL,
  "lft_mensagem" text,
  PRIMARY KEY ("id"),
  UNIQUE KEY "email" ("email")
);

