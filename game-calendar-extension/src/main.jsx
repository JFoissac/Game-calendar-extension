import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import TwitchCallback from './components/TwitchCallback.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<App />} errorElement={<ErrorBoundary />} />
        <Route path="/callback" element={<TwitchCallback />} errorElement={<ErrorBoundary />} />
        <Route path="*" element={<ErrorBoundary />} />
      </Routes>
    </HashRouter>
  </React.StrictMode>
)
