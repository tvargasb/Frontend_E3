import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; 
import { jwtDecode } from 'jwt-decode'; 
import '../assets/styles/GamePage.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
function LobbyPage() {
  const [partidasLobby, setPartidasLobby] = useState([]); 
  const [partidasActivas, setPartidasActivas] = useState([]); 
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
  const fetchPartidas = useCallback(async () => { 
    setLoading(true);
    setError(null);
  
    if (!user || !user.jugadorId) {
        setLoading(false);
        return; 
    }
  
    try {
      const response = await fetch(`${API_BASE_URL}/partidas`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
  
      const data = await response.json();  // 👈 SOLO una vez
  
      if (!response.ok) {
        throw new Error(data.error || 'No se pudieron cargar las partidas.');
      }
  
      const misActivas = data.filter(partida =>
        partida.estado === 'en_progreso' &&
        partida.Jugadors.some(j => j.id === user.jugadorId)
      );
      setPartidasActivas(misActivas);
  
      const disponibles = data.filter(partida => partida.estado === 'lobby');
      setPartidasLobby(disponibles);
  
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, user]);
  
  useEffect(() => {
    if (!socket) return;
  
    const handlePartidasActualizadas = () => {
      console.log("Socket: partidas_actualizadas → recargando lobby");
      fetchPartidas();
    };
  
    socket.on('partidas_actualizadas', handlePartidasActualizadas);
  
    return () => {
      socket.off('partidas_actualizadas', handlePartidasActualizadas);
    };
  }, [socket, fetchPartidas]);
  

  const handleCrearPartida = async () => {
    if (!user || !user.jugadorId) {
      setError("Error de autenticación. Intenta recargar la página.");
      return;
    }
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/partidas`, {
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
      const response = await fetch(`${API_BASE_URL}/partidas/${partidaId}/jugador`, {
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
    <div className="lobby-container" style={{padding: '2rem', color: 'white'}}>
      <h1>Centro de Mando</h1>
      {error && <p className="error-message" style={{color: 'red'}}>{error}</p>}

      {partidasActivas.length > 0 && (
        <div className="active-games-section" style={{marginBottom: '2rem'}}>
          <h2 style={{color: '#4cd964'}}>Tus Partidas en Curso (Multipartida)</h2>
          <div className="lista-partidas">
            {partidasActivas.map(partida => (
              <div key={partida.id} className="partida-item" style={{borderColor: '#4cd964', border: '1px solid', padding: '1rem', marginBottom: '1rem', borderRadius: '8px'}}>
                <strong>Partida #{partida.id}</strong>
                <p>Tu turno: {partida.turnoActualId === user.jugadorId ? "SÍ" : "No"}</p>
                <button 
                    onClick={() => navigate(`/juego/${partida.id}`)}
                    style={{backgroundColor: '#4cd964'}}
                >
                  Volver al Tablero
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="lobby-section">
        <h2>Salas Disponibles</h2>
        <button onClick={handleCrearPartida} disabled={loading} style={{marginBottom: '1rem'}}>
            Crear Nueva Partida
        </button>

        {loading ? (
            <p>Cargando...</p>
        ) : (
            <div className="lista-partidas">
            {partidasLobby.length === 0 ? (
                <p>No hay salas de espera. ¡Crea una!</p>
            ) : (
                partidasLobby.map(partida => (
                <div key={partida.id} className="partida-item" style={{border: '1px solid #666', padding: '1rem', marginBottom: '1rem', borderRadius: '8px'}}>
                    <strong>Partida #{partida.id}</strong> - Estado: {partida.estado}
                    <p>Jugadores: {partida.Jugadors.length} / 4</p>
                    {partida.Jugadors.some(j => j.id === user.jugadorId) ? (
                        <button onClick={() => navigate(`/partida/${partida.id}`)}>Volver a Sala de Espera</button>
                    ) : (
                        <button onClick={() => handleUnirsePartida(partida.id)}>Unirse</button>
                    )}
                </div>
                ))
            )}
            </div>
        )}
      </div>
    </div>
  );
}

export default LobbyPage;