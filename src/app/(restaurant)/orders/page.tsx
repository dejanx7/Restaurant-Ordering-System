"use client";

import { useQuery } from "@tanstack/react-query";
import { Clock, Package, Truck, ShoppingBag } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/pricing";
import { cn } from "@/lib/utils";

interface OrderSummary {
  id: string;
  orderNumber: string;
  status: string;
  type: string;
  customerName: string;
  totalAmount: number;
  createdAt: string;
  items: {
    name: string;
    quantity: number;
    lineTotal: number;
    modifiers: { name: string; priceAdj: number }[];
  }[];
}

async function fetchAllOrders(): Promise<OrderSummary[]> {
  const res = await fetch("/api/orders");
  if (!res.ok) throw new Error("Failed to fetch orders");
  return res.json();
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-400",
  CONFIRMED: "bg-blue-500/10 text-blue-400",
  PREPARING: "bg-orange-500/10 text-orange-400",
  READY: "bg-emerald-500/10 text-emerald-400",
  COMPLETED: "bg-muted text-muted-foreground",
  CANCELLED: "bg-red-500/10 text-red-400",
};

export default function OrderHistoryPage() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ["orders", "all"],
    queryFn: fetchAllOrders,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Order History</h1>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Order History</h1>
        <p className="text-sm text-muted-foreground">
          {orders?.length ?? 0} total orders
        </p>
      </div>

      <div className="space-y-2">
        {orders?.map((order) => (
          <div
            key={order.id}
            className="rounded-xl border border-border/50 bg-card/50 px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold">
                    {order.orderNumber}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      statusColors[order.status]
                    )}
                  >
                    {order.status}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    {order.type === "DELIVERY" ? (
                      <Truck className="h-3 w-3" />
                    ) : (
                      <ShoppingBag className="h-3 w-3" />
                    )}
                    {order.type}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {order.customerName} · {order.items.length} item
                  {order.items.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">
                  {formatPrice(order.totalAmount)}
                </p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {new Date(order.createdAt).toLocaleDateString()}{" "}
                  {new Date(order.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </div>
        ))}

        {(!orders || orders.length === 0) && (
          <div className="py-16 text-center text-sm text-muted-foreground">
            No orders yet
          </div>
        )}
      </div>
    </div>
  );
}
