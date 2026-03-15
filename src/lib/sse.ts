// In-process event emitter for SSE broadcasts.
// Works for single-server deployments. For multi-server, replace with Redis pub/sub.

type Listener = (data: SSEEvent) => void;

export interface SSEEvent {
  type: "order:new" | "order:updated";
  orderId: string;
  status?: string;
  order?: Record<string, unknown>;
}

class OrderEventEmitter {
  private listeners = new Set<Listener>();

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  emit(event: SSEEvent) {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch {
        // Don't let one listener break others
      }
    }
  }
}

// Singleton across hot reloads
const globalForSSE = globalThis as unknown as {
  orderEvents: OrderEventEmitter | undefined;
};

export const orderEvents =
  globalForSSE.orderEvents ?? new OrderEventEmitter();

if (process.env.NODE_ENV !== "production") {
  globalForSSE.orderEvents = orderEvents;
}
