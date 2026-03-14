"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  CookingPot,
  Package,
  Truck,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/pricing";
import { cn } from "@/lib/utils";

interface OrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  type: string;
  customerName: string;
  totalAmount: number;
  subtotal: number;
  taxAmount: number;
  deliveryFee: number;
  createdAt: string;
  items: {
    name: string;
    quantity: number;
    lineTotal: number;
    modifiers: { name: string; priceAdj: number }[];
  }[];
}

const statusSteps = [
  { status: "PENDING", label: "Order Received", icon: Clock },
  { status: "CONFIRMED", label: "Confirmed", icon: CheckCircle2 },
  { status: "PREPARING", label: "Preparing", icon: CookingPot },
  { status: "READY", label: "Ready", icon: Package },
  { status: "COMPLETED", label: "Completed", icon: Truck },
];

export default function OrderTrackingPage() {
  const params = useParams();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await fetch(`/api/orders/${params.orderId}`);
        if (res.ok) {
          setOrder(await res.json());
        }
      } catch (e) {
        console.error("Failed to fetch order:", e);
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();

    // Poll for updates every 5 seconds (SSE in Phase 2)
    const interval = setInterval(fetchOrder, 5000);
    return () => clearInterval(interval);
  }, [params.orderId]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h2 className="text-xl font-semibold">Order not found</h2>
        <Link
          href="/"
          className="mt-4 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors"
        >
          Back to Menu
        </Link>
      </div>
    );
  }

  const currentStepIndex = statusSteps.findIndex(
    (s) => s.status === order.status
  );

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">Order {order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">
            {order.type === "DELIVERY" ? "Delivery" : "Pickup"} order
          </p>
        </div>
      </div>

      {/* Status Tracker */}
      <div className="mb-8 rounded-xl border border-border/50 bg-card/50 p-6">
        <div className="space-y-0">
          {statusSteps.map((step, i) => {
            const isCompleted = i <= currentStepIndex;
            const isCurrent = i === currentStepIndex;
            const isLast = i === statusSteps.length - 1;

            return (
              <div key={step.status} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                      isCurrent
                        ? "border-primary bg-primary text-primary-foreground"
                        : isCompleted
                          ? "border-primary/50 bg-primary/20 text-primary"
                          : "border-border/50 text-muted-foreground"
                    )}
                  >
                    <step.icon className="h-5 w-5" />
                  </div>
                  {!isLast && (
                    <div
                      className={cn(
                        "h-8 w-0.5 transition-colors",
                        isCompleted && !isCurrent
                          ? "bg-primary/50"
                          : "bg-border/50"
                      )}
                    />
                  )}
                </div>
                <div className="pb-8">
                  <p
                    className={cn(
                      "pt-2 text-sm font-medium",
                      isCurrent
                        ? "text-primary"
                        : isCompleted
                          ? "text-foreground"
                          : "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </p>
                  {isCurrent && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {step.status === "PENDING" && "We received your order"}
                      {step.status === "CONFIRMED" &&
                        "The restaurant has accepted your order"}
                      {step.status === "PREPARING" &&
                        "Your food is being prepared"}
                      {step.status === "READY" && "Your order is ready!"}
                      {step.status === "COMPLETED" && "Enjoy your meal!"}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Order Details */}
      <div className="space-y-3 rounded-xl border border-border/50 bg-card/50 p-6">
        <h3 className="font-semibold">Order Details</h3>
        <div className="space-y-2">
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span>
                {item.quantity}x {item.name}
                {item.modifiers.length > 0 && (
                  <span className="ml-1 text-xs text-muted-foreground">
                    ({item.modifiers.map((m) => m.name).join(", ")})
                  </span>
                )}
              </span>
              <span>{formatPrice(item.lineTotal)}</span>
            </div>
          ))}
        </div>
        <Separator />
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tax</span>
            <span>{formatPrice(order.taxAmount)}</span>
          </div>
          {order.deliveryFee > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Delivery Fee</span>
              <span>{formatPrice(order.deliveryFee)}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span className="text-primary">
              {formatPrice(order.totalAmount)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
