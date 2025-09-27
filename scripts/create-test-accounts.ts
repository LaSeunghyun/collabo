import { PrismaClient, UserRole } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/collaborium?schema=public'
        }
    }
});

async function createTestAccounts() {
    try {
        console.log('🔐 테스트 계정 생성 시작...');

        // 기존 계정 삭제 (선택사항)
        await prisma.user.deleteMany({
            where: {
                email: {
                    in: ['admin@collabo.com', 'fan@collabo.com', 'partner@collabo.com']
                }
            }
        });

        const hashedPassword = await hash('1234', 10);

        // 1. 관리자 계정 생성
        const admin = await prisma.user.create({
            data: {
                name: '관리자',
                email: 'admin@collabo.com',
                passwordHash: hashedPassword,
                role: UserRole.ADMIN
            }
        });
        console.log('✅ 관리자 계정 생성 완료:', admin.email);

        // 2. 팬 계정 생성 (참여자)
        const fan = await prisma.user.create({
            data: {
                name: '팬',
                email: 'fan@collabo.com',
                passwordHash: hashedPassword,
                role: UserRole.PARTICIPANT
            }
        });
        console.log('✅ 팬 계정 생성 완료:', fan.email);

        // 3. 파트너 계정 생성
        const partner = await prisma.user.create({
            data: {
                name: '파트너',
                email: 'partner@collabo.com',
                passwordHash: hashedPassword,
                role: UserRole.PARTNER
            }
        });
        console.log('✅ 파트너 계정 생성 완료:', partner.email);

        console.log('\n🎉 모든 테스트 계정이 성공적으로 생성되었습니다!');
        console.log('\n📋 계정 정보:');
        console.log('👑 관리자: admin@collabo.com / 1234');
        console.log('👤 팬: fan@collabo.com / 1234');
        console.log('🤝 파트너: partner@collabo.com / 1234');

    } catch (error) {
        console.error('❌ 계정 생성 중 오류 발생:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createTestAccounts();
