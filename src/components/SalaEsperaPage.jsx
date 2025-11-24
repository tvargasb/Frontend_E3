import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// import '../assets/styles/SalaEspera.css'; agregar estilo?

function SalaEsperaPage() {
  const [partida, setPartida] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { id: partidaId } = useParams(); 
  const { token } = useAuth();
  const socket = useSocket();

  const fetchDetallesPartida = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/partidas/${partidaId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'No se pudo cargar la partida.');
      }
      
      const data = await response.json();
      setPartida(data);
      
      if (data.estado === 'en_progreso') {
        console.log("La partida ya comenzó, (lógica futura: redirigir al tablero).");
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, partidaId]);


  useEffect(() => {
    if (token) {
      setLoading(true); 
      fetchDetallesPartida();
    }
  }, [token, partidaId, fetchDetallesPartida]);

  useEffect(() => {
    if (!socket) return; 

    socket.on('jugador_unido', (nuevoJugador) => {
      console.log('Evento WebSocket recibido: jugador_unido', nuevoJugador);
      alert(`¡${nuevoJugador.name} se ha unido a la partida!`);
      
      fetchDetallesPartida();
    });

    socket.on('partida_iniciada', () => {
        alert('¡El creador ha iniciado la partida! Redirigiendo al tablero...');
        // redirigir al tablero. agregar
    });

    return () => {
      console.log('Limpiando listeners de socket (Sala Espera)');
      socket.off('jugador_unido');
      socket.off('partida_iniciada');
    };
  }, [socket, fetchDetallesPartida]);

  // logica para Iniciar Partida
  const handleIniciarPartida = async () => {
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/partidas/${partidaId}/iniciar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'No se pudo iniciar la partida.');
      }
      
      // Si se inicia con exito Respuesta 200 OK
      alert('¡Partida iniciada! Redirigiendo al tablero...');

    } catch (err) {
      setError(err.message);
    }
  };


  if (loading) return <p>Cargando sala de espera...</p>;
  if (error) return <p className="error-message">{error}</p>;
  if (!partida) return <p>No se encontraron datos de la partida.</p>;

  return (
    <div className="sala-espera-container">
      <h2>Sala de Espera: Partida #{partida.id}</h2>
      <p>Estado: {partida.estado}</p>
      
      <h3>Jugadores Conectados ({partida.Jugadors.length} / 4)</h3>
      <ul>
        {partida.Jugadors.map(jugador => (
          <li key={jugador.id}>{jugador.name}</li>
        ))}
      </ul>
            
      <button onClick={handleIniciarPartida}>
        Iniciar Partida
      </button>
    </div>
  );
}

export default SalaEsperaPage;