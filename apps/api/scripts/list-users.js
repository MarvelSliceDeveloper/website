const { PrismaClient } = require('@prisma/client');
(async () => {
    const p = new PrismaClient();
    try {
        const users = await p.user.findMany({ select: { id: true, email: true, passwordHash: true } });
        console.log(JSON.stringify(users, null, 2));
    } catch (e) {
        console.error(e);
        process.exit(1);
    } finally {
        await p.$disconnect();
    }
})();