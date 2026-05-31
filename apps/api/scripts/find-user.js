const { PrismaClient } = require('@prisma/client');

(async function () {
    const prisma = new PrismaClient();
    try {
        const users = await prisma.user.findMany({
            where: { email: { contains: 'harishkumar', mode: 'insensitive' } },
            select: { id: true, email: true, passwordHash: true, msUserId: true }
        });
        console.log(JSON.stringify(users, null, 2));
    } catch (e) {
        console.error('Error querying users:', e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
})();
