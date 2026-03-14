import { prisma } from "@/lib/prisma";
import { MenuPageClient } from "@/components/customer/menu-page-client";

export const dynamic = "force-dynamic";

export default async function MenuPage() {
  const [categories, settings] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        items: {
          where: { isArchived: false, isAvailable: true },
          orderBy: { sortOrder: "asc" },
          include: {
            modifierGroups: {
              orderBy: { sortOrder: "asc" },
              include: {
                modifiers: {
                  where: { isAvailable: true },
                  orderBy: { sortOrder: "asc" },
                },
              },
            },
          },
        },
      },
    }),
    prisma.restaurantSettings.findUnique({
      where: { id: "singleton" },
    }),
  ]);

  const restaurant = {
    name: settings?.name ?? "Restaurant",
    isOpen: (settings?.isOpen ?? true) && !(settings?.isPausedToday ?? false),
    pickupEstimate: `${settings?.pickupEstimateMin ?? 15}-${settings?.pickupEstimateMax ?? 25} min`,
    deliveryEstimate: `${settings?.deliveryEstimateMin ?? 30}-${settings?.deliveryEstimateMax ?? 45} min`,
  };

  return (
    <MenuPageClient
      categories={categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        sortOrder: cat.sortOrder,
        items: cat.items.map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          imageUrl: item.imageUrl,
          isAvailable: item.isAvailable,
          tags: item.tags,
          categoryId: item.categoryId,
          modifierGroups: item.modifierGroups.map((mg) => ({
            id: mg.id,
            name: mg.name,
            required: mg.required,
            minSelect: mg.minSelect,
            maxSelect: mg.maxSelect,
            modifiers: mg.modifiers.map((m) => ({
              id: m.id,
              name: m.name,
              priceAdjustment: m.priceAdjustment,
              isDefault: m.isDefault,
              isAvailable: m.isAvailable,
            })),
          })),
        })),
      }))}
      restaurant={restaurant}
    />
  );
}
