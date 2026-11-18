import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { expect, test as setup } from '@playwright/test';
import { AUTH_FILE } from '../support/auth';
import {
  API_URL,
  HAS_QA_USER,
  NO_QA_USER_MESSAGE,
  QA_USER_EMAIL,
  QA_USER_PASSWORD,
  TURNSTILE_TEST_TOKEN,
  WEB_URL,
} from '../support/env';

/**
 * Login pela API, sem passar pela tela: o Turnstile não deixa automatizar o
 * formulário, e a tela de login já tem os próprios testes de renderização.
 * O front guarda o JWT em localStorage['token'] (src/contexts/AuthContext.tsx);
 * gravar o storageState assim é o mesmo que ter logado pela tela.
 */
setup('login do jogador de teste pela API', async ({ request }) => {
  mkdirSync(dirname(AUTH_FILE), { recursive: true });
  // Estado vazio primeiro: os projetos dependentes sempre acham o arquivo e pulam sozinhos.
  writeFileSync(AUTH_FILE, JSON.stringify({ cookies: [], origins: [] }));
  setup.skip(!HAS_QA_USER, NO_QA_USER_MESSAGE);

  const response = await request.post(`${API_URL}/login`, {
    data: { email: QA_USER_EMAIL, password: QA_USER_PASSWORD, captchaToken: TURNSTILE_TEST_TOKEN },
  });
  // Sem o corpo na mensagem: nada de credencial ou token no relatório público.
  expect(response.status(), 'POST /login do jogador de teste').toBe(200);
  const { token } = await response.json();
  expect(typeof token).toBe('string');

  writeFileSync(
    AUTH_FILE,
    JSON.stringify({ cookies: [], origins: [{ origin: WEB_URL, localStorage: [{ name: 'token', value: token }] }] }),
  );
});
