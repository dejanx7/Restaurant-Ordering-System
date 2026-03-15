import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// GET all menu items for admin (including archived)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    const includeArchived = searchParams.get("includeArchived") === "true";

    const items = await prisma.menuItem.findMany({
      where: {
        ...(categoryId ? { categoryId } : {}),
        ...(!includeArchived ? { isArchived: false } : {}),
      },
      orderBy: { sortOrder: "asc" },
      include: {
        category: { select: { id: true, name: true } },
        modifierGroups: {
          orderBy: { sortOrder: "asc" },
          include: {
            modifiers: {
              orderBy: { sortOrder: "asc" },
            },
          },
        },
      },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("Failed to fetch menu items:", error);
    return NextResponse.json(
      { error: "Failed to fetch menu items" },
      { status: 500 }
    );
  }
}

const createSchema = z.object({
  categoryId: z.string(),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  price: z.number().int().min(0, "Price must be non-negative"),
  tags: z.array(z.enum(["VEGAN", "VEGETARIAN", "GLUTEN_FREE", "DAIRY_FREE", "SPICY", "NUT_FREE"])).optional(),
});

// POST create menu item
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

    // Get max sortOrder within category
    const maxSort = await prisma.menuItem.aggregate({
      where: { categoryId: parsed.data.categoryId },
      _max: { sortOrder: true },
    });

    const item = await prisma.menuItem.create({
      data: {
        ...parsed.data,
        tags: parsed.data.tags ?? [],
        sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
      },
      include: {
        category: { select: { id: true, name: true } },
        modifierGroups: {
          include: { modifiers: true },
        },
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Failed to create menu item:", error);
    return NextResponse.json(
      { error: "Failed to create menu item" },
      { status: 500 }
    );
  }
}
