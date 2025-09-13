// v1 pool-diff detection placeholder for Sui DEXes.
// Implement real queries via @mysten/sui once pool package/object IDs are provided.
export function detectPoolDiffs(pools) {
  // pools: [{ dex: 'Cetus', pair: 'SUI/USDC', price: 1.002 }, ...]
  const diffs = []
  for (let i = 0; i < pools.length; i++) {
    for (let j = i + 1; j < pools.length; j++) {
      const a = pools[i];
      const b = pools[j];
      if (a.pair === b.pair) {
        const spread = Math.abs(a.price - b.price)
        if (spread > 0.003) {
          diffs.push({ pair: a.pair, from: a.dex, to: b.dex, spread })
        }
      }
    }
  }
  return diffs
}

export const detectCrossChainPlaceholder = () => []
export const detectLiquidationPlaceholder = () => []