import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');

    // Permissions
    const permissions = [
        { name: 'CREATE_USER', description: 'Can create users' },
        { name: 'VIEW_LOGS', description: 'Can view system logs' },
        { name: 'READ_SENSORS', description: 'Can read sensor data' },
        { name: 'WRITE_SENSORS', description: 'Can write sensor data' },
    ];

    for (const perm of permissions) {
        await prisma.permission.upsert({
            where: { name: perm.name },
            update: {},
            create: perm,
        });
    }

    // Roles
    const roles = [
        { name: 'Admin', description: 'System administrator' },
        { name: 'Viewer', description: 'Read-only access' },
    ];

    for (const role of roles) {
        await prisma.role.upsert({
            where: { name: role.name },
            update: {},
            create: role,
        });
    }

    // Role Permission links
    const adminRole = await prisma.role.findUnique({ where: { name: 'Admin' } });
    const viewerRole = await prisma.role.findUnique({ where: { name: 'Viewer' } });
    const allPermissions = await prisma.permission.findMany();

    if (adminRole) {
        for (const perm of allPermissions) {
            await prisma.rolePermission.upsert({
                where: {
                    roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id },
                },
                update: {},
                create: { roleId: adminRole.id, permissionId: perm.id },
            });
        }
    }

    if (viewerRole) {
        const readPerm = allPermissions.find((p) => p.name === 'READ_SENSORS');
        if (readPerm) {
            await prisma.rolePermission.upsert({
                where: {
                    roleId_permissionId: { roleId: viewerRole.id, permissionId: readPerm.id },
                },
                update: {},
                create: { roleId: viewerRole.id, permissionId: readPerm.id },
            });
        }
    }

    // Admin user
    const hashedPassword = await bcrypt.hash('igor123', 10);
    const adminUser = await prisma.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            name: 'System Admin',
            username: 'admin',
            email: 'admin@admin.com',
            password: hashedPassword,
            roles: {
                create: [{ roleId: adminRole!.id }],
            },
        },
    });

    console.log('Seeding complete. Admin user:', adminUser.username);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
