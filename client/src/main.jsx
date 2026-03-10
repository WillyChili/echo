import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import { Purchases } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';

// RevenueCat — disabled until production API key is configured
// TODO: replace with production key from RevenueCat dashboard (Project Settings → API Keys)
// if (Capacitor.isNativePlatform()) {
//   Purchases.configure({
//     apiKey: 'YOUR_PRODUCTION_KEY_HERE',
//   });
// }

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
