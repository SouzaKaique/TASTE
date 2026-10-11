---
name: TASTE
description: Diário gastronômico social no mundo do quadro de feltro da padaria. Feltro bordô, letras brancas encaixadas, molduras e etiquetas de nota em latão.
colors:
  felt: "#3d1521"
  felt-deep: "#2b0d16"
  felt-raised: "#4a1c2a"
  felt-groove: "rgba(0, 0, 0, 0.26)"
  letter: "#f4efe6"
  letter-dim: "#e6cdb6"
  letter-faint: "#c9a99b"
  letter-bright: "#ffffff"
  brass: "#c9a15c"
  brass-hover: "#d8b16c"
  brass-deep: "#8a6a3a"
  brass-ink: "#7a5a26"
  hot: "#ef7a62"
  paper: "#fbf7f0"
  paper-alt: "#f1e7da"
  ink: "#2a1218"
  ink-soft: "#6b4651"
  danger-ink: "#a13d3d"
  danger-ink-hover: "#8a2f2f"
  success-ink: "#3f7351"
  success: "#7fb08f"
typography:
  display:
    fontFamily: "'Cormorant Garamond', Georgia, serif"
    fontSize: "clamp(2.6rem, 4.6vw, 4rem)"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.01em"
  h1:
    fontFamily: "'Cormorant Garamond', Georgia, serif"
    fontSize: "clamp(2.1rem, 3.4vw, 3.25rem)"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.01em"
  h2:
    fontFamily: "'Cormorant Garamond', Georgia, serif"
    fontSize: "clamp(1.5rem, 2.2vw, 1.875rem)"
    fontWeight: 600
    lineHeight: 1.15
  h3:
    fontFamily: "'Cormorant Garamond', Georgia, serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
  dish-lg:
    fontFamily: "'Cormorant Garamond', Georgia, serif"
    fontSize: "clamp(2.5rem, 4.4vw, 3.5rem)"
    fontWeight: 600
    lineHeight: 1.02
    letterSpacing: "-0.005em"
  dish-md:
    fontFamily: "'Cormorant Garamond', Georgia, serif"
    fontSize: "clamp(1.625rem, 2.4vw, 2.125rem)"
    fontWeight: 600
    lineHeight: 1.12
    letterSpacing: "-0.005em"
  dish-sm:
    fontFamily: "'Cormorant Garamond', Georgia, serif"
    fontSize: "1.375rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.005em"
  note:
    fontFamily: "'Cormorant Garamond', Georgia, serif"
    fontSize: "1.25rem"
    fontWeight: 500
    lineHeight: 1.4
  body:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  small:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.45
  board-label:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    letterSpacing: "0.14em"
  button:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 700
    letterSpacing: "0.08em"
  score:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.01em"
  score-sm:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1
rounded:
  sm: "3px"
  md: "4px"
  lg: "6px"
  pill: "999px"
spacing:
  "1": "0.25rem"
  "2": "0.5rem"
  "3": "0.75rem"
  "4": "1rem"
  "5": "1.25rem"
  "6": "2.5rem"
  "7": "3.75rem"
  "8": "5rem"
  rail: "40px"
  rail-half: "20px"
components:
  button-primary:
    backgroundColor: "{colors.brass}"
    textColor: "{colors.felt-deep}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "0.6rem 1.15rem"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.brass-hover}"
    textColor: "{colors.felt-deep}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.letter}"
    rounded: "{rounded.md}"
    padding: "0.6rem 1.15rem"
  score-tag:
    textColor: "{colors.letter}"
    typography: "{typography.score}"
    rounded: "{rounded.md}"
    padding: "0.35rem 0.6rem 0.3rem"
    width: "68px"
  nav-item-active:
    backgroundColor: "{colors.letter}"
    textColor: "{colors.felt-deep}"
    typography: "{typography.board-label}"
    height: "40px"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0.6rem 0.85rem"
    height: "44px"
  cartela-dialog:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "2.5rem"
