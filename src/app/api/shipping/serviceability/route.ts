/**
 * Shipping Serviceability API
 * GET /api/shipping/serviceability?pincode=400001
 * 
 * Check if delivery is available to a pincode.
 */

import { NextRequest, NextResponse } from "next/server";
import { shippingOrchestrator } from "@/server/shipping";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const pincode = searchParams.get("pincode");

    if (!pincode || !/^\d{6}$/.test(pincode)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid pincode. Must be 6 digits.",
        },
        { status: 400 }
      );
    }

    // Check serviceability across all providers
    const result = await shippingOrchestrator.checkServiceability(pincode);

    return NextResponse.json({
      success: true,
      serviceable: result.serviceable,
      providers: result.providers,
      pincode,
      message: result.serviceable
        ? `Delivery available to ${pincode}`
        : `Delivery not available to ${pincode}`,
    });
  } catch (error) {
    console.error("Serviceability check error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to check serviceability",
      },
      { status: 500 }
    );
  }
}

