import { expect, type Locator, type Page } from '@playwright/test';

export type NavLink = 'Início' | 'Campeonatos' | 'Ranking' | 'Planos';

/** Cabeçalho do site. No celular os links ficam atrás do botão "Abrir menu". */
export class NavBar {
  readonly banner: Locator;
  readonly logo: Locator;
  readonly menuButton: Locator;
  readonly signIn: Locator;
  readonly accountMenu: Locator;

  constructor(page: Page) {
    this.banner = page.getByRole('banner');
    this.logo = this.banner.getByRole('link', { name: 'BattleZone — início' });
    this.menuButton = this.banner.getByRole('button', { name: 'Abrir menu' });
    // "Entrar" é botão no desktop e link dentro do menu sanduíche no celular.
    this.signIn = this.banner
      .getByRole('button', { name: 'Entrar', exact: true })
      .or(this.banner.getByRole('link', { name: 'Entrar', exact: true }));
    this.accountMenu = this.banner.getByRole('button', { name: 'Menu da conta' });
  }

  /** Item do menu da conta (logado). Abre o menu se estiver fechado. */
  async accountMenuItem(name: string): Promise<Locator> {
    if ((await this.accountMenu.getAttribute('aria-expanded')) !== 'true') await this.accountMenu.click();
    return this.banner.getByRole('menu').getByRole('menuitem', { name, exact: true });
  }

  link(name: NavLink): Locator {
    return this.banner.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name, exact: true });
  }

  /** true no layout de celular (o menu sanduíche existe). */
  async isCollapsed(): Promise<boolean> {
    await expect(this.logo).toBeVisible();
    return this.menuButton.isVisible();
  }

  async goTo(name: NavLink): Promise<void> {
    if (await this.isCollapsed()) await this.menuButton.click();
    await this.link(name).click();
  }

  /** Abre a busca de jogadores do cabeçalho, digita o termo e devolve as sugestões. */
  async searchPlayer(term: string): Promise<Locator> {
    if (await this.isCollapsed()) await this.menuButton.click();
    else await this.banner.getByRole('button', { name: 'Buscar jogadores' }).click();
    await this.banner.getByRole('combobox', { name: 'Nome do jogador' }).fill(term);
    return this.banner.getByRole('listbox', { name: 'Nome do jogador' }).getByRole('option');
  }
}
