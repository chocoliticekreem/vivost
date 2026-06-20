import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/theme.css';

/**
 * Entry point for :App:.
 * Validates the existence of the root element before rendering.
 */
const container = document.getElementById('root');

if (!container) {
  const failureMessage = "Critical Error: Root element with id 'root' was not found in the DOM. " +
                         "Ensure index.html contains <div id=\"root\"></div>.";
  console.error(failureMessage);
  throw new Error(failureMessage);
}

try {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  console.error(`[Bootstrap Error]: Failed to initialize React application. Details: ${errorMessage}`);
}