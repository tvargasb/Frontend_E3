import React, { createContext, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
      return JSON.parse(storedUser);
      } catch {
        localStorage.removeItem('user');
        return null;
      }
    }
    return null;
  });
  const navigate = useNavigate();

  const login = (newToken, user_data) => {
    localStorage.setItem('token', newToken); 
    localStorage.setItem('user', JSON.stringify(user_data));
    setToken(newToken);
    setUser(user_data);
    if (user_data.rol === 'admin') {
      navigate('/admin/dashboard');
      return;
    }
    else {
      navigate('/juego');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null); 
    setUser(null);
    navigate('/'); 
  };

  const value = {
    token,
    user,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}