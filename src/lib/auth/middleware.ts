// ============================================================================
// AUTHENTICATION MIDDLEWARE
// Central authentication for all API routes
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export interface AuthenticatedUser {
  id: string;
  email?: string;
  user_metadata?: any;
}

export interface AuthenticatedRequest extends NextRequest {
  user: AuthenticatedUser;
}

/**
 * Authenticates user and adds user data to request
 * Throws error if authentication fails
 */
export async function authenticateUser(request: NextRequest): Promise<AuthenticatedUser> {
  try {
    const supabase = await createClient();
    
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Missing or invalid authorization header');
    }

    // Extract token
    const token = authHeader.substring(7);
    
    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      throw new Error('Invalid or expired token');
    }

    return {
      id: user.id,
      email: user.email,
      user_metadata: user.user_metadata
    };
  } catch (error) {
    console.error('Authentication error:', error);
    throw new Error('Unauthorized');
  }
}

/**
 * Middleware wrapper for API routes that require authentication
 */
export function withAuth(handler: (request: AuthenticatedRequest) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const user = await authenticateUser(request);
      const authenticatedRequest = request as AuthenticatedRequest;
      authenticatedRequest.user = user;
      
      return await handler(authenticatedRequest);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }
  };
}

/**
 * Optional authentication - doesn't throw if no auth provided
 */
export async function optionalAuth(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    return await authenticateUser(request);
  } catch {
    return null;
  }
}
