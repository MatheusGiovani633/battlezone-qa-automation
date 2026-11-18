import { expect, test } from '../../fixtures/api';
import { HAS_QA_USER, NO_QA_USER_MESSAGE } from '../../support/env';

type Card = { apiId: string; name: string };
type ValidationError = { detail: { loc: string[]; type: string }[] };

test.describe('GET /cards/search com login', () => {
  test.skip(!HAS_QA_USER, NO_QA_USER_MESSAGE);

  test('busca válida devolve cartas que contêm o termo @smoke', async ({ playerApi, contract }) => {
    const response = await playerApi.get('/cards/search', { params: { game: 'pokemon', q: 'pikachu' } });
    expect(response.status()).toBe(200);

    const cards: Card[] = await response.json();
    expect(contract.errors(cards, 'CardResponse[]')).toEqual([]);
    expect(cards.length).toBeGreaterThan(0);
    for (const card of cards) expect.soft(card.name.toLowerCase(), card.apiId).toContain('pikachu');
  });

  test('offset pagina sem repetir cartas @regression', async ({ playerApi }) => {
    const first: Card[] = await (await playerApi.get('/cards/search?game=pokemon&q=pikachu')).json();
    const next: Card[] = await (await playerApi.get(`/cards/search?game=pokemon&q=pikachu&offset=${first.length}`)).json();

    const firstIds = new Set(first.map(c => c.apiId));
    for (const card of next) expect(firstIds.has(card.apiId), card.apiId).toBe(false);
  });

  for (const [query, field, type] of [
    ['game=pokemon', 'q', 'missing'],
    ['game=pokemon&q=ab', 'q', 'string_too_short'],
    ['game=xadrez&q=pikachu', 'game', 'enum'],
    ['q=pikachu', 'game', 'missing'],
    ['game=pokemon&q=pikachu&offset=601', 'offset', 'less_than_equal'],
  ] as const) {
    test(`${query} → 422 apontando ${field} @regression`, async ({ playerApi, contract }) => {
      const response = await playerApi.get(`/cards/search?${query}`);
      expect(response.status()).toBe(422);

      const body: ValidationError = await response.json();
      expect(contract.errors(body, 'HTTPValidationError')).toEqual([]);
      expect(body.detail).toContainEqual(expect.objectContaining({ loc: ['query', field], type }));
    });
  }
});
