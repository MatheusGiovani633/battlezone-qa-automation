import { expect, test } from '../../fixtures/test';
import { API_URL } from '../../support/env';

// Só renderização e navegação: o envio depende do Turnstile (o login dos testes logados é pela API: tests/auth.setup.ts).
test.describe('Página de login', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
    await expect(loginPage.heading).toBeVisible();
  });

  test('renderiza o formulário e os logins sociais @smoke', async ({ loginPage }) => {
    await expect(loginPage.login).toBeVisible();
    await expect(loginPage.password).toBeVisible();
    await expect(loginPage.submit).toBeVisible();
    await expect(loginPage.google).toBeVisible();
    await expect(loginPage.discord).toBeVisible();
  });

  test('login social aponta para a API de homologação, nunca a de produção @regression', async ({ loginPage }) => {
    await expect(loginPage.google).toHaveAttribute('href', `${API_URL}/auth/google/start`);
    await expect(loginPage.discord).toHaveAttribute('href', `${API_URL}/auth/discord/start`);
  });

  test('"Mostrar senha" alterna a visibilidade do campo @regression', async ({ loginPage }) => {
    await loginPage.password.fill('senha-de-exemplo');
    await expect(loginPage.password).toHaveAttribute('type', 'password');

    await loginPage.showPassword.click();
    await expect(loginPage.password).toHaveAttribute('type', 'text');
    await expect(loginPage.password).toHaveValue('senha-de-exemplo');
  });

  test('"Entrar" fica desabilitado com o formulário vazio @regression', async ({ loginPage }) => {
    await expect(loginPage.submit).toBeDisabled();
  });

  test('links para cadastro e recuperação de senha @regression', async ({ page, loginPage }) => {
    await expect(loginPage.forgotPassword).toHaveAttribute('href', '/esqueci-senha');

    await loginPage.signUp.click();
    await expect(page).toHaveURL(/\/cadastro$/);
  });
});
