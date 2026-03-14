import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [categories, settings] = await Promise.all([
      prisma.category.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        include: {
          items: {
            where: { isArchived: false },
            orderBy: { sortOrder: "asc" },
            include: {
              modifierGroups: {
                orderBy: { sortOrder: "asc" },
                include: {
                  modifiers: {
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

    return NextResponse.json({
      categories,
      restaurant: settings
        ? {
            name: settings.name,
            isOpen: settings.isOpen && !settings.isPausedToday,
            isPausedToday: settings.isPausedToday,
            deliveryEnabled: settings.deliveryEnabled,
            deliveryFeeFixed: settings.deliveryFeeFixed,
            deliveryMinOrder: settings.deliveryMinOrder,
            pickupEstimateMin: settings.pickupEstimateMin,
            pickupEstimateMax: settings.pickupEstimateMax,
            deliveryEstimateMin: settings.deliveryEstimateMin,
            deliveryEstimateMax: settings.deliveryEstimateMax,
            taxRate: settings.taxRate,
          }
        : null,
    });
  } catch (error) {
    console.error("Failed to fetch menu:", error);
    return NextResponse.json(
      { error: "Failed to load menu" },
      { status: 500 }
    );
  }
}
