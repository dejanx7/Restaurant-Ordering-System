import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const active = searchParams.get("active") === "true";

    const orders = await prisma.order.findMany({
      where: active
        ? {
            status: {
              in: ["PENDING", "CONFIRMED", "PREPARING", "READY"],
            },
          }
        : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          select: {
            name: true,
            quantity: true,
            lineTotal: true,
            modifiers: true,
          },
        },
      },
    });

    return NextResponse.json(
      orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        type: o.type,
        customerName: o.customerName,
        totalAmount: o.totalAmount,
        createdAt: o.createdAt.toISOString(),
        items: o.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          lineTotal: item.lineTotal,
          modifiers: item.modifiers as { name: string; priceAdj: number }[],
        })),
      }))
    );
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
