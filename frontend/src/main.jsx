import React from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WalletProvider } from '@mysten/dapp-kit'
import App from './App'
import './index.css'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <WalletProvider autoConnect>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </WalletProvider>
  </React.StrictMode>,
)