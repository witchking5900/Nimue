import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom' 

// IMPORT THE CONTEXT PROVIDERS
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { GameProvider } from './context/GameContext' 
// 1. ADD THIS IMPORT
import { ToastProvider } from './context/ToastContext' 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <GameProvider>
            {/* 2. ADD THIS WRAPPER */}
            <ToastProvider>
               <App />
            </ToastProvider>
          </GameProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)