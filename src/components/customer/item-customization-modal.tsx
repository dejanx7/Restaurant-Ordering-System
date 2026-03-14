"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useCart, type CartModifier } from "@/stores/cart";
import { useCartDrawer } from "@/hooks/use-cart-drawer";
import { formatPrice } from "@/lib/pricing";
import type { MenuItemWithModifiers } from "@/types";
import { cn } from "@/lib/utils";

interface ItemCustomizationModalProps {
  item: MenuItemWithModifiers;
  open: boolean;
  onClose: () => void;
}

export function ItemCustomizationModal({
  item,
  open,
  onClose,
}: ItemCustomizationModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedModifiers, setSelectedModifiers] = useState<
    Record<string, string[]>
  >(() => {
    const defaults: Record<string, string[]> = {};
    for (const group of item.modifierGroups) {
      const defaultMods = group.modifiers
        .filter((m) => m.isDefault)
        .map((m) => m.id);
      if (defaultMods.length > 0) {
        defaults[group.id] = defaultMods;
      }
    }
    return defaults;
  });
  const [specialNote, setSpecialNote] = useState("");
  const addItem = useCart((s) => s.addItem);
  const { open: openCart } = useCartDrawer();

  const toggleModifier = (groupId: string, modifierId: string, maxSelect: number) => {
    setSelectedModifiers((prev) => {
      const current = prev[groupId] ?? [];
      if (current.includes(modifierId)) {
        return { ...prev, [groupId]: current.filter((id) => id !== modifierId) };
      }
      if (maxSelect === 1) {
        return { ...prev, [groupId]: [modifierId] };
      }
      if (current.length >= maxSelect) {
        return prev;
      }
      return { ...prev, [groupId]: [...current, modifierId] };
    });
  };

  const getSelectedModifiersList = (): CartModifier[] => {
    const mods: CartModifier[] = [];
    for (const group of item.modifierGroups) {
      const selected = selectedModifiers[group.id] ?? [];
      for (const mod of group.modifiers) {
        if (selected.includes(mod.id)) {
          mods.push({ name: mod.name, priceAdj: mod.priceAdjustment });
        }
      }
    }
    return mods;
  };

  const modifierTotal = getSelectedModifiersList().reduce(
    (s, m) => s + m.priceAdj,
    0
  );
  const lineTotal = (item.price + modifierTotal) * quantity;

  const handleAdd = () => {
    addItem({
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      quantity,
      modifiers: getSelectedModifiersList(),
      specialNote: specialNote || undefined,
      imageUrl: item.imageUrl ?? undefined,
    });
    onClose();
    setQuantity(1);
    setSpecialNote("");
    openCart();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">{item.name}</DialogTitle>
          {item.description && (
            <p className="text-sm text-muted-foreground">{item.description}</p>
          )}
          <p className="text-lg font-semibold text-primary">
            {formatPrice(item.price)}
          </p>
        </DialogHeader>

        {item.modifierGroups.length > 0 && (
          <div className="space-y-5">
            {item.modifierGroups.map((group) => (
              <div key={group.id} className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">{group.name}</Label>
                  {group.required && (
                    <span className="text-xs font-medium text-destructive">
                      Required
                    </span>
                  )}
                </div>
                <div className="space-y-1.5">
                  {group.modifiers
                    .filter((m) => m.isAvailable)
                    .map((mod) => {
                      const isSelected = (
                        selectedModifiers[group.id] ?? []
                      ).includes(mod.id);
                      return (
                        <button
                          key={mod.id}
                          onClick={() =>
                            toggleModifier(group.id, mod.id, group.maxSelect)
                          }
                          className={cn(
                            "flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition-colors",
                            isSelected
                              ? "border-primary bg-primary/10 text-foreground"
                              : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground"
                          )}
                        >
                          <span>{mod.name}</span>
                          {mod.priceAdjustment !== 0 && (
                            <span className="text-xs">
                              +{formatPrice(mod.priceAdjustment)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        )}

        <Separator />

        <div className="space-y-2">
          <Label className="text-sm">Special Instructions</Label>
          <Textarea
            placeholder="Any allergies or special requests..."
            value={specialNote}
            onChange={(e) => setSpecialNote(e.target.value)}
            className="resize-none"
            rows={2}
          />
        </div>

        <div className="flex items-center gap-4 pt-2">
          <div className="flex items-center gap-3 rounded-lg border border-border/50 px-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-6 text-center font-medium">{quantity}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setQuantity(quantity + 1)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <Button className="flex-1" size="lg" onClick={handleAdd}>
            Add to Order &middot; {formatPrice(lineTotal)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
