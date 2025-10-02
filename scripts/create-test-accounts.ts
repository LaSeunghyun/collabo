import { PrismaClient, UserRole } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestAccounts() {
    try {
        console.log('🔐 테스트 계정 생성 시작...');

        // 기존 계정 확인
        const existingAdmin = await prisma.user.findUnique({
            where: { email: 'admin@collabo.com' }
        });
        const existingFan = await prisma.user.findUnique({
            where: { email: 'fan@collabo.com' }
        });
        
        if (existingAdmin) {
            console.log('⚠️ 관리자 계정이 이미 존재합니다:', existingAdmin.email);
        }
        if (existingFan) {
            console.log('⚠️ 팬 계정이 이미 존재합니다:', existingFan.email);
        }

        const hashedPassword = await hash('1234', 10);

        // 1. 관리자 계정 생성 (upsert)
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
        console.log('✅ 관리자 계정 생성/업데이트 완료:', admin.email);

        // 2. 팬 계정 생성 (upsert)
        const fan = await prisma.user.upsert({
            where: { email: 'fan@collabo.com' },
            update: {
                name: '팬',
                passwordHash: hashedPassword,
                role: UserRole.PARTICIPANT
            },
            create: {
                name: '팬',
                email: 'fan@collabo.com',
                passwordHash: hashedPassword,
                role: UserRole.PARTICIPANT
            }
        });
        console.log('✅ 팬 계정 생성/업데이트 완료:', fan.email);

        // 3. 파트너 계정 생성 (upsert)
        const partner = await prisma.user.upsert({
            where: { email: 'partner@collabo.com' },
            update: {
                name: '파트너',
                passwordHash: hashedPassword,
                role: UserRole.PARTNER
            },
            create: {
                name: '파트너',
                email: 'partner@collabo.com',
                passwordHash: hashedPassword,
                role: UserRole.PARTNER
            }
        });
        console.log('✅ 파트너 계정 생성/업데이트 완료:', partner.email);

        // 4. 크리에이터 계정 생성 (upsert)
        const creator = await prisma.user.upsert({
            where: { email: 'creator@collabo.com' },
            update: {
                name: '크리에이터',
                passwordHash: hashedPassword,
                role: UserRole.CREATOR
            },
            create: {
                name: '크리에이터',
                email: 'creator@collabo.com',
                passwordHash: hashedPassword,
                role: UserRole.CREATOR
            }
        });
        console.log('✅ 크리에이터 계정 생성/업데이트 완료:', creator.email);

        // 5. 일반 사용자 계정 생성 (upsert)
        const user = await prisma.user.upsert({
            where: { email: 'user@collabo.com' },
            update: {
                name: '일반사용자',
                passwordHash: hashedPassword,
                role: UserRole.PARTICIPANT
            },
            create: {
                name: '일반사용자',
                email: 'user@collabo.com',
                passwordHash: hashedPassword,
                role: UserRole.PARTICIPANT
            }
        });
        console.log('✅ 일반사용자 계정 생성/업데이트 완료:', user.email);

        console.log('\n🎉 모든 테스트 계정이 성공적으로 생성되었습니다!');
        console.log('\n📋 계정 정보:');
        console.log('👑 관리자: admin@collabo.com / 1234');
        console.log('👤 팬: fan@collabo.com / 1234');
        console.log('🤝 파트너: partner@collabo.com / 1234');
        console.log('🎨 크리에이터: creator@collabo.com / 1234');
        console.log('👥 일반사용자: user@collabo.com / 1234');

    } catch (error) {
        console.error('❌ 계정 생성 중 오류 발생:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createTestAccounts();
