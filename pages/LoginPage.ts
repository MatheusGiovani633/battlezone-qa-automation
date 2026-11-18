import type { Locator, Page } from '@playwright/test';

/** Só renderização: enviar o formulário depende do Turnstile (o login dos testes logados é pela API: tests/auth.setup.ts). */
export class LoginPage {
  readonly heading: Locator;
  readonly login: Locator;
  readonly password: Locator;
  readonly showPassword: Locator;
  readonly submit: Locator;
  readonly google: Locator;
  readonly discord: Locator;
  readonly forgotPassword: Locator;
  readonly signUp: Locator;

  constructor(readonly page: Page) {
    const main = page.getByRole('main');
    this.heading = main.getByRole('heading', { level: 1, name: 'Entrar' });
    this.login = main.getByRole('textbox', { name: 'E-mail ou ID do jogador' });
    this.password = main.getByLabel('Senha', { exact: true });
    this.showPassword = main.getByRole('button', { name: 'Mostrar senha' });
    this.submit = main.getByRole('button', { name: 'Entrar', exact: true });
    this.google = main.getByRole('link', { name: 'Continuar com o Google' });
    this.discord = main.getByRole('link', { name: 'Continuar com o Discord' });
    this.forgotPassword = main.getByRole('link', { name: 'esqueci a senha' });
    this.signUp = main.getByRole('link', { name: 'Criar conta' });
  }

  async goto(): Promise<void> {
    await this.page.goto('/login');
  }
}
