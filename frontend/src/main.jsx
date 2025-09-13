import React from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WalletProvider, SuiClientProvider, createNetworkConfig } from '@mysten/dapp-kit'
import { getFullnodeUrl } from '@mysten/sui'
import App from './App'
import './index.css'
import '@mysten/dapp-kit/styles.css'

const queryClient = new QueryClient()

const { networkConfig } = createNetworkConfig({
  testnet: { url: getFullnodeUrl('testnet') },
  mainnet: { url: getFullnodeUrl('mainnet') },
})

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
      <WalletProvider autoConnect>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </WalletProvider>
    </SuiClientProvider>
  </React.StrictMode>,
)