import { withAuth } from '@/app/lib/auth';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(req: Request) {
    const { email, password } = await req.json();

    if (!email || !password) {
        return new Response(JSON.stringify({ error: 'No email or password provided' }), { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return new Response(JSON.stringify({ error: 'Invalid password' }), { status: 401 });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: '1h' });

    return new Response(JSON.stringify({ token }), { status: 200 });
}

export const GET = withAuth(async (req, user) => {
    const profile = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { id: true, email: true, createdAt: true }
    });

    if (!profile) {
        return new NextResponse(JSON.stringify({ error: 'User not found' }), { status: 404 });
    }

    return new NextResponse(JSON.stringify(profile), { status: 200 });
});