---

# Design System: TASTE

## Overview

**Creative North Star: "O quadro de feltro da padaria"**

O TASTE é um quadro de letras de feltro: o chão é feltro bordô, cada prato e cada indicação entram como uma linha encaixada no trilho, e a nota fica alinhada à direita numa etiqueta de latão, como o preço no quadro da padaria. O sistema recusa o feed-parede-de-fotos e o painel de cartões brancos iguais. Tudo foi lido do código entregue em `frontend/src` (Angular 19); as decisões abaixo descrevem o que está construído, não um plano.

O contexto padrão é "sobre o feltro" (texto claro). Formulários, diálogos e avisos usam a `.cartela`, uma ficha clara que redefine as mesmas variáveis de papel para tinta escura; os componentes usam só papéis (`--color-text-primary`, `--color-surface`, `--color-accent`…) e funcionam nos dois contextos sem variantes.

**Key Characteristics:**
- Feltro bordô dominante, nunca cinza neutro: todo texto secundário é bege tingido do feltro.
- Latão reservado a etiquetas de nota, ação principal, numeração, foco e molduras.
- Nome do prato só em Cormorant Garamond, em três tamanhos fixos; metadados em Inter caixa alta espaçada.
- Listas são linhas de quadro (linha + sulco divisor + etiqueta de nota à direita), não grades de cartões.
- Grade vertical de 40px (`--rail`): alvos de toque, linhas de ranking e altura das linhas de lista são múltiplos do trilho.
- Movimento único de assinatura: a linha encaixa no trilho ao carregar, uma vez (`.slot-in`).

## Colors

Um feltro bordô com três profundidades, letras brancas e bege que substituem o cinza, e latão como única cor de destaque. A cartela clara inverte os papéis para tinta bordô quase preta.

### Primary
- **Feltro** (`#3d1521`): `--felt`, o chão do site (`body`, `--color-bg`). Também o hover dos itens de navegação no trilho.
- **Feltro escuro** (`#2b0d16`): `--felt-deep`, trilho lateral, colunas laterais, painéis (`.surface-card`), plaqueta da home, caixa de comentários; e a tinta sobre latão (texto do botão principal, seleção).
- **Feltro destacado** (`#4a1c2a`): `--felt-raised`, linha ativa e brilho do skeleton.
- **Sulco** (`rgba(0, 0, 0, 0.26)`): `--felt-groove`, o divisor de 1px entre linhas e os sulcos do `.board`.

### Secondary
- **Latão** (`#c9a15c`): `--brass`, borda da `.score-tag`, botão principal, numeração de ranking, badges do trilho, anel de foco, cursor, barras da retrospectiva, moldura de diálogos e avisos.
- **Latão claro** (`#d8b16c`): hover e foco do `.btn-primary`.
- **Latão fundo** (`#8a6a3a`): `--brass-deep`, filete das molduras: régua `.board-top`, `.tally-strip`, bordas de coluna do trilho e das colunas laterais, plaqueta, foto em miniatura, barra de rolagem, botão principal desabilitado.
- **Latão-tinta** (`#7a5a26`): `--brass-ink`, o latão legível sobre a cartela clara (`--color-accent` dentro de `.cartela`, foco e checkbox dos campos).

### Tertiary
- **Quente** (`#ef7a62`): `--hot`, curtida ativa, coração de favorito, erro sobre o feltro (`--taste-danger`).
- **Erro sobre cartela** (`#a13d3d`), com hover `#8a2f2f`: botão de exclusão do diálogo, ícone de erro do aviso, `.invalid-feedback` dentro da cartela.
- **Sucesso sobre cartela** (`#3f7351`): ícone de sucesso do aviso; `#7fb08f` é o sucesso sobre o feltro.

