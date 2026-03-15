import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  required: z.boolean().optional(),
  minSelect: z.number().int().min(0).optional(),
  maxSelect: z.number().int().min(1).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params;
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data" },
        { status: 400 }
      );
    }

    const group = await prisma.modifierGroup.update({
      where: { id: groupId },
      data: parsed.data,
      include: { modifiers: { orderBy: { sortOrder: "asc" } } },
    });

    return NextResponse.json(group);
  } catch (error) {
    console.error("Failed to update modifier group:", error);
    return NextResponse.json(
      { error: "Failed to update modifier group" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params;

    await prisma.modifierGroup.delete({
      where: { id: groupId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete modifier group:", error);
    return NextResponse.json(
      { error: "Failed to delete modifier group" },
      { status: 500 }
    );
  }
}
