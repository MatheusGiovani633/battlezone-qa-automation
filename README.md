# BattleZone · Automação de testes

[![Testes](https://github.com/MatheusGiovani633/battlezone-qa-automation/actions/workflows/tests.yml/badge.svg)](https://github.com/MatheusGiovani633/battlezone-qa-automation/actions/workflows/tests.yml)
[![k6](https://github.com/MatheusGiovani633/battlezone-qa-automation/actions/workflows/k6.yml/badge.svg)](https://github.com/MatheusGiovani633/battlezone-qa-automation/actions/workflows/k6.yml)

Suíte de testes automatizados (API, E2E e performance) do **BattleZone**, rodando contra o ambiente de **homologação**.

**Relatório da última execução na `main`:** https://matheusgiovani633.github.io/battlezone-qa-automation/

## O que é o BattleZone

Uma plataforma de torneios de card game (Pokémon, Magic, Yu-Gi-Oh!, One Piece e outros), desenvolvida como TCC. Lojas publicam torneios e jogadores se inscrevem, pagam, montam a decklist e entram no ranking.

- Front: React + Vite + TypeScript, homologação em https://battlezone-bay.vercel.app
- API: FastAPI (Python), homologação em https://api-homolog.battlezone.net.br (contrato em `/openapi.json`)

## Estratégia de testes

A pirâmide pesa mais na API do que na interface: teste de API é mais rápido e mais estável, e acha o defeito mais perto da causa. O E2E fica com o que só a tela prova (renderização, navegação, filtros no cliente, responsivo).

| Camada | Ferramenta | Testes | O que cobre |
| --- | --- | --- | --- |
| API pública | Playwright `request` + Ajv | 45 | `/status`, `/openapi.json`, `/tournaments` (filtros, paginação, 422 de cada parâmetro), `/tournaments/{id}` e 404, `/players/ranking`, `/players/search`, `/players/{id}`, `/plans`, `/auth/providers`, `/cards/search` sem login (401), `POST /login` sem captcha (400) e com captcha de teste e senha errada (401) |
| API logada | idem, com o JWT do setup | 18 | `/players/me`, `/players/me/registrations`, `/players/me/decklists` (e filtro), `/notifications/me` (e 422 de paginação), `/cards/search` válido, offset e 422, mesma resposta para senha errada e conta inexistente |
| E2E desktop | Playwright, Chromium | 35 | home e torneios abertos, filtros e busca, detalhe de torneio, ranking e busca de jogadores, planos, login (só renderização), navegação, 404 |
| E2E celular | Playwright, Pixel 7 | 43 | os mesmos 35 no layout de celular + 8 de responsivo (sem rolagem lateral, menu sanduíche, cards em uma coluna) |
| E2E logado | Playwright, Chromium | 6 | menu da conta, "Meu perfil", "Minhas inscrições", "Minhas decklists", "Minha conta" (só leitura) |
| Performance | k6 | 2 scripts | smoke (1 VU) e carga leve (até 10 VUs) nos GETs públicos |

Total: 148 testes Playwright (incluindo o login do `setup`), 45 marcados `@smoke` e o resto `@regression`.

### Contrato com o openapi.json

Os testes de API validam o corpo de cada resposta contra o schema que a própria homologação publica em `/openapi.json` (OpenAPI 3.1 = JSON Schema 2020-12, validado com Ajv; ver `support/contract.ts`). Se o back renomear ou remover um campo obrigatório sem atualizar o contrato, o teste acusa. Além do formato, os testes conferem regras de negócio: taxa de serviço de 7%, total = inscrição + taxa, vagas ocupadas ≤ máximo, ordem por data, posições do ranking em sequência.

### Os E2E comparam a tela com a API

Torneios abertos mudam toda semana, então nenhum teste fixa nome de torneio. A massa é lida da própria API no começo de cada worker (`fixtures/test.ts`) e a tela é comparada com ela: o primeiro card é o próximo torneio, o contador bate com o total, o preço formatado bate com os centavos da API.

### O que fica de fora, e por quê

**Nada escreve dados.** A homologação roda na mesma máquina (EC2) e no mesmo banco (RDS) da produção. Por isso:

- Os testes só fazem GET. A única exceção é o `POST /login`, que não grava nada.
- Os E2E têm uma guarda (`readOnlyGuard` em `fixtures/test.ts`): qualquer POST, PUT, PATCH ou DELETE que a tela tente na API é bloqueado e reprova o teste.
- Ficam de fora inscrição em torneio, pagamento PIX, criar ou editar decklist, cadastro, recuperação de senha, área do organizador e qualquer botão que mude estado. Esses fluxos pedem um banco isolado (ver próximos passos).
- A busca de cartas só existe na tela dentro do montador de decklist, que salva rascunho sozinho. Por isso ela é coberta pela API e não pela tela.
- O k6 tem teto rígido de 10 VUs.

**O formulário de login não é enviado pela tela.** O Turnstile (captcha) não deixa. A homologação usa a chave de teste do Turnstile, então o projeto `setup` faz o login pela API com o token de teste e grava o JWT no `localStorage` do front, onde o `AuthContext` do app o procura. Para o app é o mesmo que ter logado pela tela.

## Arquitetura

```
.
├── .github/workflows/
│   ├── tests.yml            # Playwright: push/PR na main, todo dia e manual; publica o relatório no Pages
│   └── k6.yml               # k6: smoke toda semana; load só manual
├── fixtures/
│   ├── api.ts               # contrato (openapi.json), playerApi, expectBusinessError
│   └── test.ts              # page objects, massa da homologação, playerApi, readOnlyGuard
├── k6/
│   ├── lib.js               # alvo, jornada do visitante, thresholds, handleSummary
│   ├── smoke.js             # 1 VU, 30 s
│   ├── load.js              # rampa até 10 VUs, ~3 min
│   └── results/             # summaries gerados (fora do git)
├── pages/                   # Page Objects (HomePage, NavBar, TournamentsPage, ...)
├── support/
│   ├── env.ts               # URLs por variável de ambiente; recusa produção
│   ├── auth.ts              # storageState do setup e contexto de API logado
│   ├── contract.ts          # validação Ajv contra o openapi.json
│   ├── api-types.ts         # tipos das respostas usadas
│   └── format.ts            # moeda, rótulos de jogo, ids dos cards
├── tests/
│   ├── auth.setup.ts        # projeto setup: login pela API e storageState
│   ├── api/                 # projeto api
│   ├── api-auth/            # projeto api-auth (depende do setup)
│   ├── e2e/                 # projetos chromium e mobile (mobile/ só no Pixel 7)
│   └── e2e-auth/            # projeto chromium-auth (depende do setup)
└── playwright.config.ts
```

- **Page Object Model:** cada tela tem uma classe em `pages/` com locators por papel, rótulo e texto visível (`getByRole`, `getByLabel`, `getByText`), os mesmos que um leitor de tela usa. Nenhum seletor CSS ou XPath, nenhum `waitForTimeout`: as esperas são as asserções com retry do Playwright e `expect.poll`.
- **Fixtures:** os page objects, a massa lida da API e o contexto de API logado chegam ao teste por fixture, sem `beforeAll` espalhado.
- **Projetos:** `setup` → `api-auth` e `chromium-auth` dependem dele. Sem `QA_USER_EMAIL`/`QA_USER_PASSWORD`, o setup e os testes logados pulam com a mensagem de como configurar, e o resto roda normalmente.
- **Tags:** `@smoke` (o caminho feliz de cada área, para rodar rápido) e `@regression` (bordas, validação, filtros).
- **Sem retry:** `retries: 0` de propósito. Teste instável é consertado na causa, não escondido.
- **Relatório público sem segredo:** nos projetos logados não há trace, vídeo nem screenshot, que guardariam o JWT e o e-mail da conta.
- **Produção bloqueada:** `support/env.ts` e `k6/lib.js` recusam `battlezone.net.br` e `api.battlezone.net.br` antes de qualquer requisição.

## Como rodar

Pré-requisitos: Node 22 e, para performance, o [k6](https://grafana.com/docs/k6/latest/set-up/install-k6/).

```bash
npm ci
npx playwright install chromium
cp .env.example .env   # opcional: preencha QA_USER_EMAIL e QA_USER_PASSWORD para os testes logados
```

| Comando | O que faz |
| --- | --- |
| `npm test` | suíte inteira (todos os projetos) |
| `npm run test:smoke` | só `@smoke` |
| `npm run test:regression` | só `@regression` |
| `npm run test:api` | projetos `api` e `api-auth` |
| `npm run test:e2e` | projetos `chromium`, `mobile` e `chromium-auth` |
| `npm run report` | abre o último relatório HTML |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run k6:smoke` | k6, 1 VU por 30 s |
| `npm run k6:load` | k6, rampa até 10 VUs por ~3 min |

Variáveis (todas opcionais): `WEB_URL` e `API_URL` (padrão: homologação), `QA_USER_EMAIL` e `QA_USER_PASSWORD` (conta de jogador da homologação).

## CI (GitHub Actions)

- **`tests.yml`:** em push e PR na `main`, todo dia às 06:00 (Brasília) e manual. Roda `npm ci`, typecheck e a suíte. O relatório HTML vai como artifact e, só na `main`, é publicado no GitHub Pages. As credenciais vêm dos secrets `QA_USER_EMAIL` e `QA_USER_PASSWORD`; sem eles (PR de fork, por exemplo), os testes logados pulam.
- **`k6.yml`:** smoke toda segunda e manual, com escolha `smoke` ou `load`. O load só roda à mão. O resumo em markdown aparece na página do job e o `summary.json` vai como artifact.

## Resultados do k6

Medidos em 17/11/2026, de uma máquina no Brasil contra `api-homolog.battlezone.net.br`. A jornada de cada usuário virtual é a visita de um anônimo: lista de torneios, detalhe de um torneio, ranking, planos, provedores de login e `/status`, com 1 a 3 s de pausa no fim.

| Execução | VUs | Duração | Requisições | Vazão | Mediana | p(95) | Máx | Erros | Checks |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Smoke | 1 | 30 s | 67 | 2,2 req/s | 180 ms | 208 ms | 234 ms | 0% | 110/110 |
| Load | rampa até 10 | 3 min | 2.557 | 14,1 req/s | 185 ms | 288 ms | 878 ms | 0% | 4.260/4.260 |

p(95) por endpoint no load: `/auth/providers` 175 ms, `/status` 175 ms, `/tournaments/{id}` 234 ms, `/plans` 246 ms, `/players/ranking` 274 ms, `/tournaments` 374 ms (a listagem de 100 itens é a mais pesada).

Com 10 usuários a mediana quase não mudou (180 → 185 ms) e o p(95) subiu 80 ms. A maior parte dos ~150 ms de piso é latência de rede até o servidor (`/status`, que não faz nada, já leva isso). Os thresholds (`http_req_failed < 1%`, `checks > 99%`, `p(95) < 1000 ms` no geral e por endpoint) foram calibrados a partir do smoke, com folga para a rede do runner do GitHub. No smoke, que faz só 70 a 85 requisições, o limite de erro é 3% (e checks > 97%): uma única queda de conexão entre o runner e a Cloudflare, sem a requisição chegar à API, já passava de 1% e reprovava a execução. Isso não é teste de capacidade: com o teto de 10 VUs ele mostra que a API aguenta uma concorrência pequena sem degradar, não onde ela quebra.

## Achados na homologação

Nenhum defeito funcional nas rotas e telas cobertas. Dois pontos de contrato apareceram ao escrever os testes:

- **Formato de erro inconsistente.** Captcha ausente (400), rota sem token (401) e recurso inexistente (404) respondem `{ "resultData": { "code", "description", "responseId" } }`. Já o login com senha errada (401) responde no formato padrão do FastAPI, `{ "detail": "..." }`. Um cliente precisa tratar os dois.
- **O openapi.json não documenta as respostas de erro do login.** `POST /login` declara só 200 (sem schema do corpo) e 422; o 400 do captcha, o 401 e o formato `{ token, token_type }` ficam fora do contrato. Por isso o teste do login confere o corpo à mão em vez de validar pelo schema. As rotas `/players/me*` também não declaram o 401.

## Próximos passos

- **Testes que escrevem dados num banco isolado:** inscrição, cancelamento, decklist, cadastro e área do organizador, com massa criada e apagada por teste. Pede uma homologação com banco próprio.
- **Pagamento PIX em sandbox:** o fluxo de inscrição paga com as credenciais de teste do Mercado Pago, incluindo o webhook de confirmação e o estorno.
- **Observabilidade durante o k6:** CPU e memória da EC2, conexões e tempo de query do RDS no mesmo período da carga, para saber de onde vem a latência e não só quanto ela é.
- **Acessibilidade automatizada** com axe-core nas telas públicas.

## Licença

[MIT](LICENSE) © Matheus Giovani da Silva Pereira
