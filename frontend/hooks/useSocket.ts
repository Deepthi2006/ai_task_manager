import { useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

const SOCKET_URL = window.location.origin;

interface SocketEvent {
  type: string;
  data: any;
}

export function useSocket(onEvent?: (event: SocketEvent) => void) {
  const { user, token } = useAuth();
  const socketRef = useRef<any>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    if (!user || !token) return;

    // Socket.io is optional - gracefully degrade if not available
    if (typeof window === "undefined") return;

    try {
      // Try to use window.io if socket.io-client is loaded via script tag
      // Otherwise, gracefully skip socket connection
      if (!(window as any).io) {
        console.debug(
          "Socket.io client not available, real-time updates disabled",
        );
        return;
      }

      const io = (window as any).io;
      if (!socketRef.current) {
        socketRef.current = io(SOCKET_URL, {
          query: { userId: user._id },
          auth: { token },
        });

        socketRef.current.on("TASK_UPDATED", (data: any) => {
          onEvent?.({ type: "TASK_UPDATED", data });
        });

        socketRef.current.on("BOTTLENECK_ALERT", (data: any) => {
          onEvent?.({ type: "BOTTLENECK_ALERT", data });
        });

        socketRef.current.on("disconnect", () => {
          console.log("Socket disconnected");
          // Attempt to reconnect after 3 seconds
          reconnectTimeoutRef.current = setTimeout(connect, 3000);
        });
      }
    } catch (error) {
      console.debug("Socket connection error (optional feature):", error);
    }
  }, [user, token, onEvent]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [connect]);

  const emit = useCallback((eventName: string, data: any) => {
    if (socketRef.current) {
      socketRef.current.emit(eventName, data);
    }
  }, []);

  const join = useCallback((room: string) => {
    if (socketRef.current) {
      socketRef.current.emit("join-team", room);
    }
  }, []);

  return { emit, join };
}
