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
  'Felucia': '3 / 12 / span 1 / span 1',     
  'Sullust': '4 / 11 / span 1 / span 1',     
  'Kashyyyk': '4 / 12 / span 2 / span 2',    

  // SISTEMA NABOO
  // Ocupan filas 6-8, columnas 13-16
  'Mandalore': '6 / 13 / span 1 / span 1',   
  'Dathomir': '7 / 13 / span 1 / span 1',    
  'Naboo': '7 / 14 / span 2 / span 3',       

  // SISTEMA CORUSCANT
  // Ocupan filas 6-9, columnas 6-10
  'Alderaan': '6 / 6 / span 1 / span 2',     
  'Coruscant': '7 / 6 / span 2 / span 2',    
  'Jedha': '7 / 8 / span 1 / span 1',        
  'Corellia': '8 / 8 / span 1 / span 1',     
  'Bespin': '9 / 7 / span 1 / span 2',       

  // SISTEMA MUSTAFAR
  // Ocupan filas 10-12, columnas 9-13
  'Scarif': '10 / 9 / span 1 / span 2',      
  'Mustafar': '11 / 9 / span 2 / span 2',    
  'Lothal': '11 / 11 / span 1 / span 1',     
  'Yavin 4': '12 / 11 / span 1 / span 1',    
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
  
      const partidaData = await partidaResponse.json();
  
      if (!partidaResponse.ok) {
        throw new Error(partidaData.error || 'No se pudo cargar la partida.');
      }
  
      setPartida(partidaData);
  
      // Misión asignada a este jugador en esta partida
      const misionResponse = await fetch(
        `${API_BASE_URL}/misiones?partidaId=${partidaId}&jugadorId=${user.jugadorId}`,
        {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
  
      if (misionResponse.ok) {
        const misionData = await misionResponse.json();
        if (Array.isArray(misionData) && misionData.length > 0) {
          setMiMision(misionData[0]);
        } else {
          setMiMision(null);
        }
      } else {
        setMiMision(null);
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
  
      await fetchGameState();
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

  // Notificar turno al jugador
  useEffect(() => {
    if (!partida || !user?.jugadorId) return;

    if (partida.turnoActualId === user.jugadorId) {
      if (isFirstRender.current) {
        isFirstRender.current = false;
        setTurnoNotificacion(partida.turnoActualId);
        return;
      }
      if (turnoNotificacion !== partida.turnoActualId) {
        playNotify();
        setTurnoNotificacion(partida.turnoActualId);
      }
    }
  }, [partida, user?.jugadorId, playNotify, turnoNotificacion]);

  // Configuración de listeners de WebSockets
  useEffect(() => {
    if (!socket) return; 

    if (user?.jugadorId) {
      socket.emit('register', user.jugadorId);
      console.log(`Socket registrado para jugador ${user.jugadorId}`);
    }

    if (partidaId) {
      socket.emit('join_partida', { partidaId: Number(partidaId) });
      console.log(`Socket unido a sala partida:${partidaId}`);
    }

    const handleEstadoActualizado = (payload) => {
      console.log("WebSocket: Estado actualizado. Recargando datos...", payload);
      fetchGameState(); 
    };

    const handleErrorJuego = (errorMsg) => {
      console.error("WebSocket Error:", errorMsg);
      setError(errorMsg.error || "Error desconocido desde el servidor.");
    };

    const handleJuegoTerminado = (data) => {
      console.log("Juego terminado:", data);
      playVictory();
      setGanador(data.ganadorName);
    };

    socket.on('estado_actualizado', handleEstadoActualizado);
    socket.on('error_juego', handleErrorJuego);
    socket.on('juego_terminado', handleJuegoTerminado);

    return () => {
      socket.off('estado_actualizado', handleEstadoActualizado);
      socket.off('error_juego', handleErrorJuego);
      socket.off('juego_terminado', handleJuegoTerminado);

      if (partidaId) {
        socket.emit('leave_partida', { partidaId: Number(partidaId) });
        console.log(`Socket salió de sala partida:${partidaId}`);
      }
    };
  }, [socket, fetchGameState, user, partidaId, playVictory]);

  const handleClickTerritorio = (territorio) => {
    if (!esMiTurno) {
      setError("No es tu turno.");
      return;
    }

    if (faseActual === 'REFORZAR') {
      if (territorio.jugadorId !== user.jugadorId) {
        setError("Solo puedes asignar refuerzos a tus propios territorios.");
        return;
      }

      const yaPlanificado = refuerzosPlan.find(p => p.territorioId === territorio.territorioId);
      const cantidad = 1; 

      setRefuerzosPlan((prevPlan) => {
        if (yaPlanificado) {
          return prevPlan.map(p =>
            p.territorioId === territorio.territorioId 
              ? { ...p, tropas: p.tropas + cantidad } 
              : p
          );
        } else {
          return [...prevPlan, { territorioId: territorio.territorioId, tropas: cantidad }];
        }
      });
      return;
    }

    if (modoAccion === 'ATACAR') {
      if (!territorioOrigen) {
        if (territorio.jugadorId !== user.jugadorId) {
          setError("Debes elegir un territorio tuyo como origen del ataque.");
          return;
        }
        setTerritorioOrigen(territorio);
        setError(null);
      } else if (!territorioDestino) {
        if (territorio.territorioId === territorioOrigen.territorioId) {
          setTerritorioOrigen(null);
          setError(null);
          return;
        }
        if (territorio.jugadorId === user.jugadorId) {
          setError("Debes elegir un territorio enemigo como destino.");
          return;
        }
        setTerritorioDestino(territorio);
        setError(null);
      } else {
        setTerritorioOrigen(territorio);
        setTerritorioDestino(null);
        setError(null);
      }
    } else if (modoAccion === 'MANIOBRAR') {
      if (!territorioOrigen) {
        if (territorio.jugadorId !== user.jugadorId) {
          setError("Solo puedes maniobrar tropas entre tus propios territorios.");
          return;
        }
        setTerritorioOrigen(territorio);
        setError(null);
      } else if (!territorioDestino) {
        if (territorio.territorioId === territorioOrigen.territorioId) {
          setTerritorioOrigen(null);
          setError(null);
          return;
        }
        if (territorio.jugadorId !== user.jugadorId) {
          setError("Solo puedes mover tropas hacia otro territorio que también sea tuyo.");
          return;
        }
        setTerritorioDestino(territorio);
        setError(null);
      } else {
        setTerritorioOrigen(territorio);
        setTerritorioDestino(null);
        setError(null);
      }
    }
  };

  const confirmarRefuerzos = async () => {
    if (!esMiTurno) {
      setError("No es tu turno.");
      return;
    }

    if (tropasRestantes !== 0) {
      setError(`Debes asignar exactamente ${tropasBase} tropas. Te faltan ${tropasRestantes * -1} o te sobran.`);
      return;
    }

    try {
      await enviarJugada('REFORZAR', refuerzosPlan);
      setRefuerzosPlan([]);
    } catch (err) {
      console.error(err);
    }
  };

  const ejecutarAtaque = async () => {
    if (!esMiTurno) {
      setError("No es tu turno.");
      return;
    }

    if (!territorioOrigen || !territorioDestino) {
      setError("Debes seleccionar un territorio de origen y uno de destino para atacar.");
      return;
    }

    const datosAtaque = {
      origenId: territorioOrigen.territorioId,
      destinoId: territorioDestino.territorioId
    };

    await enviarJugada('ATACAR', datosAtaque);
  };

  const ejecutarManiobra = async () => {
    if (!esMiTurno) {
      setError("No es tu turno.");
      return;
    }

    if (!territorioOrigen || !territorioDestino) {
      setError("Debes seleccionar territorio origen y destino para maniobrar.");
      return;
    }
    const tropasManiobra = Number(prompt("¿Cuántas tropas quieres mover?"));

    if (!tropasManiobra || tropasManiobra <= 0) {
      setError("Debes ingresar una cantidad válida de tropas.");
      return;
    }

    const datosManiobra = {
      origenManiobraId: territorioOrigen.territorioId,
      destinoManiobraId: territorioDestino.territorioId,
      tropasManiobra
    };

    await enviarJugada('MANIOBRAR', datosManiobra);
  };

  const finalizarTurno = async () => {
    if (!esMiTurno) {
      setError("No es tu turno.");
      return;
    }
    await enviarJugada('FINALIZAR_TURNO', {});
    setModoAccion('ATACAR'); 
  };

  if (loading) return <p>Cargando partida...</p>;
  if (!partida || !user) return <p>No se pudieron cargar los datos de la partida o del jugador.</p>;

  const estadosTerritorios = partida.EstadoTerritorioEnPartidas || [];
  const jugadoresPorId = (partida.Jugadors || []).reduce((acc, j) => {
    acc[j.id] = j;
    return acc;
  }, {});

  const territoriosEnMapa = estadosTerritorios.map((estado) => {
    return {
      territorioId: estado.territorioId,
      name: estado.Territorio?.name || 'Territorio desconocido',
      sistema: estado.Territorio?.sistemaGalactico || 'Sistema desconocido',
      jugadorId: estado.jugadorId,
      jugadorNombre: jugadoresPorId[estado.jugadorId]?.name || 'Jugador desconocido',
      cantidadTropas: estado.cantidadTropas,
    };
  });

  return (
    <div className="game-page">
      {ganador && <Confetti />}

      <GameDashboard
        partida={partida}
        user={user}
        esMiTurno={esMiTurno}
        jugadorEnTurno={jugadorEnTurno}
        miInfoJugador={miInfoJugador}
        tropasBase={tropasBase}
        tropasAsignadas={tropasAsignadas}
        tropasRestantes={tropasRestantes}
        refuerzosPlan={refuerzosPlan}
        confirmarRefuerzos={confirmarRefuerzos}
        modoAccion={modoAccion}
        setModoAccion={setModoAccion}
        territorioOrigen={territorioOrigen}
        territorioDestino={territorioDestino}
        ejecutarAtaque={ejecutarAtaque}
        ejecutarManiobra={ejecutarManiobra}
        finalizarTurno={finalizarTurno}
        error={error}
      />

      <div className="game-main">
        <div className="map-container">
          {territoriosEnMapa.map((territorio) => {
            const stylePos = MAPA_POSICIONES[territorio.name] || '1 / 1 / span 1 / span 1';
            const esMio = territorio.jugadorId === user.jugadorId;
            const esOrigen = territorioOrigen?.territorioId === territorio.territorioId;
            const esDestino = territorioDestino?.territorioId === territorio.territorioId;
            const refuerzoPlanificado = refuerzosPlan.find(p => p.territorioId === territorio.territorioId);

            return (
              <div
                key={territorio.territorioId}
                className={[
                  'territorio',
                  esMio ? 'territorio-mio' : 'territorio-enemigo',
                  esOrigen ? 'territorio-origen' : '',
                  esDestino ? 'territorio-destino' : '',
                ].join(' ')}
                style={{ gridArea: stylePos }}
                onClick={() => handleClickTerritorio(territorio)}
              >
                <div className="territorio-nombre">{territorio.name}</div>
                <div className="territorio-jugador">{territorio.jugadorNombre}</div>
                <div className="territorio-tropas">Tropas: {territorio.cantidadTropas}</div>
                {refuerzoPlanificado && (
                  <div className="territorio-refuerzo">
                    +{refuerzoPlanificado.tropas}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <GameChat partidaId={partidaId} />
      </div>

      {miMision && (
        <div className="mission-panel">
          <h3>Tu Misión Secreta</h3>
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
          <div className="combat-modal">
            <h2>Resultado del Combate</h2>
            <div className="dados-container">
              <div>
                <h3>Atacante</h3>
                <p>Dados: {resultadoCombate.dadosAtacante.join(', ')}</p>
                <p>Pérdidas: {resultadoCombate.perdidasDeAtacante}</p>
              </div>
              <div>
                <h3>Defensor</h3>
                <p>Dados: {resultadoCombate.dadosDefensor.join(', ')}</p>
                <p>Pérdidas: {resultadoCombate.perdidasDeDefensor}</p>
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
