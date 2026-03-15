"use client";

import { useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { OrderBoard } from "@/components/restaurant/order-board";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrderSSE } from "@/hooks/use-order-sse";
import { Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OrderSummary } from "@/types";

async function fetchOrders(): Promise<OrderSummary[]> {
  const res = await fetch("/api/orders?active=true");
  if (!res.ok) throw new Error("Failed to fetch orders");
  return res.json();
}

async function updateStatus(orderId: string, status: string) {
  const res = await fetch(`/api/orders/${orderId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update status");
  return res.json();
}

function playNewOrderSound() {
  try {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    // Two-tone alert
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    oscillator.frequency.setValueAtTime(1100, ctx.currentTime + 0.15);
    oscillator.frequency.setValueAtTime(880, ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.5);
  } catch {
    // Audio not available
  }
}

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const flashRef = useRef<HTMLDivElement>(null);

  const handleNewOrder = useCallback(() => {
    playNewOrderSound();

    // Visual flash
    if (flashRef.current) {
      flashRef.current.classList.remove("animate-none");
      flashRef.current.classList.add("animate-pulse");
      setTimeout(() => {
        flashRef.current?.classList.remove("animate-pulse");
        flashRef.current?.classList.add("animate-none");
      }, 2000);
    }
  }, []);

  const { connected } = useOrderSSE({ onNewOrder: handleNewOrder });

  const { data: orders, isLoading } = useQuery({
    queryKey: ["orders", "active"],
    queryFn: fetchOrders,
    // SSE is primary, polling as fallback (30s when connected, 10s when disconnected)
    refetchInterval: connected ? 30000 : 10000,
  });

  const mutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      updateStatus(orderId, status),
    onMutate: async ({ orderId, status }) => {
      await queryClient.cancelQueries({ queryKey: ["orders", "active"] });
      const previous = queryClient.getQueryData<OrderSummary[]>([
        "orders",
        "active",
      ]);
      queryClient.setQueryData<OrderSummary[]>(
        ["orders", "active"],
        (old) =>
          old?.map((o) => (o.id === orderId ? { ...o, status } : o)) ?? []
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(["orders", "active"], ctx.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["orders", "active"] });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Live Orders</h1>
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Connection status banner */}
      {!connected && (
        <div className="flex items-center gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-sm text-yellow-400">
          <WifiOff className="h-4 w-4" />
          <span>Connection lost — reconnecting...</span>
        </div>
      )}

      <div ref={flashRef} className="flex items-center justify-between animate-none">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Live Orders</h1>
          <div
            className={cn(
              "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
              connected
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-yellow-500/10 text-yellow-400"
            )}
          >
            {connected ? (
              <Wifi className="h-3 w-3" />
            ) : (
              <WifiOff className="h-3 w-3" />
            )}
            {connected ? "Live" : "Polling"}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {orders?.length ?? 0} active orders
        </p>
      </div>
      <OrderBoard
        orders={orders ?? []}
        onStatusChange={(orderId, status) =>
          mutation.mutate({ orderId, status })
        }
      />
    </div>
  );
}
