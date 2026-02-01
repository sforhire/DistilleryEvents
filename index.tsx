import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const mountApp = () => {
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    console.error("DistilleryEvents: Root element not found.");
    return;
  }

  console.log("DistilleryEvents: Initiating mount sequence...");

  try {
    const root = createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("DistilleryEvents: Mount successful.");
  } catch (error: any) {
    console.error("DistilleryEvents Fatal Render Error:", error);
    showCrashUI(rootElement, error);
  }
};

const showCrashUI = (el: HTMLElement, error: any) => {
  el.innerHTML = `
    <div style="padding: 40px; font-family: sans-serif; max-width: 600px; margin: auto; color: #333;">
      <h1 style="color: #b45309; text-transform: uppercase; letter-spacing: -0.05em; font-size: 24px; font-weight: 900;">System Error</h1>
      <p style="font-weight: bold; margin-bottom: 20px;">The application failed to initialize.</p>
      <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 20px; border-radius: 12px; font-family: monospace; font-size: 13px; color: #991b1b; overflow-x: auto; white-space: pre-wrap;">
        ${error?.message || error || 'Unknown runtime error'}
      </div>
      <button onclick="window.location.reload()" style="margin-top: 20px; padding: 12px 24px; background: #1a1a1a; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; text-transform: uppercase; font-size: 12px; letter-spacing: 0.1em;">
        Reload Pipeline
      </button>
    </div>
  `;
};

// Listen for unhandled promise rejections (often caused by import map failures)
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled Promise Rejection:', event.reason);
  const root = document.getElementById('root');
  if (root) showCrashUI(root, event.reason);
});

window.addEventListener('error', (e) => {
  if (e.message.includes('Script error') || e.message.includes('import')) {
    const root = document.getElementById('root');
    if (root) showCrashUI(root, e.message);
  }
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountApp);
} else {
  mountApp();
}