export function detectPoolDiffs(pools) {
  const diffs = []
  for (let i = 0; i < pools.length; i++) {
    for (let j = i + 1; j < pools.length; j++) {
      const a = pools[i];
      const b = pools[j];
      if (a.pair === b.pair) {
        const spread = Math.abs(a.price - b.price)
        if (spread > 0.003) diffs.push({ pair: a.pair, from: a.dex, to: b.dex, spread })
      }
    }
  }
  return diffs.sort((x, y) => y.spread - x.spread)
}

export const detectCrossChainPlaceholder = () => []
export const detectLiquidationPlaceholder = () => []