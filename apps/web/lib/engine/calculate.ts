import { calculateBo3Markets } from '../../../../packages/domain/markets';
import { decimalToImpliedProb, deVigNormalize } from '../../../../packages/domain/odds';

export type AnalysisInput = {
  mapWinProbability: number;
  marketOdds: number[];
};

export function buildAnalysis(input: AnalysisInput) {
  const markets = calculateBo3Markets(input.mapWinProbability);
  const implied = input.marketOdds.map(decimalToImpliedProb);
  const fair = deVigNormalize(implied);

  return {
    markets,
    marketFairProbabilities: fair,
  };
}
