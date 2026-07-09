import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { loadChatwoot } from './lib/chatwoot.js';
import './styles/tokens.css';
import './styles/global.css';
import './styles/animations.css';
import './styles/mascot.css';
import './styles/components.css';
import './styles/v8.css';

// Optional Chatwoot support widget — no-op if VITE_CHATWOOT_* env vars
// are not configured.
loadChatwoot();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
