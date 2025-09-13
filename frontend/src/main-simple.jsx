import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

// Simple version without React Query and Sui providers for testing
createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <div>
      <h1>Simple Test</h1>
      <p>If you can see this, React is working</p>
    </div>
  </React.StrictMode>,
)