import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { applyCssMotionTokens } from './lib/motion'
import './styles/fonts.css'
import './styles/index.css'

applyCssMotionTokens()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
