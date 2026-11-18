import { expect, test } from '../../fixtures/test';
import { brl } from '../../support/format';

test.describe('Planos para organizadores', () => {
  test.beforeEach(async ({ plansPage }) => {
    await plansPage.goto();
    await expect(plansPage.heading).toBeVisible();
  });

  test('mostra cada plano ativo da API com o preço certo @smoke', async ({ page, plans }) => {
    const main = page.getByRole('main');

    for (const plan of plans.filter(p => p.active)) {
      await expect(main.getByText(plan.name, { exact: true })).toBeVisible();
      // price vem em centavos (4990 = R$ 49,90).
      await expect(main.getByText(plan.price === 0 ? 'Grátis' : brl(plan.price), { exact: true })).toBeVisible();
    }
  });

  test('escolher um plano pago marca a seleção, sem pagar nada @regression', async ({ plansPage, plans }) => {
    const paid = plans.find(p => p.active && p.price > 0);
    test.skip(!paid, 'nenhum plano pago ativo');

    await plansPage.subscribeButton(paid!.name).click();

    // A seleção é só local; o botão do plano escolhido vira "Plano selecionado".
    await expect(plansPage.subscribeButton(paid!.name)).toHaveCount(0);
    await expect(plansPage.page.getByRole('button', { name: 'Plano selecionado' })).toHaveCount(1);
  });

  test('visitante que confirma é levado ao cadastro @regression', async ({ page }) => {
    await page.getByRole('button', { name: 'Criar conta para assinar' }).click();

    await expect(page).toHaveURL(/\/cadastro$/);
  });
});
