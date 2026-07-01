# Valorant Tourney v2 — Design Tokens & Visual Identity

## 1. O Problema Atual
O visual atual usa fundo preto genérico, sombras de "glassmorphism" suaves e bordas redondas genéricas (shadcn-like). Falta a "alma" de um jogo de FPS tático.

## 2. A Nova Direção (Tático & Gamer)
A nova identidade visual será baseada em **recortes táticos**, **tipografia angular**, e uma **paleta restrita mas de alto contraste**, fugindo do padrão "app de IA". O design será inspirado em HUDs de jogos (overlay), com foco em legibilidade e imersão.

### 2.1 Paleta de Cores
Não usaremos mais branco puro ou preto puro genéricos.
- `--bg-base`: `#0F1115` (Cinza muito escuro com leve toque azulado — como a tela de loading do Valorant).
- `--bg-surface`: `#1A1D24` (Para cards e modais, sem sombras exageradas, foco em bordas sólidas).
- `--accent-primary`: `#FF4655` (Vermelho Valorant — usado apenas para ações destrutivas ou botões de destaque principal/Call to Action).
- `--accent-cyan`: `#0CEBB5` (Ciano tático, estilo Sage/KAYO — usado para status de sucesso, links, e XP).
- `--accent-gold`: `#F3D784` (Dourado de Radiante/Vencedor — para primeiro lugar e highlights).
- `--text-main`: `#ECE8E1` (Off-white/Bege claro, característico dos menus do jogo, cansa menos a vista).
- `--text-muted`: `#7A838C` (Cinza tático para informações secundárias).

### 2.2 Tipografia
- **Títulos e Números (Stats):** `Chakra Petch` (Google Fonts). É angular, agressiva, tem formato "quadrado/tecnológico" perfeito para K/D, placares e nomes de times.
- **Corpo do texto:** `Inter` (Mantido pela legibilidade excepcional em tamanhos pequenos).
- *Regra:* Títulos sempre em UPPERCASE com tracking (letter-spacing) levemente aumentado.

### 2.3 O Elemento de Assinatura (Signature Element)
**Cantos Chanfrados (Chamfered Corners):**
Em vez de `border-radius: 8px` genéricos, os cards principais e botões primários terão um ou dois cantos "cortados" em 45 graus (usando `clip-path: polygon(...)`). Isso é a marca registrada da UI do Valorant e quebra a monotonia dos retângulos arredondados.

**Scanlines Sutis e Borders Rígidas:**
Em vez de brilho e glow infinito, usaremos borders de 1px sólidas (`border-zinc-800` ou similar) com fundos opacos que possuem uma levíssima textura de scanline diagonal (`repeating-linear-gradient`).

### 2.4 Microcopy e UX
- Textos genéricos ("Nenhum torneio encontrado") → Gamer ("Mapa vazio, igual seu Bind sem instalar").
- "Criar time" → "Montar Squad".
- "Atualizar stats" → "Sincronizar Combat Record".

## 3. Plano de Refatoração Visual (Passo Zero)
Antes de implementar o Bloco 4 (WebSockets) ou Bloco 11 (Tracker), farei uma passada global de refatoração:
1. Instalar `Chakra Petch` no `layout.tsx`.
2. Criar utilitário CSS para `clip-path` chanfrado.
3. Atualizar botões primários para o formato angular.
4. Remover as "auroras" suaves e trocar por fundos com texturas táticas e linhas de grade mais marcadas.
