import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import { store } from './store/store.js';

store.init();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <a className="skip-link" href="#main">Skip to content</a>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
