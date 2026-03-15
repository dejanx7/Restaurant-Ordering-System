import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { orderEvents } from "@/lib/sse";
import { generateOrderNumber } from "@/lib/order-number";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    // Idempotency: check if order already exists for this PaymentIntent
    const existingOrder = await prisma.order.findUnique({
      where: { stripePaymentIntentId: paymentIntent.id },
    });

    if (existingOrder) {
      // Already processed — return success
      return NextResponse.json({ received: true });
    }

    const meta = paymentIntent.metadata;

    let orderItems: {
      menuItemId: string;
      name: string;
      price: number;
      quantity: number;
      modifiers: { name: string; priceAdj: number }[];
      specialNote?: string;
      lineTotal: number;
    }[];

    try {
      orderItems = JSON.parse(meta.orderItems);
    } catch {
      console.error("Failed to parse orderItems from metadata:", meta.orderItems);
      return NextResponse.json(
        { error: "Invalid order metadata" },
        { status: 400 }
      );
    }

    const orderNumber = await generateOrderNumber();

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          customerName: meta.customerName,
          customerEmail: meta.customerEmail,
          customerPhone: meta.customerPhone || null,
          type: meta.orderType as "PICKUP" | "DELIVERY",
          status: "PENDING",
          deliveryAddress: meta.deliveryAddress || null,
          deliveryFee: parseInt(meta.deliveryFee, 10),
          subtotal: parseInt(meta.subtotal, 10),
          taxAmount: parseInt(meta.taxAmount, 10),
          totalAmount: paymentIntent.amount,
          specialInstructions: meta.specialInstructions || null,
          stripePaymentIntentId: paymentIntent.id,
          items: {
            create: orderItems.map((item) => ({
              menuItemId: item.menuItemId,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              modifiers: item.modifiers,
              specialNote: item.specialNote || null,
              lineTotal: item.lineTotal,
            })),
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

    // Broadcast new order via SSE
    orderEvents.emit({
      type: "order:new",
      orderId: order.id,
      status: "PENDING",
    });
  }

  return NextResponse.json({ received: true });
}
