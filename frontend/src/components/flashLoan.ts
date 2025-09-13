// Generic flash loan call placeholders. Real Move package IDs will be injected later.
// Use wallet-standard to sign transactions.
import { Transaction } from '@mysten/sui'

export function buildFlashLoanTx({ packageId, poolId, amount, borrower }) {
  const tx = new Transaction()
  // NOTE: Replace with real entry function name and types
  tx.moveCall({
    target: `${packageId}::flashloan::borrow`,
    arguments: [tx.object(poolId), tx.pure.u64(BigInt(amount)), tx.pure.address(borrower)],
  })
  return tx
}