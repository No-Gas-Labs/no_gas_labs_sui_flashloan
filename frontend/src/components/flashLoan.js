import { Transaction } from '@mysten/sui/transactions'

export function buildFlashLoanTx({ packageId, poolId, amount, borrower }) {
  const tx = new Transaction()
  tx.moveCall({
    target: `${packageId}::flashloan::borrow`,
    arguments: [tx.object(poolId), tx.pure.u64(BigInt(amount)), tx.pure.address(borrower)],
  })
  return tx
}