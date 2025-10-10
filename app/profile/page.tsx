import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user) {
    redirect('/auth/signin');
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pb-20">
      <header className="pt-6">
        <h1 className="text-3xl font-semibold text-white">프로필</h1>
        <p className="mt-2 text-sm text-white/60">로그인된 사용자의 정보와 권한을 확인하세요</p>
      </header>

      <div className="mt-8 space-y-6">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">기본 정보</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">이름</span>
              <span className="text-sm text-white">{user.name || '미설정'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">이메일</span>
              <span className="text-sm text-white">{user.email || '미설정'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">역할</span>
              <span className="text-sm text-white">{user.role}</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">권한</h2>
          <div className="space-y-2">
            {user.permissions && user.permissions.length > 0 ? (
              user.permissions.map((permission) => (
                <div key={permission} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-400" />
                  <span className="text-sm text-white">{permission}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-white/60">특별한 권한이 없습니다.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">계정 관리</h2>
          <div className="space-y-4">
            <button className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
              프로필 수정
            </button>
            <button className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-sm font-medium text-white hover:bg-white/10 transition-colors">
              비밀번호 변경
            </button>
            <button className="w-full rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm font-medium text-red-300 hover:bg-red-500/10 transition-colors">
              계정 삭제
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}