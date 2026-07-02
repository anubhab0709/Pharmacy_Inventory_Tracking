import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider, createRoutesFromElements, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import App from './App.jsx'
import './styles/globals.css'
import '@fontsource/inter';
import '@fontsource/roboto';

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/*" element={<AuthProvider><App /></AuthProvider>} />
  ),
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  }
)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
