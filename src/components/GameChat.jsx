import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import '../assets/styles/GameChat.css'; 

function GameChat({ partidaId, usuarioNombre }) {
  const [mensaje, setMensaje] = useState("");
  const [chat, setChat] = useState([]);
  const socket = useSocket();
  const chatEndRef = useRef(null); 

  useEffect(() => {
    if (!socket) return;

    const handleNuevoMensaje = (data) => {
      setChat(prev => [...prev, data]);
      // Scroll automatico
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    };

    socket.on('nuevo_mensaje', handleNuevoMensaje);

    return () => {
      socket.off('nuevo_mensaje', handleNuevoMensaje);
    };
  }, [socket]);

  const enviarMensaje = (e) => {
    e.preventDefault();
    if (mensaje.trim()) {
      socket.emit('enviar_mensaje', {
        partidaId,
        mensaje,
        usuarioNombre
      });
      setMensaje("");
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">Chat de la Partida</div>
      <div className="chat-messages">
        {chat.map((msg, i) => (
          <div key={i} className={`chat-message ${msg.usuario === usuarioNombre ? 'propio' : 'otro'}`}>
            <strong>{msg.usuario}: </strong> {msg.texto}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      <form onSubmit={enviarMensaje} className="chat-form">
        <input 
          value={mensaje} 
          onChange={e => setMensaje(e.target.value)}
          placeholder="Escribe aquí..." 
        />
        <button type="submit">Enviar</button>
      </form>
    </div>
  );
}

export default GameChat;