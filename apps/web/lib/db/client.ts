type JobStatus = 'queued' | 'processing' | 'completed' | 'failed';

const inMemoryJobs: Record<string, { status: JobStatus; progress: number; pdfUrl: string | null }> = {};

export async function createJob(jobId: string) {
  inMemoryJobs[jobId] = { status: 'queued', progress: 0, pdfUrl: null };
}

export async function getJobStatus(jobId: string) {
  const job = inMemoryJobs[jobId];

  if (!job) return null;

  return {
    jobId,
    status: job.status,
    progress: job.progress,
    summary: null,
    pdfUrl: job.pdfUrl,
  };
}

export async function getJobPdfMeta(jobId: string) {
  const job = inMemoryJobs[jobId];

  if (!job) return null;

  return {
    status: job.status,
    pdfUrl: job.pdfUrl,
  };
}