### Neutral
- **Letra** (`#f4efe6`): `--letter`, texto principal sobre o feltro, item ativo do trilho e aba de filtro ativa (letra branca encaixada, texto em feltro escuro).
- **Letra bege** (`#e6cdb6`): `--letter-dim`, texto secundário. Nunca cinza.
- **Letra discreta** (`#c9a99b`): `--letter-faint`, datas e metadados de terceira ordem, ainda tingidos do feltro.
- **Letra acesa** (`#ffffff`): `--color-brand-strong`, só para hover de nome de prato e para linhas com peso (`.board-line--strong`, notificação não lida).
- **Cartela** (`#fbf7f0`) e **cartela alternativa** (`#f1e7da`): `--paper` / `--paper-alt`, fundo de campos, diálogos e avisos.
- **Tinta** (`#2a1218`) e **tinta suave** (`#6b4651`): `--ink` / `--ink-soft`, texto sobre a cartela; bordô quase preto, não neutro.

### Named Rules
**The No Neutral Grey Rule.** Regra do nenhum cinza: todo texto secundário e todo metadado usa `--letter-dim` ou `--letter-faint` (sobre o feltro) ou `--ink-soft` (sobre a cartela). Cinza neutro não existe no sistema.

**The Brass Means Value Rule.** Regra do latão: o latão marca nota, ação principal, numeração, foco e moldura. Não é cor decorativa de fundo nem de texto corrido.

**The Role Variables Rule.** Regra dos papéis: componentes leem papéis (`--color-text-primary`, `--color-surface`, `--color-accent`), nunca os materiais direto, para funcionar dentro e fora da `.cartela`. Os nomes `--taste-*` são aliases de compatibilidade; código novo não os usa.

## Typography

**Display Font:** Cormorant Garamond (with Georgia, serif)
**Body Font:** Inter (with -apple-system, BlinkMacSystemFont, sans-serif)

**Character:** Cormorant é o que se lê de longe no quadro: pratos e títulos, peso 600, com `text-wrap: balance`. Inter é a interface e, em caixa alta espaçada, a letra pequena do quadro para metadados, navegação, botões e contagens.

### Hierarchy
- **Display** (600, `clamp(2.6rem, 4.6vw, 4rem)`, 1): `.display-title`, título do restaurante e chamada da landing.
- **Headline** (600, `clamp(2.1rem, 3.4vw, 3.25rem)`, 1.05): `h1` de página ("O que seus amigos comeram").
- **Title** (600, `clamp(1.5rem, 2.2vw, 1.875rem)` / 1.25rem): `h2` e `h3`; títulos de blocos laterais em 1.625rem.
- **Dish** (600, três tamanhos): `.dish--lg` `clamp(2.5rem, 4.4vw, 3.5rem)` no detalhe, na plaqueta da home e no primeiro lugar do Top 3; `.dish--md` `clamp(1.625rem, 2.4vw, 2.125rem)` em feed e listas; `.dish--sm` 1.375rem em rankings e cartões compactos.
- **Note** (Cormorant itálico 500, 1.25rem, 1.4): o relato entre aspas no feed e o `.lede` (1.3rem); máximo de 58 a 60ch.
- **Body** (400, 1rem): texto de interface; lugar e cidade em 0.875rem com `--letter-dim`.
- **Label** (600, 0.75rem, `letter-spacing: 0.14em`, caixa alta): `.board-label`, quem, quando, culinária, contagens; navegação do trilho no mesmo desenho.
- **Score** (Inter 700, 1.5rem / 1.125rem no `--sm`, `tabular-nums`): o número dentro da `.score-tag`.

### Named Rules
**The Three Dish Sizes Rule.** Regra dos três tamanhos: o nome do prato é sempre `.dish` com `--lg`, `--md` ou `--sm`. Nunca um tamanho solto, nunca em Inter.

