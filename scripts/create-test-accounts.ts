import { PrismaClient, UserRole } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestAccounts() {
    try {
        console.log('?�� ?�스??계정 ?�성 ?�작...');

        // 기존 계정 ?�인
        const existingAdmin = await prisma.user.findUnique({
            where: { email: 'admin@collabo.com' }
        });
        const existingFan = await prisma.user.findUnique({
            where: { email: 'fan@collabo.com' }
        });
        
        if (existingAdmin) {
            console.log('?�️ 관리자 계정???��? 존재?�니??', existingAdmin.email);
        }
        if (existingFan) {
            console.log('?�️ ??계정???��? 존재?�니??', existingFan.email);
        }

        const hashedPassword = await hash('1234', 10);

        // 1. 관리자 계정 ?�성 (upsert)
        const admin = await prisma.user.upsert({
            where: { email: 'admin@collabo.com' },
            update: {
                name: '관리자',
                passwordHash: hashedPassword,
                role: UserRole.ADMIN
            },
            create: {
                name: '관리자',
                email: 'admin@collabo.com',
                passwordHash: hashedPassword,
                role: UserRole.ADMIN
            }
        });
        console.log('??관리자 계정 ?�성/?�데?�트 ?�료:', admin.email);

        // 2. ??계정 ?�성 (upsert)
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
        console.log('????계정 ?�성/?�데?�트 ?�료:', fan.email);

        // 3. ?�트??계정 ?�성 (upsert)
        const partner = await prisma.user.upsert({
            where: { email: 'partner@collabo.com' },
            update: {
                name: '?�트??,
                passwordHash: hashedPassword,
                role: UserRole.PARTNER
            },
            create: {
                name: '?�트??,
                email: 'partner@collabo.com',
                passwordHash: hashedPassword,
                role: UserRole.PARTNER
            }
        });
        console.log('???�트??계정 ?�성/?�데?�트 ?�료:', partner.email);

        // 4. ?�리?�이??계정 ?�성 (upsert)
        const creator = await prisma.user.upsert({
            where: { email: 'creator@collabo.com' },
            update: {
                name: '?�리?�이??,
                passwordHash: hashedPassword,
                role: UserRole.CREATOR
            },
            create: {
                name: '?�리?�이??,
                email: 'creator@collabo.com',
                passwordHash: hashedPassword,
                role: UserRole.CREATOR
            }
        });
        console.log('???�리?�이??계정 ?�성/?�데?�트 ?�료:', creator.email);

        // 5. ?�반 ?�용??계정 ?�성 (upsert)
        const user = await prisma.user.upsert({
            where: { email: 'user@collabo.com' },
            update: {
                name: '?�반?�용??,
                passwordHash: hashedPassword,
                role: UserRole.PARTICIPANT
            },
            create: {
                name: '?�반?�용??,
                email: 'user@collabo.com',
                passwordHash: hashedPassword,
                role: UserRole.PARTICIPANT
            }
        });
        console.log('???�반?�용??계정 ?�성/?�데?�트 ?�료:', user.email);

        console.log('\n?�� 모든 ?�스??계정???�공?�으�??�성?�었?�니??');
        console.log('\n?�� 계정 ?�보:');
        console.log('?�� 관리자: admin@collabo.com / 1234');
        console.log('?�� ?? fan@collabo.com / 1234');
        console.log('?�� ?�트?? partner@collabo.com / 1234');
        console.log('?�� ?�리?�이?? creator@collabo.com / 1234');
        console.log('?�� ?�반?�용?? user@collabo.com / 1234');

    } catch (error) {
        console.error('??계정 ?�성 �??�류 발생:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createTestAccounts();
