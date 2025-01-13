// SocketContext.js
import React, { createContext, useEffect } from "react";
import socket from "./socket";

export const SocketContext = createContext();
export const SocketProvider = ({ children }) => {
  useEffect(() => {
    // Debug: Log when the socket connects
    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });

    // Debug: Log when the socket disconnects
    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });

    // Cleanup: Disconnect the socket when the app unmounts
    return () => {
      socket.disconnect(); // Ensure the socket is properly disconnected
      console.log("Socket connection terminated.");
    };
  }, []); // Run only once on mount

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
};
