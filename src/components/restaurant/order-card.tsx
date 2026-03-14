"use client";

import { Clock, MapPin, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/pricing";
import type { OrderSummary } from "@/types";

const nextStatus: Record<string, { label: string; status: string }> = {
  PENDING: { label: "Accept", status: "CONFIRMED" },
  CONFIRMED: { label: "Start Preparing", status: "PREPARING" },
  PREPARING: { label: "Mark Ready", status: "READY" },
  READY: { label: "Complete", status: "COMPLETED" },
};

interface OrderCardProps {
  order: OrderSummary;
  onStatusChange: (orderId: string, status: string) => void;
}

export function OrderCard({ order, onStatusChange }: OrderCardProps) {
  const next = nextStatus[order.status];
  const elapsed = getElapsedTime(order.createdAt);

  return (
    <div className="space-y-3 rounded-xl border border-border/50 bg-card p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold">{order.orderNumber}</p>
          <p className="text-sm text-muted-foreground">{order.customerName}</p>
        </div>
        <Badge variant={order.type === "DELIVERY" ? "default" : "secondary"}>
          {order.type === "DELIVERY" ? (
            <MapPin className="mr-1 h-3 w-3" />
          ) : (
            <ShoppingBag className="mr-1 h-3 w-3" />
          )}
          {order.type === "DELIVERY" ? "Delivery" : "Pickup"}
        </Badge>
      </div>

      <div className="space-y-1">
        {order.items.map((item, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span>
              {item.quantity}x {item.name}
            </span>
            <span className="text-muted-foreground">
              {formatPrice(item.lineTotal)}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-border/50 pt-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {elapsed}
        </div>
        <span className="text-sm font-semibold">
          {formatPrice(order.totalAmount)}
        </span>
      </div>

      {next && (
        <Button
          size="sm"
          className="w-full"
          onClick={() => onStatusChange(order.id, next.status)}
        >
          {next.label}
        </Button>
      )}
    </div>
  );
}

function getElapsedTime(createdAt: string): string {
  const diff = Date.now() - new Date(createdAt).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
}
