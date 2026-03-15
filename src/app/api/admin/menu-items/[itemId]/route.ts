import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  price: z.number().int().min(0).optional(),
  categoryId: z.string().optional(),
  isAvailable: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  tags: z.array(z.enum(["VEGAN", "VEGETARIAN", "GLUTEN_FREE", "DAIRY_FREE", "SPICY", "NUT_FREE"])).optional(),
});

// PATCH update menu item
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const item = await prisma.menuItem.update({
      where: { id: itemId },
      data: parsed.data,
      include: {
        category: { select: { id: true, name: true } },
        modifierGroups: {
          orderBy: { sortOrder: "asc" },
          include: {
            modifiers: { orderBy: { sortOrder: "asc" } },
          },
        },
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("Failed to update menu item:", error);
    return NextResponse.json(
      { error: "Failed to update menu item" },
      { status: 500 }
    );
  }
}

// DELETE (archive) menu item
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;

    await prisma.menuItem.update({
      where: { id: itemId },
      data: { isArchived: true, isAvailable: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to archive menu item:", error);
    return NextResponse.json(
      { error: "Failed to archive menu item" },
      { status: 500 }
    );
  }
}
