import { getJobStatus } from '@/lib/db/client';

type Params = {
  params: { id: string };
};

export async function GET(_request: Request, { params }: Params) {
  const job = await getJobStatus(params.id);

  if (!job) {
    return Response.json({ message: 'Job não encontrado.' }, { status: 404 });
  }

  return Response.json(job, { status: 200 });
}
