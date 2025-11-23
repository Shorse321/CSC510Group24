import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children, url, userId }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io(url);

    newSocket.on("connect", () => {
      console.log("✅ Connected to Socket.IO server:", newSocket.id);
      
      // Register user with socket server if userId is available
      if (userId) {
        newSocket.emit("register", userId);
        console.log(`🔐 Registered userId ${userId} with socket ${newSocket.id}`);
      }
    });

    newSocket.on("disconnect", () => {
      console.log("❌ Disconnected from Socket.IO server");
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [url, userId]);

  // Re-register if userId changes while socket is already connected
  useEffect(() => {
    if (socket && socket.connected && userId) {
      socket.emit("register", userId);
      console.log(`🔐 Re-registered userId ${userId} with socket ${socket.id}`);
    }
  }, [socket, userId]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};