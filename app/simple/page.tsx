export default function SimplePage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold mb-8">Simple Test Page</h1>
      <div className="space-y-4">
        <p className="text-lg">✅ Next.js 애플리케이션 실행 중</p>
        <p className="text-lg">✅ Drizzle 데이터베이스 연결 준비 완료</p>
        <p className="text-lg">✅ Prisma 완전 제거 완료</p>
      </div>
    </div>
  );
}
