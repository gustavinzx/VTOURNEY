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

### 3. Configurando o Banco de Dados e Variáveis de Ambiente (.env)

Você tem duas opções para o Banco de Dados:

**Opção A: Usar o mesmo banco de dados do criador (Recomendado para testar junto)**
Peça ao administrador do projeto as chaves de ambiente e crie os arquivos:
1. **No Backend:** Crie um arquivo `.env` dentro da pasta `backend` com a conexão online.
2. **No Frontend:** Crie um arquivo `.env.local` dentro da pasta `frontend`.

**Opção B: Criar seu próprio Banco de Dados Local (Para desenvolvimento isolado)**
1. Tenha o MySQL instalado na sua máquina (XAMPP, MySQL Workbench, etc).
2. Crie um banco de dados vazio: `CREATE DATABASE valorant_tourney;`
3. Importe a estrutura das tabelas usando o arquivo de dump que está em `backend/sql/schema.sql`.
4. Crie o arquivo `.env` no `backend` apontando para o seu `localhost`.
5. Crie o arquivo `.env.local` no `frontend`.

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
