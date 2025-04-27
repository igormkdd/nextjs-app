import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export async function POST(req: Request) {
    const { email, password } = await req.json();

    if (!email || !password) {
        return new Response(JSON.stringify({ error: 'No email or password provided' }), { status: 401 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        return new Response(JSON.stringify({ error: 'User already exists' }), { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
        data: { email, password: hashedPassword },
    });

    return new Response(JSON.stringify({ message: 'User created', userId: newUser.id }), { status: 201 });
}
