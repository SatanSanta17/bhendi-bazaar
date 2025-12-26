import { z } from 'zod';
import { NextResponse } from 'next/server';

/**
 * Validate request body against a Zod schema
 * Returns validated data or error response
 */
export async function validateRequest<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ data: T } | { error: NextResponse }> {
  try {
    const body = await request.json();
    const validated = schema.parse(body);
    return { data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        error: NextResponse.json(
          {
            error: 'Validation failed',
            details: error.issues.map((e) => ({
              path: e.path.join('.'),
              message: e.message,
            })),
          },
          { status: 400 }
        ),
      };
    }
    
    return {
      error: NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      ),
    };
  }
}

/**
 * Validate query parameters
 */
export function validateQueryParams<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>
): { data: T } | { error: NextResponse } {
  try {
    const params = Object.fromEntries(searchParams.entries());
    const validated = schema.parse(params);
    return { data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        error: NextResponse.json(
          {
            error: 'Invalid query parameters',
            details: error.issues.map((e) => ({
              path: e.path.join('.'),
              message: e.message,
            })),
          },
          { status: 400 }
        ),
      };
    }
    
    return {
      error: NextResponse.json(
        { error: 'Invalid query parameters' },
        { status: 400 }
      ),
    };
  }
}

