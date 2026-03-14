"use client";

import { MenuItemCard } from "./menu-item-card";
import type { CategoryWithItems } from "@/types";

interface MenuSectionProps {
  category: CategoryWithItems;
}

export function MenuSection({ category }: MenuSectionProps) {
  const availableItems = category.items.filter((item) => item.isAvailable);

  if (availableItems.length === 0) return null;

  return (
    <section id={category.id} className="scroll-mt-36">
      <h2 className="mb-4 text-xl font-bold tracking-tight">
        {category.name}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {availableItems.map((item) => (
          <MenuItemCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
