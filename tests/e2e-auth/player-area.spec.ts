import { expect, test } from '../../fixtures/test';
import { HAS_QA_USER, NO_QA_USER_MESSAGE } from '../../support/env';

type Me = { id: number; name: string | null };

// Logado com o storageState do setup. Só leitura: o readOnlyGuard reprova
// qualquer POST/PUT/PATCH/DELETE que a tela tente.
test.describe('Área do jogador (logado, só leitura)', () => {
  test.skip(!HAS_QA_USER, NO_QA_USER_MESSAGE);

  test('cabeçalho troca "Entrar" pelo menu da conta @smoke', async ({ page, nav }) => {
    await page.goto('/');

    await expect(nav.accountMenu).toBeVisible();
    await expect(nav.signIn).toBeHidden();
    for (const item of ['Minha conta', 'Meu perfil', 'Minhas inscrições', 'Minhas decklists', 'Sair']) {
      await expect(await nav.accountMenuItem(item)).toBeVisible();
    }
  });

  test('"Meu perfil" abre o perfil público do próprio jogador @smoke', async ({ page, nav, playerApi }) => {
    const me: Me = await (await playerApi.get('/players/me')).json();
    await page.goto('/');

    // O item nasce desabilitado e habilita quando o /players/me responde; o click espera.
    await (await nav.accountMenuItem('Meu perfil')).click();

    await expect(page).toHaveURL(new RegExp(`/jogadores/${me.id}$`));
    if (me.name) await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toHaveText(me.name);
  });

  test('"Minhas inscrições" mostra a contagem da API @smoke', async ({ myRegistrationsPage, playerApi }) => {
    const { items } = await (await playerApi.get('/players/me/registrations')).json();

    await myRegistrationsPage.goto();

    await expect(myRegistrationsPage.heading).toBeVisible();
    await expect(myRegistrationsPage.counter(items.length)).toBeVisible();
    if (items.length === 0) await expect(myRegistrationsPage.empty).toBeVisible();
    else await expect(myRegistrationsPage.empty).toBeHidden();
  });

  test('"Minhas decklists" lista as decklists da API, sem criar nenhuma @smoke', async ({ myDecklistsPage, playerApi }) => {
    const decks: { name: string }[] = await (await playerApi.get('/players/me/decklists')).json();

    await myDecklistsPage.goto();
    await expect(myDecklistsPage.heading).toBeVisible();

    if (decks.length === 0) {
      await expect(myDecklistsPage.empty).toBeVisible();
      // O botão existe; clicar abriria o diálogo que cria a decklist.
      await expect(myDecklistsPage.createFirst).toBeVisible();
    } else {
      await expect(myDecklistsPage.deckNames).toHaveText(decks.map(d => d.name));
    }
  });

  test('"Minha conta" mostra o login e a zona de perigo, sem acionar nada @regression', async ({
    page,
    nav,
    accountPage,
  }) => {
    await page.goto('/');
    await (await nav.accountMenuItem('Minha conta')).click();

    await expect(page).toHaveURL(/\/conta$/);
    await expect(accountPage.heading).toBeVisible();
    await expect(accountPage.loginEmailLabel).toBeVisible();
    await expect(accountPage.deleteSection).toBeVisible();
  });

  test('detalhe de torneio logado não pede mais para entrar @regression', async ({
    page,
    tournamentDetailPage,
    openTournaments,
  }) => {
    await tournamentDetailPage.goto(openTournaments[0].id);
    await expect(tournamentDetailPage.heading).toHaveText(openTournaments[0].name);

    await expect(page.getByRole('link', { name: 'Entrar para se inscrever' })).toHaveCount(0);
  });
});