**The Board Label Rule.** Regra do rótulo de quadro: metadados (quem, quando, culinária, contagens) usam `.board-label`, Inter caixa alta com `--board-tracking` (0.14em). O rótulo acompanha a linha; não é sobretítulo colocado acima de títulos.

**The Comma Score Rule.** Regra da nota com vírgula: a nota sempre aparece como número com uma casa decimal e vírgula ("4,5"), via `number: '1.1-1'` com `LOCALE_ID` `pt-BR`, em algarismos tabulares, dentro da `.score-tag`. Nunca estrelas como exibição de nota.

## Layout

Grade vertical de 40px (`--rail`). Linhas de ranking têm `min-height: var(--rail)`; linhas de lista (`experience-line`, linha de restaurante) têm três trilhos (`calc(var(--rail) * 3)`): data ou culinária, prato, lugar. Botões e itens de navegação têm 40px de altura mínima; campos, 44px. A escala de espaço é de 4px, com `--space-5` = meio trilho (1.25rem), `--space-6` = um trilho (2.5rem) e `--space-8` = dois trilhos.

App autenticado no desktop: trilho escuro de 248px à esquerda (`--sidebar-width`) com filete de latão à direita, coluna central com o conteúdo e, em feed e home, uma coluna lateral de feltro escuro com o quadro numerado "Indicados pela turma" e pedidos de amizade. Abaixo de 1200px a coluna lateral desce para depois do conteúdo (filete passa para o topo); no celular, cabeçalho de feltro de 56px e navegação inferior de 64px com filete de latão no topo. Containers: `.container-narrow` 680px e `.container-editorial` 1180px, com 2.5rem de margem (1rem abaixo de 480px).

### Named Rules
**The Board Line Rule.** Regra da linha de quadro: listas são linhas (conteúdo à esquerda, sulco de 1px `--felt-groove` embaixo, `.score-tag` ou seta à direita), começando sob a régua `.board-top` de latão. Não são grades de cartões.

**The Groove Placement Rule.** Regra do sulco: o fundo `.board` com sulcos repetidos a cada 40px só vai sob listas de altura fixa em múltiplos do trilho (ranking "Indicados pela turma" no feed, critérios no detalhe, contagens da home). Sob conteúdo de altura livre (entradas do feed, diário, relatos) ele não é aplicado, porque o sulco cruzaria as linhas de texto; ali o sulco aparece como o divisor de 1px entre linhas.

**The Real Photo Only Rule.** Regra da foto real: miniatura (80px, 56px no celular, moldura de 1px `--brass-deep`) ou foto de capa só aparecem quando existe uma foto real; sem foto, a linha fecha a coluna (`:has(.line__photo)`). Nenhum degradê ou inicial como substituto em superfícies principais.

## Elevation

O feltro é plano: a hierarquia vem de profundidade de feltro (`--felt` → `--felt-deep`) e de filetes de latão, não de sombra. Sombras existem só para o que flutua sobre a página, sempre com deslocamento e desfoque, tingidas de bordô.

### Shadow Vocabulary
- **Pequena** (`box-shadow: 0 1px 2px rgba(12, 2, 6, 0.3)`): `--shadow-sm`, reservada.
- **Média** (`box-shadow: 0 6px 16px rgba(12, 2, 6, 0.32)`): `--shadow-md`, `.cartela-panel` e menus suspensos.
- **Grande** (`box-shadow: 0 18px 40px rgba(12, 2, 6, 0.42)`): `--shadow-lg`, diálogo de confirmação, modal e avisos (toasts).

### Named Rules
**The Flat Felt Rule.** Regra do feltro plano: linhas, painéis e colunas não têm sombra. Sombra só em diálogo, menu e aviso, que de fato flutuam.

## Shapes

Cantos de peça de letreiro, não de app genérico: 3px (`--radius-sm`) em selos, badges e foco; 4px (`--radius-md`) em botões, campos, `.score-tag`, miniaturas e avisos; 6px (`--radius-lg`) em painéis, plaqueta, diálogos e quadro ilustrativo. `--radius-pill` existe, mas o sistema construído quase não o usa.

