export function Footer() {
    return (
        <footer className="bg-neutral-900 border-t border-neutral-800">
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="col-span-1 md:col-span-2">
                        <h3 className="text-lg font-semibold mb-4">Collaborium</h3>
                        <p className="text-neutral-400 text-sm">
                            ?�과 ?�티?�트가 ?�께 만들?��????�??· 커�??�티 ?�랫??
                        </p>
                    </div>
                    <div>
                        <h4 className="font-medium mb-4">?�비??/h4>
                        <ul className="space-y-2 text-sm text-neutral-400">
                            <li><a href="/projects" className="hover:text-white transition-colors">?�로?�트</a></li>
                            <li><a href="/partners" className="hover:text-white transition-colors">?�트??/a></li>
                            <li><a href="/community" className="hover:text-white transition-colors">커�??�티</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-medium mb-4">지??/h4>
                        <ul className="space-y-2 text-sm text-neutral-400">
                            <li><a href="/help" className="hover:text-white transition-colors">?��?�?/a></li>
                            <li><a href="/contact" className="hover:text-white transition-colors">문의?�기</a></li>
                        </ul>
                    </div>
                </div>
                <div className="border-t border-neutral-800 mt-8 pt-8 text-center text-sm text-neutral-400">
                    <p>&copy; 2024 Collaborium. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
