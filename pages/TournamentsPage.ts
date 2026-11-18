import type { Locator, Page } from '@playwright/test';

/** /campeonatos: a lista completa, com busca e filtros. */
export class TournamentsPage {
  readonly heading: Locator;
  readonly search: Locator;
  readonly gameSelect: Locator;
  readonly counter: Locator;
  readonly emptyResult: Locator;
  readonly clearFilters: Locator;

  constructor(readonly page: Page) {
    const filters = page.getByRole('region', { name: 'Busca e filtros' });
    this.heading = page.getByRole('heading', { level: 1, name: 'Campeonatos' });
    this.search = filters.getByRole('searchbox', { name: 'Buscar' });
    this.gameSelect = filters.getByRole('combobox', { name: 'Jogo' });
    // "6 campeonatos" sem filtro, "1 de 6 campeonatos" com filtro.
    this.counter = page.getByRole('main').getByText(/^\d+ (de \d+ )?campeonatos?/);
    this.emptyResult = page.getByText('Nenhum campeonato com esses filtros.');
    this.clearFilters = filters.getByRole('button', { name: 'Limpar filtros' });
  }

  async goto(): Promise<void> {
    await this.page.goto('/campeonatos');
  }

  cards(): Locator {
    return this.page
      .getByRole('main')
      .getByRole('link')
      .filter({ has: this.page.getByRole('heading', { level: 3 }) });
  }
}
