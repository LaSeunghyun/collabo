import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { AdminSidebar } from './_components/admin-sidebar';
import { AdminHeader } from './_components/admin-header';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin?callbackUrl=/admin');
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/forbidden');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader user={{
        id: session.user.id!,
        name: session.user.name || null,
        email: session.user.email!,
        avatarUrl: session.user.image || null
      }} />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
