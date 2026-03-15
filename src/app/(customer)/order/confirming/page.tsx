"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/stores/cart";

function OrderConfirmingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const paymentIntent = searchParams.get("payment_intent");
  const clearCart = useCart((s) => s.clearCart);

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!paymentIntent) {
      setStatus("error");
      return;
    }

    clearCart();

    let cancelled = false;
    const poll = async () => {
      const maxAttempts = 30;
      for (let i = 0; i < maxAttempts; i++) {
        if (cancelled) return;
        try {
          const res = await fetch(
            `/api/orders/by-payment-intent/${paymentIntent}`
          );
          if (res.ok) {
            const data = await res.json();
            setOrderId(data.orderId);
            setStatus("success");
            return;
          }
        } catch {
          // ignore and retry
        }
        await new Promise((r) => setTimeout(r, 1000));
      }
      setStatus("error");
    };

    poll();
    return () => {
      cancelled = true;
    };
  }, [paymentIntent, clearCart]);

  // Auto-redirect once order is found
  useEffect(() => {
    if (status === "success" && orderId) {
      const timer = setTimeout(() => {
        router.push(`/order/${orderId}`);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [status, orderId, router]);

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
        <h2 className="mt-6 text-xl font-semibold">Confirming your order...</h2>
        <p className="mt-2 text-muted-foreground">
          Please wait while we process your payment.
        </p>
      </div>
    );
  }

  if (status === "success" && orderId) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
        <h2 className="mt-6 text-xl font-semibold">Order confirmed!</h2>
        <p className="mt-2 text-muted-foreground">
          Your payment was successful. Redirecting to order tracking...
        </p>
        <Link
          href={`/order/${orderId}`}
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors"
        >
          Track Order
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <XCircle className="mx-auto h-12 w-12 text-destructive" />
      <h2 className="mt-6 text-xl font-semibold">Something went wrong</h2>
      <p className="mt-2 text-muted-foreground">
        Your payment may have been processed. Please check your email for
        confirmation or contact us.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors"
      >
        Back to Menu
      </Link>
    </div>
  );
}

export default function OrderConfirmingPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <h2 className="mt-6 text-xl font-semibold">Loading...</h2>
        </div>
      }
    >
      <OrderConfirmingContent />
    </Suspense>
  );
}
