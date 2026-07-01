<div align="center">
  <img src="https://raw.githubusercontent.com/gustavinzx/VTOURNEY/main/frontend/public/icon.png" alt="VTourney Logo" width="120" />
  <h1>VTourney 🏆</h1>
  <p><strong>A plataforma definitiva para gerenciar e competir no cenário amador de Valorant.</strong></p>
</div>

---

Uma plataforma premium para organização de torneios de Valorant, com sistema de estatísticas reais, tracker sincronizado e UX inspirada na interface tática oficial da Riot Games. Desenvolvido para entregar uma experiência "esports-ready" com animações fluidas, dados em tempo real e micro-interações mecânicas.

## 🚀 Principais Features

- **Autenticação e Perfis:** Crie sua conta, vincule seu Riot ID e sincronize automaticamente seus status reais (K/D, Win Rate, Rank).
- **VTourney Tracker:** Um tracker próprio completo. Filtre seu desempenho por mapa, agente e modo de jogo. Veja o histórico de partidas com indicadores táticos.
- **Gestão de Times:** Crie sua line-up, convide jogadores (titulares e reservas) e exiba sua tag nos torneios.
- **Ecossistema de Torneios:** Crie campeonatos, defina limite de times, aprove equipes e veja a contagem regressiva para o início. Use Markdown para regras bonitas!
- **UI/UX Tática (Glassmorphism & VCT):** Botões chanfrados (`clip-tatico`), efeitos Glitch, Glow baseado em Rank (Radiante brilha dourado!), spinners mecânicos de carregamento e blur text.

## 🛠️ Stack Tecnológico

**Frontend:**
- [Next.js 14](https://nextjs.org/) (App Router)
- [React 18](https://react.dev/)
- [TailwindCSS](https://tailwindcss.com/) (Utilitários avançados e efeitos customizados)
- [Framer Motion](https://www.framer.com/motion/) (Animações e transições de página)
- *ReactBits* & *Aceternity UI* (Efeitos visuais)
- *Recharts* (Gráficos de performance)

**Backend:**
- Node.js & [Express](https://expressjs.com/)
- [MySQL](https://www.mysql.com/) (com driver mysql2/promise)
- Autenticação via JWT (JSON Web Tokens)
- [Cloudinary](https://cloudinary.com/) (Armazenamento de imagens)
- [HenrikDev API](https://docs.henrikdev.xyz/) (Provedor não-oficial de dados do Valorant)

---

## ⚙️ Como Inicializar o Projeto Localmente

O repositório é um monorepo contendo tanto a API quanto a aplicação web. Siga os passos abaixo:

### Pré-requisitos
- **Node.js** (v18+)
- **MySQL** (rodando localmente ou em nuvem)
- Uma chave da **Valorant API (HenrikDev)** (opcional para algumas requisições básicas com rate-limit generoso, mas recomendada).

### Passo 1: Configurando o Backend (API)

1. Entre na pasta do servidor e instale as dependências:
   ```bash
   cd backend
   npm install
   ```

2. Crie e configure as variáveis de ambiente baseadas no `.env.example`:
   ```bash
   cp .env.example .env
   ```
   *Edite o arquivo `.env` gerado e preencha suas credenciais do MySQL, Cloudinary e a chave JWT.*

3. Execute o script SQL para criar as tabelas no seu MySQL:
   *(Consulte o código/scripts de db no projeto para a estrutura das tabelas)*

4. Rode o servidor:
   ```bash
   npm run dev
   ```
   > O backend estará rodando em `http://localhost:3001`

### Passo 2: Configurando o Frontend (Web)

1. Em um novo terminal, vá para a pasta da web:
   ```bash
   cd frontend
   npm install
   ```

2. Crie um arquivo `.env.local` na raiz de `frontend/` com a URL do backend:
   ```bash
   echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > .env.local
   ```

3. Inicie o servidor frontend:
   ```bash
   npm run dev
   ```
   > A aplicação estará disponível em `http://localhost:3000`

---

## 🎨 Contribuindo

Pull Requests são muito bem vindos. Ao contribuir com UI, por favor siga a **Regra de Ouro da Estética do Projeto**:
> O site deve parecer um jogo feito por quem joga, não um template corporativo. Use cantos cortados (clip-path), cores semânticas (vermelho primário `#FF4655`) e o mínimo necessário de animações para não pesar. Evite fundos brancos.

## 📝 Licença
Desenvolvido por Gustavo Silva dos Santos.
Licenciado sob a [MIT License](LICENSE).
