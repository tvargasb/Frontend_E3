import React, { createContext, useContext } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:3000');

const SocketContext = createContext(socket);

export function useSocket() {
  return useContext(SocketContext);
}

export function SocketProvider({ children }) {
  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}