"use client";

import { useState, useCallback } from "react";
import {
  ShoppingBag,
  MapPin,
  Truck,
  CreditCard,
  ArrowLeft,
  Loader2,
  Check,
} from "lucide-react";
import Link from "next/link";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { StripePaymentForm } from "@/components/customer/stripe-payment-form";
import { useCart } from "@/stores/cart";
import { formatPrice } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

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
  const [isCreatingIntent, setIsCreatingIntent] = useState(false);

  // Payment step state
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [serverTotal, setServerTotal] = useState<number>(0);

  const subtotal = getSubtotal();
  const taxRate = 0.08;
  const tax = Math.round(subtotal * taxRate);
  const deliveryFee = orderType === "DELIVERY" ? 399 : 0;
  const total = subtotal + tax + deliveryFee;

  if (items.length === 0 && !clientSecret) {
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

  const handleContinueToPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email) {
      toast.error("Please fill in your name and email");
      return;
    }

    if (orderType === "DELIVERY" && !address) {
      toast.error("Please enter a delivery address");
      return;
    }

    setIsCreatingIntent(true);

    try {
      const res = await fetch("/api/create-payment-intent", {
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
        throw new Error(data.error || "Failed to initialize payment");
      }

      const { clientSecret: secret, paymentIntentId: piId, totalAmount } = await res.json();
      setClientSecret(secret);
      setPaymentIntentId(piId);
      setServerTotal(totalAmount);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to initialize payment"
      );
    } finally {
      setIsCreatingIntent(false);
    }
  };

  const handlePaymentSuccess = useCallback(async () => {
    if (!paymentIntentId) return;

    clearCart();

    // Poll for order creation (webhook may take a moment)
    const maxAttempts = 20;
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const res = await fetch(
          `/api/orders/by-payment-intent/${paymentIntentId}`
        );
        if (res.ok) {
          const { orderId } = await res.json();
          window.location.href = `/order/${orderId}`;
          return;
        }
      } catch {
        // ignore and retry
      }
      await new Promise((r) => setTimeout(r, 1000));
    }

    // If we couldn't find the order, redirect to a generic confirmation
    toast.error("Payment succeeded but order is still processing. Please check back shortly.");
  }, [paymentIntentId, clearCart]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        {clientSecret ? (
          <button
            onClick={() => setClientSecret(null)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        ) : (
          <Link
            href="/"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
        )}
        <h1 className="text-2xl font-bold">Checkout</h1>
      </div>

      {/* Step Indicator */}
      <div className="mb-8 flex items-center gap-3">
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold",
            clientSecret
              ? "bg-primary text-primary-foreground"
              : "bg-primary text-primary-foreground"
          )}
        >
          {clientSecret ? <Check className="h-4 w-4" /> : "1"}
        </div>
        <span className={cn("text-sm font-medium", clientSecret && "text-muted-foreground")}>
          Details
        </span>
        <div className="h-px flex-1 bg-border" />
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold",
            clientSecret
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          )}
        >
          2
        </div>
        <span className={cn("text-sm font-medium", !clientSecret && "text-muted-foreground")}>
          Payment
        </span>
      </div>

      {!clientSecret ? (
        /* Step 1: Order Details */
        <form onSubmit={handleContinueToPayment} className="space-y-6">
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
            disabled={isCreatingIntent}
          >
            {isCreatingIntent ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Preparing Payment...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4" />
                Continue to Payment
              </>
            )}
          </Button>
        </form>
      ) : (
        /* Step 2: Stripe Payment */
        <div className="space-y-6">
          {/* Compact Order Summary */}
          <div className="rounded-xl border border-border/50 bg-muted/30 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {orderType === "PICKUP" ? "Pickup" : "Delivery"} order for{" "}
                  <span className="text-foreground font-medium">{name}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {items.length} item{items.length !== 1 ? "s" : ""}
                </p>
              </div>
              <p className="text-lg font-semibold text-primary">
                {formatPrice(serverTotal)}
              </p>
            </div>
          </div>

          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: "night",
                variables: {
                  colorPrimary: "#10b981",
                  colorBackground: "#0a0a0a",
                  colorText: "#fafafa",
                  colorDanger: "#ef4444",
                  borderRadius: "0.75rem",
                  fontFamily: "inherit",
                },
                rules: {
                  ".Input": {
                    backgroundColor: "#171717",
                    border: "1px solid #262626",
                  },
                  ".Input:focus": {
                    borderColor: "#10b981",
                    boxShadow: "0 0 0 1px #10b981",
                  },
                  ".Tab": {
                    backgroundColor: "#171717",
                    border: "1px solid #262626",
                  },
                  ".Tab--selected": {
                    backgroundColor: "#10b981",
                    borderColor: "#10b981",
                  },
                },
              },
            }}
          >
            <StripePaymentForm
              totalAmount={serverTotal}
              paymentIntentId={paymentIntentId!}
              onSuccess={handlePaymentSuccess}
            />
          </Elements>
        </div>
      )}
    </div>
  );
}
