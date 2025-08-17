import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const { name, username, email, password } = await req.json();

        if (!name || !username || !email || !password) {
            return new Response(JSON.stringify({ error: 'No full name or username or email or password provided' }), { status: 401 });
        }

        const existingUser = await prisma.user.findUnique({ where: { username } });
        if (existingUser) {
            return new Response(JSON.stringify({ error: 'User already exists' }), { status: 409 });
        }

        const existingEmail = await prisma.user.findUnique({ where: { email } });
        if (existingEmail) {
            return new Response(JSON.stringify({ error: 'Email already exists' }), { status: 409 });
        }

        // User role "user" must exists - important. Otherwise it will fail. Also improve it later
        let userRole = await prisma.role.findUnique({ where: { name: 'user' } });
        if (!userRole) {
            userRole = await prisma.role.create({
                data: { name: 'user', description: 'Default role for new users' },
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                name: name,
                email: email,
                username: username,
                password: hashedPassword,
                roles: {
                    create: {
                        roleId: userRole.id,
                    },
                },
            },
            include: { roles: { include: { role: true } } },
        });

        return new Response(
            JSON.stringify({
                message: 'User created',
                userId: newUser.id,
                roles: newUser.roles.map(r => r.role.name),
            }),
            { status: 201 }
        );
    } catch (err) {
        console.error('Registration error:', err);
        return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
    }
}
