<div align="center">

<img src="frontend/public/favicon.svg" width="72" height="72" alt="TASTE logo" />

# TASTE
### Seu diário gastronômico

*Boa comida, boas memórias.*

[![Angular](https://img.shields.io/badge/Angular-19-DD0031?style=flat-square&logo=angular&logoColor=white)](https://angular.dev)
[![Bootstrap](https://img.shields.io/badge/Bootstrap-5-7952B3?style=flat-square&logo=bootstrap&logoColor=white)](https://getbootstrap.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3-6DB33F?style=flat-square&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://neon.tech)
[![License](https://img.shields.io/badge/license-MIT-4b1d24?style=flat-square)](#licença)

</div>

---

## Sobre o projeto

**TASTE** é uma plataforma para registrar, avaliar e reviver experiências gastronômicas — um diário pessoal, uma rede social e uma retrospectiva anual, tudo em um único lugar.

A proposta central: ao longo do ano você registra os pratos, sobremesas e restaurantes que experimenta, avalia cada um com estrelas, e no fim do ano o TASTE monta automaticamente o **Top 3** das suas melhores experiências — combinando um ranking automático com destaques escolhidos manualmente por você.

Este repositório reúne as duas partes da aplicação:

| Pasta | O que é | Publicado em |
|---|---|---|
| [`frontend/`](frontend) | Aplicação web em Angular | Vercel |
| [`backend/`](backend) | API REST em Java + Spring Boot, com banco PostgreSQL | Render + Neon |

## Funcionalidades

| Módulo | Descrição |
|---|---|
| 📓 **Diário gastronômico** | Registro completo de experiências: prato, categoria, culinária, restaurante, cidade, foto, relato pessoal, tags e visibilidade |
| ⭐ **Avaliação por estrelas** | Nota geral de 1 a 5, com critérios opcionais (sabor, apresentação, textura, criatividade) |
| 🔍 **Descoberta** | Busca de restaurantes do Brasil todo (OpenStreetMap), destaques curados por cidade, capas com fotos da comunidade |
| 👥 **Rede social** | Amigos, feed de atividades, curtidas, comentários e notificações |
| ❤️ **Favoritos e coleções** | Organização pessoal de pratos e restaurantes em listas temáticas |
| 🏆 **Retrospectiva anual** | Estatísticas do ano, gráfico mensal, Top 3 automático e destaques manuais por categoria |
| 👤 **Perfil e privacidade** | Perfil público/privado, edição de conta, controle de visibilidade |

## Tecnologias

**Frontend**
- **[Angular 19](https://angular.dev)** — componentes standalone, signals, Reactive Forms, lazy loading
- **[Bootstrap 5](https://getbootstrap.com)** + Bootstrap Icons — customizado com um design system próprio
- **TypeScript** — tipagem estrita em modelos, serviços e componentes
- **SCSS** com design tokens (cores, tipografia, espaçamento) centralizados

**Backend**
- **Java 17 + [Spring Boot 3](https://spring.io/projects/spring-boot)** — API REST com Spring Web, Spring Data JPA e Bean Validation
- **Spring Security + JWT** — autenticação stateless, senhas com BCrypt e dados isolados por usuário
- **PostgreSQL** ([Neon](https://neon.tech)) em produção e H2 em memória no desenvolvimento
- **Docker** — imagem enxuta para o plano gratuito do [Render](https://render.com)

## Identidade visual

Paleta editorial em tons de bordô, bege e dourado, com tipografia serifada (Cormorant Garamond) para títulos e sans-serif (Inter) para interface — pensada para transmitir sofisticação, curadoria e memória afetiva em torno da comida.

## Como rodar o projeto

Pré-requisitos: [Node.js](https://nodejs.org) 20+ e Java 17+.

```bash
# Backend (http://localhost:8080) — usa banco H2 em memória, sem configuração
cd backend
./mvnw spring-boot:run

# Frontend (http://localhost:4200), em outro terminal
cd frontend
npm install
npm start
```

Abra `http://localhost:4200` e crie uma conta na tela de cadastro.

## Estrutura do projeto

```
frontend/src/app/
├─ core/          # modelos, serviços HTTP, guards, interceptor de autenticação
├─ shared/        # componentes reutilizáveis (star-rating, cards, avatar, toasts, modais...)
├─ layout/        # shell da aplicação autenticada (sidebar desktop + navegação mobile)
└─ features/      # uma pasta por tela/fluxo (auth, dashboard, experiences, retrospective...)

backend/src/main/java/com/taste/backend/
├─ config/        # segurança (JWT, CORS) e leitura da DATABASE_URL
├─ security/      # geração e validação de tokens JWT
├─ user/          # cadastro, login e perfil
├─ experience/    # CRUD de experiências gastronômicas
└─ common/        # tratamento padronizado de erros
```

## API

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/auth/register` | Cria uma conta e devolve o token |
| `POST` | `/api/auth/login` | Autentica e devolve o token |
| `GET` / `PATCH` | `/api/users/me` | Lê ou atualiza o próprio perfil |
| `GET` | `/api/users/{username}` | Perfil público (sem e-mail) |
| `GET` / `POST` | `/api/experiences` | Lista ou cria experiências do usuário |
| `GET` / `PUT` / `DELETE` | `/api/experiences/{id}` | Detalha, edita ou remove (somente o dono) |
| `PATCH` | `/api/experiences/{id}/favorite` | Marca ou desmarca como favorita |
| `GET` / `POST` / `DELETE` | `/api/friends/...` | Busca de pessoas, pedidos e amizades |
| `GET` | `/api/feed` | Experiências próprias e de amigos, com curtidas e comentários |
| `GET` / `POST` | `/api/notifications/...` | Notificações e contador de não lidas |
| `GET` | `/api/places/search?q=` | Busca de restaurantes no OpenStreetMap (Photon) |
| `GET` | `/api/places/{id}` | Detalhes de um restaurante (Nominatim) |

## Deploy

- **Frontend (Vercel):** projeto com *Root Directory* `frontend`. A URL da API fica em `frontend/src/environments/environment.ts`.
- **Backend (Render):** blueprint em [`render.yaml`](render.yaml), com imagem Docker em `backend/Dockerfile`. Variáveis de ambiente: `DATABASE_URL` (connection string do Neon), `TASTE_CORS_ALLOWED_ORIGINS` (URL do site) e `TASTE_JWT_SECRET` (gerado pelo Render).

## Limitações conhecidas (propositais)

Este é um projeto pessoal em fase de demonstração — algumas limitações são intencionais nesta etapa:

- **Módulos ainda demonstrativos**: contas, experiências, amigos, feed e notificações são reais; coleções ainda usam dados de demonstração.
- **Busca de restaurantes**: usa dados abertos do OpenStreetMap, que podem não incluir todos os estabelecimentos — por isso o cadastro manual continua disponível.
- **Fotos**: são reduzidas no navegador e guardadas no próprio banco, uma solução provisória até existir um serviço de armazenamento de arquivos.
- **Plano gratuito**: o backend no Render "dorme" após 15 minutos sem uso; o primeiro acesso depois disso pode levar cerca de um minuto.
- **Mapa**: como não há uma chave de API de mapas configurada, a tela exibe uma visualização ilustrativa e claramente identificada como demonstração.
- **Restaurantes**: a busca usa uma base de dados local de demonstração, não uma API de lugares real.

## Roteiro futuro

- [x] Backend com persistência real (usuários e experiências)
- [x] Autenticação real com JWT
- [x] Amigos, feed e notificações no backend
- [x] Busca de restaurantes com dados abertos (OpenStreetMap)
- [ ] Coleções no backend
- [ ] Upload de imagens em um serviço de armazenamento

## Licença

Projeto pessoal, distribuído sob licença MIT.

---

<div align="center">

Desenvolvido por **Kaique Souza**

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Kaique_Souza-0A66C2?style=flat-square&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/kaique-souzaa/)

</div>
