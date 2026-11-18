import { expect, test } from '../../fixtures/test';
import { cardIds, GAME_LABEL } from '../../support/format';

test.describe('Busca de campeonatos (/campeonatos)', () => {
  test.beforeEach(async ({ tournamentsPage }) => {
    await tournamentsPage.goto();
    await expect(tournamentsPage.heading).toBeVisible();
  });

  test('o contador mostra o total de torneios abertos da API @smoke', async ({ tournamentsPage, openTournaments }) => {
    const total = openTournaments.length;

    await expect(tournamentsPage.counter).toHaveText(new RegExp(`^${total} campeonatos?`));
    await expect(tournamentsPage.cards().first()).toBeVisible();
  });

  test('busca pelo nome filtra a lista @regression', async ({ tournamentsPage, openTournaments }) => {
    const term = openTournaments[0].name;
    const expected = openTournaments.filter(
      t => t.name.toLowerCase().includes(term.toLowerCase()) || t.store.name.toLowerCase().includes(term.toLowerCase()),
    );

    await tournamentsPage.search.fill(term);

    await expect(tournamentsPage.counter).toHaveText(new RegExp(`^${expected.length} de ${openTournaments.length} `));
    await expect(tournamentsPage.cards()).toHaveCount(Math.min(expected.length, 20));
    for (const id of await cardIds(tournamentsPage.cards())) expect(expected.map(t => t.id)).toContain(id);
  });

  test('busca sem resultado mostra estado vazio e "Limpar filtros" restaura @regression', async ({
    tournamentsPage,
    openTournaments,
  }) => {
    await tournamentsPage.search.fill('zzz-nenhum-torneio-qa');

    await expect(tournamentsPage.emptyResult).toBeVisible();
    await expect(tournamentsPage.cards()).toHaveCount(0);

    await tournamentsPage.clearFilters.click();
    await expect(tournamentsPage.search).toHaveValue('');
    await expect(tournamentsPage.counter).toHaveText(new RegExp(`^${openTournaments.length} campeonatos?`));
  });

  test('filtro de jogo bate com a contagem da API @regression', async ({ tournamentsPage, openTournaments }) => {
    const game = openTournaments[0].game;
    const expected = openTournaments.filter(t => t.game === game).length;

    await tournamentsPage.gameSelect.selectOption({ label: GAME_LABEL[game] });

    await expect(tournamentsPage.counter).toHaveText(new RegExp(`^${expected} de ${openTournaments.length} `));
    await expect(tournamentsPage.cards().first()).toContainText(GAME_LABEL[game]);
  });

  test('clicar no card abre o detalhe do torneio @smoke', async ({ page, tournamentsPage, tournamentDetailPage }) => {
    const card = tournamentsPage.cards().first();
    // evaluateAll não espera a lista carregar: sem isto o id vinha undefined às vezes.
    await expect(card).toBeVisible();
    const [id] = await cardIds(card);
    const name = await card.getByRole('heading', { level: 3 }).innerText();

    await card.click();

    await expect(page).toHaveURL(new RegExp(`/campeonatos/${id}$`));
    await expect(tournamentDetailPage.heading).toHaveText(name);
  });
});
