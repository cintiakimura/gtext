import React from 'react';
import ReactDOM from 'react-dom/client';
import Desktop from './components/Desktop'; // Desktop is now the main component for the popup

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <Desktop />
  </React.StrictMode>
);