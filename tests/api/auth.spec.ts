import { expect, expectBusinessError, test } from '../../fixtures/api';
import { TURNSTILE_TEST_TOKEN } from '../../support/env';

const CAPTCHA_MESSAGE = 'Confirme que você não é um robô e tente de novo.';

test.describe('Autenticação (só o que não cria nada)', () => {
  test('GET /auth/providers lista Google e Discord @smoke', async ({ request, contract }) => {
    const response = await request.get('/auth/providers');
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(contract.errors(body, 'ProvidersResponse')).toEqual([]);
    expect(body.providers).toEqual(expect.arrayContaining(['google', 'discord']));
  });

  // O back confere o captcha ANTES de procurar o usuário: estes pedidos não leem
  // nem escrevem no banco. Nenhum captchaToken é enviado de propósito.
  test('POST /login sem captcha → 400 @smoke', async ({ request }) => {
    const response = await request.post('/login', {
      data: { email: 'qa-automation@example.com', password: 'senha-qualquer' },
    });

    expect(response.status()).toBe(400);
    expectBusinessError(await response.json(), 400, CAPTCHA_MESSAGE);
  });

  test('POST /login com corpo vazio também para no captcha → 400 @regression', async ({ request }) => {
    const response = await request.post('/login', { data: {} });

    expect(response.status()).toBe(400);
    expectBusinessError(await response.json(), 400, CAPTCHA_MESSAGE);
  });

  test('POST /login com JSON malformado → 422 @regression', async ({ request }) => {
    const response = await request.post('/login', {
      headers: { 'Content-Type': 'application/json' },
      data: '{"email":',
    });

    expect(response.status()).toBe(422);
  });

  // Com o token de teste do Turnstile o captcha passa e quem responde é a senha.
  test('POST /login com captcha de teste e senha errada → 401 @smoke', async ({ request }) => {
    const response = await request.post('/login', {
      data: { email: 'qa-automation-inexistente@example.com', password: 'senha-errada-qa', captchaToken: TURNSTILE_TEST_TOKEN },
    });

    expect(response.status()).toBe(401);
    expect(await response.json()).toEqual({ detail: expect.any(String) });
  });

  test('rota autenticada sem token → 401 @regression', async ({ request }) => {
    const response = await request.get('/players/me');

    expect(response.status()).toBe(401);
    expectBusinessError(await response.json(), 401, 'Missing bearer token.');
  });
});
