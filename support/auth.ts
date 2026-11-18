import { readFileSync } from 'node:fs';
import type { APIRequestContext, PlaywrightWorkerArgs } from '@playwright/test';
import { API_URL } from './env';

/** storageState gravado pelo projeto `setup` (tests/auth.setup.ts). Fora do git. */
export const AUTH_FILE = '.auth/player.json';

type StorageState = { origins: { origin: string; localStorage: { name: string; value: string }[] }[] };

/** O JWT que o setup guardou no localStorage do front (chave `token`, como o AuthContext). */
export function savedToken(): string {
  const state = JSON.parse(readFileSync(AUTH_FILE, 'utf8')) as StorageState;
  const token = state.origins.flatMap(o => o.localStorage).find(item => item.name === 'token')?.value;
  if (!token) throw new Error(`${AUTH_FILE} sem token: o projeto setup rodou sem credenciais?`);
  return token;
}

/** Contexto de API com o Bearer do jogador de teste, reaproveitando o login do setup. */
export function newPlayerApi(playwright: PlaywrightWorkerArgs['playwright']): Promise<APIRequestContext> {
  return playwright.request.newContext({
    baseURL: API_URL,
    extraHTTPHeaders: { Accept: 'application/json', Authorization: `Bearer ${savedToken()}` },
  });
}
