export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold mb-8">Drizzle ?岇姢???橃澊歆�</h1>
      <div className="space-y-4">
        <p className="text-lg">??Drizzle ?办澊?半矤?挫姢 ?瓣舶 ?标车</p>
        <p className="text-lg">??Prisma ?勳爠 ?滉卑 ?勲</p>
        <p className="text-lg">??Next.js ?犿攲毽??挫厴 ?ろ枆 欷?/p>
        <div className="mt-8">
          <a 
            href="/api/test-db" 
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md transition-colors"
          >
            ?办澊?半矤?挫姢 ?瓣舶 ?岇姢??
          </a>
        </div>
      </div>
    </div>
  );
}
