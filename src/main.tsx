import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// -------------------------------------------------------------
// Punto de entrada de la aplicación
// -------------------------------------------------------------
// Crea el árbol de React en el elemento con id "root" y envuelve la app en
// StrictMode para detectar patrones potencialmente peligrosos en desarrollo.

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
