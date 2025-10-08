'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignUpPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        // ë¹„ë?ë²ˆí˜¸ ?•ì¸
        if (formData.password !== formData.confirmPassword) {
            setError('ë¹„ë?ë²ˆí˜¸ê°€ ?¼ì¹˜?˜ì? ?ŠìŠµ?ˆë‹¤.');
            setIsLoading(false);
            return;
        }

        // ë¹„ë?ë²ˆí˜¸ ê¸¸ì´ ?•ì¸
        if (formData.password.length < 6) {
            setError('ë¹„ë?ë²ˆí˜¸??6???´ìƒ?´ì–´???©ë‹ˆ??');
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                }),
            });

            if (response.ok) {
                const loginResponse = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        email: formData.email,
                        password: formData.password,
                        rememberMe: true,
                        client: 'web',
                    }),
                });

                if (!loginResponse.ok) {
                    const payload = await loginResponse.json().catch(() => ({ error: '?ë™ ë¡œê·¸?¸ì— ?¤íŒ¨?ˆìŠµ?ˆë‹¤.' }));
                    setError(payload.error ?? '?Œì›ê°€?…ì? ?„ë£Œ?˜ì—ˆì§€ë§??ë™ ë¡œê·¸?¸ì— ?¤íŒ¨?ˆìŠµ?ˆë‹¤. ë¡œê·¸???˜ì´ì§€?ì„œ ?¤ì‹œ ?œë„?´ì£¼?¸ìš”.');
                    return;
                }

                const result = await signIn('credentials', {
                    email: formData.email,
                    password: formData.password,
                    redirect: false,
                });

                if (result?.ok) {
                    router.push('/');
                } else {
                    setError('?Œì›ê°€?…ì? ?„ë£Œ?˜ì—ˆì§€ë§??ë™ ë¡œê·¸?¸ì— ?¤íŒ¨?ˆìŠµ?ˆë‹¤. ë¡œê·¸???˜ì´ì§€?ì„œ ?¤ì‹œ ?œë„?´ì£¼?¸ìš”.');
                }
            } else {
                const data = await response.json();
                setError(data.error || '?Œì›ê°€??ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.');
            }
        } catch {
            setError('?Œì›ê°€??ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
            <div className="max-w-md w-full space-y-8 p-8">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-bold text-white">
                        ?Œì›ê°€??
                    </h2>
                    <p className="mt-2 text-sm text-gray-300">
                        ?„í‹°?¤íŠ¸ ?€???‘ì—… ?Œë«?¼ì— ì°¸ì—¬?˜ì„¸??
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-300">
                                ?´ë¦„
                            </label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                required
                                value={formData.name}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="?´ë¦„???…ë ¥?˜ì„¸??
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                                ?´ë©”??
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="?´ë©”?¼ì„ ?…ë ¥?˜ì„¸??
                            />
                        </div>

                        <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-purple-100">
                            <p className="font-medium">??• ?€ ê°€?????„ìš© ? ì²­ ?Œë¡œ?°ì—???„í™˜?´ìš”</p>
                            <p className="mt-1 text-xs text-purple-200/80">
                                ? ê·œ ê°€?…ì? ì°¸ì—¬????• ë¡??œì‘?˜ë©°, ?ŒíŠ¸???ëŠ” ?¬ë¦¬?ì´?°ë¡œ ?œë™?˜ë ¤ë©??„ìš© ? ì²­ ?ˆì°¨ë¥??µí•´ ?¹ì¸ ?”ì²­??ë³´ë‚´ì£¼ì„¸?? ? ì²­???¹ì¸?˜ë©´ ê³„ì • ??• ???ë™?¼ë¡œ ?…ë°?´íŠ¸?©ë‹ˆ??
                            </p>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                                ë¹„ë?ë²ˆí˜¸
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                value={formData.password}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="ë¹„ë?ë²ˆí˜¸ë¥??…ë ¥?˜ì„¸??(6???´ìƒ)"
                            />
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">
                                ë¹„ë?ë²ˆí˜¸ ?•ì¸
                            </label>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                required
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="ë¹„ë?ë²ˆí˜¸ë¥??¤ì‹œ ?…ë ¥?˜ì„¸??
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-400 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? '?Œì›ê°€??ì¤?..' : '?Œì›ê°€??}
                        </button>
                    </div>

                    <div className="text-center">
                        <p className="text-sm text-gray-300">
                            ?´ë? ê³„ì •???ˆìœ¼? ê???{' '}
                            <Link
                                href="/auth/signin"
                                className="font-medium text-purple-400 hover:text-purple-300"
                            >
                                ë¡œê·¸?¸í•˜ê¸?
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
