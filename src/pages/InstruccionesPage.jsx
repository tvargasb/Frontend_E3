import React from 'react';
import '../assets/styles/StaticPage.css';

function InstruccionesPage() {
  return (
    <div className="static-page-container"> 
      <h1>Instrucciones de STAR RISK</h1>

      <div className="instructions-callout">
        <p>
          Bienvenido, General Galáctico. Tu objetivo es la dominación galáctica. Lee estas
          instrucciones para prepararte para la batalla.
        </p>
      </div>

      <section>
        <h2>El Objetivo del Juego</h2>
        <p>
          El objetivo principal de STAR RISK es ser el primer jugador en cumplir su Misión Secreta
          o conquistar todo el mapa. Si lo logras, vencerás a tus enemigos y dominarás el mundo.
        </p>
      </section>

      <section>
        <h2>Inicio: El Lobby</h2>
        <p>Una vez que inicias sesión, llegas al Lobby. Desde aquí puedes:</p>
        <ul>
          <li><strong>Crear una Partida:</strong> Inicia tu propia sala. Puedes establecer una contraseña para hacerla privada.</li>
          <li><strong>Unirse a una Partida:</strong> Ve una lista de partidas en estado "lobby" y únete a la que prefieras.</li>
        </ul>
        <p>
          Una vez en la "Sala de Espera", podrás ver a los jugadores conectados en tiempo real.
          El creador de la sala puede iniciar el juego cuando haya entre 2 y 4 jugadores.
        </p>
      </section>

      <section>
        <h2>Configuración de la Partida</h2>
        <p>Cuando el creador inicia el juego, el servidor automáticamente:</p>
        <ol>
          <li><strong>Asigna Misiones:</strong> Reparte una Misión Secreta aleatoria a cada jugador.</li>
          <li><strong>Reparte Territorios:</strong> Distribuye equitativamente los territorios entre los jugadores. Cada territorio asignado comienza con 1 tropa.</li>
          <li><strong>Decide el Turno:</strong> Se establece el orden de juego aleatoriamente y se da el primer turno.</li>
          <li><strong>Calcula Refuerzos Iniciales:</strong> El primer jugador recibe sus tropas de refuerzo iniciales.</li>
        </ol>
      </section>

      <section>
        <h2>Fases de tu Turno</h2>
        <p>Cada turno se compone de 4 fases que deben realizarse en orden.</p>

        <h3>Fase 1: Reforzar (Obligatorio)</h3>
        <p>Al inicio de tu turno, recibes nuevas tropas. El número se calcula sumando:</p>
        <ul>
          <li><strong>Tropas por Territorios:</strong> El número de territorios que controlas dividido por 3 (redondeado hacia abajo), mínimo 3.</li>
          <li><strong>Bonificación por Sistemas:</strong> Si controlas todos los planetas de un sistema, recibes un bonus fijo.</li>
          <li><strong>Canje de Cartas (Opcional):</strong> Si tienes una combinación válida, puedes canjear cartas por tropas adicionales.</li>
        </ul>
        <p>Debes colocar <strong>todas</strong> estas tropas en territorios que ya controlas antes de poder atacar.</p>

        <h3>Fase 2: Atacar (Opcional)</h3>
        <p>Puedes atacar territorios enemigos desde los tuyos, siguiendo estas reglas:</p>
        <ul>
          <li>El territorio de origen debe ser adyacente al destino.</li>
          <li>Debes tener al menos 2 tropas en el origen (una se queda, las demás atacan).</li>
          <li>La batalla se resuelve con dados: el atacante usa 1–3 y el defensor 1–2, según tropas disponibles.</li>
          <li>Si conquistas, debes mover al menos tantas tropas como dados usaste en el ataque final.</li>
          <li>Si conquistas al menos un territorio en tu turno, recibes una carta de territorio.</li>
        </ul>

        <h3>Fase 3: Maniobrar (Opcional)</h3>
        <ul>
          <li>Puedes mover tropas entre dos territorios conectados por una ruta de tus territorios.</li>
          <li>Solo una maniobra por turno (salvo reglas de variante).</li>
        </ul>

        <h3>Fase 4: Finalizar Turno</h3>
        <p>
          Cuando termines de atacar y maniobrar, finaliza tu turno. El juego pasará al siguiente jugador y
          calculará automáticamente sus refuerzos.
        </p>
      </section>

      <section>
        <h2>Ganar la Partida</h2>
        <p>
          El juego termina inmediatamente cuando un jugador cumple su Misión Secreta o conquista todo el mapa.
          El servidor lo verifica al final de cada turno.
        </p>
      </section>
    </div>
  );
}

export default InstruccionesPage;
