# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

Aplicação web responsiva. O uso no celular (navegador mobile, 320–430px) é tão importante quanto no desktop.

## Users

Qualquer pessoa no Brasil que come fora e quer guardar e compartilhar o que comeu — sem um perfil de nicho (não é feito só para críticos ou "foodies"). O momento típico de uso é logo depois (ou durante) uma refeição em um restaurante: registrar o prato, dar uma nota e ver o que os amigos andam comendo para decidir onde ir.

## Product Purpose

TASTE é um diário gastronômico social: cada pessoa registra suas experiências (prato, restaurante, cidade, nota de 1 a 5, foto, relato, tags) e as compartilha com amigos, que podem curtir e comentar. É um **produto real**, feito para ser usado no dia a dia e crescer — não apenas uma peça de portfólio.

Sucesso significa pessoas voltando para registrar refeições e, principalmente, descobrindo onde comer pelas indicações de quem elas conhecem.

## Positioning

O coração do produto é o **social / indicações**: descobrir onde comer por pessoas em quem você confia, e não por avaliações anônimas. O diário pessoal alimenta o social (cada registro vira uma indicação para os amigos), e a retrospectiva anual com Top 3 é um diferencial de apoio, não o centro.

*(Confirmado pelo usuário em 2026-10-10. Observação: a landing page atual ainda apresenta a retrospectiva como "o grande diferencial" — essa mensagem está desalinhada com o posicionamento confirmado.)*

## Operating Context

- Uso em português do Brasil, em qualquer cidade do país.
- Fluxos principais: cadastro/login → registrar experiência → feed de amigos (curtir, comentar) → notificações → descobrir restaurantes → perfil e retrospectiva do ano.
- Busca de restaurantes do Brasil todo via dados abertos do OpenStreetMap, somada a uma seleção curada de destaques reais (Assis, Londrina, Curitiba e São Paulo) com a fonte do destaque citada (Guia Michelin, Exame Casual, Prazeres da Mesa, Prêmio Bom Gourmet, Tripadvisor).
- Hospedagem gratuita: o backend "dorme" após inatividade e leva ~75 s para acordar no primeiro acesso.

## Capabilities and Constraints

**Funcionalidades reais (persistidas no backend):** contas e perfil (público/privado), experiências com visibilidade pública / somente amigos / privada, amizades (busca, pedidos, aceite), feed com curtidas e comentários, notificações (pedido, aceite, curtida, comentário), busca de restaurantes no OpenStreetMap, capas de restaurantes com fotos públicas da comunidade.

**Ainda demonstrativo / provisório:**
- Coleções ainda não são salvas no backend.
- Restaurantes cadastrados manualmente ficam só no navegador (localStorage).
- Fotos são reduzidas no navegador e guardadas como texto no banco — solução provisória até existir armazenamento de arquivos.

**Restrições conhecidas:**
- Dados do OpenStreetMap podem estar incompletos; o cadastro manual de restaurante precisa continuar disponível.
- Não usar logos ou fotos oficiais de restaurantes (direitos autorais); capas vêm de fotos públicas da comunidade ou de capa ilustrada.
- Privacidade é regra de produto: o que é "somente amigos" ou "privado", ou de perfil privado, nunca aparece para quem não tem permissão (inclusive em capas e no feed).
- Mapa gastronômico foi removido por decisão do usuário (não considerado funcional).

**Stack existente:** Angular 19 (frontend, Vercel), Java 17 + Spring Boot 3 + PostgreSQL/Neon (backend, Render). Monorepo `frontend/` + `backend/`.

## Brand Commitments

- Nome: **TASTE**, com o subtítulo "Diário gastronômico" e o mote "Boa comida, boas memórias."
- Logo: selo circular bordô com "T" geométrico bege inclinado e uma faísca dourada (`frontend/public/favicon.svg`, componente `shared/components/logo`).
- Identidade escolhida pelo usuário: fundo bordô como cor dominante, com bege, branco e dourado como complementos; tipografia Cormorant Garamond (títulos) + Inter (interface).
- Sem fotos decorativas nas páginas de entrada (landing, login, cadastro) — decisão explícita do usuário.
- Linguagem neutra em gênero (ex.: "Que bom te ver de novo", não "Bem-vinda").
- Voz observada no produto (inferida do texto atual, não confirmada formalmente): acolhedora, próxima e um pouco editorial, em português do Brasil.

## Evidence on Hand

- Seleção curada de 24 restaurantes reais com a fonte de cada destaque: `frontend/src/app/core/data/restaurants.data.ts`.
- Não existem depoimentos, números de usuários, métricas de uso, parceiros ou imprensa. Nada disso deve ser inventado em nenhuma superfície.

## Product Principles

1. **Indicação de quem você confia vem primeiro.** Decisões de produto devem favorecer o que conecta pessoas a indicações de amigos.
2. **Registrar tem que ser rápido.** Um registro acontece perto da mesa, muitas vezes no celular; cada passo extra custa uso.
3. **Privacidade é inegociável.** As regras de visibilidade valem em todo lugar, sem exceções silenciosas.
4. **Verdade sobre os dados.** Destaques citam sua fonte; limitações (dados incompletos, recursos provisórios) são ditas com clareza, nunca escondidas ou inventadas.
5. **Feito para o Brasil inteiro.** Nada pode depender de estar em uma cidade específica.

## Accessibility & Inclusion

Sem requisito formal definido pelo usuário. O projeto já mantém contraste de texto em nível AA, alvos de toque de pelo menos 40 px no celular, rótulos acessíveis em ícones e controles, e linguagem neutra em gênero — essas práticas devem ser preservadas.
