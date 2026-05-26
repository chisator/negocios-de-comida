import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const topic = request.headers.get("x-topic") ?? body.type;
    const resourceId = body.data?.id ?? body.resource;

    if (topic === "payment" && resourceId) {
      console.log("MP Payment notification:", resourceId);
    }

    if (body.data?.id) {
      const externalRef = body.external_reference;

      if (externalRef && (body.action === "payment.updated" || body.type === "payment")) {
        try {
          await prisma.order.update({
            where: { id: externalRef },
            data: { status: "CONFIRMED" },
          });
        } catch {
          console.log("Order not found for MP webhook:", externalRef);
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }, { status: 200 });
  }
}
