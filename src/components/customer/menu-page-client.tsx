"use client";

import { MenuHero } from "./menu-hero";
import { CategoryNav } from "./category-nav";
import { MenuSection } from "./menu-section";
import type { CategoryWithItems } from "@/types";

interface MenuPageClientProps {
  categories: CategoryWithItems[];
  restaurant: {
    name: string;
    isOpen: boolean;
    pickupEstimate: string;
    deliveryEstimate: string;
  };
}

export function MenuPageClient({
  categories,
  restaurant,
}: MenuPageClientProps) {
  const nonEmptyCategories = categories.filter(
    (cat) => cat.items.filter((i) => i.isAvailable).length > 0
  );

  return (
    <>
      <MenuHero
        restaurantName={restaurant.name}
        isOpen={restaurant.isOpen}
        pickupEstimate={restaurant.pickupEstimate}
        deliveryEstimate={restaurant.deliveryEstimate}
      />

      {nonEmptyCategories.length > 0 && (
        <CategoryNav
          categories={nonEmptyCategories.map((c) => ({
            id: c.id,
            name: c.name,
          }))}
        />
      )}

      <div className="mx-auto max-w-5xl space-y-10 px-4 py-8">
        {nonEmptyCategories.map((category) => (
          <MenuSection key={category.id} category={category} />
        ))}

        {nonEmptyCategories.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-lg text-muted-foreground">
              No menu items available right now.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
