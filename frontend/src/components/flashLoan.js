import { Transaction } from '@mysten/sui/transactions'

export function buildFlashLoanTx({ packageId, poolId, amount }) {
  const tx = new Transaction()
  // 1) borrow -> returns LoanTicket
  const ticket = tx.moveCall({
    target: `${packageId}::flashloan::borrow`,
    arguments: [tx.object(poolId), tx.pure.u64(BigInt(amount))],
  })
  // 2) repay -> consumes LoanTicket
  tx.moveCall({
    target: `${packageId}::flashloan::repay`,
    arguments: [tx.object(poolId), ticket],
  })
  return tx
}