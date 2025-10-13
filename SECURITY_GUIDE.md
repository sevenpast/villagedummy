# 🔒 Security Implementation Guide

## Critical Security Fixes Applied

### 1. ✅ API Key Security
- **FIXED**: Removed `NEXT_PUBLIC_GEMINI_API_KEY` from client-side code
- **SECURE**: All Gemini API calls now use server-side only `GEMINI_API_KEY`
- **IMPACT**: Prevents API key exposure in browser

### 2. ✅ Authentication Middleware
- **IMPLEMENTED**: Central authentication for all API routes
- **FEATURES**: 
  - JWT token validation
  - User context injection
  - Automatic error handling
- **USAGE**: Wrap API routes with `withAuth()` middleware

### 3. ✅ Input Validation
- **IMPLEMENTED**: Zod schemas for all API inputs
- **FEATURES**:
  - UUID validation
  - Email validation
  - URL validation
  - Type-safe parameter parsing
- **USAGE**: Use `validateInput()`, `validateQueryParams()`, `validateRequestBody()`

### 4. ✅ Consolidated API Routes
- **IMPLEMENTED**: Single `/api/test/email` route replacing 12+ test routes
- **FEATURES**:
  - Parameter-based test types
  - Centralized error handling
  - Consistent authentication
- **BENEFITS**: Reduced attack surface, easier maintenance

### 5. ✅ Unified Gemini Service
- **IMPLEMENTED**: Single `GeminiService` class replacing 3 duplicate files
- **FEATURES**:
  - Centralized caching
  - Error handling
  - Retry logic
  - Type safety
- **BENEFITS**: Consistent behavior, reduced code duplication

## Required Environment Variables

### Production Environment
```bash
# Supabase (Public - Safe for client-side)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Supabase (Private - Server-side only)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Gemini AI (Private - Server-side only)
GEMINI_API_KEY=your_gemini_api_key

# Email Service (Private - Server-side only)
RESEND_API_KEY=your_resend_api_key

# Google Cloud Vision (Private - Server-side only)
GOOGLE_CLOUD_VISION_API_KEY=your_vision_api_key
```

### Development Environment
```bash
# Same as production, but with development values
NODE_ENV=development
```

## Security Best Practices

### 1. API Route Security
```typescript
// ✅ SECURE: Use authentication middleware
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  const user = request.user; // Authenticated user
  // Your secure logic here
});

// ❌ INSECURE: No authentication
export async function GET(request: NextRequest) {
  // Anyone can access this
}
```

### 2. Input Validation
```typescript
// ✅ SECURE: Validate all inputs
const { documentId, userId } = validateQueryParams(DocumentDownloadSchema, searchParams);

// ❌ INSECURE: Direct parameter usage
const documentId = searchParams.get('documentId'); // No validation
```

### 3. Error Handling
```typescript
// ✅ SECURE: Don't leak sensitive information
catch (error) {
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', error);
  }
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

// ❌ INSECURE: Expose internal errors
catch (error) {
  return NextResponse.json({ error: error.message }, { status: 500 });
}
```

### 4. Database Queries
```typescript
// ✅ SECURE: Use authenticated user ID
.eq('user_id', request.user.id)

// ❌ INSECURE: Use user-provided ID
.eq('user_id', userId) // Could be manipulated
```

## Migration Checklist

### Immediate Actions Required
- [ ] Update environment variables in production
- [ ] Remove old test API routes
- [ ] Update frontend to use new consolidated API
- [ ] Test authentication on all protected routes
- [ ] Verify input validation is working

### Code Cleanup
- [ ] Remove duplicate Gemini utility files
- [ ] Update imports to use new unified service
- [ ] Remove console.log statements from production code
- [ ] Add proper TypeScript types (remove `any`)

### Monitoring
- [ ] Set up error monitoring
- [ ] Monitor API usage patterns
- [ ] Track authentication failures
- [ ] Monitor cache hit rates

## Testing Security

### 1. Authentication Tests
```bash
# Test without authentication (should fail)
curl -X GET /api/documents/download?documentId=123

# Test with valid authentication (should succeed)
curl -X GET /api/documents/download?documentId=123 \
  -H "Authorization: Bearer your_jwt_token"
```

### 2. Input Validation Tests
```bash
# Test with invalid UUID (should fail)
curl -X GET /api/documents/download?documentId=invalid-uuid

# Test with valid UUID (should succeed)
curl -X GET /api/documents/download?documentId=123e4567-e89b-12d3-a456-426614174000
```

### 3. Authorization Tests
```bash
# Test accessing other user's data (should fail)
curl -X GET /api/documents/download?documentId=other-user-doc \
  -H "Authorization: Bearer your_jwt_token"
```

## Security Headers (Next.js Config)

Add to `next.config.ts`:
```typescript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};
```

## Incident Response

### If API Key is Compromised
1. Immediately rotate the API key
2. Update environment variables
3. Monitor usage for suspicious activity
4. Review access logs

### If Authentication is Bypassed
1. Check middleware implementation
2. Verify JWT token validation
3. Review user permissions
4. Update authentication logic if needed

### If Data is Exposed
1. Identify the scope of exposure
2. Notify affected users
3. Implement additional security measures
4. Review and update access controls

---

**Last Updated**: $(date)
**Security Level**: HIGH
**Review Required**: Monthly
