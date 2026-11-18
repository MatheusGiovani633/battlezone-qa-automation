import { expect, expectBusinessError, test } from '../../fixtures/api';

/**
 * /cards/search é autenticada (o front só a chama dentro do deck builder).
 * Sem login dá para provar só a fronteira: sem token → 401, inclusive com
 * parâmetro inválido, porque a autenticação vem antes da validação.
 * Busca válida e 422 com login: tests/api-auth/cards.spec.ts.
 */
test.describe('GET /cards/search sem login', () => {
  test('o contrato declara autenticação Bearer @smoke', async ({ request }) => {
    const spec = await (await request.get('/openapi.json')).json();

    expect(spec.paths['/cards/search'].get.security).toEqual([{ HTTPBearer: [] }]);
  });

  for (const query of ['game=pokemon&q=pikachu', 'game=magic&q=a', 'game=jogo-que-nao-existe&q=a', 'game=pokemon']) {
    test(`${query} sem token → 401 @regression`, async ({ request }) => {
      const response = await request.get(`/cards/search?${query}`);

      expect(response.status()).toBe(401);
      expectBusinessError(await response.json(), 401, 'Missing bearer token.');
    });
  }

  test('token inválido → 401 @regression', async ({ request }) => {
    const response = await request.get('/cards/search?game=pokemon&q=pikachu', {
      headers: { Authorization: 'Bearer token-invalido' },
    });

    expect(response.status()).toBe(401);
  });
});
