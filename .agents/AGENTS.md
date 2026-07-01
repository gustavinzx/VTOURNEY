# UI/UX Design Guidelines: Valorant Tourney (ReactBits + 21st.dev)

## Princípios Globais
- **Regra de Ouro:** Máximo de 2-3 componentes animados pesados por página (ReactBits). O objetivo é dar toques sutis e impactantes, não sobrecarregar.
- **21st.dev:** Usar como esqueleto estrutural (modais, command palette), mas SEMPRE restilizar para o tema tático (`clip-tatico`, `scanlines`, paleta `#FF4655`, fonte `Chakra Petch`).
- **Aparência Tática:** O site deve parecer um jogo feito por quem joga, não um template genérico corporativo. Elementos chanfrados, micro-interações mecânicas, cores semânticas fortes.

## 1. Layout Global
- **Navbar:** Reduz altura no scroll com `backdrop-blur`. Indicador animado na navegação. Menu hambúrguer lateral mecânico no mobile. Command Palette (Cmd+K) estilizado.
- **Micro-interações:** Hover em botões primários com leve `skew` ou `border-glow`. Wipe diagonal em transições de página (`framer-motion`).
- **Feedback:** Toasts customizados (`sonner`) com cantos cortados.

## 2. Home / Landing
- **Hero:** Fundo animado sutil do ReactBits (ex: scan/HUD). Texto principal com leve glitch inicial. Botões com hierarquia clara. Preview ao vivo de torneio rolando (countdown animado).
- **Provas Sociais:** Mosaico orgânico de avatares (`Circle Stack`) em vez de números genéricos isolados.
- **Listas:** Carrossel horizontal cinematográfico para torneios em destaque. Preview de Trending Players do Tracker.

## 3. Autenticação (Login / Cadastro)
- Formulário em painel flutuante sobre fundo animado sutil. Inputs com linha que desenha no foco.
- Submit com spinner tático (barra linear fina). Erros diretos, "voz do jogo".

## 4. Perfil do Jogador
- **Stats:** `react-countup` nas métricas numéricas, gráfico radial. Gráficos de performance por mapa com background temático.
- **Match History:** Tabela estilo scoreboard monospaced, acordeão para expandir partida, barra lateral verde/vermelha.
- **Badges:** Grid usando `Animated List`.

## 5. Torneios & Dashboard (Blocos Futuros)
- **Detalhes:** Bracket renderizado em SVG interativo com flashes em novos confrontos.
- **Formulário de Criação:** Multi-step wizard com preview de card em tempo real.
- **Dashboard Org:** Foco brutal em eficiência. Nada de animações pesadas. Atualizações otimistas (inline actions). Celebração massiva (confetes) APENAS no encerramento (campeão).

## 6. Responsividade e Performance
- Desativar ou reduzir fundos pesados no Mobile. Usar Tab Bar inferior fixa no mobile em vez de depender 100% de menu hambúrguer. Respeitar `prefers-reduced-motion`. Carregamento lazy.
