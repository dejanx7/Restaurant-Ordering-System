import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const hoursSchema = z.object({
  hours: z.array(
    z.object({
      dayOfWeek: z.number().int().min(0).max(6),
      openTime: z.string().regex(/^\d{2}:\d{2}$/),
      closeTime: z.string().regex(/^\d{2}:\d{2}$/),
      isClosed: z.boolean(),
    })
  ).length(7),
});

// PUT replace all business hours
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = hoursSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Delete existing and recreate
    await prisma.$transaction([
      prisma.businessHours.deleteMany({
        where: { settingsId: "singleton" },
      }),
      ...parsed.data.hours.map((h) =>
        prisma.businessHours.create({
          data: {
            settingsId: "singleton",
            dayOfWeek: h.dayOfWeek,
            openTime: h.openTime,
            closeTime: h.closeTime,
            isClosed: h.isClosed,
          },
        })
      ),
    ]);

    const hours = await prisma.businessHours.findMany({
      where: { settingsId: "singleton" },
      orderBy: { dayOfWeek: "asc" },
    });

    return NextResponse.json(hours);
  } catch (error) {
    console.error("Failed to update hours:", error);
    return NextResponse.json(
      { error: "Failed to update hours" },
      { status: 500 }
    );
  }
}
