import { expect, test } from '../../../fixtures/test';

// Só no projeto "mobile" (Pixel 7): o projeto "chromium" ignora esta pasta.
test.describe('Responsivo no celular', () => {
  for (const path of ['/', '/campeonatos', '/ranking', '/planos', '/login']) {
    test(`${path} cabe na largura da tela, sem rolagem lateral @regression`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toBeVisible();

      const { scrollWidth, innerWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      }));
      expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
    });
  }

  test('detalhe do torneio cabe na tela @regression', async ({ page, tournamentDetailPage, openTournaments }) => {
    await tournamentDetailPage.goto(openTournaments[0].id);
    await expect(tournamentDetailPage.heading).toBeVisible();

    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });

  test('menu sanduíche abre, mostra os links e fecha @smoke', async ({ nav }) => {
    await nav.logo.page().goto('/');
    expect(await nav.isCollapsed()).toBe(true);
    await expect(nav.link('Ranking')).toBeHidden();

    await nav.menuButton.click();
    const close = nav.banner.getByRole('button', { name: 'Fechar menu' });
    await expect(close).toHaveAttribute('aria-expanded', 'true');
    for (const name of ['Início', 'Campeonatos', 'Ranking', 'Planos'] as const) {
      await expect(nav.link(name)).toBeVisible();
    }

    await close.click();
    await expect(nav.link('Ranking')).toBeHidden();
  });

  test('cards de torneio ficam empilhados em uma coluna @regression', async ({ homePage }) => {
    await homePage.goto();
    const cards = homePage.cards();
    await expect(cards.first()).toBeVisible();
    test.skip((await cards.count()) < 2, 'precisa de 2 cards');

    const [first, second] = [await cards.nth(0).boundingBox(), await cards.nth(1).boundingBox()];
    expect(second!.y).toBeGreaterThanOrEqual(first!.y + first!.height - 1);
  });
});
