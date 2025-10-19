import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt, { JwtPayload } from 'jsonwebtoken';

// Define which routes are protected
const protectedRoutes = [
    '/api/admin',
    '/api/settings',
    '/api/secure',
];

// Define which permissions each protected route requires
const routePermissions: Record<string, string[]> = {
    '/api/admin': ['ADMIN_ACCESS'],
    '/api/settings': ['EDIT_SETTINGS'],
};

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': 'http://localhost:5173',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: CORS_HEADERS,
        });
    }

    // Skip authorization if route is public
    const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));
    if (!isProtected) {
        const res = NextResponse.next();
        Object.entries(CORS_HEADERS).forEach(([key, value]) => res.headers.set(key, value));
        return res;
    }

    // --- Authorization header validation ---
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return new NextResponse(JSON.stringify({ error: 'Unauthorized: Missing or invalid Authorization header' }), {
            status: 401,
            headers: CORS_HEADERS,
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload & {
            userId: string;
            roles?: string[];
            permissions?: string[];
        };

        // Permission check for route
        const requiredPermissions = routePermissions[pathname];
        if (requiredPermissions && requiredPermissions.length > 0) {
            const userPermissions = decoded.permissions || [];
            const hasAllPermissions = requiredPermissions.every((p) => userPermissions.includes(p));

            if (!hasAllPermissions) {
                return new NextResponse(JSON.stringify({ error: 'Forbidden: Insufficient permissions' }), {
                    status: 403,
                    headers: CORS_HEADERS,
                });
            }
        }

        // Pass user context down the line
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set('x-user', JSON.stringify(decoded));

        const response = NextResponse.next({
            request: { headers: requestHeaders },
        });

        Object.entries(CORS_HEADERS).forEach(([key, value]) => response.headers.set(key, value));
        return response;
    } catch (err: any) {
        console.error('JWT verification failed:', err.message);

        return new NextResponse(
            JSON.stringify({ error: 'Unauthorized: Invalid or expired token' }),
            { status: 401, headers: CORS_HEADERS }
        );
    }
}

export const config = {
    matcher: '/api/:path*',
};
