import { defineConfig, devices } from '@playwright/test';
import { AUTH_FILE } from './support/auth';
import { API_URL, WEB_URL } from './support/env';

const isCI = !!process.env.CI;

// O relatório HTML é público (GitHub Pages). Nos projetos logados não há trace,
// vídeo nem screenshot: guardariam o JWT, o corpo do login e o e-mail da conta.
const noEvidence = { trace: 'off', screenshot: 'off', video: 'off' } as const;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: isCI,
  // Sem retry de propósito: teste instável é consertado na causa, não escondido.
  retries: 0,
  // Homologação divide a máquina com a produção: poucos workers, sempre.
  workers: isCI ? 2 : 4,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { open: 'never' }], ['json', { outputFile: 'test-results/results.json' }]],
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts$/,
      use: noEvidence,
    },
    {
      name: 'api',
      testDir: './tests/api',
      use: { baseURL: API_URL, extraHTTPHeaders: { Accept: 'application/json' } },
    },
    {
      name: 'api-auth',
      testDir: './tests/api-auth',
      dependencies: ['setup'],
      use: { ...noEvidence, baseURL: API_URL, extraHTTPHeaders: { Accept: 'application/json' } },
    },
    {
      name: 'chromium',
      testDir: './tests/e2e',
      testIgnore: '**/mobile/**',
      use: { ...devices['Desktop Chrome'], baseURL: WEB_URL },
    },
    {
      name: 'mobile',
      testDir: './tests/e2e',
      use: { ...devices['Pixel 7'], baseURL: WEB_URL },
    },
    {
      name: 'chromium-auth',
      testDir: './tests/e2e-auth',
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], ...noEvidence, baseURL: WEB_URL, storageState: AUTH_FILE },
    },
  ],
});
