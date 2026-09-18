<div align="center">

<img src="public/favicon.svg" width="72" height="72" alt="TASTE logo" />

# TASTE
### Seu diário gastronômico

*Boa comida, boas memórias.*

[![Angular](https://img.shields.io/badge/Angular-19-DD0031?style=flat-square&logo=angular&logoColor=white)](https://angular.dev)
[![Bootstrap](https://img.shields.io/badge/Bootstrap-5-7952B3?style=flat-square&logo=bootstrap&logoColor=white)](https://getbootstrap.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/license-MIT-4b1d24?style=flat-square)](#licença)

</div>

---

## Sobre o projeto

**TASTE** é uma plataforma para registrar, avaliar e reviver experiências gastronômicas — um diário pessoal, uma rede social e uma retrospectiva anual, tudo em um único lugar.

A proposta central: ao longo do ano você registra os pratos, sobremesas e restaurantes que experimenta, avalia cada um com estrelas, e no fim do ano o TASTE monta automaticamente o **Top 3** das suas melhores experiências — combinando um ranking automático com destaques escolhidos manualmente por você.

Este repositório contém o **frontend** completo da aplicação. Não há backend: os dados vêm de uma camada de serviços mockados, isolada e pronta para ser substituída por uma API real sem reescrever nenhuma tela.

## Funcionalidades

| Módulo | Descrição |
|---|---|
| 📓 **Diário gastronômico** | Registro completo de experiências: prato, categoria, culinária, restaurante, cidade, foto, relato pessoal, tags e visibilidade |
| ⭐ **Avaliação por estrelas** | Nota geral de 1 a 5, com critérios opcionais (sabor, apresentação, textura, criatividade) |
| 🔍 **Descoberta** | Busca de restaurantes, cadastro manual, página de detalhe com histórico pessoal |
| 🗺️ **Mapa gastronômico** | Visualização das cidades exploradas, agrupada por experiências registradas |
| 👥 **Rede social** | Amigos, feed de atividades, curtidas e comentários |
| ❤️ **Favoritos e coleções** | Organização pessoal de pratos e restaurantes em listas temáticas |
| 🏆 **Retrospectiva anual** | Estatísticas do ano, gráfico mensal, Top 3 automático e destaques manuais por categoria |
| 👤 **Perfil e privacidade** | Perfil público/privado, edição de conta, controle de visibilidade |

## Tecnologias

- **[Angular 19](https://angular.dev)** — componentes standalone, signals, Reactive Forms, lazy loading
- **[Bootstrap 5](https://getbootstrap.com)** + Bootstrap Icons — customizado com um design system próprio
- **TypeScript** — tipagem estrita em modelos, serviços e componentes
- **SCSS** com design tokens (cores, tipografia, espaçamento) centralizados

## Identidade visual

Paleta editorial em tons de bordô, bege e dourado, com tipografia serifada (Cormorant Garamond) para títulos e sans-serif (Inter) para interface — pensada para transmitir sofisticação, curadoria e memória afetiva em torno da comida.

## Como rodar o projeto

Pré-requisito: [Node.js](https://nodejs.org) 20 ou superior.

```bash
# 1. Instale as dependências
npm install

# 2. Inicie o servidor de desenvolvimento
npm start
```

Abra `http://localhost:4200` no navegador. Na tela de login, use o botão **"Entrar com conta de demonstração"** para explorar a aplicação sem precisar criar uma conta.

## Estrutura do projeto

```
src/app/
├─ core/          # modelos TypeScript, serviços (mockados), guards, dados de demonstração
├─ shared/        # componentes reutilizáveis (star-rating, cards, avatar, toasts, modais...)
├─ layout/        # shell da aplicação autenticada (sidebar desktop + navegação mobile)
└─ features/      # uma pasta por tela/fluxo (auth, dashboard, experiences, retrospective...)
```

## Limitações conhecidas (propositais)

Este é um projeto pessoal em fase de demonstração — algumas limitações são intencionais nesta etapa:

- **Sem backend real**: não há autenticação, banco de dados ou upload persistente. Os dados voltam ao estado inicial a cada recarregamento completo da página.
- **Fotos**: usa o serviço público [picsum.photos](https://picsum.photos) como placeholder de imagem, já que ainda não há upload real de arquivos.
- **Mapa**: como não há uma chave de API de mapas configurada, a tela exibe uma visualização ilustrativa e claramente identificada como demonstração.
- **Restaurantes**: a busca usa uma base de dados local de demonstração, não uma API de lugares real.

## Roteiro futuro

- [ ] Backend com persistência real (usuários, experiências, uploads)
- [ ] Autenticação real (os guards e o interceptor já estão preparados para isso)
- [ ] Integração com uma API de lugares e um provedor de mapas
- [ ] Upload de imagens

## Licença

Projeto pessoal, distribuído sob licença MIT.

---

<div align="center">

Desenvolvido por **Kaique Souza**

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Kaique_Souza-0A66C2?style=flat-square&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/kaique-souzaa/)

</div>
