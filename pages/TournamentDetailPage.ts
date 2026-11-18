import type { Locator, Page } from '@playwright/test';

export class TournamentDetailPage {
  readonly heading: Locator;
  readonly registration: Locator;
  readonly seats: Locator;
  readonly backLink: Locator;
  readonly unavailable: Locator;

  constructor(readonly page: Page) {
    this.heading = page.getByRole('main').getByRole('heading', { level: 1 });
    this.registration = page.getByRole('region', { name: 'Inscrição' });
    this.seats = page.getByRole('heading', { level: 2, name: /^Inscritos — \d+ de \d+ vagas$/ });
    this.backLink = page.getByRole('link', { name: '← Todos os campeonatos' });
    this.unavailable = page.getByText('Este campeonato não está disponível.');
  }

  async goto(id: number | string): Promise<void> {
    await this.page.goto(`/campeonatos/${id}`);
  }
}
