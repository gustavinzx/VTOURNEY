# VTourney 🏆

Plataforma premium para torneios de Valorant, com sistema de estatísticas, tracker sincronizado e gerador de badges automático. Construído com **Next.js**, **TailwindCSS** e **Node.js/Express**, utilizando a temática tática inspirada no HUD oficial do jogo.

## Estrutura do Projeto

O repositório é um monorepo dividido em duas partes principais:
- `/frontend`: Aplicação Web feita em Next.js (App Router), React e Framer Motion.
- `/backend`: API RESTful feita em Node.js (ESM), Express e conectada às APIs oficiais/públicas do Valorant (HenrikDev).

---

## 🚀 Como Inicializar o Projeto Localmente

### Pré-requisitos
Certifique-se de ter instalado:
- **Node.js** (v18 ou superior)
- **NPM** ou **Yarn**

### Passo 1: Configurando o Backend (API)
1. Abra um terminal e navegue até a pasta do backend:
   ```bash
   cd backend
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Crie um arquivo `.env` na raiz da pasta `backend/` e preencha as chaves necessárias (banco de dados, JWT, chaves da API do Valorant, etc):
   ```env
   PORT=5000
   VALORANT_API_KEY=sua_chave_aqui
   # ...outras variaveis (ex: DATABASE_URL, JWT_SECRET)
   ```
4. Inicie o servidor em modo de desenvolvimento:
   ```bash
   npm run dev
   ```
   > O backend estará rodando na porta `5000`.

### Passo 2: Configurando o Frontend (Web)
1. Abra um NOVO terminal e navegue até a pasta do frontend:
   ```bash
   cd frontend
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Crie um arquivo `.env.local` na raiz da pasta `frontend/` com a URL do backend:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```
4. Inicie o Next.js em modo de desenvolvimento:
   ```bash
   npm run dev
   ```
   > O frontend estará disponível em `http://localhost:3000`.

---

## 🎨 Design & Estética (Premium Tactical)

O sistema utiliza a temática "Glassmorphism" com a estética VCT (Valorant Champions Tour):
- Componentes chanfrados (CSS Clip Path).
- Glow dinâmico de cores baseadas nos resultados (Verde pra Win, Vermelho pra Loss).
- Scanlines, micro-interações mecânicas e painéis texturizados.

## ⚙️ Tecnologias Principais
- **Frontend**: React 18, Next.js 14, TailwindCSS, Framer Motion, Lucide React, CMDK.
- **Backend**: Node.js, Express, Axios.
- **Integração de Dados**: HenrikDev API, Tracker Services.
