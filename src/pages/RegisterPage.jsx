import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../assets/styles/Forms.css';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate(); 

  const handleSubmit = async (event) => {
    event.preventDefault(); 
    setError(null); 

    if (!name || !email || !password) {
      setError('Todos los campos son requeridos.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
          rol: 'user',
          estado: 'activo' 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al registrar. Intenta de nuevo.');
      }

      alert('Registro exitoso! Ahora puedes iniciar sesión.');
      navigate('/login'); 

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit}>
        <h2>Registro</h2>
        {error && <p className="error-message">{error}</p>}
        <div>
          <label>Nombre de Usuario:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
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
        <button type="submit">Crear Cuenta</button>
      </form>
    </div>
  );
}

export default RegisterPage;