import { getJobPdfMeta } from '@/lib/db/client';

type Params = {
  params: { id: string };
};

export async function GET(_request: Request, { params }: Params) {
  const pdfMeta = await getJobPdfMeta(params.id);

  if (!pdfMeta) {
    return Response.json({ message: 'Job não encontrado.' }, { status: 404 });
  }

  if (pdfMeta.status !== 'completed' || !pdfMeta.pdfUrl) {
    return Response.json({ message: `PDF indisponível no status ${pdfMeta.status}.` }, { status: 409 });
  }

  return Response.redirect(pdfMeta.pdfUrl, 302);
}
