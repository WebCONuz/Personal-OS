import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import { initDb } from './data/store'
import './index.css'

// Data is read from IndexedDB once before the first render; after that every read is synchronous.
void initDb().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
