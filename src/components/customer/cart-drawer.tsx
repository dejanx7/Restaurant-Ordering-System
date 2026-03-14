"use client";

import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCart } from "@/stores/cart";
import { useCartDrawer } from "@/hooks/use-cart-drawer";
import { formatPrice } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function CartDrawer() {
  const { isOpen, close } = useCartDrawer();
  const items = useCart((s) => s.items);
  const updateQuantity = useCart((s) => s.updateQuantity);
  const removeItem = useCart((s) => s.removeItem);
  const getSubtotal = useCart((s) => s.getSubtotal);

  const subtotal = getSubtotal();
  const isEmpty = items.length === 0;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Your Order
          </SheetTitle>
        </SheetHeader>

        {isEmpty ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
            <ShoppingBag className="h-12 w-12 opacity-30" />
            <p className="text-lg font-medium">Your cart is empty</p>
            <p className="text-sm">Add items from the menu to get started</p>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-4 pb-4">
                {items.map((item) => {
                  const modTotal = item.modifiers.reduce(
                    (s, m) => s + m.priceAdj,
                    0
                  );
                  const lineTotal = (item.price + modTotal) * item.quantity;

                  return (
                    <div key={item.id} className="flex gap-3">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-start justify-between">
                          <p className="font-medium leading-tight">
                            {item.name}
                          </p>
                          <p className="ml-2 text-sm font-medium text-primary">
                            {formatPrice(lineTotal)}
                          </p>
                        </div>
                        {item.modifiers.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {item.modifiers.map((m) => m.name).join(", ")}
                          </p>
                        )}
                        {item.specialNote && (
                          <p className="text-xs italic text-muted-foreground">
                            {item.specialNote}
                          </p>
                        )}
                        <div className="flex items-center gap-2 pt-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-6 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="ml-auto h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <div className="space-y-3 pt-2">
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatPrice(subtotal)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Tax and delivery fees calculated at checkout
              </p>
              <Link
                href="/checkout"
                onClick={close}
                className={cn(
                  "flex w-full items-center justify-center rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors"
                )}
              >
                Checkout &middot; {formatPrice(subtotal)}
              </Link>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
