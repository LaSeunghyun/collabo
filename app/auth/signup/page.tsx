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

        // 비�?번호 ?�인
        if (formData.password !== formData.confirmPassword) {
            setError('비�?번호가 ?�치?��? ?�습?�다.');
            setIsLoading(false);
            return;
        }

        // 비�?번호 길이 ?�인
        if (formData.password.length < 6) {
            setError('비�?번호??6???�상?�어???�니??');
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
                    const payload = await loginResponse.json().catch(() => ({ error: '?�동 로그?�에 ?�패?�습?�다.' }));
                    setError(payload.error ?? '?�원가?��? ?�료?�었지�??�동 로그?�에 ?�패?�습?�다. 로그???�이지?�서 ?�시 ?�도?�주?�요.');
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
                    setError('?�원가?��? ?�료?�었지�??�동 로그?�에 ?�패?�습?�다. 로그???�이지?�서 ?�시 ?�도?�주?�요.');
                }
            } else {
                const data = await response.json();
                setError(data.error || '?�원가??�??�류가 발생?�습?�다.');
            }
        } catch {
            setError('?�원가??�??�류가 발생?�습?�다.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
            <div className="max-w-md w-full space-y-8 p-8">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-bold text-white">
                        ?�원가??
                    </h2>
                    <p className="mt-2 text-sm text-gray-300">
                        ?�티?�트 ?�???�업 ?�랫?�에 참여?�세??
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-300">
                                ?�름
                            </label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                required
                                value={formData.name}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="?�름???�력?�세??
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                                ?�메??
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="?�메?�을 ?�력?�세??
                            />
                        </div>

                        <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-purple-100">
                            <p className="font-medium">??��?� 가?????�용 ?�청 ?�로?�에???�환?�요</p>
                            <p className="mt-1 text-xs text-purple-200/80">
                                ?�규 가?��? 참여????���??�작?�며, ?�트???�는 ?�리?�이?�로 ?�동?�려�??�용 ?�청 ?�차�??�해 ?�인 ?�청??보내주세?? ?�청???�인?�면 계정 ??��???�동?�로 ?�데?�트?�니??
                            </p>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                                비�?번호
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                value={formData.password}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="비�?번호�??�력?�세??(6???�상)"
                            />
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">
                                비�?번호 ?�인
                            </label>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                required
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="비�?번호�??�시 ?�력?�세??
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
                            {isLoading ? '?�원가??�?..' : '?�원가??}
                        </button>
                    </div>

                    <div className="text-center">
                        <p className="text-sm text-gray-300">
                            ?��? 계정???�으?��???{' '}
                            <Link
                                href="/auth/signin"
                                className="font-medium text-purple-400 hover:text-purple-300"
                            >
                                로그?�하�?
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
