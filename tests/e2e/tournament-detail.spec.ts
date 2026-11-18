import { expect, test } from '../../fixtures/test';
import { brl } from '../../support/format';

test.describe('Detalhe do torneio', () => {
  test('mostra nome, loja, vagas e valor iguais aos da API @smoke', async ({ tournamentDetailPage, openTournaments }) => {
    // Um torneio pago, para conferir o valor formatado.
    const t = openTournaments.find(item => item.entryFee > 0) ?? openTournaments[0];

    await tournamentDetailPage.goto(t.id);

    await expect(tournamentDetailPage.heading).toHaveText(t.name);
    await expect(tournamentDetailPage.registration).toContainText(t.entryFee > 0 ? brl(t.entryFee) : 'Grátis');
    await expect(tournamentDetailPage.seats).toHaveText(`Inscritos — ${t.occupiedSeats} de ${t.maxPlayers} vagas`);
    await expect(tournamentDetailPage.page.getByRole('complementary')).toContainText(t.store.name);
  });

  test('visitante é mandado para o login para se inscrever @regression', async ({
    page,
    tournamentDetailPage,
    loginPage,
    openTournaments,
  }) => {
    await tournamentDetailPage.goto(openTournaments[0].id);
    await page.getByRole('link', { name: 'Entrar para se inscrever' }).click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(loginPage.heading).toBeVisible();
  });

  test('"Todos os campeonatos" volta para a busca @regression', async ({
    page,
    tournamentDetailPage,
    tournamentsPage,
    openTournaments,
  }) => {
    await tournamentDetailPage.goto(openTournaments[0].id);
    await tournamentDetailPage.backLink.click();

    await expect(page).toHaveURL(/\/campeonatos$/);
    await expect(tournamentsPage.heading).toBeVisible();
  });

  test('torneio inexistente mostra aviso e link para os abertos @regression', async ({ page, tournamentDetailPage }) => {
    await tournamentDetailPage.goto(999999999);

    await expect(tournamentDetailPage.unavailable).toBeVisible();
    await expect(page.getByRole('link', { name: 'Ver campeonatos abertos' })).toHaveAttribute('href', '/campeonatos');
  });
});
