import { expect, expectBusinessError, test } from '../../fixtures/api';
import type { TournamentPublic } from '../../support/api-types';

/** Regra do back (service_fee.py): 7% da inscrição, arredondado meio para cima no centavo. */
const serviceFee = (entryFee: number) => Math.floor((entryFee * 7 + 50) / 100);

test.describe('GET /tournaments', () => {
  test('lista torneios abertos no formato do contrato @smoke', async ({ request, contract }) => {
    const response = await request.get('/tournaments');
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(contract.errors(body, 'TournamentPublicResponse[]')).toEqual([]);
    // A homologação tem massa de exemplo; lista vazia aqui quer dizer massa quebrada.
    expect(body.length).toBeGreaterThan(0);
  });

  test('vem em ordem de início, o mais próximo primeiro @regression', async ({ request }) => {
    const body: TournamentPublic[] = await (await request.get('/tournaments?pageSize=100')).json();
    const starts = body.map(t => t.startsAt);

    expect(starts).toEqual([...starts].sort());
  });

  test('valores e vagas batem com as regras de negócio @regression', async ({ request }) => {
    const body: TournamentPublic[] = await (await request.get('/tournaments?pageSize=100')).json();

    for (const t of body) {
      expect.soft(t.serviceFee, `taxa do torneio ${t.id}`).toBe(serviceFee(t.entryFee));
      expect.soft(t.totalDue, `total do torneio ${t.id}`).toBe(t.entryFee + t.serviceFee);
      expect.soft(t.occupiedSeats, `vagas do torneio ${t.id}`).toBeLessThanOrEqual(t.maxPlayers);
      expect.soft(t.registrationClosesAt <= t.startsAt, `inscrição fecha antes do início (${t.id})`).toBe(true);
      expect.soft(t.startsAt < t.endsAt, `início antes do fim (${t.id})`).toBe(true);
    }
  });

  test('paginação: páginas de 1 item reproduzem a lista na mesma ordem @regression', async ({ request }) => {
    const firstThree: TournamentPublic[] = await (await request.get('/tournaments?page=1&pageSize=3')).json();
    test.skip(firstThree.length < 2, 'massa com menos de 2 torneios não permite testar paginação');

    const paged: number[] = [];
    for (let page = 1; page <= firstThree.length; page++) {
      const items: TournamentPublic[] = await (await request.get(`/tournaments?page=${page}&pageSize=1`)).json();
      expect(items).toHaveLength(1);
      paged.push(items[0].id);
    }
    expect(paged).toEqual(firstThree.map(t => t.id));
  });

  test('página além do fim volta vazia @regression', async ({ request }) => {
    const response = await request.get('/tournaments?page=1000&pageSize=100');

    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual([]);
  });

  test('filtro por jogo só traz torneios daquele jogo @regression', async ({ request }) => {
    const [first]: TournamentPublic[] = await (await request.get('/tournaments?pageSize=1')).json();
    const filtered: TournamentPublic[] = await (await request.get(`/tournaments?game=${first.game}&pageSize=100`)).json();

    expect(filtered.map(t => t.id)).toContain(first.id);
    expect(new Set(filtered.map(t => t.game))).toEqual(new Set([first.game]));
  });

  test('filtro por cidade só traz torneios daquela cidade @regression', async ({ request }) => {
    const [first]: TournamentPublic[] = await (await request.get('/tournaments?pageSize=1')).json();
    const city = first.store.address.city;
    const filtered: TournamentPublic[] = await (
      await request.get('/tournaments', { params: { city, pageSize: 100 } })
    ).json();

    expect(filtered.map(t => t.id)).toContain(first.id);
    expect(new Set(filtered.map(t => t.store.address.city))).toEqual(new Set([city]));
  });

  for (const [query, field] of [
    ['game=xyz', 'game'],
    ['pageSize=0', 'pageSize'],
    ['pageSize=101', 'pageSize'],
    ['page=0', 'page'],
    ['city=a', 'city'],
    ['latitude=91&longitude=0', 'latitude'],
    ['radiusKm=501&latitude=-30&longitude=-51', 'radiusKm'],
  ] as const) {
    test(`parâmetro inválido ${query} → 422 apontando ${field} @regression`, async ({ request, contract }) => {
      const response = await request.get(`/tournaments?${query}`);
      expect(response.status()).toBe(422);

      const body = await response.json();
      expect(contract.errors(body, 'HTTPValidationError')).toEqual([]);
      expect(body.detail.map((d: { loc: string[] }) => d.loc.join('.'))).toContain(`query.${field}`);
    });
  }
});

test.describe('GET /tournaments/{id}', () => {
  test('detalhe do primeiro torneio da lista bate com a listagem @smoke', async ({ request, contract }) => {
    const [listed]: TournamentPublic[] = await (await request.get('/tournaments?pageSize=1')).json();

    const response = await request.get(`/tournaments/${listed.id}`);
    expect(response.status()).toBe(200);

    const detail = await response.json();
    expect(contract.errors(detail, 'TournamentPublicResponse')).toEqual([]);
    // distanceKm só existe quando a lista recebe latitude/longitude.
    expect({ ...detail, distanceKm: null }).toEqual({ ...listed, distanceKm: null });
  });

  test('id inexistente → 404 com o erro de negócio @regression', async ({ request }) => {
    const response = await request.get('/tournaments/999999999');

    expect(response.status()).toBe(404);
    expectBusinessError(await response.json(), 404, 'Tournament not found.');
  });

  test('id não numérico → 422 @regression', async ({ request, contract }) => {
    const response = await request.get('/tournaments/abc');

    expect(response.status()).toBe(422);
    expect(contract.errors(await response.json(), 'HTTPValidationError')).toEqual([]);
  });
});
