import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import '../assets/styles/Forms.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [socketId, setSocketId] = useState(null);
  const [error, setError] = useState(null);
  const { login } = useAuth();
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    function onConnect() {
      console.log('Socket conectado:', socket.id);
      setSocketId(socket.id);
    }

    if (socket.connected) {
      onConnect(); 
    } else {
      socket.on('connect', onConnect);
    }

    return () => {
      socket.off('connect', onConnect);
    };
  }, [socket]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Email y contraseña son obligatorios.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, socketId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al iniciar sesión.');
      }

      login(data.token, data.jugador);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error al iniciar sesión.');
    }
  };

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit}>
        <h2>Iniciar Sesión</h2>
        {error && <p className="error-message">{error}</p>}

        {!socketId && (
          <p className="info-message">
            Conectando al servidor en segundo plano...
          </p>
        )}

        <div>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label>Contraseña:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={!email || !password}
        >
          Entrar
        </button>
      </form>
    </div>
  );
}

export default LoginPage;
