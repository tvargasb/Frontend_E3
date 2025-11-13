import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function RutaAdmin({ children }) {
  const { token, user } = useAuth();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user?.rol !== 'admin') {
    return <Navigate to="/juego" replace />;
  }
  return children;
}

export default RutaAdmin;