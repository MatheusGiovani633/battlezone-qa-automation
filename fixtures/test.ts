import { test as base, expect, type APIRequestContext } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';
import { NavBar } from '../pages/NavBar';
import { AccountPage, MyDecklistsPage, MyRegistrationsPage } from '../pages/PlayerAreaPages';
import { PlansPage } from '../pages/PlansPage';
import { RankingPage } from '../pages/RankingPage';
import { TournamentDetailPage } from '../pages/TournamentDetailPage';
import { TournamentsPage } from '../pages/TournamentsPage';
import type { Plan, RankingEntry, TournamentPublic } from '../support/api-types';
import { newPlayerApi } from '../support/auth';
import { API_URL } from '../support/env';

type Pages = {
  nav: NavBar;
  homePage: HomePage;
  tournamentsPage: TournamentsPage;
  tournamentDetailPage: TournamentDetailPage;
  rankingPage: RankingPage;
  plansPage: PlansPage;
  loginPage: LoginPage;
  myRegistrationsPage: MyRegistrationsPage;
  myDecklistsPage: MyDecklistsPage;
  accountPage: AccountPage;
  readOnlyGuard: void;
};

/**
 * A massa vem da própria API da homologação, lida uma vez por worker.
 * Os E2E comparam a tela com ela em vez de fixar nomes de torneio, que
 * mudam todo mês.
 */
type HomologData = {
  homologApi: APIRequestContext;
  openTournaments: TournamentPublic[];
  ranking: RankingEntry[];
  plans: Plan[];
  /** Só nos projetos logados: a API com o Bearer do jogador de teste. */
  playerApi: APIRequestContext;
};

async function getJson<T>(api: APIRequestContext, path: string): Promise<T> {
  const response = await api.get(path);
  expect(response, `GET ${path}`).toBeOK();
  return (await response.json()) as T;
}

export const test = base.extend<Pages, HomologData>({
  homologApi: [
    async ({ playwright }, use) => {
      const api = await playwright.request.newContext({ baseURL: API_URL });
      await use(api);
      await api.dispose();
    },
    { scope: 'worker' },
  ],
  openTournaments: [
    async ({ homologApi }, use) => {
      // Mesma estratégia da tela /campeonatos: lotes de 100 até o primeiro incompleto.
      const all: TournamentPublic[] = [];
      for (let page = 1; ; page++) {
        const batch = await getJson<TournamentPublic[]>(homologApi, `/tournaments?page=${page}&pageSize=100`);
        all.push(...batch);
        if (batch.length < 100) break;
      }
      await use(all);
    },
    { scope: 'worker' },
  ],
  ranking: [
    async ({ homologApi }, use) => use((await getJson<{ items: RankingEntry[] }>(homologApi, '/players/ranking')).items),
    { scope: 'worker' },
  ],
  plans: [async ({ homologApi }, use) => use(await getJson<Plan[]>(homologApi, '/plans')), { scope: 'worker' }],

  playerApi: [
    async ({ playwright }, use) => {
      const api = await newPlayerApi(playwright);
      await use(api);
      await api.dispose();
    },
    { scope: 'worker' },
  ],

  // A homologação divide o banco com a produção: qualquer escrita que a tela
  // tente na API é barrada aqui e reprova o teste.
  readOnlyGuard: [
    async ({ page }, use) => {
      const writes: string[] = [];
      await page.route(`${API_URL}/**`, route => {
        const { method, url } = { method: route.request().method(), url: route.request().url() };
        if (['GET', 'HEAD', 'OPTIONS'].includes(method)) return route.fallback();
        writes.push(`${method} ${url}`);
        return route.abort('blockedbyclient');
      });
      await use();
      expect(writes, 'a tela tentou escrever na API da homologação').toEqual([]);
    },
    { auto: true },
  ],

  nav: async ({ page }, use) => use(new NavBar(page)),
  homePage: async ({ page }, use) => use(new HomePage(page)),
  tournamentsPage: async ({ page }, use) => use(new TournamentsPage(page)),
  tournamentDetailPage: async ({ page }, use) => use(new TournamentDetailPage(page)),
  rankingPage: async ({ page }, use) => use(new RankingPage(page)),
  plansPage: async ({ page }, use) => use(new PlansPage(page)),
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  myRegistrationsPage: async ({ page }, use) => use(new MyRegistrationsPage(page)),
  myDecklistsPage: async ({ page }, use) => use(new MyDecklistsPage(page)),
  accountPage: async ({ page }, use) => use(new AccountPage(page)),
});

export { expect };
