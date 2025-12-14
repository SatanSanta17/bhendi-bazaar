import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get("x-razorpay-signature") ?? "";
    const body = await req.text();

    if (webhookSecret) {
      const expected = crypto
        .createHmac("sha256", webhookSecret)
        .update(body)
        .digest("hex");

      if (expected !== signature) {
        return NextResponse.json(
          { error: "Invalid Razorpay signature" },
          { status: 400 },
        );
      }
    }

    const event = JSON.parse(body) as {
      event?: string;
      payload?: unknown;
    };

    // For this demo store, we only verify the event and log it.
    // In a real backend, you would look up the order by notes.localOrderId
    // and update its payment status in your database.
    // eslint-disable-next-line no-console
    console.log("Razorpay webhook received", event.event);

    return NextResponse.json({ received: true });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error handling Razorpay webhook", error);
    return NextResponse.json(
      { error: "Error handling webhook" },
      { status: 500 },
    );
  }
}


