import { expect, test } from '../../fixtures/api';
import { HAS_QA_USER, NO_QA_USER_MESSAGE, QA_USER_EMAIL, TURNSTILE_TEST_TOKEN } from '../../support/env';

test.describe('POST /login com a conta de teste', () => {
  test.skip(!HAS_QA_USER, NO_QA_USER_MESSAGE);

  // Uma tentativa errada por rodada: o back não bloqueia conta por tentativa,
  // e a senha certa nunca sai daqui (o login certo é do projeto setup).
  test('senha errada de conta existente dá a mesma resposta de conta inexistente @regression', async ({ request }) => {
    const attempt = (email: string) =>
      request.post('/login', { data: { email, password: 'senha-errada-qa', captchaToken: TURNSTILE_TEST_TOKEN } });

    const [existing, missing] = await Promise.all([attempt(QA_USER_EMAIL), attempt('qa-automation-inexistente@example.com')]);

    expect(existing.status()).toBe(401);
    expect(missing.status()).toBe(401);
    // Mensagem igual: a tela de login não revela quais e-mails têm conta.
    expect(await existing.json()).toEqual(await missing.json());
  });
});
