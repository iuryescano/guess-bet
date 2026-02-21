export function calculateBo3Markets(pMap: number) {
  const pA20 = pMap ** 2;
  const pA21 = 2 * pMap ** 2 * (1 - pMap);

  return {
    pA20,
    pA21,
    pSeriesWin: pA20 + pA21,
    pOver25: 2 * pMap * (1 - pMap),
    pUnder25: pMap ** 2 + (1 - pMap) ** 2,
  };
}
