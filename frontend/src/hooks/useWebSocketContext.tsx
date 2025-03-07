"use client";

import { getBackendUrl } from "@/lib/backendUrl";
import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAppState } from "./useAppState";
import { useWallets } from "./useWalletContext";

interface WebSocketContextType {
  isConnected: boolean;
  error: string | null;
}

const WebSocketContext = createContext<WebSocketContextType>({
  isConnected: false,
  error: null,
});

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { fetchWallets } = useWallets();
  const { currentWallet } = useAppState();

  useEffect(() => {
    // Only connect if we're in a browser environment
    if (typeof window === "undefined") return;

    // Create socket connection
    const socketInstance = io(getBackendUrl(), {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    setSocket(socketInstance);

    // Socket event handlers
    socketInstance.on("connect", () => {
      console.log("WebSocket connected");
      setIsConnected(true);
      setError(null);
    });

    socketInstance.on("disconnect", () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
    });

    socketInstance.on("connect_error", (err) => {
      console.error("WebSocket connection error:", err);
      setError(`Connection error: ${err.message}`);
      setIsConnected(false);
    });

    // Listen for wallet events
    socketInstance.on("wallet_event", async (data) => {
      console.log("Received wallet event:", data);

      if (data.event === "balance_update") {
        // Check if this event is for the current user's wallet
        if (currentWallet && data.data.walletId === currentWallet.id) {
          console.log(
            "Updating wallet data for current wallet:",
            currentWallet.id,
          );
          // Refresh wallet data to get the latest balance
          await fetchWallets();
        } else {
          // Still refresh wallets to update other wallets in the UI
          await fetchWallets();
        }
      }
    });

    // Clean up on unmount
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [fetchWallets]);

  // Implement reconnection logic
  useEffect(() => {
    if (!socket || isConnected) return;

    const reconnectInterval = setInterval(() => {
      console.log("Attempting to reconnect WebSocket...");
      socket.connect();
    }, 5000);

    return () => {
      clearInterval(reconnectInterval);
    };
  }, [socket, isConnected]);

  return (
    <WebSocketContext.Provider value={{ isConnected, error }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);
