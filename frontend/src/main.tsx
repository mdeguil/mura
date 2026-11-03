import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
// The charte's typeface, served with the app rather than fetched from a
// font service.
import '@fontsource-variable/inter'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
