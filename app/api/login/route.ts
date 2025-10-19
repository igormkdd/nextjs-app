import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const { username, password } = await req.json();

        if (!username || !password) {
            return new NextResponse(
                JSON.stringify({ error: 'No username or password provided' }),
                { status: 400 }
            );
        }

        // Find user with their roles and permissions
        const user = await prisma.user.findUnique({
            where: { username },
            include: {
                roles: {
                    include: {
                        role: {
                            include: {
                                permissions: {
                                    include: {
                                        permission: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!user) {
            return new NextResponse(JSON.stringify({ error: 'User not found' }), { status: 404 });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return new NextResponse(JSON.stringify({ error: 'Invalid password' }), { status: 401 });
        }

        // Extract roles and permissions from UserRole -> Role -> RolePermission
        const roles = user.roles.map((r) => r.role.name);
        const permissions = user.roles.flatMap((r) =>
            r.role.permissions.map((p) => p.permission.name)
        );

        // Create JWT toekn
        const token = jwt.sign(
            {
                userId: user.id,
                username: user.username,
                roles,
                permissions,
            },
            process.env.JWT_SECRET!,
            { expiresIn: '1h' }
        );

        return new NextResponse(
            JSON.stringify({
                message: 'Login successful',
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    roles,
                    permissions,
                },
            }),
            { status: 200 }
        );
    } catch (err: any) {
        console.error('Login error:', err);
        return new NextResponse(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
    }
}
