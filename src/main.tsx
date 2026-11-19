import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Fuentes empaquetadas: la demo no depende de internet.
import '@fontsource/onest/latin-400.css'
import '@fontsource/onest/latin-500.css'
import '@fontsource/onest/latin-600.css'
import '@fontsource/onest/latin-700.css'
import './ui/tema.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
