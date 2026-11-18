import { expect, test } from '../../fixtures/test';
import { cardIds, GAME_LABEL } from '../../support/format';

test.describe('Home', () => {
  test.beforeEach(async ({ homePage }) => {
    await homePage.goto();
    await expect(homePage.heading).toBeVisible();
  });

  test('carrega e mostra os torneios abertos que a API devolve @smoke', async ({ homePage, openTournaments }) => {
    const cards = homePage.cards();
    await expect(cards.first()).toBeVisible();

    // Sem localização a lista vem por data: o primeiro card é o próximo torneio.
    await expect(cards.first().getByRole('heading', { level: 3 })).toHaveText(openTournaments[0].name);

    const apiIds = new Set(openTournaments.map(t => t.id));
    for (const id of await cardIds(cards)) expect(apiIds).toContain(id);
  });

  test('seção de regionais só lista torneios da categoria regional @regression', async ({ homePage, openTournaments }) => {
    const regionalIds = new Set(openTournaments.filter(t => t.category === 'regional').map(t => t.id));
    test.skip(regionalIds.size === 0, 'massa sem torneio regional');

    const links = homePage.regionalTournaments.getByRole('link', { name: /^(?!Ver todos)/ });
    await expect(links.first()).toBeVisible();
    for (const id of await cardIds(links)) expect(regionalIds).toContain(id);
  });

  test('filtro por jogo deixa só torneios daquele jogo @regression', async ({ homePage, openTournaments }) => {
    const game = openTournaments[0].game;
    const expectedIds = new Set(openTournaments.filter(t => t.game === game).map(t => t.id));

    await homePage.filterChip(GAME_LABEL[game]).click();
    await expect(homePage.filterChip(GAME_LABEL[game])).toHaveAttribute('aria-pressed', 'true');

    const cards = homePage.cards();
    await expect(cards.first()).toContainText(GAME_LABEL[game]);
    // O filtro é feito no cliente, no mesmo render que marca o chip.
    for (const id of await cardIds(cards)) expect(expectedIds).toContain(id);
  });

  test('jogo sem torneio mostra estado vazio e "Limpar filtros" volta a lista @regression', async ({
    homePage,
    openTournaments,
  }) => {
    const present = new Set(openTournaments.map(t => t.game));
    const absent = Object.keys(GAME_LABEL).find(game => !present.has(game));
    test.skip(!absent, 'todos os jogos têm torneio aberto; não há filtro vazio para testar');

    await homePage.filterChip(GAME_LABEL[absent!]).click();
    await expect(homePage.emptyFilter).toBeVisible();
    await expect(homePage.cards()).toHaveCount(0);

    await homePage.clearFilters.click();
    await expect(homePage.filterChip('Todos os jogos')).toHaveAttribute('aria-pressed', 'true');
    await expect(homePage.cards().first()).toBeVisible();
  });

  test('"Ver campeonatos" leva para a busca completa @regression', async ({ page, tournamentsPage }) => {
    await page.getByRole('link', { name: 'Ver campeonatos' }).click();

    await expect(page).toHaveURL(/\/campeonatos$/);
    await expect(tournamentsPage.heading).toBeVisible();
  });
});
