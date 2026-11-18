// Só homologação. A produção (battlezone.net.br / api.battlezone.net.br) é
// recusada aqui, antes de qualquer teste rodar.
// .env opcional (veja .env.example). Sem ele, valem os defaults de homologação.
try {
  process.loadEnvFile();
} catch {
  // sem .env
}

const PRODUCTION_HOSTS = ['battlezone.net.br', 'www.battlezone.net.br', 'api.battlezone.net.br'];

function homologUrl(name: string, fallback: string): string {
  const value = (process.env[name] || fallback).replace(/\/+$/, '');
  const host = new URL(value).hostname;
  if (PRODUCTION_HOSTS.includes(host)) {
    throw new Error(`${name}=${value} aponta para produção. Esta suíte roda só contra a homologação.`);
  }
  return value;
}

export const WEB_URL = homologUrl('WEB_URL', 'https://battlezone-bay.vercel.app');
export const API_URL = homologUrl('API_URL', 'https://api-homolog.battlezone.net.br');

// Conta de jogador da homologação. Sem ela, os testes logados pulam.
export const QA_USER_EMAIL = process.env.QA_USER_EMAIL ?? '';
export const QA_USER_PASSWORD = process.env.QA_USER_PASSWORD ?? '';
export const HAS_QA_USER = !!(QA_USER_EMAIL && QA_USER_PASSWORD);
export const NO_QA_USER_MESSAGE = 'defina QA_USER_EMAIL e QA_USER_PASSWORD (veja .env.example) para rodar os testes logados';

// A homologação usa a chave secreta de TESTE do Turnstile: este token passa sempre.
export const TURNSTILE_TEST_TOKEN = 'XXXX.DUMMY.TOKEN.XXXX';
