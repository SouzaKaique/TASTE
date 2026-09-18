# TASTE — Diário Gastronômico

Plataforma digital para registrar, avaliar e reviver experiências gastronômicas: diário pessoal, rede social, mapa, favoritos/coleções e retrospectiva anual com Top 3.

Este é o **frontend** do projeto, construído em **Angular 19** (componentes standalone) + **Bootstrap 5**. Não há backend: todos os dados vêm de uma camada de serviços com dados mockados (`src/app/core/mock-data`), pronta para ser trocada por chamadas HTTP reais no futuro sem reescrever os componentes.

## Como rodar o projeto

Pré-requisitos: [Node.js](https://nodejs.org) instalado (qualquer versão 20+).

1. Abra um terminal na pasta `taste-app`.
2. Instale as dependências (só precisa fazer isso uma vez, ou sempre que o `package.json` mudar):

```bash
npm install
```

3. Inicie o servidor de desenvolvimento:

```bash
npm start
```

4. Abra `http://localhost:4200` no navegador. A página recarrega automaticamente a cada alteração de código.

Na tela de login existe um botão **"Entrar com conta de demonstração"** que já entra com um perfil pré-populado (Clara Marques) com ~20 experiências, restaurantes, feed social e retrospectiva prontos para explorar.

## O que já está implementado

- Landing page, cadastro, login (mockado — qualquer e-mail cadastrado nos dados de demonstração com senha de 4+ caracteres funciona).
- Dashboard com estatísticas, atalhos e destaques.
- Registro, edição, exclusão e detalhe de experiências (com busca/cadastro de restaurante, avaliação por estrelas, fotos, tags, critérios opcionais).
- Listagem com filtros (grade, lista, linha do tempo).
- Busca de restaurantes e página de detalhe.
- Descobrir, Mapa gastronômico (visualização ilustrativa — ver nota abaixo), Feed social, busca de amigos.
- Favoritos e coleções.
- Retrospectiva anual com estatísticas, gráfico por mês, Top 3 automático (critério de desempate documentado no código) e destaques manuais por categoria.
- Perfil próprio/de terceiros, configurações e privacidade.
- Design responsivo (desktop com menu lateral, mobile com navegação inferior), estados de carregamento/vazio/erro, acessibilidade básica (foco visível, labels, navegação por teclado no star-rating).

## Limitações conhecidas (propositais)

- **Sem backend real**: não há autenticação, banco de dados ou upload de arquivo persistente. Os dados voltam ao estado inicial a cada recarregamento completo da página (F5) — isso é esperado nesta fase.
- **Fotos**: usa imagens do serviço público [picsum.photos](https://picsum.photos) como placeholder. Como esse serviço retorna fotos aleatórias (não necessariamente de comida), as imagens nem sempre parecem pratos reais — troque pela foto real do usuário quando o upload de arquivos for implementado.
- **Mapa**: como não há uma chave de API de mapas configurada, a tela de Mapa mostra uma visualização ilustrativa e claramente identificada como demonstração, agrupando experiências por cidade. Estrutura pronta para integrar um provedor de mapas real depois.
- **Restaurantes**: a "busca" usa uma base de dados de demonstração local, não uma API de lugares real.

## Estrutura do projeto

```
src/app/
  core/            # modelos TypeScript, serviços (mockados), guards, mock-data
  shared/          # componentes reutilizáveis (star-rating, cards, avatar, toasts, etc.)
  layout/          # shell da aplicação autenticada (sidebar + bottom nav)
  features/        # uma pasta por tela/fluxo (auth, dashboard, experiences, retrospective, ...)
```

## Próximos passos sugeridos

1. Construir um backend simples (ex.: Node/Express ou Firebase) para persistir usuários e experiências.
2. Implementar upload real de imagens.
3. Integrar uma API de restaurantes/lugares e um provedor de mapas.
4. Adicionar autenticação real (JWT ou OAuth) — os guards e o interceptor já estão preparados para isso.

---

## Comandos úteis do Angular CLI

```bash
npm start              # ng serve — ambiente de desenvolvimento
npm run build           # build de produção em dist/
npm test                # testes unitários (Karma)
```

Para gerar novos componentes: `npx ng generate component features/nome-da-tela`.
