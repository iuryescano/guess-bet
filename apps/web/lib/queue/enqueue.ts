import { randomUUID } from 'node:crypto';
import { createJob } from '@/lib/db/client';

export async function enqueueAnalysisJob(_payload: unknown) {
  const jobId = `job_${randomUUID().slice(0, 8)}`;
  await createJob(jobId);

  return jobId;
}
