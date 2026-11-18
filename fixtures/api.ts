import { test as base, expect, type APIRequestContext } from '@playwright/test';
import { Contract } from '../support/contract';
import { newPlayerApi } from '../support/auth';
import { API_URL } from '../support/env';

type ApiWorkerFixtures = { contract: Contract; playerApi: APIRequestContext };

/** Testes de API: o `request` já vem com baseURL da API (playwright.config.ts). */
export const test = base.extend<object, ApiWorkerFixtures>({
  contract: [
    async ({ playwright }, use) => {
      const api = await playwright.request.newContext({ baseURL: API_URL });
      const response = await api.get('/openapi.json');
      expect(response, 'GET /openapi.json').toBeOK();
      await use(new Contract(await response.json()));
      await api.dispose();
    },
    { scope: 'worker' },
  ],
  /** Só nos projetos que dependem do `setup` (api-auth). */
  playerApi: [
    async ({ playwright }, use) => {
      const api = await newPlayerApi(playwright);
      await use(api);
      await api.dispose();
    },
    { scope: 'worker' },
  ],
});

export { expect };

/** Formato de erro de negócio da API: { resultData: { code, description, responseId } }. */
export function expectBusinessError(body: unknown, code: number, description: string | RegExp): void {
  expect(body).toEqual({
    resultData: {
      code,
      description: typeof description === 'string' ? description : expect.stringMatching(description),
      responseId: expect.any(String),
    },
  });
}
