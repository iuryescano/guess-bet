type JobPageProps = {
  params: { id: string };
};

export default function JobPage({ params }: JobPageProps) {
  return (
    <main>
      <h1>Status do job {params.id}</h1>
      <p>Resumo com p_model, p_market_fair, EV e edge será exibido aqui.</p>
      <p>Apostas envolvem risco e responsabilidade do usuário.</p>
    </main>
  );
}
