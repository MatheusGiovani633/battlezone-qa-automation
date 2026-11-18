import { expect, test } from '../../fixtures/test';
import type { NavLink } from '../../pages/NavBar';

const ROUTES: { link: NavLink; path: RegExp; heading: string }[] = [
  { link: 'Campeonatos', path: /\/campeonatos$/, heading: 'Campeonatos' },
  { link: 'Ranking', path: /\/ranking$/, heading: 'Ranking' },
  { link: 'Planos', path: /\/planos$/, heading: 'Escolha o plano da sua loja' },
  { link: 'Início', path: /\/$/, heading: 'O próximo torneio da sua loja está aqui.' },
];

test.describe('Navegação', () => {
  for (const route of ROUTES) {
    test(`menu "${route.link}" abre a página certa @smoke`, async ({ page, nav }) => {
      // Parte de uma página diferente do destino, para o clique mudar de rota.
      await page.goto(route.link === 'Início' ? '/ranking' : '/');

      await nav.goTo(route.link);

      await expect(page).toHaveURL(route.path);
      await expect(page.getByRole('heading', { level: 1, name: route.heading })).toBeVisible();
    });
  }

  test('visitante vê "Entrar" e não vê o menu da conta @regression', async ({ page, nav }) => {
    await page.goto('/');
    if (await nav.isCollapsed()) await nav.menuButton.click();

    await expect(nav.signIn).toBeVisible();
    await expect(nav.accountMenu).toHaveCount(0);
  });

  test('logo volta para o início @regression', async ({ page, nav, homePage }) => {
    await page.goto('/planos');
    await nav.logo.click();

    await expect(page).toHaveURL(/\/$/);
    await expect(homePage.heading).toBeVisible();
  });

  test('link "Pular para o conteúdo" existe para teclado @regression', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('link', { name: 'Pular para o conteúdo' })).toHaveAttribute('href', '#conteudo');
  });

  test('rota inexistente mostra 404 e volta para o início @smoke', async ({ page, homePage }) => {
    await page.goto('/rota-que-nao-existe-qa');

    await expect(page.getByText('Erro 404')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: 'Essa página não existe' })).toBeVisible();

    await page.getByRole('link', { name: 'Ir para o início' }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(homePage.heading).toBeVisible();
  });

  test('título da aba é o do produto @regression', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle('BattleZone · Torneios de TCG');
  });
});
