import React, { createContext, useContext } from 'react';
import io from 'socket.io-client';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const socket = io(API_BASE_URL);

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