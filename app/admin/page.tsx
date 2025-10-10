import { requireUser } from '@/lib/auth/guards';
import { UserRole } from '@/types/shared';

export default async function AdminPage() {
  const user = await requireUser({ roles: [UserRole.ADMIN] });

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">관리자 대시보드</h2>
          <p className="text-gray-600">환영합니다, {user.name}님!</p>
          <p className="text-sm text-gray-500 mt-2">관리자 권한으로 시스템을 관리할 수 있습니다.</p>
        </div>
      </div>
    </div>
  );
}