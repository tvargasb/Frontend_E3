import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './assets/styles/index.css'; 
import Routing from './Routing.jsx'; 
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider> 
          <Routing />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);