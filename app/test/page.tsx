export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold mb-8">Drizzle ?�스???�이지</h1>
      <div className="space-y-4">
        <p className="text-lg">??Drizzle ?�이?�베?�스 ?�결 ?�공</p>
        <p className="text-lg">??Prisma ?�전 ?�거 ?�료</p>
        <p className="text-lg">??Next.js ?�플리�??�션 ?�행 �?/p>
        <div className="mt-8">
          <a 
            href="/api/test-db" 
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md transition-colors"
          >
            ?�이?�베?�스 ?�결 ?�스??
          </a>
        </div>
      </div>
    </div>
  );
}
