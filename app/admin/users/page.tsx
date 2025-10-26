import { getDbClient } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const db = await getDbClient();
  
  const userList = await db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    role: users.role,
    createdAt: users.createdAt,
    updatedAt: users.updatedAt
  })
  .from(users)
  .orderBy(desc(users.createdAt))
  .limit(100);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'ARTIST':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'PARTNER':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return '관리자';
      case 'ARTIST':
        return '아티스트';
      case 'PARTNER':
        return '파트너';
      default:
        return role;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">유저 관리</h1>
        <p className="mt-2 text-sm text-white/60">
          플랫폼에 가입한 모든 유저를 조회하고 관리할 수 있습니다. ({userList.length}명)
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">
                  이메일
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">
                  이름
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">
                  역할
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">
                  가입일
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">
                  ID
                </th>
              </tr>
            </thead>
            <tbody>
              {userList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-white/50">
                    유저가 없습니다.
                  </td>
                </tr>
              ) : (
                userList.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-white">
                      {user.email}
                    </td>
                    <td className="px-4 py-3 text-sm text-white/80">
                      {user.name || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeClass(user.role || 'USER')}`}>
                        {getRoleLabel(user.role || 'USER')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-white/60">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-xs text-white/50 font-mono">
                      {user.id}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

