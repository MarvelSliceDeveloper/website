const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
(async () => {
    const p = new PrismaClient();
    try {
        const user = await p.user.findUnique({ where: { email: 'admin@lms.local' } });
        if (!user) return console.error('user not found');
        const ok = await bcrypt.compare('admin123', user.passwordHash);
        console.log('admin password matches:', ok);
        const student = await p.user.findUnique({ where: { email: 'student@lms.local' } });
        const ok2 = await bcrypt.compare('student123', student.passwordHash);
        console.log('student password matches:', ok2);
    } catch (e) {
        console.error(e);
        process.exit(1);
    } finally { await p.$disconnect(); }
})();