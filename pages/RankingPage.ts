import type { Locator, Page } from '@playwright/test';

export class RankingPage {
  readonly heading: Locator;
  readonly gameSelect: Locator;
  readonly stateSelect: Locator;
  readonly players: Locator;

  constructor(readonly page: Page) {
    const main = page.getByRole('main');
    this.heading = main.getByRole('heading', { level: 1, name: 'Ranking' });
    this.gameSelect = main.getByRole('combobox', { name: 'Jogo' });
    this.stateSelect = main.getByRole('combobox', { name: 'Estado da loja' });
    this.players = main.getByRole('list').getByRole('listitem').getByRole('link');
  }

  async goto(): Promise<void> {
    await this.page.goto('/ranking');
  }
}
