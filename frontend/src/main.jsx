import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Global styles
const style = document.createElement('style');
style.textContent = `
  *, *::before, *::after { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    background: #f9fafb;
    color: #111827;
    -webkit-font-smoothing: antialiased;
  }
  a { color: inherit; }
  button, input, select, textarea {
    font-family: inherit;
  }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: #f1f5f9; }
  ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

  /* FullCalendar overrides */
  .fc .fc-button-primary {
    background-color: #1e40af !important;
    border-color: #1e40af !important;
  }
  .fc .fc-button-primary:hover {
    background-color: #1d4ed8 !important;
  }
  .fc .fc-button-primary:not(:disabled):active,
  .fc .fc-button-primary:not(:disabled).fc-button-active {
    background-color: #1e3a8a !important;
  }
  .fc-event { cursor: pointer; border-radius: 4px !important; }
  .fc-day-today { background: #eff6ff !important; }
  .fc-toolbar-title { font-size: 1.1rem !important; font-weight: 700 !important; }
`;
document.head.appendChild(style);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
