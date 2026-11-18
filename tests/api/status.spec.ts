import { expect, test } from '../../fixtures/api';

test.describe('Saúde e contrato', () => {
  test('GET /status responde Ok @smoke', async ({ request }) => {
    const response = await request.get('/status');

    expect(response.status()).toBe(200);
    expect((await response.text()).trim()).toBe('Ok');
  });

  test('openapi.json publica as rotas públicas que a suíte cobre @smoke', async ({ request }) => {
    const response = await request.get('/openapi.json');
    expect(response).toBeOK();

    const spec = await response.json();
    expect(spec.openapi).toMatch(/^3\.1\./);
    expect(Object.keys(spec.paths)).toEqual(
      expect.arrayContaining([
        '/status',
        '/tournaments',
        '/tournaments/{tournament_id}',
        '/players/ranking',
        '/players/search',
        '/players/{player_id}',
        '/cards/search',
        '/plans',
        '/auth/providers',
        '/login',
      ]),
    );
  });
});
