import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// GET restaurant settings
export async function GET() {
  try {
    const settings = await prisma.restaurantSettings.findUnique({
      where: { id: "singleton" },
      include: {
        hours: { orderBy: { dayOfWeek: "asc" } },
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  isOpen: z.boolean().optional(),
  isPausedToday: z.boolean().optional(),
  deliveryEnabled: z.boolean().optional(),
  deliveryRadiusMiles: z.number().min(0).optional(),
  deliveryFeeFixed: z.number().int().min(0).optional(),
  deliveryMinOrder: z.number().int().min(0).optional(),
  pickupEstimateMin: z.number().int().min(0).optional(),
  pickupEstimateMax: z.number().int().min(0).optional(),
  deliveryEstimateMin: z.number().int().min(0).optional(),
  deliveryEstimateMax: z.number().int().min(0).optional(),
  taxRate: z.number().min(0).max(1).optional(),
});

// PATCH update settings
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const settings = await prisma.restaurantSettings.update({
      where: { id: "singleton" },
      data: parsed.data,
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Failed to update settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
