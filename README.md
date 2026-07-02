# VTourney - Plataforma de Torneios de Valorant 🏆

Bem-vindo ao repositório do **VTourney**, uma plataforma completa para gerenciamento de torneios amadores de Valorant. O projeto conta com sistema de autenticação, mercado de transferências (LFT), criação de chaves automáticas, e comunicação em tempo real via Discord.

## 🚀 Como rodar o projeto localmente

Se você acabou de clonar este repositório para testar a aplicação na sua máquina, siga os passos abaixo! O projeto é dividido em duas partes: o **Backend** (Node.js/Express) e o **Frontend** (Next.js/React).

### 1. Pré-requisitos
- [Node.js](https://nodejs.org/) instalado na sua máquina (versão 18 ou superior).
- Git instalado (para clonar).

### 2. Clonando o Repositório
Abra o seu terminal e rode:
```bash
git clone <URL_DO_REPOSITORIO>
cd valorant-tourney
```

### 3. Configurando as Variáveis de Ambiente (.env)
Como as chaves de segurança e senhas do banco de dados ficam ocultas, você não vai baixá-las ao fazer o clone. Peça ao administrador do projeto as duas chaves de ambiente:
1. **No Backend:** Crie um arquivo chamado `.env` dentro da pasta `backend` e cole as variáveis (conexão com Aiven Cloud MySQL, JWT Secret, etc).
2. **No Frontend:** Crie um arquivo chamado `.env.local` dentro da pasta `frontend` e cole as variáveis (link da API, etc).

### 4. Instalando e Iniciando o Backend
Abra um terminal, acesse a pasta do backend, instale os pacotes e inicie o servidor:
```bash
cd backend
npm install
npm run dev
```
*(O backend deverá rodar na porta 3001 e se conectar ao banco de dados na nuvem)*

### 5. Instalando e Iniciando o Frontend
Mantenha o terminal do backend aberto. Abra **um novo terminal**, acesse a pasta do frontend, instale os pacotes e inicie o site:
```bash
cd frontend
npm install
npm run dev
```
*(O frontend deverá rodar na porta 3000)*

### 6. Tudo pronto! 🎉
Agora basta abrir o seu navegador de internet e acessar:
**http://localhost:3000**

Qualquer dado que você alterar ou conta que você criar vai ser refletida no banco de dados oficial, então você e seus amigos podem interagir em tempo real no sistema!
