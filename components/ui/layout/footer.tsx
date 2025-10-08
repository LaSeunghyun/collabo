export function Footer() {
    return (
        <footer className="bg-neutral-900 border-t border-neutral-800">
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="col-span-1 md:col-span-2">
                        <h3 className="text-lg font-semibold mb-4">Collaborium</h3>
                        <p className="text-neutral-400 text-sm">
                            ?¨Í≥º ?ÑÌã∞?§Ìä∏Í∞Ä ?®Íªò ÎßåÎì§?¥Í????Ä??¬∑ Ïª§Î??àÌã∞ ?åÎû´??
                        </p>
                    </div>
                    <div>
                        <h4 className="font-medium mb-4">?úÎπÑ??/h4>
                        <ul className="space-y-2 text-sm text-neutral-400">
                            <li><a href="/projects" className="hover:text-white transition-colors">?ÑÎ°ú?ùÌä∏</a></li>
                            <li><a href="/partners" className="hover:text-white transition-colors">?åÌä∏??/a></li>
                            <li><a href="/community" className="hover:text-white transition-colors">Ïª§Î??àÌã∞</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-medium mb-4">ÏßÄ??/h4>
                        <ul className="space-y-2 text-sm text-neutral-400">
                            <li><a href="/help" className="hover:text-white transition-colors">?ÑÏ?Îß?/a></li>
                            <li><a href="/contact" className="hover:text-white transition-colors">Î¨∏Ïùò?òÍ∏∞</a></li>
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
