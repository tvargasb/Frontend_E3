import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; 
import { jwtDecode } from 'jwt-decode'; 
// import '../assets/styles/Lobby.css'; Agregar diseño

function LobbyPage() {
  const [partidas, setPartidas] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { token } = useAuth(); 
  const navigate = useNavigate();

  const user = useMemo(() => {
    if (!token) return null;
    try {
      return jwtDecode(token); 
    } catch (err) {
      console.error('Error al decodificar el token:', err);
      return null;
    }
  }, [token]); 

  // conexion endpoint: GET /partidas 
  const fetchPartidas = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3000/partidas', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'No se pudieron cargar las partidas.');
      }
      const data = await response.json();
      setPartidas(data.filter(partida => partida.estado === 'lobby'));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchPartidas();
    }
  }, [token]);

  // conexion endpoint: POST /partidas
  const handleCrearPartida = async () => {
    if (!user || !user.jugadorId) {
      setError("Error de autenticación. Intenta recargar la página.");
      return;
    }
    setError(null);
    try {
      const response = await fetch('http://localhost:3000/partidas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          creadorId: user.jugadorId 
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'No se pudo crear la partida.');
      }

      fetchPartidas(); 

    } catch (err) {
      setError(err.message);
    }
  };

  // conexion endpoint: POST /partidas/:id/jugador 
  const handleUnirsePartida = async (partidaId) => {
    if (!user || !user.jugadorId) {
      setError("Error de autenticación. Intenta recargar la página.");
      return;
    }
    setError(null);
    try {
      const response = await fetch(`http://localhost:3000/partidas/${partidaId}/jugador`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          jugadorId: user.jugadorId 
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'No se pudo unir a la partida.');
      }

      navigate(`/partida/${partidaId}`);

    } catch (err) {
      if (err.message.includes('El jugador ya está en la partida')) {
        console.log("Ya estabas en la partida, redirigiendo...");
        navigate(`/partida/${partidaId}`);
      } else {
        setError(err.message);
      }
    }
  };

  return (
    <div className="lobby-container">
      <h2>Salas Disponibles (Lobby)</h2>
      {error && <p className="error-message">{error}</p>}
      <button onClick={handleCrearPartida} disabled={loading}>
        Crear Nueva Partida
      </button>

      <hr />

      {loading ? (
        <p>Cargando partidas...</p>
      ) : (
        <div className="lista-partidas">
          {partidas.length === 0 ? (
            <p>No hay partidas disponibles. ¡Crea una!</p>
          ) : (
            partidas.map(partida => (
              <div key={partida.id} className="partida-item">
                <strong>Partida ID: {partida.id}</strong>
                <p>Estado: {partida.estado}</p>
                <p>Jugadores: {partida.Jugadors.length} / 4</p>
                <button onClick={() => handleUnirsePartida(partida.id)}>
                  Unirse
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default LobbyPage;