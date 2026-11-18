import type { Locator, Page } from '@playwright/test';

/** /minhas-inscricoes: só leitura (cancelar ou pagar ficam fora da suíte). */
export class MyRegistrationsPage {
  readonly heading: Locator;
  readonly empty: Locator;

  constructor(readonly page: Page) {
    const main = page.getByRole('main');
    this.heading = main.getByRole('heading', { level: 1, name: 'Minhas inscrições' });
    this.empty = main.getByText('Você ainda não se inscreveu em nenhum torneio.');
  }

  async goto(): Promise<void> {
    await this.page.goto('/minhas-inscricoes');
  }

  /** "1 inscrição" / "N inscrições", como a tela escreve. */
  counter(total: number): Locator {
    return this.page.getByRole('main').getByText(total === 1 ? '1 inscrição' : `${total} inscrições`, { exact: true });
  }
}

/** /minhas-decklists: só leitura (criar, renomear, duplicar e excluir escrevem no banco). */
export class MyDecklistsPage {
  readonly heading: Locator;
  readonly empty: Locator;
  readonly createFirst: Locator;
  readonly deckNames: Locator;

  constructor(readonly page: Page) {
    const main = page.getByRole('main');
    this.heading = main.getByRole('heading', { level: 1, name: 'Minhas decklists' });
    this.empty = main.getByText('Você ainda não tem nenhuma decklist salva.');
    this.createFirst = main.getByRole('button', { name: 'Criar a primeira decklist' });
    this.deckNames = main.getByRole('list').getByRole('heading', { level: 2 });
  }

  async goto(): Promise<void> {
    await this.page.goto('/minhas-decklists');
  }
}

/** /conta: só leitura ("Excluir conta" nunca é clicado). */
export class AccountPage {
  readonly heading: Locator;
  readonly loginEmailLabel: Locator;
  readonly deleteSection: Locator;

  constructor(readonly page: Page) {
    const main = page.getByRole('main');
    this.heading = main.getByRole('heading', { level: 1, name: 'Minha conta' });
    this.loginEmailLabel = main.getByText('E-mail de login', { exact: true });
    this.deleteSection = main.getByRole('heading', { level: 2, name: 'Excluir conta' });
  }

  async goto(): Promise<void> {
    await this.page.goto('/conta');
  }
}
