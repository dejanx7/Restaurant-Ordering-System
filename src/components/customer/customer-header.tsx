"use client";

import { ShoppingBag, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/stores/cart";
import { useCartDrawer } from "@/hooks/use-cart-drawer";

export function CustomerHeader() {
  const itemCount = useCart((s) => s.getItemCount());
  const { open } = useCartDrawer();

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <span className="text-lg font-bold text-primary">R</span>
          </div>
          <span className="text-lg font-semibold tracking-tight">
            Restaurant
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-1.5 text-sm text-muted-foreground sm:flex">
            <Clock className="h-4 w-4" />
            <span>Open now</span>
          </div>
          <div className="hidden items-center gap-1.5 text-sm text-muted-foreground sm:flex">
            <MapPin className="h-4 w-4" />
            <span>Pickup & Delivery</span>
          </div>

          <Button
            variant="default"
            size="sm"
            className="relative gap-2"
            onClick={open}
          >
            <ShoppingBag className="h-4 w-4" />
            <span className="hidden sm:inline">Cart</span>
            {itemCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-background text-xs font-bold text-primary">
                {itemCount}
              </span>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
