import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

const razorpay =
  keyId && keySecret
    ? new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      })
    : null;

export async function POST(req: NextRequest) {
  try {
    if (!razorpay) {
      return NextResponse.json(
        { error: "Razorpay is not configured on the server." },
        { status: 500 },
      );
    }

    const body = await req.json();
    const {
      amount,
      currency,
      localOrderId,
    }: {
      amount?: number;
      currency?: string;
      localOrderId?: string;
      customer?: {
        name?: string;
        email?: string;
        contact?: string;
      };
    } = body;

    if (!amount || !currency || !localOrderId) {
      return NextResponse.json(
        { error: "Missing required fields for Razorpay order." },
        { status: 400 },
      );
    }

    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt: localOrderId,
      notes: {
        localOrderId,
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Razorpay order creation failed", error);
    return NextResponse.json(
      { error: "Failed to create Razorpay order." },
      { status: 500 },
    );
  }
}


