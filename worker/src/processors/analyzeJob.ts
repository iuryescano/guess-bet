export async function analyzeJob(jobId: string) {
  console.log(`Processando job ${jobId}...`);

  // Placeholder para pipeline:
  // 1) Resolver matchId
  // 2) Buscar dados do provider
  // 3) Calcular p_model, edge e EV
  // 4) Gerar PDF
  // 5) Atualizar status no banco

  return { jobId, status: 'processing' as const };
}
