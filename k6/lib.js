// Partes comuns do smoke e do load: alvo, jornada de leitura e resumo.
import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.1.0/index.js';

// Só homologação. A API de homologação roda na MESMA EC2 e no MESMO RDS da
// produção: nada aqui escreve dados, e a carga é limitada (ver load.js).
const PRODUCTION_HOSTS = ['battlezone.net.br', 'www.battlezone.net.br', 'api.battlezone.net.br'];
export const API_URL = (__ENV.API_URL || 'https://api-homolog.battlezone.net.br').replace(/\/+$/, '');
const host = API_URL.replace(/^https?:\/\//, '').split(/[/:]/)[0];
if (PRODUCTION_HOSTS.includes(host)) throw new Error(`API_URL=${API_URL} aponta para produção. Rode só contra a homologação.`);

const ENDPOINTS = ['GET /tournaments', 'GET /tournaments/{id}', 'GET /players/ranking', 'GET /plans', 'GET /auth/providers', 'GET /status'];

/**
 * Calibrados pelo smoke medido em 17/11/2026 (1 VU, a partir do Brasil):
 * p(95) geral 240 ms, pior endpoint (GET /tournaments) 340 ms, 0% de erro.
 * 1000 ms dá ~3x de folga para a rede do runner do GitHub sem esconder regressão.
 */
export const THRESHOLDS = {
  http_req_failed: ['rate<0.01'],
  checks: ['rate>0.99'],
  http_req_duration: ['p(95)<1000'],
  // Uma linha por endpoint, para o resumo mostrar onde está a latência.
  ...Object.fromEntries(ENDPOINTS.map(name => [`http_req_duration{name:${name}}`, ['p(95)<1000']])),
};

const params = name => ({ headers: { Accept: 'application/json' }, tags: { name } });

const isJsonArray = r => {
  try {
    return Array.isArray(r.json());
  } catch {
    return false;
  }
};

/** Roda uma vez antes dos VUs: escolhe um torneio real para o GET de detalhe. */
export function setup() {
  const res = http.get(`${API_URL}/tournaments?pageSize=1`, params('setup'));
  if (res.status !== 200 || !isJsonArray(res) || res.json().length === 0) {
    throw new Error(`GET /tournaments falhou no setup (status ${res.status}): sem torneio para o detalhe.`);
  }
  return { tournamentId: res.json()[0].id };
}

/** A visita de um jogador anônimo: só GETs públicos, com pausa de leitura no fim. */
export function visitorJourney({ tournamentId }) {
  group('home e busca de campeonatos', () => {
    const list = http.get(`${API_URL}/tournaments?page=1&pageSize=100`, params('GET /tournaments'));
    check(list, {
      'lista de torneios 200': r => r.status === 200,
      'lista de torneios é array': isJsonArray,
    });
  });

  group('detalhe do torneio', () => {
    const detail = http.get(`${API_URL}/tournaments/${tournamentId}`, params('GET /tournaments/{id}'));
    check(detail, {
      'detalhe 200': r => r.status === 200,
      'detalhe é o torneio pedido': r => r.status === 200 && r.json('id') === tournamentId,
    });
  });

  group('ranking', () => {
    const ranking = http.get(`${API_URL}/players/ranking`, params('GET /players/ranking'));
    check(ranking, {
      'ranking 200': r => r.status === 200,
      'ranking tem items': r => r.status === 200 && Array.isArray(r.json('items')),
    });
  });

  group('planos e login', () => {
    const plans = http.get(`${API_URL}/plans`, params('GET /plans'));
    check(plans, { 'planos 200': r => r.status === 200, 'planos é array': isJsonArray });

    const providers = http.get(`${API_URL}/auth/providers`, params('GET /auth/providers'));
    check(providers, { 'providers 200': r => r.status === 200 });
  });

  const status = http.get(`${API_URL}/status`, params('GET /status'));
  check(status, { 'status Ok': r => r.status === 200 && r.body.trim() === 'Ok' });

  // Tempo de leitura entre uma visita e outra (1 a 3 s), como uma pessoa navegando.
  sleep(1 + Math.random() * 2);
}

const ms = value => (value === undefined ? '-' : `${Math.round(value)} ms`);

/** summary.json (bruto) e summary.md (tabela) em k6/results/, mais o resumo padrão no terminal. */
export function summaryFiles(name, data) {
  const m = data.metrics;
  const failed = m.http_req_failed ? m.http_req_failed.values.rate : 0;
  const checks = m.checks ? m.checks.values : { passes: 0, fails: 0 };
  const thresholds = Object.entries(m)
    .filter(([, metric]) => metric.thresholds)
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([metric, { thresholds: t }]) =>
      Object.entries(t).map(([expr, r]) => `| \`${metric}\` | \`${expr}\` | ${r.ok ? 'ok' : '**FALHOU**'} |`),
    );
  const perEndpoint = Object.entries(m)
    .filter(([key]) => key.startsWith('http_req_duration{name:'))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, metric]) => {
      const v = metric.values;
      return `| ${key.slice('http_req_duration{name:'.length, -1)} | ${ms(v.med)} | ${ms(v['p(95)'])} | ${ms(v.max)} |`;
    });

  const md = [
    `## k6 ${name} — ${API_URL}`,
    '',
    `- VUs no pico: ${m.vus_max ? m.vus_max.values.max : '-'}`,
    `- Requisições: ${m.http_reqs.values.count} (${m.http_reqs.values.rate.toFixed(2)} req/s)`,
    `- Iterações (visitas completas): ${m.iterations.values.count}`,
    `- Latência: mediana ${ms(m.http_req_duration.values.med)}, p(90) ${ms(m.http_req_duration.values['p(90)'])}, p(95) ${ms(m.http_req_duration.values['p(95)'])}, máx ${ms(m.http_req_duration.values.max)}`,
    `- Requisições com erro: ${(failed * 100).toFixed(2)}%`,
    `- Checks: ${checks.passes} ok, ${checks.fails} falhos`,
    '',
    '| Endpoint | Mediana | p(95) | Máx |',
    '| --- | --- | --- | --- |',
    ...perEndpoint,
    '',
    '| Métrica | Threshold | Resultado |',
    '| --- | --- | --- |',
    ...thresholds,
    '',
  ].join('\n');

  return {
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
    [`k6/results/${name}-summary.json`]: JSON.stringify(data, null, 2),
    [`k6/results/${name}-summary.md`]: md,
  };
}
