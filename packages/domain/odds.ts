export function decimalToImpliedProb(odd: number) {
  return 1 / odd;
}

export function impliedProbToDecimal(probability: number) {
  return 1 / probability;
}

export function deVigNormalize(probabilities: number[]) {
  const total = probabilities.reduce((sum, value) => sum + value, 0);

  return probabilities.map((probability) => probability / total);
}
