import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; 
import { useSocket } from '../context/SocketContext'; 
import { jwtDecode } from 'jwt-decode'; 
// import '../assets/styles/GamePage.css'; 

function GamePage() {
  const [partida, setPartida] = useState(null); 
  const [miMision, setMiMision] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [modoAccion, setModoAccion] = useState('ATACAR'); 
  const [territorioOrigen, setTerritorioOrigen] = useState(null); 
  const [territorioDestino, setTerritorioDestino] = useState(null); 

  const { id: partidaId } = useParams(); 
  const { token } = useAuth();
  const socket = useSocket();
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

  const esMiTurno = partida?.turnoActualId === user?.jugadorId;
  const jugadorEnTurno = partida?.Jugadors.find(j => j.id === partida.turnoActualId);
  const miInfoJugador = partida?.Jugadors.find(j => j.id === user?.jugadorId);
  
  const faseActual = (esMiTurno && (miInfoJugador?.tropasParaReforzar || 0) > 0) ? 'REFORZAR' : 'JUEGO';

  const fetchGameState = useCallback(async () => {
    if (!token || !partidaId || !user?.jugadorId) return;
    try {
      setLoading(true); 
      const partidaResponse = await fetch(`http://localhost:3000/partidas/${partidaId}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!partidaResponse.ok) throw new Error('No se pudo cargar la partida.');
      const partidaData = await partidaResponse.json();
      setPartida(partidaData);

      const misionResponse = await fetch(`http://localhost:3000/misiones?partidaId=${partidaId}&jugadorId=${user.jugadorId}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (misionResponse.ok) {
        const misionData = await misionResponse.json();
        if (misionData.length > 0) setMiMision(misionData[0]);
      }
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, partidaId, user?.jugadorId]);

  const enviarJugada = async (tipo, datos) => {
    setError(null);
    try {
      const response = await fetch('http://localhost:3000/jugadas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          partidaId: Number(partidaId),
          jugadorId: user.jugadorId,
          tipoJugada: tipo,
          datosJugada: datos
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `Error al ${tipo}`);
      }
      setTerritorioOrigen(null);
      setTerritorioDestino(null);
    } catch (err) {
      setError(err.message); 
    }
  };


  useEffect(() => {
    if (user?.jugadorId) { 
        fetchGameState();
    }
  }, [fetchGameState, user?.jugadorId]); 

  useEffect(() => {
    if (!socket) return; 

    const handleEstadoActualizado = () => {
      console.log("WebSocket: Estado actualizado. Recargando datos...");
      fetchGameState(); 
    };
    const handleErrorJuego = (errorMsg) => {
      console.error("WebSocket Error:", errorMsg);
      setError(errorMsg.error || "Error desconocido desde el servidor.");
    };

    socket.on('estado_actualizado', handleEstadoActualizado);
    socket.on('error_juego', handleErrorJuego);

    return () => {
      socket.off('estado_actualizado', handleEstadoActualizado);
      socket.off('error_juego', handleErrorJuego);
    };
  }, [socket, fetchGameState]);

  const handleTerritorioClick = (territorio) => {
    if (!esMiTurno) { 
      setError("No es tu turno.");
      return;
    }
    setError(null);
    setTerritorioDestino(null);

    if (faseActual === 'REFORZAR') {
      const tropas = prompt(`¿Cuántas tropas quieres añadir a ${territorio.Territorio.name}? (Tienes ${miInfoJugador.tropasParaReforzar})`);
      if (tropas && !isNaN(Number(tropas)) && Number(tropas) > 0) {
        if (Number(tropas) > miInfoJugador.tropasParaReforzar) {
            setError(`No puedes asignar ${tropas}. Solo te quedan ${miInfoJugador.tropasParaReforzar}.`);
            return;
        }
        enviarJugada('REFORZAR', [{ territorioId: territorio.territorioId, tropas: Number(tropas) }]);
      }
    } else if (faseActual === 'JUEGO') { 
      if (!territorioOrigen) {
        // Validaciones de origen
        if (territorio.jugadorId !== user.jugadorId) { /* ... */ return; }
        if (modoAccion === 'ATACAR' && territorio.cantidadTropas < 2) { /* ... */ return; }
        if (modoAccion === 'MANIOBRAR' && territorio.cantidadTropas < 2) { /* ... */ return; }
        setTerritorioOrigen(territorio);
      } else {
        // Logica de destino
        const origenId = territorioOrigen.territorioId;
        const destinoId = territorio.territorioId;
        if (origenId === destinoId) { /* ... */ return; }

        if (modoAccion === 'ATACAR') {
          // logica atacar)
          if (territorio.jugadorId === user.jugadorId) { /* ... */ } else {
            enviarJugada('ATACAR', { origenId, destinoId });
          }
        } else if (modoAccion === 'MANIOBRAR') {
          // logica maniobrar
          if (territorio.jugadorId !== user.jugadorId) { /* ... */ } else {
            const tropasMax = territorioOrigen.cantidadTropas - 1;
            const tropas = prompt(`¿Cuántas tropas mover a ${territorio.Territorio.name}? (Máx: ${tropasMax})`);
            const tropasNum = Number(tropas);
            if (tropas && !isNaN(tropasNum) && tropasNum > 0 && tropasNum <= tropasMax) {
              enviarJugada('MANIOBRAR', { 
                  origenManiobraId: origenId, 
                  destinoManiobraId: destinoId,
                  tropasManiobra: tropasNum
              });
            } else {
              setError(`Cantidad inválida. Debes mover entre 1 y ${tropasMax} tropas.`);
            }
          }
        }
      }
    } 
  };

  const handleFinalizarTurno = () => {
    enviarJugada('FINALIZAR_TURNO', {});
    setTerritorioOrigen(null); 
    setTerritorioDestino(null);
    setModoAccion('ATACAR');
  };

  if (loading) return <p>Cargando partida...</p>;
  if (!partida || !user) return <p>No se pudieron cargar los datos de la partida o del usuario.</p>;
  
  return (
    <div className="game-page-container">
      <h1>Partida #{partida.id}</h1>
      {error && <p className="error-message">{error}</p>}

      <div className="game-status-bar">
        <div>
          <strong>Turno de:</strong> {jugadorEnTurno ? jugadorEnTurno.name : 'N/A'} {esMiTurno ? "(Es tu turno!)" : ""}
        </div>
        {esMiTurno && (
          <div>
            <strong>Fase Actual:</strong> {faseActual}
            {faseActual === 'REFORZAR' && ` (Tropas restantes: ${miInfoJugador?.tropasParaReforzar || 0})`}
          </div>
        )}
      </div>

      <div className="game-board">
        {partida.EstadoTerritorioEnPartidas.map(estadoTerritorio => (
          <div 
            key={estadoTerritorio.id}
            className="territorio-celda" 
            onClick={() => handleTerritorioClick(estadoTerritorio)}
            style={{ 
              borderColor: estadoTerritorio.jugadorId === user.jugadorId ? 'cyan' : 'red', 
              backgroundColor: territorioOrigen?.id === estadoTerritorio.id ? 'blue' : 'transparent' 
            }}
          >
            <p>{estadoTerritorio.Territorio.name}</p>
            <p>Tropas: {estadoTerritorio.cantidadTropas}</p>
            <p>(Dueño: {partida.Jugadors.find(j => j.id === estadoTerritorio.jugadorId)?.name})</p>
          </div>
        ))}
      </div>

      {esMiTurno && (
        <div className="action-panel">
          <h3>Tus Acciones:</h3>
          
          {faseActual === 'REFORZAR' && (
            <div>
              <p><strong>FASE: REFORZAR</strong> (Tropas restantes: {miInfoJugador?.tropasParaReforzar || 0})</p>
              <p>Haz clic en tus territorios para añadir tropas.</p>
              <button 
                onClick={handleFinalizarTurno} 
                disabled={miInfoJugador?.tropasParaReforzar > 0} 
              >
                Finalizar Turno (Omitir Ataque/Maniobra)
              </button>
              <p style={{fontSize: '0.8em', color: '#888'}}>
                (Nota: Debes poner 0 tropas para habilitar Atacar/Maniobrar...)
              </p>
            </div>
          )}
          
          {faseActual === 'JUEGO' && (
            <div>
              <p><strong>FASE: JUGAR</strong> (Turno de {jugadorEnTurno?.name})</p>
              
              <button 
                onClick={() => setModoAccion('ATACAR')}
                style={{ backgroundColor: modoAccion === 'ATACAR' ? '#646cff' : '#1a1a1a' }} 
              >
                Atacar
              </button>
              <button 
                onClick={() => setModoAccion('MANIOBRAR')}
                style={{ backgroundColor: modoAccion === 'MANIOBRAR' ? '#646cff' : '#1a1a1a' }} 
              >
                Maniobrar
              </button>
              <button onClick={handleFinalizarTurno}>
                Finalizar Turno
              </button>
              
              <p className="read-the-docs">
                {modoAccion === 'ATACAR' && !territorioOrigen && "Haz clic en tu territorio de origen (debe tener > 1 tropa)."}
                {modoAccion === 'ATACAR' && territorioOrigen && `Origen: ${territorioOrigen.Territorio.name}. Haz clic en un enemigo adyacente.`}
                {modoAccion === 'MANIOBRAR' && !territorioOrigen && "Haz clic en tu territorio de origen (debe tener > 1 tropa)."}
                {modoAccion === 'MANIOBRAR' && territorioOrigen && `Origen: ${territorioOrigen.Territorio.name}. Haz clic en un territorio propio conectado.`}
                {territorioOrigen && <button onClick={() => setTerritorioOrigen(null)}>Cancelar Selección</button>}
              </p>
            </div>
          )}
        </div>
      )}

      {miMision && (
        <div className="mision-secreta">
          <h4>Tu Misión Secreta:</h4>
          <p>{miMision.Mision.descripcion}</p>
        </div>
      )}
    </div>
  );
}

export default GamePage;