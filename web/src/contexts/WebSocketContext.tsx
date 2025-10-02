import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

/**
 * WebSocket Context for Real-time Updates
 * 
 * Features:
 * - Automatic connection management
 * - Authentication with JWT
 * - Event subscription system
 * - Reconnection handling
 * - Connection status tracking
 */

interface WebSocketContextType {
  socket: Socket | null;
  connected: boolean;
  subscribe: (event: string, callback: (data: any) => void) => () => void;
  emit: (event: string, data: any) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      // Disconnect if user logs out
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    // Get WebSocket URL from environment or default to API URL
    const wsUrl = process.env.REACT_APP_WS_URL || process.env.REACT_APP_API_URL || 'http://localhost:3000';
    
    // Create socket connection with authentication
    const token = localStorage.getItem('token');
    const newSocket = io(wsUrl, {
      auth: {
        token
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('WebSocket connected');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setConnected(false);
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('WebSocket reconnected after', attemptNumber, 'attempts');
      setConnected(true);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  // Subscribe to events
  const subscribe = useCallback((event: string, callback: (data: any) => void) => {
    if (!socket) return () => {};

    socket.on(event, callback);

    // Return unsubscribe function
    return () => {
      socket.off(event, callback);
    };
  }, [socket]);

  // Emit events
  const emit = useCallback((event: string, data: any) => {
    if (socket && connected) {
      socket.emit(event, data);
    }
  }, [socket, connected]);

  const value = {
    socket,
    connected,
    subscribe,
    emit
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}
