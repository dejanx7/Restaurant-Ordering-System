"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { OrderBoard } from "@/components/restaurant/order-board";
import { Skeleton } from "@/components/ui/skeleton";
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

export default function DashboardPage() {
  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useQuery({
    queryKey: ["orders", "active"],
    queryFn: fetchOrders,
    refetchInterval: 10000, // Poll every 10s until SSE is implemented
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Live Orders</h1>
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
