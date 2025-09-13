import React, { useMemo, useState } from 'react'
import GridLayout from 'react-grid-layout'
import { useWalletKit, ConnectButton, useSignAndExecuteTransaction } from '@mysten/dapp-kit'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { detectPoolDiffs } from './components/arbitrage'
import { buildFlashLoanTx } from './components/flashLoan'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

const baseLayouts = [
  { i: 'pools', x: 0, y: 0, w: 6, h: 8 },
  { i: 'trade', x: 6, y: 0, w: 6, h: 8 },
  { i: 'history', x: 0, y: 8, w: 6, h: 8 },
  { i: 'charts', x: 6, y: 8, w: 6, h: 8 },
]

const card = 'pixel-border rounded-sm bg-[#0f1520] p-4'

function PoolsWidget() {
  const pools = [
    { id: 'POOL_A', dex: 'DEX-A', price: 1.002, pair: 'SUI/USDC', apy: 8.2, liq: 1200000 },
    { id: 'POOL_B', dex: 'DEX-B', price: 0.998, pair: 'SUI/USDC', apy: 11.4, liq: 540000 },
  ]
  const opps = detectPoolDiffs(pools)
  return (
    <div className={card}>
      <h2 className="font-pixel text-teal-500 mb-4 text-xs">Pool Monitoring</h2>
      <div className="space-y-2">
        {pools.map(p => (
          <div key={p.id} className="flex justify-between text-sm">
            <div>{p.pair} <span className="opacity-60">({p.dex})</span></div>
            <div className="text-magenta-500">APY {p.apy}%</div>
            <div className="text-teal-500">Liq ${p.liq.toLocaleString()}</div>
          </div>
        ))}
      </div>
      <div className="mt-3 text-xs">
        <div className="opacity-70 mb-1">Detected Arbitrage (Pool Diff):</div>
        {opps.length === 0 ? (
          <div className="opacity-50">None</div>
        ) : (
          <ul className="list-disc list-inside space-y-1">
            {opps.map((o, i) => (
              <li key={i} className="text-teal-500">{o.pair}: {o.from} → {o.to} spread {(o.spread*100).toFixed(2)}%</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function TradePanel() {
  const { currentAccount } = useWalletKit()
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction()
  const [amount, setAmount] = useState('')
  const [pool, setPool] = useState('POOL_A')
  const [packageId, setPackageId] = useState('')
  const [poolId, setPoolId] = useState('')
  const [sending, setSending] = useState(false)

  const onFlashLoan = async () => {
    if (!currentAccount) return alert('Connect Sui Wallet first')
    if (!packageId || !poolId || !amount) return alert('Enter packageId, poolId, and amount')
    setSending(true)
    try {
      const tx = buildFlashLoanTx({ packageId, poolId, amount, borrower: currentAccount.address })
      const res = await signAndExecute({ transaction: tx })
      alert(`Submitted: ${res.digest || 'ok'}`)
    } catch (e) {
      console.error(e)
      alert('Flash loan failed; transaction reverted.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className={card}>
      <h2 className="font-pixel text-magenta-500 mb-4 text-xs">Trading Strategy</h2>
      <div className="text-xs mb-2">Wallet: {currentAccount?.address ?? 'Not connected'}</div>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <input value={packageId} onChange={e => setPackageId(e.target.value)} placeholder="Move packageId" className="bg-black border border-teal-700 p-2 text-xs col-span-2" />
        <input value={poolId} onChange={e => setPoolId(e.target.value)} placeholder="Pool objectId" className="bg-black border border-teal-700 p-2 text-xs col-span-2" />
        <select value={pool} onChange={e => setPool(e.target.value)} className="bg-black border border-teal-700 p-2 text-xs">
          <option value="POOL_A">SUI/USDC</option>
          <option value="POOL_B">SUI/USDT</option>
        </select>
        <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="Loan amount (u64)" className="bg-black border border-magenta-700 p-2 text-xs" />
      </div>
      <div className="mt-1 flex gap-2">
        <button disabled={sending} onClick={onFlashLoan} className="bg-teal-700 hover:bg-teal-500 disabled:opacity-50 text-black px-3 py-2 text-xs">Execute Flash Loan</button>
        <button className="bg-magenta-700 hover:bg-magenta-500 text-black px-3 py-2 text-xs">Simulate</button>
      </div>
    </div>
  )
}

function HistoryView() {
  const history = [
    { id: 'tx1', pnl: +45.23, when: '2m ago' },
    { id: 'tx2', pnl: -3.5, when: '10m ago' },
  ]
  return (
    <div className={card}>
      <h2 className="font-pixel text-teal-500 mb-4 text-xs">Transaction History</h2>
      <div className="space-y-2 text-xs">
        {history.map(h => (
          <div key={h.id} className="flex justify-between">
            <span>{h.id}</span>
            <span className={h.pnl >= 0 ? 'text-teal-500' : 'text-magenta-500'}>{h.pnl >= 0 ? '+' : ''}{h.pnl}%</span>
            <span className="opacity-70">{h.when}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function PriceCharts() {
  const data = useMemo(() => Array.from({ length: 30 }, (_, i) => ({ t: i, p: 10 + Math.sin(i / 3) * 2 + (i % 5 === 0 ? 1 : 0) })), [])
  return (
    <div className={card}>
      <h2 className="font-pixel text-magenta-500 mb-4 text-xs">Real-time Price Chart</h2>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <XAxis dataKey="t" hide />
          <YAxis hide domain={[7, 15]} />
          <Tooltip contentStyle={{ background: '#0b0f14', border: '1px solid #00F5D4', fontSize: 10 }} />
          <Line type="monotone" dataKey="p" stroke="#FF00A8" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function App() {
  const layout = baseLayouts
  const cols = 12
  const rowHeight = 30
  return (
    <div className="min-h-screen">
      <header className="p-4 flex items-center justify-between">
        <div className="font-pixel text-teal-500 text-xs">No_Gas_Labs™ Flash Loan</div>
        <ConnectButton connectText="Connect Sui Wallet" className="text-xs" />
      </header>
      <main className="p-4">
        <GridLayout className="layout" layout={layout} cols={cols} rowHeight={rowHeight} width={1200}>
          <div key="pools"><PoolsWidget /></div>
          <div key="trade"><TradePanel /></div>
          <div key="history"><HistoryView /></div>
          <div key="charts"><PriceCharts /></div>
        </GridLayout>
      </main>
      <footer className="p-4 opacity-60 text-xs">v1 — Sui DEX pool diff detection placeholder; cross-chain & liquidation hooks ready.</footer>
    </div>
  )
}