import { expect, expectBusinessError, test } from '../../fixtures/api';
import type { RankingEntry } from '../../support/api-types';

async function ranking(request: import('@playwright/test').APIRequestContext, query = ''): Promise<RankingEntry[]> {
  const response = await request.get(`/players/ranking${query}`);
  expect(response).toBeOK();
  return (await response.json()).items;
}

test.describe('GET /players/ranking', () => {
  test('ranking geral no formato do contrato @smoke', async ({ request, contract }) => {
    const response = await request.get('/players/ranking');
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(contract.errors(body, 'RankingResponse')).toEqual([]);
    expect(body.items.length).toBeGreaterThan(0);
  });

  test('posições em sequência e pontuação decrescente @regression', async ({ request }) => {
    const items = await ranking(request);

    expect(items.map(i => i.position)).toEqual(items.map((_, index) => index + 1));
    const scores = items.map(i => i.score);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });

  test('rota pública não expõe contato nem saldo do jogador @regression', async ({ request }) => {
    const items = await ranking(request);
    const allowed = ['position', 'playerId', 'name', 'score', 'wins'];

    for (const item of items) expect(allowed).toEqual(expect.arrayContaining(Object.keys(item)));
  });

  test('filtro por jogo recomeça as posições em 1 @regression', async ({ request }) => {
    const items = await ranking(request, '?game=one_piece');

    if (items.length > 0) expect(items[0].position).toBe(1);
    expect(items.map(i => i.position)).toEqual(items.map((_, index) => index + 1));
  });

  test('filtro por estado aceita UF válida @regression', async ({ request, contract }) => {
    const response = await request.get('/players/ranking?state=RS');

    expect(response.status()).toBe(200);
    expect(contract.errors(await response.json(), 'RankingResponse')).toEqual([]);
  });

  for (const query of ['state=RSX', 'state=R', 'game=xadrez']) {
    test(`parâmetro inválido ${query} → 422 @regression`, async ({ request, contract }) => {
      const response = await request.get(`/players/ranking?${query}`);

      expect(response.status()).toBe(422);
      expect(contract.errors(await response.json(), 'HTTPValidationError')).toEqual([]);
    });
  }
});

test.describe('GET /players/search e /players/{id}', () => {
  test('busca por 2 letras do nome acha o líder do ranking @regression', async ({ request, contract }) => {
    const [leader] = await ranking(request);
    const term = leader.name!.slice(0, 2);

    const response = await request.get('/players/search', { params: { q: term } });
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(contract.errors(body, 'PlayerSearchResponse')).toEqual([]);
    expect(body.items.map((p: { playerId: number }) => p.playerId)).toContain(leader.playerId);
  });

  test('busca com 1 letra → 422 (mínimo de 2) @regression', async ({ request }) => {
    const response = await request.get('/players/search?q=a');

    expect(response.status()).toBe(422);
    expect((await response.json()).detail[0].type).toBe('string_too_short');
  });

  test('perfil público do líder bate com o ranking @regression', async ({ request, contract }) => {
    const [leader] = await ranking(request);

    const response = await request.get(`/players/${leader.playerId}`);
    expect(response.status()).toBe(200);

    const profile = await response.json();
    expect(contract.errors(profile, 'PlayerProfileResponse')).toEqual([]);
    expect(profile).toMatchObject({
      playerId: leader.playerId,
      name: leader.name,
      position: leader.position,
      score: leader.score,
      wins: leader.wins,
    });
  });

  test('perfil inexistente → 404 @regression', async ({ request }) => {
    const response = await request.get('/players/999999999');

    expect(response.status()).toBe(404);
    expectBusinessError(await response.json(), 404, 'Player not found.');
  });
});
