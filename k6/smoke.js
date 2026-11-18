// Smoke de performance: 1 usuário por 30 s. Prova que a jornada pública
// funciona e dá a linha de base que calibra os thresholds (ver lib.js).
// Rodar: k6 run k6/smoke.js   (API_URL=... para outro alvo de homologação)
import { setup, summaryFiles, THRESHOLDS, visitorJourney } from './lib.js';

// O smoke faz só ~70 a 85 requisições: com o limite de 1% da carga, UMA queda de
// conexão no caminho runner → Cloudflare (já aconteceu, sem a requisição chegar à
// API) reprova a execução. Aqui o limite tolera uma ou duas falhas de rede; a carga,
// com ~2.500 requisições, segue com 1%. Erro de verdade na API ainda reprova pelos
// checks e pelos tempos.
export const options = {
  vus: 1,
  duration: '30s',
  thresholds: {
    ...THRESHOLDS,
    http_req_failed: ['rate<0.03'],
    checks: ['rate>0.97'],
  },
};

export { setup };
export default visitorJourney;
export const handleSummary = data => summaryFiles('smoke', data);
