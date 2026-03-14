import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOrderNumber } from "@/lib/order-number";
import { z } from "zod";

const checkoutSchema = z.object({
  customerName: z.string().min(1, "Name is required"),
  customerEmail: z.string().email("Valid email required"),
  customerPhone: z.string().optional(),
  orderType: z.enum(["PICKUP", "DELIVERY"]),
  deliveryAddress: z.string().optional(),
  specialInstructions: z.string().optional(),
  items: z
    .array(
      z.object({
        menuItemId: z.string(),
        name: z.string(),
        price: z.number().int(),
        quantity: z.number().int().positive(),
        modifiers: z.array(
          z.object({
            name: z.string(),
            priceAdj: z.number().int(),
          })
        ),
        specialNote: z.string().optional(),
      })
    )
    .min(1, "At least one item required"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid order data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Validate delivery address for delivery orders
    if (data.orderType === "DELIVERY" && !data.deliveryAddress) {
      return NextResponse.json(
        { error: "Delivery address is required for delivery orders" },
        { status: 400 }
      );
    }

    // Get restaurant settings for tax rate and delivery fee
    const settings = await prisma.restaurantSettings.findUnique({
      where: { id: "singleton" },
    });

    if (!settings) {
      return NextResponse.json(
        { error: "Restaurant settings not found" },
        { status: 500 }
      );
    }

    if (!settings.isOpen || settings.isPausedToday) {
      return NextResponse.json(
        { error: "Restaurant is currently closed" },
        { status: 400 }
      );
    }

    // Verify items against the database
    const menuItemIds = data.items.map((i) => i.menuItemId);
    const dbItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds }, isAvailable: true, isArchived: false },
    });

    if (dbItems.length !== menuItemIds.length) {
      return NextResponse.json(
        { error: "Some menu items are no longer available" },
        { status: 400 }
      );
    }

    // Calculate totals server-side (never trust client calculations)
    const dbItemMap = new Map(dbItems.map((i) => [i.id, i]));
    let subtotal = 0;

    const orderItems = data.items.map((item) => {
      const dbItem = dbItemMap.get(item.menuItemId)!;
      const modTotal = item.modifiers.reduce((s, m) => s + m.priceAdj, 0);
      const lineTotal = (dbItem.price + modTotal) * item.quantity;
      subtotal += lineTotal;

      return {
        menuItemId: item.menuItemId,
        name: dbItem.name,
        price: dbItem.price,
        quantity: item.quantity,
        modifiers: item.modifiers,
        specialNote: item.specialNote,
        lineTotal,
      };
    });

    const deliveryFee =
      data.orderType === "DELIVERY" ? settings.deliveryFeeFixed : 0;

    if (
      data.orderType === "DELIVERY" &&
      subtotal < settings.deliveryMinOrder
    ) {
      return NextResponse.json(
        {
          error: `Minimum order for delivery is $${(settings.deliveryMinOrder / 100).toFixed(2)}`,
        },
        { status: 400 }
      );
    }

    const taxAmount = Math.round(subtotal * settings.taxRate);
    const totalAmount = subtotal + taxAmount + deliveryFee;

    const orderNumber = await generateOrderNumber();

    // Create order in a transaction
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone,
          type: data.orderType,
          status: "PENDING",
          deliveryAddress:
            data.orderType === "DELIVERY" ? data.deliveryAddress : null,
          deliveryFee,
          subtotal,
          taxAmount,
          totalAmount,
          specialInstructions: data.specialInstructions,
          items: {
            create: orderItems,
          },
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: newOrder.id,
          status: "PENDING",
        },
      });

      return newOrder;
    });

    // TODO: In Phase 2, broadcast via SSE here

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to process order" },
      { status: 500 }
    );
  }
}
