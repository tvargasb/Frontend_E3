import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; 
import { useSocket } from '../context/SocketContext'; 
import { jwtDecode } from 'jwt-decode'; 
import '../assets/styles/GamePage.css';
import GameDashboard from '../components/GameDashboard';
import GameChat from '../components/GameChat';
import Confetti from 'react-confetti';

import useSound from 'use-sound';
import swordSfx from '../assets/sounds/sword.wav';
import victorySfx from '../assets/sounds/victory.mp3';
import notifySfx from '../assets/sounds/notification.wav';


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const MAPA_POSICIONES = {
  // SISTEMA ENDOR
  'Kef Bir': '1 / 1 / span 1 / span 2',     
  'Endor': '2 / 1 / span 2 / span 2',         

  //SISTEMA TATOOINE
  // Ocupan filas 1-3, columnas 6-9. 
  'Tatooine': '1 / 6 / span 1 / span 3',      
  'Geonosis': '2 / 6 / span 1 / span 2',      
  'Ryloth': '2 / 8 / span 1 / span 1',       

  // SISTEMA KASHYYYK
  // Ocupan filas 3-5, columnas 11-14
  'Trandosha': '3 / 11 / span 1 / span 1',   
  'Kashyyyk': '3 / 12 / span 2 / span 2',     
  'Alaris Prime': '5 / 11 / span 1 / span 2', 
  'Worrroz': '5 / 13 / span 1 / span 1',    

  // SISTEMA NABOO
  // Ocupan filas 4-6, columnas 1-4
  'Naboo': '4 / 2 / span 2 / span 2',        
  "Ohma-D'un": '4 / 1 / span 1 / span 1',     
  'Veris Hydromea': '5 / 4 / span 1 / span 1',
  'Rori': '6 / 2 / span 1 / span 2',       

  // SISTEMA CORUSCANT
  // Ocupan filas 4-7, columnas 6-9
  'Coruscant': '4 / 7 / span 2 / span 2',     
  'Alsakan': '4 / 6 / span 1 / span 1',      
  'Chandrila': '4 / 9 / span 1 / span 1',     
  'Kuat': '6 / 7 / span 1 / span 1',          
  'Corellia': '5 / 5 / span 2 / span 1',     
  'Hosnian Prime': '5 / 9 / span 2 / span 1', 

  // SISTEMA MUSTAFAR
  // Ocupan filas 8-10
  'Mustafar': '8 / 4 / span 2 / span 2',     
  'Sullust': '8 / 6 / span 1 / span 1',       
  'Nevarro': '9 / 3 / span 1 / span 1',       
};