### Named Rules
**The Full Brass Frame Rule.** Regra da moldura inteira: painéis e molduras usam borda de latão de 2px em volta toda (diálogo, aviso, plaqueta da home, quadro "Exemplo ilustrativo", `.score-tag`). Nunca faixa de destaque de um lado só num cartão. O filete de 2px `--brass-deep` entre colunas inteiras (trilho, coluna lateral) é divisão de estrutura, não faixa de destaque.

## Components

### Score tag (`.score-tag`)
A etiqueta de preço do quadro. Inline-flex em coluna, `min-width: 68px`, borda 2px `--brass`, raio 4px, número Inter 700 1.5rem em `--letter` e o rótulo "de 5" em 0.5625rem caixa alta latão. `.score-tag--sm` (52px, 1.125rem, borda 1.5px) em listas compactas e no celular. Sempre alinhada à direita da linha e com `aria-label` "Nota X de 5". A plaqueta da home usa a versão grande (84px, 2rem).

### Linha de experiência (`experience-line`) e de restaurante (`restaurant-card`)
Grid `minmax(0, 1fr) auto` com três trilhos de altura: `.board-label` em `--letter-faint` (data ou culinária), prato ou restaurante em `.dish--md`, lugar em 0.875rem `--letter-dim`; sulco de 1px embaixo. À direita, `.score-tag` (experiência) ou seta que anda 3px e fica latão no hover (restaurante). Destaque curado aparece em itálico latão. Hover sublinha o nome com 1px.

### Entrada do feed (`feed-item`)
Avatar de 40px (32px no celular), quem e quando em `.board-label`, prato `.dish--md`, lugar, relato em Cormorant itálico entre aspas, foto opcional (máx. 520 × 320px, raio 4px), ações curtir/comentar em Inter caixa alta com alvo de 40px (no celular só ícone e número, nome completo no `aria-label`), comentários numa caixa `--felt-deep`. A `.score-tag` fica à direita. Altura livre: separada pelo sulco de 1px, sem `.board` por baixo.

### Linha numerada (`.board-line`)
Grid `1.75rem / 1fr / auto`, 40px de altura mínima: número latão tabular, texto Inter 600 0.8125rem caixa alta com reticências, valor tabular à direita em `--letter-dim`. `.board-line--strong` acende o texto em branco quando mais de um amigo indicou. Usada no ranking "Indicados pela turma", nos critérios do detalhe, nas contagens da home e nas listas da retrospectiva.

### Faixa de contagem (`.tally-strip`) e régua (`.board-top`)
Números lado a lado (Inter 700 1.625rem tabular) com legenda em `.board-label`, régua de 2px `--brass-deep` no topo e sulcos entre as células; duas colunas abaixo de 480px. `.board-top` é a régua de latão que inicia qualquer lista de linhas.

### Trilho de navegação (`layout/shell`) e navegação inferior (`bottom-nav`)
Trilho em `--felt-deep` com filete de 2px `--brass-deep`; itens com 40px, Inter caixa alta espaçada em `--letter-dim`; hover em `--felt`; item ativo como letra branca encaixada (fundo `--letter`, texto `--felt-deep`); badge de notificação latão, raio 3px, tabular. Botão de latão "Registrar prato" no pé. No celular, a navegação inferior marca o ativo com letra branca e ícone latão; o atalho central é a peça de latão.

### Abas de filtro (feed, favoritos, configurações)
Contorno de letra; hover com borda `--brass-deep`; ativa como letra branca encaixada (fundo `--letter`, texto `--felt-deep`). Em favoritos e configurações, a aba ativa usa texto e borda latão.

