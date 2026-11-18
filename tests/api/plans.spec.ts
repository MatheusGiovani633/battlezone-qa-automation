import { expect, test } from '../../fixtures/api';
import type { Plan } from '../../support/api-types';

test.describe('GET /plans', () => {
  test('planos no formato do contrato @smoke', async ({ request, contract }) => {
    const response = await request.get('/plans');
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(contract.errors(body, 'PlanResponse[]')).toEqual([]);
    expect(body.length).toBeGreaterThan(0);
  });

  test('nomes únicos, preço não negativo e limites coerentes @regression', async ({ request }) => {
    const plans: Plan[] = await (await request.get('/plans')).json();

    expect(new Set(plans.map(p => p.name)).size).toBe(plans.length);
    for (const plan of plans) {
      expect.soft(plan.price, plan.name).toBeGreaterThanOrEqual(0);
      // null = ilimitado; número = pelo menos 1.
      if (plan.companyLimit !== null) expect.soft(plan.companyLimit, plan.name).toBeGreaterThanOrEqual(1);
      if (plan.freeTournamentLimit !== null) expect.soft(plan.freeTournamentLimit, plan.name).toBeGreaterThanOrEqual(0);
    }
  });

});