function GamePage() {
  const [partida, setPartida] = useState(null); 
  const [miMision, setMiMision] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ganador, setGanador] = useState(null);
  const [refuerzosPlan, setRefuerzosPlan] = useState([]);

  const [modoAccion, setModoAccion] = useState('ATACAR'); 
  const [territorioOrigen, setTerritorioOrigen] = useState(null); 
  const [territorioDestino, setTerritorioDestino] = useState(null);
  const [resultadoCombate, setResultadoCombate] = useState(null); 

  const { id: partidaId } = useParams(); 
  const { token } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();

  const [playSword] = useSound(swordSfx);
  const [playVictory] = useSound(victorySfx, { volume: 0.5 }); 
  const [playNotify] = useSound(notifySfx);
  const isFirstRender = useRef(true);
  const [turnoNotificacion, setTurnoNotificacion] = useState(null);

  // Decodifica el token de forma segura
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

  const tropasBase = miInfoJugador?.tropasParaReforzar || 0;
  const tropasAsignadas = refuerzosPlan.reduce((total, item) => total + item.tropas, 0);
  const tropasRestantes = tropasBase - tropasAsignadas;   

  const faseActual = (esMiTurno && tropasBase > 0) ? 'REFORZAR' : 'JUEGO';  
  
  const fetchGameState = useCallback(async () => {
    setLoading(true); 
    setError(null);   

    if (!token || !partidaId || !user?.jugadorId) {
      if (!token) setError("Error de autenticación. Intenta recargar.");
      setLoading(false);
      return;
    }

    try {
      const partidaResponse = await fetch(`${API_BASE_URL}/partidas/${partidaId}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!partidaResponse.ok) {
        const data = await partidaResponse.json();
        throw new Error(data.error || 'No se pudo cargar la partida.');
      }
      const partidaData = await partidaResponse.json();
      setPartida(partidaData);

      const misionResponse = await fetch(`${API_BASE_URL}/misiones?partidaId=${partidaId}&jugadorId=${user.jugadorId}`, {
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
      const response = await fetch(`${API_BASE_URL}/jugadas`, {
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

      if (tipo === 'ATACAR' && data.resultado?.combate) {
        playSword();
        setResultadoCombate(data.resultado.combate);
      }

      if (data.gameOver) {
        playVictory();
        setGanador(data.ganadorName || user.name);
        return;
      }
      
      setTerritorioOrigen(null);
      setTerritorioDestino(null);
    } catch (err) {
      setError(err.message); 
    }
  };


  useEffect(() => {
    if (user !== undefined) { 
        fetchGameState();
    }
  }, [fetchGameState, user]); 

  useEffect(() => {
    if (socket && user?.jugadorId) {
        socket.emit('register', user.jugadorId);
        console.log(`Socket registrado para jugador ${user.jugadorId}`);
    }
  }, [socket, user?.jugadorId]);

  // Notificar turno
useEffect(() => {
  if (!partida || !user) return;

  const esMiTurnoAhora = partida.turnoActualId === user.jugadorId;

  if (isFirstRender.current) {
    isFirstRender.current = false; 
    return; 
  }
  if (esMiTurnoAhora) {
     playNotify();
     setTurnoNotificacion("🚀 ¡Es tu turno, Comandante! 🚀");
  }

}, [partida?.turnoActualId, user?.jugadorId, playNotify]); 

  
  // Efecto para que mensaje de error dure 3 seg
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 3000); 
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (turnoNotificacion) {
      const timer = setTimeout(() => {
        setTurnoNotificacion(null);
      }, 3000); 
      return () => clearTimeout(timer);
    }
  }, [turnoNotificacion]);
  
  // Configuración de listeners de WebSockets
  useEffect(() => {
    if (!socket) return; 

    if (user?.jugadorId) {
        socket.emit('register', user.jugadorId);
    }

    const handleEstadoActualizado = () => {
      console.log("WebSocket: Estado actualizado. Recargando datos...");
      fetchGameState(); 
    };

    const handleErrorJuego = (errorMsg) => {
      console.error("WebSocket Error:", errorMsg);
      setError(errorMsg.error || "Error desconocido desde el servidor.");
    };

    const handleJuegoTerminado = (data) => {
      console.log("Juego terminado recibido:", data);
      if (data.ganadorId === user.jugadorId) {
         playVictory();
      }      
      setGanador(data.ganadorName);
    };

    socket.on('estado_actualizado', handleEstadoActualizado);
    socket.on('error_juego', handleErrorJuego);
    socket.on('juego_terminado', handleJuegoTerminado);

    return () => {
      socket.off('estado_actualizado', handleEstadoActualizado);
      socket.off('error_juego', handleErrorJuego);
      socket.off('juego_terminado', handleJuegoTerminado); 
    };
  }, [socket, fetchGameState, user]); 

  const handleConfirmarRefuerzos = () => {
    if (tropasRestantes !== 0) {
      setError(`Debes asignar TODAS tus tropas. Te faltan ${tropasRestantes}.`);
      return;
    }
    enviarJugada('REFORZAR', refuerzosPlan);
    setRefuerzosPlan([]); 
  };

  const handleResetearRefuerzos = () => {
    setRefuerzosPlan([]); 
  };

  const handleTerritorioClick = (territorio) => {
    if (!esMiTurno) { 
      setError("No es tu turno.");
      return;
    }
    setError(null);
    setTerritorioDestino(null);

    if (faseActual === 'REFORZAR') {
      if (territorio.jugadorId !== user.jugadorId) {
        setError("Solo puedes reforzar tus propios territorios.");
        return;
      }

      if (tropasRestantes <= 0) {
        setError("Ya has asignado todas tus tropas. Pulsa 'Confirmar' o 'Resetear'.");
        return;
      }

      const input = prompt(`¿Cuántas tropas añadir a ${territorio.Territorio.name}? (Disponibles: ${tropasRestantes})`);
      const cantidad = Number(input);

      if (input && !isNaN(cantidad) && cantidad > 0) {
        if (cantidad > tropasRestantes) {
          setError(`Solo te quedan ${tropasRestantes} tropas.`);
          return;
        }

        setRefuerzosPlan(prevPlan => {
          const existente = prevPlan.find(p => p.territorioId === territorio.territorioId);
          if (existente) {
            return prevPlan.map(p => 
              p.territorioId === territorio.territorioId 
                ? { ...p, tropas: p.tropas + cantidad } 
                : p
            );
          }
          return [...prevPlan, { territorioId: territorio.territorioId, tropas: cantidad }];
        });
      }

    } else if (faseActual === 'JUEGO') { 
      if (!territorioOrigen) {
        if (territorio.jugadorId !== user.jugadorId) {
          setError("Debes seleccionar un territorio propio como origen.");
          return;
        }
        if (modoAccion === 'ATACAR' && territorio.cantidadTropas < 2) {
          setError("Necesitas al menos 2 tropas para atacar desde aquí.");
          return;
        }
        if (modoAccion === 'MANIOBRAR' && territorio.cantidadTropas < 2) {
          setError("Necesitas al menos 2 tropas para maniobrar (debes dejar 1).");
          return;
        }
        setTerritorioOrigen(territorio);
        
      } else {
        const origenId = territorioOrigen.territorioId;
        const destinoId = territorio.territorioId;

        if (origenId === destinoId) { 
            setTerritorioOrigen(null); 
            return;
        }

        if (modoAccion === 'ATACAR') {
          if (territorio.jugadorId === user.jugadorId) {
            setError("Has seleccionado otro territorio propio. Elige un enemigo adyacente o cancela.");
            setTerritorioOrigen(territorio); 
          } else {
            enviarJugada('ATACAR', { origenId, destinoId });
          }
        } 
        
        else if (modoAccion === 'MANIOBRAR') {
          if (territorio.jugadorId !== user.jugadorId) {
            setError("El destino de la maniobra debe ser un territorio propio.");
          } else {
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

      {ganador && (
        <Confetti 
          width={window.innerWidth} 
          height={window.innerHeight} 
          style={{ zIndex: 10000, pointerEvents: 'none' }} 
        />
      )}

      <h1>Partida #{partida.id}</h1>
      {error && (
        <div className="error-toast" onClick={() => setError(null)}>
          ⚠️ {error}
        </div>
      )}

      {turnoNotificacion && (
        <div className="turn-toast" onClick={() => setTurnoNotificacion(null)}>
          🔔 {turnoNotificacion}
        </div>
      )}

      {/* Barra de Estado */}
      <div className="game-status-bar">
        <div>
          <strong>Turno de:</strong> {jugadorEnTurno ? jugadorEnTurno.name : 'N/A'} {esMiTurno ? "(¡Es tu turno!)" : ""}
        </div>
        {esMiTurno && (
          <div>
            {faseActual === 'REFORZAR' && (
            <div className="reinforcement-panel">
              <p><strong>FASE: REFORZAR</strong></p>
              <p>Tropas totales: {tropasBase}</p>
              <p style={{ color: 'cyan', fontSize: '1.2em' }}>
                Por asignar: <strong>{tropasRestantes}</strong>
              </p>
              
              <div className="botones-refuerzo">
                <button 
                  onClick={handleConfirmarRefuerzos} 
                  disabled={tropasRestantes > 0} 
                  style={{ backgroundColor: tropasRestantes === 0 ? '#4cd964' : 'gray' }}
                >
                  Confirmar y Enviar
                </button>
                <button onClick={handleResetearRefuerzos} style={{backgroundColor: '#ff6b6b'}}>
                  Borrar Selección
                </button>
              </div>
              <p className="nota-ayuda">Haz clic en tus territorios para repartir tropas.</p>
            </div>
          )}
          </div>
        )}
      </div>

      {/* EL TABLERO */}
      <div className="game-board">
        {partida.EstadoTerritorioEnPartidas && partida.EstadoTerritorioEnPartidas.map(estadoTerritorio => {
          
          // Validación de seguridad
          if (!estadoTerritorio.Territorio) {
             console.warn("Datos de territorio incompletos:", estadoTerritorio);
             return null; 
          }

          const nombreTerritorio = estadoTerritorio.Territorio.name;
          const pos = MAPA_POSICIONES[nombreTerritorio];

          

          // Logica de Clases CSS
          let clasesCSS = "territorio-celda";
          if (estadoTerritorio.jugadorId === user.jugadorId) {
            clasesCSS += ' territorio-propio';
          } else {
            clasesCSS += ' territorio-enemigo';
          }

          if (territorioOrigen?.id === estadoTerritorio.id) {
            clasesCSS += ' selected-origen';
          }

          const planParaEste = refuerzosPlan.find(p => p.territorioId === estadoTerritorio.territorioId);
          const tropasExtra = planParaEste ? planParaEste.tropas : 0;

          return (
            <div 
              key={estadoTerritorio.id}
              className={clasesCSS} 
              onClick={() => handleTerritorioClick(estadoTerritorio)}
              style={{ '--posicion-mapa': pos }}
            >
              <p className="terr-nombre">{nombreTerritorio}</p>
              <p className="terr-tropas">
                {estadoTerritorio.cantidadTropas}
                {tropasExtra > 0 && <span style={{color: '#4cd964'}}> +{tropasExtra}</span>}
            </p>
              <p className="terr-dueño">
                ({partida.Jugadors.find(j => j.id === estadoTerritorio.jugadorId)?.name})
              </p>
            </div>
          );
        })}
      </div>

      {/* PANEL DE ACCIONES */}
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
                Finalizar Turno
              </button>
              <p className="nota-ayuda">
                (Debes asignar todas las tropas antes de atacar)
              </p>
            </div>
          )}
          
          {faseActual === 'JUEGO' && (
            <div>
              <p><strong>FASE: JUGAR</strong> (Turno de {jugadorEnTurno?.name})</p>
              
              <div className="botones-accion">
                <button 
                  onClick={() => setModoAccion('ATACAR')}
                  className={modoAccion === 'ATACAR' ? 'btn-activo' : ''} 
                >
                  Atacar
                </button>
                <button 
                  onClick={() => setModoAccion('MANIOBRAR')}
                  className={modoAccion === 'MANIOBRAR' ? 'btn-activo' : ''} 
                >
                  Maniobrar
                </button>
                <button onClick={handleFinalizarTurno}>
                  Finalizar Turno
                </button>
              </div>
              
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

      <div className="game-sidebar"> 
          <GameDashboard 
            partida={partida} 
            usuarioActualId={user?.jugadorId} 
          />
          
          <GameChat 
            partidaId={partida.id} 
            usuarioNombre={user?.name || "Jugador"} 
          />
      </div>

      {/* Misión Secreta */}
      {miMision && (
        <div className="mision-secreta">
          <h4>Tu Misión Secreta:</h4>
          <p>{miMision.Mision?.descripcion || 'Cargando misión...'}</p>
        </div>
      )}
      {ganador && (
        <div className="game-over-overlay">
          <div className="game-over-card">
            <h2>👑 ¡JUEGO TERMINADO! 👑</h2>
            <p>El ganador es:</p>
            <h1>{ganador}</h1>
            <button onClick={() => navigate('/juego')}>
              Volver al Lobby
            </button>
          </div>
        </div>
      )}

      {/* RESULTADO DE COMBATE */}
      {resultadoCombate && (
        <div className="combat-modal-overlay">
          <div className={`combat-card ${resultadoCombate.territorioEsConquistado ? 'conquista' : 'defensa'}`}>
            <h2>⚔️ Reporte de Batalla ⚔️</h2>
            
            <div className="dados-container">
              <div className="bando atacante">
                <h3>Atacante</h3>
                <div className="dados">
                  {resultadoCombate.dadosAtacante.map((dado, i) => (
                    <span key={i} className="dado dado-rojo">{dado}</span>
                  ))}
                </div>
                <p>Tropas Pérdidas: {resultadoCombate.perdidasDeAtacante}</p>
              </div>

              <div className="vs">VS</div>

              <div className="bando defensor">
                <h3>Defensor</h3>
                <div className="dados">
                  {resultadoCombate.dadosDefensor.map((dado, i) => (
                    <span key={i} className="dado dado-blanco">{dado}</span>
                  ))}
                </div>
                <p>Tropas Pérdidas: {resultadoCombate.perdidasDeDefensor}</p>
              </div>
            </div>

            <div className="resultado-final">
              {resultadoCombate.territorioEsConquistado 
                ? <h3>🎉 ¡TERRITORIO CONQUISTADO! 🎉</h3> 
                : <h3>🛡️ El defensor resistió. 🛡️</h3>
              }
            </div>

            <button onClick={() => setResultadoCombate(null)}>Cerrar Reporte</button>
          </div>
        </div>
      )}
    </div>
    
  );
}

export default GamePage;