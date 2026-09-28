import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import AppToaster from './components/ui/AppToaster'
import App from './App'
import 'aos/dist/aos.css'
import './index.css'
import QueryProvider from './providers/QueryProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
    <QueryProvider>
      <App />
      <AppToaster />
    </QueryProvider>
    </BrowserRouter>
  </StrictMode>,
)
