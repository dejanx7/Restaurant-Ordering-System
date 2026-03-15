"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

interface SSEEvent {
  type: "order:new" | "order:updated";
  orderId: string;
  status?: string;
}

/**
 * SSE hook for restaurant dashboard — receives all order events.
 * Invalidates the orders query on new/updated orders.
 * Calls onNewOrder callback for audio/visual alerts.
 */
export function useOrderSSE({
  onNewOrder,
}: {
  onNewOrder?: (orderId: string) => void;
} = {}) {
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource("/api/sse/orders");
    eventSourceRef.current = es;

    es.onopen = () => {
      setConnected(true);
    };

    es.onmessage = (event) => {
      try {
        const data: SSEEvent = JSON.parse(event.data);

        if (data.type === "order:new") {
          queryClient.invalidateQueries({ queryKey: ["orders", "active"] });
          onNewOrder?.(data.orderId);
        } else if (data.type === "order:updated") {
          queryClient.invalidateQueries({ queryKey: ["orders", "active"] });
        }
      } catch {
        // Ignore parse errors (heartbeats)
      }
    };

    es.onerror = () => {
      setConnected(false);
      es.close();
      eventSourceRef.current = null;

      // Reconnect after 3 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 3000);
    };
  }, [queryClient, onNewOrder]);

  useEffect(() => {
    connect();

    return () => {
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  return { connected };
}
