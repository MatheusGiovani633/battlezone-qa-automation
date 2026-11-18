import type { Locator, Page } from '@playwright/test';

export class PlansPage {
  readonly heading: Locator;

  constructor(readonly page: Page) {
    this.heading = page.getByRole('heading', { level: 1, name: 'Escolha o plano da sua loja' });
  }

  async goto(): Promise<void> {
    await this.page.goto('/planos');
  }

  subscribeButton(planName: string): Locator {
    return this.page.getByRole('button', { name: `Assinar ${planName}` });
  }
}
