# No_Gas_Labs™ Flash Loan dApp (Sui)

Pure Sui Move dApp with Vite React frontend.

- Wallet: Sui Wallet (wallet-standard)
- RPC: Public Fullnode (mainnet/testnet)
- Branding: dark theme, retro pixel aesthetic, teal/magenta

## Frontend

Requirements: Node 18+, Yarn

```bash
cd frontend
yarn
yarn dev # local preview
yarn build && yarn preview # production build test
```

UI includes:
- Pool monitoring widgets
- Trading strategy panel (flash loan simulate/execute entry)
- Transaction history view
- Real-time price charts

Enhancements (v1.1):
- Responsive grid (mobile/tablet/desktop) using ResponsiveGridLayout
- Drag-and-drop positions persist across reloads and resize (localStorage)
- UX tooltips for APY, PnL and chart values
- Placeholders for cross-chain and liquidation arbitrage within Pool Monitoring

## Move (Sui)

```bash
cd move
sui move build
```

Module: `no_gas_labs::flashloan`
- `init_pool` creates a sample pool
- `borrow` returns a linear `LoanTicket` (must be repaid in-same-tx)
- `repay` consumes ticket; events indicate start/success

### Simulation (devInspect, testnet)
- In Trading panel, enter your deployed `packageId` and `poolId` (from `init_pool`).
- Click Simulate to run `borrow + repay` in a single tx flow.

## v1 Limitations & Roadmap
- Arbitrage detection: only Sui DEX pool-diff in v1.
- Cross-chain and liquidation arbitrage are placeholders (UI + docs hooks) pending API & protocol endpoints.
- Flash loan uses a generic interface; inject real pool IDs/package IDs when available.

## Milestones
- v1.0 (M1-M3): UI scaffold, Move flash loan (LoanTicket), build/test fixes.
- v1.1 (M4): Responsive layout + UX tooltips + grid persistence; placeholders for cross-chain & liquidation.
- v1.2 (M5): Documentation updates for API/Move hooks (this file).

## Future Integration Hooks
- Cross-chain: provide price feed API endpoints and bridge executor; add Move entry `execute_cross_chain(ticket, ...)` in new module.
- Liquidation: subscribe to lending protocol liquidation events; add Move entry `execute_liquidation(ticket, ...)`.