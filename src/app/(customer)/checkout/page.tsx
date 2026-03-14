"use client";

import { useState } from "react";
import {
  ShoppingBag,
  MapPin,
  Truck,
  CreditCard,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/stores/cart";
import { formatPrice } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function CheckoutPage() {
  const items = useCart((s) => s.items);
  const orderType = useCart((s) => s.orderType);
  const setOrderType = useCart((s) => s.setOrderType);
  const getSubtotal = useCart((s) => s.getSubtotal);
  const clearCart = useCart((s) => s.clearCart);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subtotal = getSubtotal();
  const taxRate = 0.08;
  const tax = Math.round(subtotal * taxRate);
  const deliveryFee = orderType === "DELIVERY" ? 399 : 0;
  const total = subtotal + tax + deliveryFee;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground opacity-30" />
        <h2 className="mt-4 text-xl font-semibold">Your cart is empty</h2>
        <p className="mt-2 text-muted-foreground">
          Add some items to get started
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors"
        >
          Browse Menu
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email) {
      toast.error("Please fill in your name and email");
      return;
    }

    if (orderType === "DELIVERY" && !address) {
      toast.error("Please enter a delivery address");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name,
          customerEmail: email,
          customerPhone: phone || undefined,
          orderType,
          deliveryAddress: orderType === "DELIVERY" ? address : undefined,
          specialInstructions: notes || undefined,
          items: items.map((item) => ({
            menuItemId: item.menuItemId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            modifiers: item.modifiers,
            specialNote: item.specialNote,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to place order");
      }

      const { orderId, orderNumber } = await res.json();
      clearCart();
      window.location.href = `/order/${orderId}`;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to place order"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">Checkout</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Order Type */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Order Type</Label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setOrderType("PICKUP")}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-4 transition-colors",
                orderType === "PICKUP"
                  ? "border-primary bg-primary/10"
                  : "border-border/50 hover:border-border"
              )}
            >
              <ShoppingBag
                className={cn(
                  "h-5 w-5",
                  orderType === "PICKUP"
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              />
              <div className="text-left">
                <p className="text-sm font-medium">Pickup</p>
                <p className="text-xs text-muted-foreground">15-25 min</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setOrderType("DELIVERY")}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-4 transition-colors",
                orderType === "DELIVERY"
                  ? "border-primary bg-primary/10"
                  : "border-border/50 hover:border-border"
              )}
            >
              <Truck
                className={cn(
                  "h-5 w-5",
                  orderType === "DELIVERY"
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              />
              <div className="text-left">
                <p className="text-sm font-medium">Delivery</p>
                <p className="text-xs text-muted-foreground">30-45 min</p>
              </div>
            </button>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Contact Information</Label>
          <div className="space-y-3">
            <Input
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              type="tel"
              placeholder="Phone number (optional)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>

        {/* Delivery Address */}
        {orderType === "DELIVERY" && (
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Delivery Address</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Enter your delivery address"
                className="pl-9"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </div>
          </div>
        )}

        {/* Special Instructions */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">
            Special Instructions (optional)
          </Label>
          <Textarea
            placeholder="Any special requests for the kitchen..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="resize-none"
          />
        </div>

        <Separator />

        {/* Order Summary */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Order Summary</h3>
          <div className="space-y-2">
            {items.map((item) => {
              const modTotal = item.modifiers.reduce(
                (s, m) => s + m.priceAdj,
                0
              );
              return (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {item.quantity}x {item.name}
                    {item.modifiers.length > 0 && (
                      <span className="ml-1 text-xs">
                        ({item.modifiers.map((m) => m.name).join(", ")})
                      </span>
                    )}
                  </span>
                  <span>
                    {formatPrice((item.price + modTotal) * item.quantity)}
                  </span>
                </div>
              );
            })}
          </div>
          <Separator />
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span>{formatPrice(tax)}</span>
            </div>
            {orderType === "DELIVERY" && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery Fee</span>
                <span>{formatPrice(deliveryFee)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-base font-semibold">
              <span>Total</span>
              <span className="text-primary">{formatPrice(total)}</span>
            </div>
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full gap-2"
          disabled={isSubmitting}
        >
          <CreditCard className="h-4 w-4" />
          {isSubmitting ? "Placing Order..." : `Place Order · ${formatPrice(total)}`}
        </Button>
      </form>
    </div>
  );
}
