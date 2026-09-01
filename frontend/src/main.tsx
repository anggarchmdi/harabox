import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import App from './App'
import './index.css'
import QueryProvider from './providers/QueryProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
    <QueryProvider>
      <App />
      <Toaster position="top-right" richColors />
    </QueryProvider>
    </BrowserRouter>
  </StrictMode>,
)
