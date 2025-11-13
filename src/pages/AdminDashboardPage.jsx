import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

function AdminDashboardPage() {
  const [players, setPlayers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const { token, user } = useAuth();


  const fetchPlayers = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3000/jugadores', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'No se pudo cargar la lista de jugadores.');
      }

      const filteredPlayers = data.filter(player => player.id !== user.id);
      setPlayers(filteredPlayers);

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
    if (!window.confirm('¿Estás seguro de que quieres eliminar a este jugador? Esta acción no se puede deshacer.')) {
      return;
    }

    setError(null); 

    try {
      const response = await fetch(`http://localhost:3000/jugadores/${playerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar el jugador.');
      }
      setPlayers(prevPlayers => prevPlayers.filter(player => player.id !== playerId));

    } catch (err) {
      setError(err.message);
    }
  };

  if (isLoading) {
    return <div className="admin-dashboard-loading">Cargando panel de administración...</div>;
  }

  return (
    <div className="admin-dashboard">
      <h2>Panel de Administración</h2>
      {error && <p className="error-message">{error}</p>}
      
      <h3>Lista de Jugadores</h3>
      <table className="players-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Email</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {players.map(player => (
            <tr key={player.id}>
              <td>{player.id}</td>
              <td>{player.name}</td>
              <td>{player.email}</td>
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
  );
}

export default AdminDashboardPage;