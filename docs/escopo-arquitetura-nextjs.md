# Escopo e arquitetura — app Next.js para análise de apostas em eSports

## 1) Objetivo do produto
Construir um aplicativo em **Next.js (App Router)** que:
1. Recebe uma partida + mercado de interesse (ML, handicap e O/U mapas).
2. Consulta dados históricos e odds por fontes permitidas/licenciadas (ou mock provider no MVP).
3. Estima probabilidades "fair" com incerteza.
4. Compara com odds de mercado (de-vig).
5. Gera um relatório explicável em PDF com ranking de oportunidades.

> Definição operacional de aposta promissora no MVP: **edge positivo + incerteza controlada + cobertura mínima de dados recentes**.

---

## 2) Definição formal de "promissora"
Para cada seleção de aposta `s`:
- `p_model(s)`: probabilidade estimada pelo modelo.
- `p_market_fair(s)`: probabilidade de mercado após de-vig.
- `odd_book(s)`: odd atual do book.
- `edge_prob(s) = p_model(s) - p_market_fair(s)`.
- `EV(s) = p_model(s) * odd_book(s) - 1` (em decimal odds).

### Regra de aprovação no ranking
Uma aposta entra no ranking apenas se:
- `EV > 0`.
- `edge_prob >= 0.02` (sugestão inicial, ajustável).
- Intervalo de confiança (90%) menor que um limite definido por mercado.
- Quantidade mínima de dados na janela móvel (ex.: >= 15 mapas/partidas úteis por lado).

---

## 3) Escopo do MVP (vertical slice)
### Entradas
- Jogo (`valorant` inicialmente).
- `matchId` ou URL da partida.
- Mercado alvo (`moneyline`, `map_handicap`, `over_under_maps`).
- Janela de recência (default: 60 dias).

### Saídas
- Probabilidades por mercado.
- Odds justas do modelo.
- Comparativo com odds de mercado e edge.
- Indicador de confiança (alta/média/baixa).
- PDF com justificativa e metodologia resumida.

### Fora do MVP
- Execução com dinheiro real.
- Auto-bet.
- Integração com múltiplos books sem contrato de uso.

---

## 4) Requisitos funcionais
1. Criar job de análise.
2. Acompanhar status (`queued`, `processing`, `completed`, `failed`).
3. Exibir resumo no frontend antes do PDF.
4. Baixar PDF final.
5. Registrar trilha mínima de auditoria (fonte dos dados, timestamp, versão do modelo).

## 5) Requisitos não funcionais
- **Conformidade**: ingestão apenas por fontes permitidas/licenciadas.
- **Escalabilidade**: jobs assíncronos para evitar timeout HTTP.
- **Observabilidade**: logs estruturados + métricas de latência por etapa.
- **Reprodutibilidade**: versão de modelo e snapshot de dados por análise.

---

## 6) Arquitetura recomendada
## 6.1 Componentes
- **Web App (Next.js / App Router)**
  - UI + Route Handlers.
  - Runtime Node.js para endpoints com I/O e autenticação.
- **Job Queue**
  - Redis/BullMQ (simples) ou SQS (cloud-managed).
- **Worker**
  - Consome job, executa pipeline e gera PDF.
- **Banco relacional**
  - PostgreSQL para jobs, análises e metadados.
- **Armazenamento de artefatos**
  - S3/R2/GCS para PDFs e snapshots de entrada.
- **Cache de dados externos**
  - Redis para odds recentes + throttling.

## 6.2 Fluxo ponta a ponta
1. Frontend chama `POST /api/jobs`.
2. API valida payload, grava job e publica na fila.
3. Worker processa:
   - resolve `matchId`;
   - busca dados do provider;
   - calcula probabilidades + incerteza;
   - calcula edge/EV;
   - gera JSON do relatório;
   - renderiza HTML e converte para PDF;
   - salva PDF e marca job como `completed`.
4. Frontend consulta `GET /api/jobs/:id` (polling curto).
5. Ao concluir, frontend habilita `GET /api/jobs/:id/pdf`.

---

## 7) Contratos de API (App Router)
### `POST /api/jobs`
**Request**
```json
{
  "game": "valorant",
  "matchRef": "vlr://match/12345",
  "market": "moneyline",
  "windowDays": 60,
  "juice": 0.07
}
```

**Response (202)**
```json
{
  "jobId": "job_abc123",
  "status": "queued"
}
```

### `GET /api/jobs/:id`
**Response (200)**
```json
{
  "jobId": "job_abc123",
  "status": "processing",
  "progress": 65,
  "summary": null,
  "pdfUrl": null
}
```

### `GET /api/jobs/:id/pdf`
- Retorna arquivo PDF quando `status = completed`.
- Caso contrário: `409` com mensagem de estado.

---

## 8) Modelo de dados mínimo
### Tabela `jobs`
- `id` (pk)
- `status`
- `payload_json`
- `progress`
- `error_message`
- `created_at`, `updated_at`

### Tabela `analyses`
- `id` (pk)
- `job_id` (fk)
- `match_id`
- `game`
- `model_version`
- `provider_version`
- `window_days`
- `result_json` (probabilidades, EV, edge, intervalos)
- `pdf_path`

### Tabela `odds_snapshots`
- `id` (pk)
- `provider`
- `match_id`
- `market`
- `selection`
- `odds_decimal`
- `captured_at`

---

## 9) Motor de cálculo (TypeScript puro)
## 9.1 Utilitários essenciais
- `decimalToImpliedProb(odd) = 1 / odd`
- `impliedProbToDecimal(p) = 1 / p`
- `deVigNormalize([p1..pn]) => p_i / sum(p)`

## 9.2 Markets em Bo3 (Valorant)
Com `p_map` (time A vencer mapa):
- `P(A 2-0) = p_map^2`
- `P(A 2-1) = 2 * p_map^2 * (1 - p_map)`
- `P(A vence série) = P(A 2-0) + P(A 2-1)`
- `P(Over 2.5) = 2 * p_map * (1 - p_map)`
- `P(Under 2.5) = p_map^2 + (1 - p_map)^2`

> Para versões futuras, trocar `p_map` constante por probabilidade por mapa (`p1`, `p2`, `p3`) condicionada a side/map pool.

## 9.3 Juice de 7%
- Usar `juice` como parâmetro de pricing interno (`default 0.07`).
- Separar claramente no relatório:
  1. probabilidade do modelo (fair),
  2. probabilidade mercado de-vig,
  3. odds internas com juice configurado.

---

## 10) Incerteza e margem de erro
### MVP
- Faixa de confiança empírica baseada em volume de amostra + recência.
- Heurística inicial: menor amostra recente => intervalo mais largo.

### Evolução recomendada
1. Glicko-2 para incorporar volatilidade e `rating deviation`.
2. Backtesting em janela rolante por mercado (Brier/log loss/calibração).
3. Bootstrap para intervalos por seleção.

---

## 11) Compliance e risco operacional
- Não depender de scraping proibido em ToS.
- Projetar providers desacoplados (`OddsSource`, `StatsSource`) para troca rápida.
- Implementar rate limiting, cache e retries com backoff.
- Exibir aviso explícito no produto:
  - "Análise estatística; não é recomendação financeira."
  - "Apostas envolvem risco e responsabilidade do usuário."

---

## 12) Plano de implementação em fases
### Fase 1 — MVP funcional
- Next.js App Router + páginas `novo job`, `status`, `resultado`.
- Route Handlers (`POST /api/jobs`, `GET /api/jobs/:id`, `GET /api/jobs/:id/pdf`).
- Worker local com fila.
- Mock provider (`/data/mock-match.json`).
- Engine de probabilidade + edge + EV.
- Geração de PDF (Playwright).

### Fase 2 — Qualidade analítica
- Métricas de calibração.
- Regras de confiança por mercado.
- Versão de modelo e trilha de auditoria.

### Fase 3 — Operação e escala
- Cron de pré-coleta de odds.
- Observabilidade completa (dashboards/alertas).
- Hardening de segurança, autenticação e limites por usuário.

---

## 13) Estrutura de pastas sugerida
```text
apps/
  web/                        # Next.js App Router
    app/
      api/
        jobs/route.ts
        jobs/[id]/route.ts
        jobs/[id]/pdf/route.ts
      jobs/new/page.tsx
      jobs/[id]/page.tsx
    lib/
      engine/
      providers/
      db/
      queue/
  worker/
    src/
      main.ts
      processors/analyzeJob.ts
packages/
  domain/
    odds.ts
    markets.ts
    uncertainty.ts
  pdf/
    templates/
    render.ts
data/
  mock-match.json
```

---

## 14) Critérios de aceite do MVP
- Usuário cria job e recebe `jobId`.
- Status evolui até `completed` sem travar request HTTP.
- Resumo mostra pelo menos: `p_model`, `p_market_fair`, `EV`, `edge`.
- PDF baixa com dados e metodologia.
- Testes unitários cobrem fórmulas de odds/probabilidade/de-vig.
- Projeto inclui disclaimer de risco e fonte dos dados usados.
