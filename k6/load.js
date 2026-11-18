// Carga leve: rampa até 10 usuários simultâneos em ~3 min, só GETs públicos.
//
// Por que no máximo 10 VUs: a API de homologação roda na MESMA EC2 e no MESMO
// banco (RDS) da produção. Mais carga que isso deixaria o site real lento para
// os jogadores. 10 VUs com 1 a 3 s de pausa por visita dão ~14 req/s (medido), o
// suficiente para ver se a latência sobe com concorrência sem virar estresse.
// Teste de estresse/capacidade de verdade pede um ambiente isolado.
//
// Rodar: k6 run k6/load.js   (só manual; no CI é workflow_dispatch)
import { setup, summaryFiles, THRESHOLDS, visitorJourney } from './lib.js';

const MAX_VUS = 10; // teto rígido, ver acima

export const options = {
  scenarios: {
    rampa: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 5 },
        { duration: '30s', target: MAX_VUS },
        { duration: '1m30s', target: MAX_VUS },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: THRESHOLDS,
};

export { setup };
export default visitorJourney;
export const handleSummary = data => summaryFiles('load', data);
