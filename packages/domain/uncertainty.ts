export type ConfidenceLevel = 'high' | 'medium' | 'low';

export function estimateConfidence(sampleSize: number, windowDays: number): ConfidenceLevel {
  if (sampleSize >= 30 && windowDays <= 60) return 'high';
  if (sampleSize >= 15 && windowDays <= 90) return 'medium';

  return 'low';
}
