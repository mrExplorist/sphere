'use client';

import { createContext, useContext, useEffect, useState } from 'react';

import { io as ClientIO } from 'socket.io-client';

// Define the type for the SocketContext
type SocketContextType = {
  socket: any | null;
  isConnected: boolean;
};

// Create a new context with initial values
const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

// Custom hook for using the SocketContext
export const useSocket = () => {
  return useContext(SocketContext);
};

// SocketProvider component to wrap the application with Socket.IO functionality
export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  // State to manage the socket instance and connection status
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Effect to run once when the component mounts
  useEffect(() => {
    // Create a new Socket.IO client instance
    const socketInstance = new (ClientIO as any)(process.env.NEXT_PUBLIC_SITE_URL!, {
      path: '/api/socket/io',
      addTrailingSlash: false,
    });

    // Event handler for successful connection
    socketInstance.on('connect', () => {
      setIsConnected(true);
    });

    // Event handler for disconnection
    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    // Set the socket instance in the state
    setSocket(socketInstance);

    // Cleanup function to disconnect the socket when the component unmounts
    return () => {
      socketInstance.disconnect();
    };
  }, []); // The empty dependency array ensures the effect runs only once during component mount

  // Provide the SocketContext to the wrapped components
  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
