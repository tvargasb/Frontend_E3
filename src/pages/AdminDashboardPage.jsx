import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { jwtDecode } from 'jwt-decode'; 
// import '../assets/styles/AdminDashboard.css'; crear el CSS

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

function AdminDashboardPage() {
  const [players, setPlayers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const { token } = useAuth();

  const user = useMemo(() => {
    if (!token) return null;
    try {
      return jwtDecode(token);
    } catch (err) {
      return null;
    }
  }, [token]);

  const fetchPlayers = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/jugadores`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 403) throw new Error('No tienes permisos de administrador.');
        const data = await response.json();
        throw new Error(data.error || 'No se pudo cargar la lista.');
      }

      const data = await response.json();

      if (user) {
          const filteredPlayers = data.filter(player => player.id !== user.jugadorId);
          setPlayers(filteredPlayers);
      } else {
          setPlayers(data);
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [token, user]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  const handleDelete = async (playerId) => {
    if (!window.confirm('¿Estás seguro de eliminar a este usuario? Esta acción es irreversible.')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/jugadores/${playerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar.');
      }

      setPlayers(prevPlayers => prevPlayers.filter(player => player.id !== playerId));
      alert("Jugador eliminado correctamente.");

    } catch (err) {
      alert(err.message);
    }
  };

  if (isLoading) return <div className="admin-container"><p>Cargando panel...</p></div>;
  if (error) return <div className="admin-container"><p className="error-message">{error}</p></div>;

  return (
    <div className="admin-dashboard">
      <h2>Panel de Administración</h2>
      <p>Bienvenido, Admin. Aquí puedes gestionar los usuarios registrados.</p>
      
      <div className="table-container">
        <table className="players-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Email</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {players.map(player => (
              <tr key={player.id}>
                <td>{player.id}</td>
                <td>{player.name}</td>
                <td>{player.email}</td>
                <td>{player.estado}</td>
                <td>
                  <button 
                    onClick={() => handleDelete(player.id)}
                    className="delete-button"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminDashboardPage;