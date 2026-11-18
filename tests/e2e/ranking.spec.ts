import { expect, test } from '../../fixtures/test';
import type { RankingEntry } from '../../support/api-types';
import { escapeRegExp, GAME_LABEL } from '../../support/format';

const TOP = 10;
const topNames = (items: RankingEntry[]) => items.slice(0, TOP).map(i => i.name ?? '');

test.describe('Ranking de jogadores', () => {
  test.beforeEach(async ({ rankingPage }) => {
    await rankingPage.goto();
    await expect(rankingPage.heading).toBeVisible();
  });

  test('lista os jogadores na mesma ordem da API @smoke', async ({ rankingPage, ranking }) => {
    await expect(rankingPage.players.first()).toBeVisible();

    await expect.poll(async () => (await rankingPage.players.allInnerTexts()).slice(0, TOP)).toEqual(topNames(ranking));
  });

  test('filtro por jogo mostra o ranking daquele jogo @regression', async ({ rankingPage, homologApi, openTournaments }) => {
    const game = openTournaments[0].game;
    const response = await homologApi.get(`/players/ranking?game=${game}`);
    const expected: RankingEntry[] = (await response.json()).items;
    test.skip(expected.length === 0, `ninguém pontuou em ${game} ainda`);

    await rankingPage.gameSelect.selectOption({ label: GAME_LABEL[game] });

    await expect.poll(async () => (await rankingPage.players.allInnerTexts()).slice(0, TOP)).toEqual(topNames(expected));
  });

  test('clicar no jogador abre o perfil público @regression', async ({ page, rankingPage, ranking }) => {
    const [leader] = ranking;

    await rankingPage.players.first().click();

    await expect(page).toHaveURL(new RegExp(`/jogadores/${leader.playerId}$`));
    await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toHaveText(leader.name!);
  });
});

test.describe('Busca de jogadores (cabeçalho)', () => {
  test('acha o jogador por 2 letras e abre o perfil @regression', async ({ page, nav, ranking }) => {
    const [leader] = ranking;
    await page.goto('/');

    const options = await nav.searchPlayer(leader.name!.slice(0, 2));
    const option = options.filter({ hasText: new RegExp(`^${escapeRegExp(leader.name!)}`) });
    await option.click();

    await expect(page).toHaveURL(new RegExp(`/jogadores/${leader.playerId}$`));
    await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toHaveText(leader.name!);
  });
});
