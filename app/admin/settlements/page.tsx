import { requireUser } from '@/lib/auth/guards';
import { UserRole } from '@/types/shared';

export const dynamic = 'force-dynamic';

export default async function SettlementsPage() {
  const user = await requireUser({ roles: [UserRole.ADMIN] });

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">정산 관리</h2>
          <p className="text-gray-600">프로젝트 정산을 관리합니다.</p>
        </div>
      </div>
    </div>
  );
}