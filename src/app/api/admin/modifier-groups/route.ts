import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  menuItemId: z.string(),
  name: z.string().min(1),
  required: z.boolean().optional(),
  minSelect: z.number().int().min(0).optional(),
  maxSelect: z.number().int().min(1).optional(),
  modifiers: z.array(
    z.object({
      name: z.string().min(1),
      priceAdjustment: z.number().int().optional(),
      isDefault: z.boolean().optional(),
    })
  ).min(1, "At least one modifier required"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { menuItemId, modifiers, ...groupData } = parsed.data;

    const maxSort = await prisma.modifierGroup.aggregate({
      where: { menuItemId },
      _max: { sortOrder: true },
    });

    const group = await prisma.modifierGroup.create({
      data: {
        menuItemId,
        ...groupData,
        sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
        modifiers: {
          create: modifiers.map((mod, i) => ({
            name: mod.name,
            priceAdjustment: mod.priceAdjustment ?? 0,
            isDefault: mod.isDefault ?? false,
            sortOrder: i,
          })),
        },
      },
      include: { modifiers: { orderBy: { sortOrder: "asc" } } },
    });

    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    console.error("Failed to create modifier group:", error);
    return NextResponse.json(
      { error: "Failed to create modifier group" },
      { status: 500 }
    );
  }
}
