import { enqueueAnalysisJob } from '@/lib/queue/enqueue';

export async function POST(request: Request) {
  const payload = await request.json();

  const jobId = await enqueueAnalysisJob(payload);

  return Response.json({ jobId, status: 'queued' }, { status: 202 });
}
