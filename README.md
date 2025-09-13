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
```

UI includes:
- Pool monitoring widgets
- Trading strategy panel (flash loan simulate)
- Transaction history view
- Real-time price charts

## Move (Sui)

```bash
cd move
sui move build
```

Module: `no_gas_labs::flashloan`
- `init_pool` creates a sample pool
- `borrow` entry as atomic flash loan placeholder with event emission and assertion

## Wiring Flash Loan (v1 placeholders)
- Set your `packageId` and `poolId` in frontend callers when you deploy the Move package.
- Uses wallet-standard signing via @mysten/dapp-kit.

## v1 Limitations
- Arbitrage detection includes only Sui DEX pool-diff.
- Cross-chain and liquidation arbitrage placeholders exist but are not wired.
- Flash loan is a generic placeholder awaiting real pool interfaces.

## Testnet Simulation
- Connect Sui Wallet
- Use Trading panel → Simulate/Execute (placeholder) to validate UI flows.