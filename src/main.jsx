// src/main.jsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app.jsx'; // Lowercase 'a', explicit extension
import './index.css'; // Your global CSS file (ensure this path is correct)
import { BrowserRouter } from 'react-router-dom'; // Import BrowserRouter
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';

// Get the root element from your HTML (usually index.html)
const rootElement = document.getElementById('root');

// Create a root instance
const root = ReactDOM.createRoot(rootElement);

// Render the application
root.render(
  <React.StrictMode>
    {/* Wrap the entire application with BrowserRouter */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);