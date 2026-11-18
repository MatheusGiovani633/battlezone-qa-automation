import { expect, test } from '../../fixtures/api';
import { HAS_QA_USER, NO_QA_USER_MESSAGE } from '../../support/env';

// Só GET: a conta de teste é lida, nunca alterada.
test.describe('Rotas do jogador logado (/me)', () => {
  test.skip(!HAS_QA_USER, NO_QA_USER_MESSAGE);

  test('GET /players/me devolve a posição do próprio jogador @smoke', async ({ playerApi, contract }) => {
    const response = await playerApi.get('/players/me');
    expect(response.status()).toBe(200);

    const me = await response.json();
    expect(contract.errors(me, 'PlayerStandingResponse')).toEqual([]);
    expect(me.id).toBeGreaterThan(0);
    expect(me.score).toBeGreaterThanOrEqual(0);
    expect(me.wins).toBeGreaterThanOrEqual(0);
    expect(me.coins).toBeGreaterThanOrEqual(0);
  });

  test('o próprio jogador bate com o perfil público dele @regression', async ({ playerApi, request }) => {
    const me = await (await playerApi.get('/players/me')).json();

    const response = await request.get(`/players/${me.id}`);
    expect(response.status()).toBe(200);
    expect(await response.json()).toMatchObject({ playerId: me.id, name: me.name, score: me.score, wins: me.wins });
  });

  test('GET /players/me/registrations no formato do contrato @smoke', async ({ playerApi, contract }) => {
    const response = await playerApi.get('/players/me/registrations');
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(contract.errors(body, 'PlayerRegistrationListResponse')).toEqual([]);
    const me = await (await playerApi.get('/players/me')).json();
    for (const registration of body.items) expect(registration.playerId).toBe(me.id);
  });

  test('GET /players/me/decklists no formato do contrato @smoke', async ({ playerApi, contract }) => {
    const response = await playerApi.get('/players/me/decklists');
    expect(response.status()).toBe(200);

    expect(contract.errors(await response.json(), 'SavedDecklistSummaryResponse[]')).toEqual([]);
  });

  test('GET /players/me/decklists?game= filtra pelo jogo @regression', async ({ playerApi }) => {
    const response = await playerApi.get('/players/me/decklists?game=pokemon');
    expect(response.status()).toBe(200);

    const decks: { game: string }[] = await response.json();
    for (const deck of decks) expect(deck.game).toBe('pokemon');
  });

  test('GET /players/me/decklists com jogo inválido → 422 @regression', async ({ playerApi, contract }) => {
    const response = await playerApi.get('/players/me/decklists?game=xadrez');

    expect(response.status()).toBe(422);
    expect(contract.errors(await response.json(), 'HTTPValidationError')).toEqual([]);
  });

  test('GET /notifications/me no formato do contrato @smoke', async ({ playerApi, contract }) => {
    const response = await playerApi.get('/notifications/me');
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(contract.errors(body, 'NotificationListResponse')).toEqual([]);
    expect(body.unreadCount).toBeGreaterThanOrEqual(0);
    expect(body.items.length).toBeLessThanOrEqual(20);
  });

  for (const query of ['page=0', 'pageSize=0', 'pageSize=101']) {
    test(`GET /notifications/me?${query} → 422 @regression`, async ({ playerApi, contract }) => {
      const response = await playerApi.get(`/notifications/me?${query}`);

      expect(response.status()).toBe(422);
      expect(contract.errors(await response.json(), 'HTTPValidationError')).toEqual([]);
    });
  }
});
