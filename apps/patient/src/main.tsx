import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './App'
import { AuthProvider } from './providers/AuthProvider'
import { TRPCProvider } from './lib/trpc'
import './index.css'
import './shell.css'

const root = document.getElementById('root')
if (!root) throw new Error('Élément #root introuvable')

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <TRPCProvider>
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    </TRPCProvider>
  </React.StrictMode>,
)
