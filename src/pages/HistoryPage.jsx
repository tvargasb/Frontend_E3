import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { jwtDecode } from 'jwt-decode';
import '../assets/styles/GamePage.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

function HistoryPage() {
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  const user = useMemo(() => {
    if (!token) return null;
    try { return jwtDecode(token); } catch { return null; }
  }, [token]);

  useEffect(() => {
    const fetchHistorial = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/partidas`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        const misPartidasTerminadas = data.filter(p => 
            p.estado === 'finalizada' && 
            p.Jugadors.some(j => j.id === user.jugadorId)
        );
        
        misPartidasTerminadas.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        
        setHistorial(misPartidasTerminadas);
      } catch (error) {
        console.error("Error cargando historial:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchHistorial();
  }, [token, user]);

  if (loading) return <div className="game-page-container"><p>Cargando historial...</p></div>;

  return (
    <div className="game-page-container">
      <h1>📜 Tu Historial de Batallas</h1>
      
      {historial.length === 0 ? (
        <p>Aún no has terminado ninguna partida.</p>
      ) : (
        <div className="historial-list">
          {historial.map(partida => {
    
            const misionCumplida = partida.MisionJugadors?.find(m => m.cumplida);
            
            let nombreGanador = "N/A";
            if (misionCumplida) {
                const jugadorGanador = partida.Jugadors.find(j => j.id === misionCumplida.jugadorId);
                nombreGanador = jugadorGanador ? jugadorGanador.name : "Desconocido";
            }

            return (
            <div key={partida.id} className="partida-item" style={{borderColor: '#646cff'}}>
                <h3>Partida #{partida.id}</h3>
                <p><strong>Fecha:</strong> {new Date(partida.updatedAt).toLocaleDateString()}</p>
                <p><strong>Ganador:</strong> <span style={{color: 'gold'}}>🏆 {nombreGanador}</span></p> 
                <p><strong>Jugadores:</strong> {partida.Jugadors.map(j => j.name).join(', ')}</p>
                <p><strong>Estado:</strong> {partida.estado.toUpperCase()}</p>
            </div>
            );
        })}
        </div>
      )}
    </div>
  );
}

export default HistoryPage;