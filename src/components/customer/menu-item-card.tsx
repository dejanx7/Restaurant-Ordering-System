"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Flame, Leaf, Wheat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/pricing";
import { ItemCustomizationModal } from "./item-customization-modal";
import type { MenuItemWithModifiers } from "@/types";

interface MenuItemCardProps {
  item: MenuItemWithModifiers;
}

const tagIcons: Record<string, React.ReactNode> = {
  SPICY: <Flame className="h-3 w-3" />,
  VEGAN: <Leaf className="h-3 w-3" />,
  VEGETARIAN: <Leaf className="h-3 w-3" />,
  GLUTEN_FREE: <Wheat className="h-3 w-3" />,
};

const tagLabels: Record<string, string> = {
  SPICY: "Spicy",
  VEGAN: "Vegan",
  VEGETARIAN: "Veg",
  GLUTEN_FREE: "GF",
  DAIRY_FREE: "DF",
  NUT_FREE: "NF",
};

export function MenuItemCard({ item }: MenuItemCardProps) {
  const [showModal, setShowModal] = useState(false);

  const handleAdd = () => {
    if (item.modifierGroups.length > 0) {
      setShowModal(true);
    } else {
      // Quick add without customization modal
      setShowModal(true);
    }
  };

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="group flex cursor-pointer gap-4 rounded-xl border border-border/50 bg-card/50 p-4 transition-colors hover:border-primary/30 hover:bg-card"
        onClick={handleAdd}
      >
        <div className="flex flex-1 flex-col justify-between">
          <div className="space-y-1.5">
            <h3 className="font-semibold leading-tight">{item.name}</h3>
            {item.description && (
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {item.description}
              </p>
            )}
            {item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {item.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="gap-1 px-1.5 py-0 text-[10px]"
                  >
                    {tagIcons[tag]}
                    {tagLabels[tag] ?? tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center justify-between pt-3">
            <span className="text-sm font-semibold text-primary">
              {formatPrice(item.price)}
            </span>
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 rounded-full border-primary/30 opacity-0 transition-opacity group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                handleAdd();
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {item.imageUrl && (
          <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg sm:h-28 sm:w-28">
            <img
              src={item.imageUrl}
              alt={item.name}
              className="h-full w-full object-cover"
            />
          </div>
        )}
      </motion.div>

      <ItemCustomizationModal
        item={item}
        open={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}
