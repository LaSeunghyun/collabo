export function Footer() {
    return (
        <footer className="bg-neutral-900 border-t border-neutral-800">
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="col-span-1 md:col-span-2">
                        <h3 className="text-lg font-semibold mb-4">Collaborium</h3>
                        <p className="text-neutral-400 text-sm">
                            팬과 아티스트가 함께 만들어가는 펀딩 · 커뮤니티 플랫폼
                        </p>
                    </div>
                    <div>
                        <h4 className="font-medium mb-4">서비스</h4>
                        <ul className="space-y-2 text-sm text-neutral-400">
                            <li><a href="/projects" className="hover:text-white transition-colors">프로젝트</a></li>
                            <li><a href="/partners" className="hover:text-white transition-colors">파트너</a></li>
                            <li><a href="/community" className="hover:text-white transition-colors">커뮤니티</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-medium mb-4">지원</h4>
                        <ul className="space-y-2 text-sm text-neutral-400">
                            <li><a href="/help" className="hover:text-white transition-colors">도움말</a></li>
                            <li><a href="/contact" className="hover:text-white transition-colors">문의하기</a></li>
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
