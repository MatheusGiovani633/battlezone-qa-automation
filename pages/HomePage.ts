import type { Locator, Page } from '@playwright/test';
import { NavBar } from './NavBar';

export class HomePage {
  readonly nav: NavBar;
  readonly heading: Locator;
  readonly openTournaments: Locator;
  readonly regionalTournaments: Locator;
  readonly emptyFilter: Locator;
  readonly clearFilters: Locator;

  constructor(readonly page: Page) {
    this.nav = new NavBar(page);
    this.heading = page.getByRole('heading', { level: 1, name: 'O próximo torneio da sua loja está aqui.' });
    this.openTournaments = page.getByRole('region', { name: 'Torneios abertos' });
    this.regionalTournaments = page.getByRole('region', { name: 'Torneios regionais' });
    this.emptyFilter = this.openTournaments.getByText('Nenhum torneio com esses filtros.');
    this.clearFilters = this.openTournaments.getByRole('button', { name: 'Limpar filtros' });
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  /** Cada card de torneio é um link com o nome do torneio num h3. */
  cards(): Locator {
    return this.openTournaments.getByRole('link').filter({ has: this.page.getByRole('heading', { level: 3 }) });
  }

  /** Chips de jogo e de tipo de campeonato. */
  filterChip(label: string): Locator {
    return this.page.getByRole('main').getByRole('button', { name: label, exact: true });
  }
}
