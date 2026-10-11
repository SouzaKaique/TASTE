---
version: 1
slug: "frontend-src-app-layout-shell-shell-component-html"
primary_target: "frontend/src/app/layout/shell/shell.component.html"
related_targets: ["frontend/src/styles.scss","frontend/src/app/features/social/feed/feed.component.html"]
---

# TASTE — aplicação (shell e telas internas)

Escopo: todo o app autenticado (feed, diário, descobrir, restaurante, amigos, notificações, retrospectiva, favoritos, perfil, configurações) e, no mesmo mundo, as páginas de entrada (landing, login, cadastro). Modo: Operate para o app; a landing é Persuade dentro do mesmo mundo.

Público e tarefa: qualquer pessoa no Brasil, muito no celular, vendo o que os amigos comeram e registrando o próprio prato perto da mesa. Núcleo: indicações de quem você confia (ver PRODUCT.md).

Restrições: bordô dominante + bege/branco/dourado; Cormorant Garamond + Inter; logo atual; sem fotos decorativas nas páginas de entrada; linguagem neutra; contraste AA e alvos ≥40px.

## Direction contract

THESIS: O TASTE é o quadro de feltro da padaria: cada prato e cada indicação entram como uma linha encaixada no trilho, com a nota alinhada à direita como o preço. Recusa o feed-parede-de-fotos e o painel de cartões brancos iguais.

OWN-WORLD: Feltro bordô (#3d1521) com sulcos reais a cada 40px; trilho de navegação em feltro escuro (#2b0d16) com filete de latão; letras brancas (#f4efe6) e bege tingido (#e6cdb6) no lugar de cinza; latão (#c9a15c) só para etiquetas de nota, ação principal e numeração; Cormorant para pratos em três tamanhos fixos; Inter em caixa alta espaçada para metadados de quadro. Cartelas claras só para formulários e diálogos.

STORY: A pessoa abre o app, lê o que os amigos comeram como linhas de quadro, varre as notas na margem direita, curte, comenta e consulta "Indicados pela turma" para decidir onde ir; registra o próprio prato pelo botão de latão.

FIRST VIEWPORT: Desktop: trilho escuro de 248px à esquerda (logo, navegação em letras de quadro, item ativo como letra branca encaixada, botão de latão "Registrar prato" no pé); coluna central com título Cormorant ~52px, abas de filtro e as entradas do feed em linhas de 40px com etiqueta de nota à direita; coluna direita de 360px em feltro escuro com o quadro numerado "Indicados pela turma" e pedidos de amizade. Celular: cabeçalho de feltro com sino e avatar, entradas em largura total, quadro de indicados após as primeiras linhas, navegação inferior.

FORM: Quadro de letras de feltro de padaria; posição 3 da lista ordenada; seed 70f469ae. Raises: grade única de 40px (Crouwel); nome do prato em três tamanhos fixos (Emigre); valores tabulares à direita e Top 3 de exatamente três linhas (cassete); peso por número de amigos que indicaram (atlas); nenhum cinza neutro (Ikeda). Movimento: as linhas encaixam no trilho ao carregar, uma vez.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
