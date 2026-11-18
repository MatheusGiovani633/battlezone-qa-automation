// Smoke de performance: 1 usuário por 30 s. Prova que a jornada pública
// funciona e dá a linha de base que calibra os thresholds (ver lib.js).
// Rodar: k6 run k6/smoke.js   (API_URL=... para outro alvo de homologação)
import { setup, summaryFiles, THRESHOLDS, visitorJourney } from './lib.js';

export const options = {
  vus: 1,
  duration: '30s',
  thresholds: THRESHOLDS,
};

export { setup };
export default visitorJourney;
export const handleSummary = data => summaryFiles('smoke', data);
