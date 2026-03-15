import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  description: z.string().optional(),
  discountType: z.enum(["FLAT_AMOUNT", "PERCENTAGE"]).optional(),
  discountValue: z.number().int().min(1).optional(),
  minimumOrder: z.number().int().min(0).nullable().optional(),
  maxUses: z.number().int().min(1).nullable().optional(),
  expiresAt: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ promoId: string }> }
) {
  try {
    const { promoId } = await params;
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data" },
        { status: 400 }
      );
    }

    const data = { ...parsed.data };
    const updateData: Record<string, unknown> = { ...data };
    if (data.expiresAt !== undefined) {
      updateData.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
    }

    const promo = await prisma.promoCode.update({
      where: { id: promoId },
      data: updateData,
    });

    return NextResponse.json(promo);
  } catch (error) {
    console.error("Failed to update promo code:", error);
    return NextResponse.json(
      { error: "Failed to update promo code" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ promoId: string }> }
) {
  try {
    const { promoId } = await params;

    await prisma.promoCode.delete({
      where: { id: promoId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete promo code:", error);
    return NextResponse.json(
      { error: "Failed to delete promo code" },
      { status: 500 }
    );
  }
}
