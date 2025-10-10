import { PrismaClient, UserRole } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestAccounts() {
    try {
        console.log('?” ?ŒìŠ¤??ê³„ì • ?ì„± ?œì‘...');

        // ê¸°ì¡´ ê³„ì • ?•ì¸
        const existingAdmin = await prisma.user.findUnique({
            where: { email: 'admin@collabo.com' }
        });
        const existingFan = await prisma.user.findUnique({
            where: { email: 'fan@collabo.com' }
        });
        
        if (existingAdmin) {
            console.log('? ï¸ ê´€ë¦¬ì ê³„ì •???´ë? ì¡´ì¬?©ë‹ˆ??', existingAdmin.email);
        }
        if (existingFan) {
            console.log('? ï¸ ??ê³„ì •???´ë? ì¡´ì¬?©ë‹ˆ??', existingFan.email);
        }

        const hashedPassword = await hash('1234', 10);

        // 1. ê´€ë¦¬ì ê³„ì • ?ì„± (upsert)
        const admin = await prisma.user.upsert({
            where: { email: 'admin@collabo.com' },
            update: {
                name: 'ê´€ë¦¬ì',
                passwordHash: hashedPassword,
                role: UserRole.ADMIN
            },
            create: {
                name: 'ê´€ë¦¬ì',
                email: 'admin@collabo.com',
                passwordHash: hashedPassword,
                role: UserRole.ADMIN
            }
        });
        console.log('??ê´€ë¦¬ì ê³„ì • ?ì„±/?…ë°?´íŠ¸ ?„ë£Œ:', admin.email);

        // 2. ??ê³„ì • ?ì„± (upsert)
        const fan = await prisma.user.upsert({
            where: { email: 'fan@collabo.com' },
            update: {
                name: '??,
                passwordHash: hashedPassword,
                role: UserRole.PARTICIPANT
            },
            create: {
                name: '??,
                email: 'fan@collabo.com',
                passwordHash: hashedPassword,
                role: UserRole.PARTICIPANT
            }
        });
        console.log('????ê³„ì • ?ì„±/?…ë°?´íŠ¸ ?„ë£Œ:', fan.email);

        // 3. ?ŒíŠ¸??ê³„ì • ?ì„± (upsert)
        const partner = await prisma.user.upsert({
            where: { email: 'partner@collabo.com' },
            update: {
                name: '?ŒíŠ¸??,
                passwordHash: hashedPassword,
                role: UserRole.PARTNER
            },
            create: {
                name: '?ŒíŠ¸??,
                email: 'partner@collabo.com',
                passwordHash: hashedPassword,
                role: UserRole.PARTNER
            }
        });
        console.log('???ŒíŠ¸??ê³„ì • ?ì„±/?…ë°?´íŠ¸ ?„ë£Œ:', partner.email);

        // 4. ?¬ë¦¬?ì´??ê³„ì • ?ì„± (upsert)
        const creator = await prisma.user.upsert({
            where: { email: 'creator@collabo.com' },
            update: {
                name: '?¬ë¦¬?ì´??,
                passwordHash: hashedPassword,
                role: UserRole.CREATOR
            },
            create: {
                name: '?¬ë¦¬?ì´??,
                email: 'creator@collabo.com',
                passwordHash: hashedPassword,
                role: UserRole.CREATOR
            }
        });
        console.log('???¬ë¦¬?ì´??ê³„ì • ?ì„±/?…ë°?´íŠ¸ ?„ë£Œ:', creator.email);

        // 5. ?¼ë°˜ ?¬ìš©??ê³„ì • ?ì„± (upsert)
        const user = await prisma.user.upsert({
            where: { email: 'user@collabo.com' },
            update: {
                name: '?¼ë°˜?¬ìš©??,
                passwordHash: hashedPassword,
                role: UserRole.PARTICIPANT
            },
            create: {
                name: '?¼ë°˜?¬ìš©??,
                email: 'user@collabo.com',
                passwordHash: hashedPassword,
                role: UserRole.PARTICIPANT
            }
        });
        console.log('???¼ë°˜?¬ìš©??ê³„ì • ?ì„±/?…ë°?´íŠ¸ ?„ë£Œ:', user.email);

        console.log('\n?‰ ëª¨ë“  ?ŒìŠ¤??ê³„ì •???±ê³µ?ìœ¼ë¡??ì„±?˜ì—ˆ?µë‹ˆ??');
        console.log('\n?“‹ ê³„ì • ?•ë³´:');
        console.log('?‘‘ ê´€ë¦¬ì: admin@collabo.com / 1234');
        console.log('?‘¤ ?? fan@collabo.com / 1234');
        console.log('?¤ ?ŒíŠ¸?? partner@collabo.com / 1234');
        console.log('?¨ ?¬ë¦¬?ì´?? creator@collabo.com / 1234');
        console.log('?‘¥ ?¼ë°˜?¬ìš©?? user@collabo.com / 1234');

    } catch (error) {
        console.error('??ê³„ì • ?ì„± ì¤??¤ë¥˜ ë°œìƒ:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createTestAccounts();
