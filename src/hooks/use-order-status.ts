"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface SSEEvent {
  type: "order:new" | "order:updated";
  orderId: string;
  status?: string;
}

/**
 * SSE hook for customer order tracking — receives status updates for a single order.
 * Calls onStatusChange when the order status changes.
 */
export function useOrderStatus({
  orderId,
  onStatusChange,
}: {
  orderId: string;
  onStatusChange?: (status: string) => void;
}) {
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource(`/api/sse/order/${orderId}`);
    eventSourceRef.current = es;

    es.onopen = () => {
      setConnected(true);
    };

    es.onmessage = (event) => {
      try {
        const data: SSEEvent = JSON.parse(event.data);
        if (data.type === "order:updated" && data.status) {
          onStatusChange?.(data.status);
        }
      } catch {
        // Ignore parse errors
      }
    };

    es.onerror = () => {
      setConnected(false);
      es.close();
      eventSourceRef.current = null;

      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 3000);
    };
  }, [orderId, onStatusChange]);

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
