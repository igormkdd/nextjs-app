import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get user permissions after successful authentication
export async function getUserPermissions(userId: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
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
            throw new Error('User not found');
        }

        // Extract permission names
        const permissions = user.roles.flatMap((userRole) =>
            userRole.role.permissions.map((rp) => rp.permission.name)
        );

        // Remove duplicates - improve later
        const uniquePermissions = [...new Set(permissions)];
        console.log(`User permissions: ${JSON.stringify(uniquePermissions)}`);

        return { roles: user.roles.map(r => r.role.name), permissions: uniquePermissions };
    } catch (error) {
        console.error("Error fetching permissions: ", error);
        throw error;
    }
}
