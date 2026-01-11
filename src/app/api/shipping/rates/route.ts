/**
 * Shipping Rates API
 * POST /api/shipping/rates
 * 
 * Get available shipping rates for delivery to a pincode.
 * Uses all enabled shipping providers and returns rates from each.
 */

import { NextRequest, NextResponse } from "next/server";
import { shippingOrchestrator } from "@/server/shipping";
import { z } from "zod";

// Validation schema
const getRatesSchema = z.object({
  fromPincode: z.string().regex(/^\d{6}$/, "Pincode must be 6 digits"),
  toPincode: z.string().regex(/^\d{6}$/, "Pincode must be 6 digits"),
  weight: z.number().min(0.1).max(100),
  cod: z.number(),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validated = getRatesSchema.parse(body);

    // Calculate weight if not provided
    let weight = validated.weight;
    if (!weight) {
      weight = 0.5; // Default weight
    }

    // Build rate request
    const rateRequest = {
      fromPincode: validated.fromPincode,
      toPincode: validated.toPincode,
      cod: validated.cod,
      weight: weight,
    };

    // Get rates from all providers
    const rates = await shippingOrchestrator.getRatesFromAllProviders(
      rateRequest,
      { useCache: true }
    );

    // Select default rate using "balanced" strategy
    const defaultSelection = await shippingOrchestrator.getBestRate(
      rateRequest,
      { strategy: "balanced" }
    );

    return NextResponse.json({
      success: true,
      rates,
      defaultRate: defaultSelection?.selectedRate,
      fromPincode: validated.fromPincode,
      toPincode: validated.toPincode,
      metadata: {
        totalProviders: rates.length,
        selectionReason: defaultSelection?.reason,
      },
    });
  } catch (error) {
    console.error("Get shipping rates error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation error",
          details: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to get shipping rates",
      },
      { status: 500 }
    );
  }
}

