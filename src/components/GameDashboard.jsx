import React, { useMemo } from 'react';
import '../assets/styles/GameDashboard.css'; 

function GameDashboard({ partida, usuarioActualId }) {
  
  const stats = useMemo(() => {
    if (!partida) return [];

    const sistemasTotales = {}; 
    partida.EstadoTerritorioEnPartidas.forEach(estado => {
      const sis = estado.Territorio.sistemaGalactico;
      sistemasTotales[sis] = (sistemasTotales[sis] || 0) + 1;
    });

    return partida.Jugadors.map(jugador => {
      const misTerritorios = partida.EstadoTerritorioEnPartidas.filter(
        e => e.jugadorId === jugador.id
      );

      const countTerritorios = misTerritorios.length;

      const countTropas = misTerritorios.reduce((sum, t) => sum + t.cantidadTropas, 0);

      const misSistemasCount = {};
      misTerritorios.forEach(estado => {
        const sis = estado.Territorio.sistemaGalactico;
        misSistemasCount[sis] = (misSistemasCount[sis] || 0) + 1;
      });

      const sistemasControlados = Object.keys(sistemasTotales).filter(
        sis => misSistemasCount[sis] === sistemasTotales[sis]
      );

      const countCartas = partida.CartaJugadors 
        ? partida.CartaJugadors.filter(c => c.jugadorId === jugador.id).length 
        : 0;

      return {
        id: jugador.id,
        nombre: jugador.name,
        color: jugador.color || '#fff', 
        territorios: countTerritorios,
        tropas: countTropas,
        sistemas: sistemasControlados,
        cartas: countCartas,
        esTurno: partida.turnoActualId === jugador.id
      };
    });
  }, [partida]);

  if (!partida) return null;

  return (
    <div className="dashboard-panel">
      <h3>📊 Estadísticas de Batalla</h3>
      <div className="dashboard-grid">
        {/* Encabezados */}
        <div className="dash-header">Jugador</div>
        <div className="dash-header">Territorios</div>
        <div className="dash-header">Tropas</div>
        <div className="dash-header">Sistemas</div>
        
        {/* Filas de Jugadores */}
        {stats.map(stat => (
          <React.Fragment key={stat.id}>
            <div className={`dash-cell name ${stat.esTurno ? 'active-turn' : ''}`}>
              {stat.id === usuarioActualId ? '➤ ' : ''}{stat.nombre}
            </div>
            <div className="dash-cell">{stat.territorios}</div>
            <div className="dash-cell">{stat.tropas}</div>
            <div className="dash-cell systems">
              {stat.sistemas.length > 0 ? stat.sistemas.join(', ') : '-'}
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

export default GameDashboard;