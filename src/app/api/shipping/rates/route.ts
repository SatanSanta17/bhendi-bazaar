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

    // Get best rates using two-step filtering
    const bestRates = await shippingOrchestrator.getBestRatesByDeliveryDays(
      rateRequest,
      { useCache: false }
    );

    // Debug logging
    console.log("📦 Shipping Rates Debug:");
    console.log(`- Total rates returned: ${bestRates.length}`);
    console.log(
      `- Rates:`,
      bestRates.map((r) => ({
        courier: r.courierName,
        days: r.estimatedDays,
        rate: r.rate,
      }))
    );

    if (bestRates.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No shipping options available for this location",
        },
        { status: 404 }
      );
    }

    // Return best rates (one per delivery day group)
    return NextResponse.json({
      success: true,
      rates: bestRates, // Array of best rates (one per delivery day)
      defaultRate: bestRates[0], // First one is fastest/cheapest
      fromPincode: rateRequest.fromPincode,
      toPincode: rateRequest.toPincode,
      metadata: {
        totalOptions: bestRates.length,
        deliveryDays: bestRates.map((r) => r.estimatedDays),
        priceRange: {
          min: Math.min(...bestRates.map((r) => r.rate)),
          max: Math.max(...bestRates.map((r) => r.rate)),
        },
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