### Botões (`_bootstrap-overrides.scss`)
Inter 700 0.8125rem caixa alta `letter-spacing: 0.08em`, 40px de altura (34px `-sm`, 48px `-lg`), raio 4px, desce 1px ao pressionar. `.btn-primary` é a peça de latão com texto `--felt-deep`; `.btn-outline-primary` é contorno de letra sobre o feltro ou de tinta sobre a cartela; `.btn-ghost` só texto. Carregamento: spinner de 16px no lugar do texto.

### Campos e cartela
Campos são sempre ficha clara: `--paper`, tinta `--ink`, borda bordô a 24%, 44px, raio 4px; foco com borda `--brass-ink` e anel de 3px latão a 45%. Diálogo de confirmação: `.cartela` com borda 2px `--brass`, raio 6px, `--shadow-lg`, título Cormorant 1.625rem, ações à direita, ação destrutiva em `#a13d3d`. Aviso (toast): cartela com borda 2px latão, raio 4px, ícone colorido por tipo.

### Plaqueta (home) e quadro ilustrativo (landing, login, cadastro)
Plaqueta: `--felt-deep`, borda inteira 2px `--brass-deep`, raio 6px, prato `.dish--lg` e `.score-tag` grande. Quadro ilustrativo: moldura inteira 2px `--brass-deep` sobre `--felt`, linhas de exemplo com `.score-tag--sm`, sempre com a legenda `.board-label` "Exemplo ilustrativo" e `aria-label` correspondente.

### Retrospectiva
Contagens como `.board-line` sob `.board-top`; gráfico mensal com barras chapadas `--brass` de até 24px, topo arredondado 2px, sem degradê; Top 3 como exatamente três linhas numeradas, o primeiro lugar em `.dish--lg` e os demais em `.dish--md`.

### Estado vazio (`empty-state`)
Painel `--felt-deep` com borda tracejada de 1px `--color-border-strong` e raio 6px.

## Do's and Don'ts

### Do:
- **Do** escrever o nome do prato com `.dish` em um dos três tamanhos e os metadados com `.board-label`.
- **Do** mostrar a nota sempre na `.score-tag` de latão, à direita, com vírgula decimal ("4,5") e `aria-label` "Nota X de 5".
- **Do** montar listas como linhas de quadro sob `.board-top`, com sulco de 1px entre linhas.
- **Do** usar o fundo `.board` só em listas de altura fixa em múltiplos de 40px.
- **Do** colocar formulários, diálogos e avisos dentro da `.cartela` e deixar os papéis resolverem as cores.
- **Do** rotular todo conteúdo sintético de prévia como "Exemplo ilustrativo", na legenda visível e no `aria-label`.
- **Do** escrever em português do Brasil com linguagem neutra em gênero ("Que bom te ver de novo").
- **Do** manter alvos de toque de 40px ou mais e o anel de foco latão de 2px.
- **Do** respeitar `prefers-reduced-motion`: animações e transições caem para 0.01ms.

### Don't:
- **Don't** exibir nota com estrelas, nem com ponto decimal.
- **Don't** montar grades de cartões iguais nem parede de fotos nas superfícies principais.
- **Don't** usar degradê ou inicial como substituto de foto em superfícies principais (o `restaurant-cover` fica só como fallback dentro da visão em grade do `experience-card`).
- **Don't** aplicar o `.board` sob texto de altura livre (entradas do feed, diário, relatos).
- **Don't** usar faixa de destaque de um lado só em cartões ou painéis; moldura é borda inteira de 2px.
- **Don't** usar cinza neutro para texto secundário.
- **Don't** usar logos ou fotos oficiais de restaurantes, nem fotos decorativas nas páginas de entrada.
- **Don't** inventar depoimentos, números de uso ou imprensa em nenhuma superfície.
- **Don't** colocar sobretítulos (rótulos acima de títulos); o `.board-label` acompanha a linha.
- **Don't** animar além do encaixe único da linha no trilho (`.slot-in`, 420ms, atraso de 45ms por linha até a oitava).
