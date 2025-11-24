# HTML3_front_252s2

Links de Despliegue:
    Frontend (Netlify/Vercel): [Link](https://super-tiramisu-b9d0ae.netlify.app)
    Backend (Render): [Link](https://html3-back-api.onrender.com)

Configuración y Ejecución local:
    Requisitos:
        - Node.js
        - yarn
        - Servidor backend corriendo localmente en http://localhost:3000
    
    Instalación:
        - Clonar el repositorio y acceder a la carpeta del frontend.
        - yarn install para instalar dependencias.
        - yarn dev: comando en consola para iniciar el servidor.

Librerias y frameworks:
    - React (Vite): Framework principal para la construcción de la interfaz de usuario.
    - React Router DOM: Librería utilizada para manejar la navegación y las rutas de la app.
    - CSS: Para ccrear los estilos y usar lexbox y Grid.
    - Socket.io-client: Librería cliente para la comunicación en tiempo real con el servidor de websockets.
    - jwt-decode: Para decodificar tokens JWT en el lado del cliente y obtener información del payload (como jugadorId y rol).


Funcionalidades implementadas:
    - Flujo de Login: El usuario se loguea en la ruta /login. El backend (POST /auth/login) devuelve un token JWT que se guarda en el localStorage del navegador.
    - Estado Global: Se usa React Context API (AuthContext) para gestionar el estado de autenticación en la app.
    - Rutas Protegidas: Se implemento un componente RutaProtegida.jsx que usa el AuthContext. El componente envuelve rutas (como /juego y /partida/:id) para redirigir automáticamente a /login a cualquier usuario que no este autenticado.
    NavBar: Utiliza el AuthContext para mostrar condicionalmente los enlaces Login/Registro (si no ha iniciado sesión) o Ir a Partida/Cerrar Sesión (si está logueado).


Conexión con endpoints del juego, se conectaron los siguientes endpoints:
    - GET /partidas: Se usa en la LobbyPage  para obtener y mostrar la lista de partidas disponibles que están en estado 'lobby'.
    - POST /partidas: Se utiliza en la LobbyPage para permitir que el usuario pueda crear una nueva partida.
    - POST /partidas/:id/jugador: Se usa en la LobbyPage para permitir al usuario unirse a una partida existente.
    - POST /partidas/:id/iniciar: Se usa en la SalaEsperaPage para permitir al creador iniciar el juego.


WebSockets:
    - Se usa un SocketContext para tener una unica instancia de socket en toda la app.
    - Al iniciar sesión, el frontend se conecta al socket, obtiene su socket.id y lo envía al backend (POST /auth/login) para que el servidor lo asocie con el jugadorId.
    - Evento en Tiempo Real (jugador_unido): 
        -Emisión (Backend): Cuando un jugador se une a una partida (llama a POST /partidas/:id/jugador), el backend emite un evento jugador_unido a todos los otros jugadores que ya estaban en esa sala.
        - Escucha (Frontend): El componente SalaEsperaPage.jsx tiene un listener, que cuando recibe este evento, automáticamente vuelve a llamar a fetchDetallesPartida() para refrescar la lista de jugadores, haciendo que se actualice en tiempo real.
    - Evento en Tiempo Real (partida_iniciada):
        - Emisión (Backend): Cuando el creador de la partida llama a POST /partidas/:id/iniciar, el backend emite partida_iniciada a todos los sockets en la sala.
        - Escucha (Frontend): SalaEsperaPage.jsx escucha este evento y (por implementar) mandará al usuario al tablero de juego.

