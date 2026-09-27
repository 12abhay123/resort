import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (!user) return;
    const url = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const socket = io(url, { transports: ['websocket'] });
    socketRef.current = socket;

    const pushEvent = (type) => (payload) => setEvents((prev) => [{ type, payload, at: Date.now() }, ...prev].slice(0, 20));
    socket.on('request:new', pushEvent('request:new'));
    socket.on('request:update', pushEvent('request:update'));
    socket.on('task:update', pushEvent('task:update'));
    socket.on('event:published', pushEvent('event:published'));
    socket.on('booking:update', pushEvent('booking:update'));

    return () => socket.disconnect();
  }, [user]);

  return <SocketContext.Provider value={{ socket: socketRef.current, events }}>{children}</SocketContext.Provider>;
}

export const useSocket = () => useContext(SocketContext);
