"use client";

import { OrderCard } from "./order-card";
import type { OrderSummary } from "@/types";

const columns = [
  { status: "PENDING", label: "New Orders", color: "text-yellow-500" },
  { status: "CONFIRMED", label: "Confirmed", color: "text-blue-500" },
  { status: "PREPARING", label: "Preparing", color: "text-orange-500" },
  { status: "READY", label: "Ready", color: "text-primary" },
] as const;

interface OrderBoardProps {
  orders: OrderSummary[];
  onStatusChange: (orderId: string, status: string) => void;
}

export function OrderBoard({ orders, onStatusChange }: OrderBoardProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {columns.map((col) => {
        const columnOrders = orders.filter((o) => o.status === col.status);
        return (
          <div key={col.status} className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className={`text-sm font-semibold ${col.color}`}>
                {col.label}
              </h3>
              {columnOrders.length > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-muted px-1.5 text-xs font-medium">
                  {columnOrders.length}
                </span>
              )}
            </div>
            <div className="space-y-2">
              {columnOrders.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/50 py-8 text-center text-sm text-muted-foreground">
                  No orders
                </div>
              ) : (
                columnOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onStatusChange={onStatusChange}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
