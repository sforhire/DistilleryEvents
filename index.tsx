
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const mountApp = () => {
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    console.error("DistilleryEvents: Root element not found.");
    return;
  }

  try {
    const root = createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error: any) {
    console.error("DistilleryEvents Fatal Render Error:", error);
    
    // Display error on screen if the app fails to mount entirely
    rootElement.innerHTML = `
      <div style="padding: 40px; font-family: sans-serif; max-width: 600px; margin: auto; color: #333;">
        <h1 style="color: #b45309; text-transform: uppercase; letter-spacing: -0.05em;">Initialization Failed</h1>
        <p style="font-weight: bold;">The application encountered a fatal error during boot.</p>
        <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 20px; border-radius: 12px; font-family: monospace; font-size: 13px; color: #991b1b; overflow-x: auto;">
          ${error?.message || 'Unknown runtime error'}
        </div>
        <p style="margin-top: 20px; font-size: 14px; color: #666;">
          Check your browser console for more details. This is usually caused by a library failing to load from the CDN.
        </p>
        <button onclick="window.location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #1a1a1a; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">
          Retry Loading
        </button>
      </div>
    `;
  }
};

// Ensure DOM is ready before mounting
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountApp);
} else {
  mountApp();
}
