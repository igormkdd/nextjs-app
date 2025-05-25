import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET

// Sign a JWT token
export function signToken(payload: object) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

// Verify a JWT token
export function verifyToken(token: string) {
    return jwt.verify(token, JWT_SECRET);
}

// Hash a password
export async function hashPassword(password: string) {
    return await bcrypt.hash(password, 10);
}

// Compare password with hash
export async function verifyPassword(password: string, hash: string) {
    return await bcrypt.compare(password, hash);
}

// Add Authentication
export function withAuth(handler: (req: NextRequest, user: any) => Promise<NextResponse>) {
    return async function (req: NextRequest) {
        const authHeader = req.headers.get('authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new NextResponse(JSON.stringify({ error: 'Missing or invalid Authorization header' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const token = authHeader.split(' ')[1];

        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            return handler(req, decoded);
        } catch (error) {
            console.error('JWT verification failed:', error);
            return new NextResponse(JSON.stringify({ error: 'Invalid or expired token' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            });
        }
    };
}
