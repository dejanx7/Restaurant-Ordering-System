import { prisma } from "./prisma";

export async function generateOrderNumber(): Promise<string> {
  const seq = await prisma.orderSequence.create({ data: {} });
  return `#${(1000 + seq.id).toString()}`;
}
