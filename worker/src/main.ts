import { analyzeJob } from './processors/analyzeJob';

async function main() {
  console.log('Worker iniciado. Aguardando jobs...');

  // Placeholder: integração com fila (BullMQ/SQS) entra na fase de implementação.
  await analyzeJob('job_placeholder');
}

main().catch((error) => {
  console.error('Falha ao iniciar worker:', error);
  process.exit(1);
});
