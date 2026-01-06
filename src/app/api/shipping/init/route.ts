/**
 * Manual Shipping Module Initialization
 * GET /api/shipping/init
 * 
 * For debugging only - module auto-initializes on server start
 */

import { NextResponse } from 'next/server';
import { initializeShippingModule, getShippingModuleStatus } from '@/server/shipping';

export async function GET() {
  try {
    const result = await initializeShippingModule();
    const status = getShippingModuleStatus();
    
    return NextResponse.json({
      ...result,
      status,
    });
  } catch (error) {
    console.error('Manual init error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to initialize' 
      },
      { status: 500 }
    );
  }
}