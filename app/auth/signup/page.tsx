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

        // 비밀번호 확인
        if (formData.password !== formData.confirmPassword) {
            setError('비밀번호가 일치하지 않습니다.');
            setIsLoading(false);
            return;
        }

        // 비밀번호 길이 확인
        if (formData.password.length < 6) {
            setError('비밀번호는 6자 이상이어야 합니다.');
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
                    const payload = await loginResponse.json().catch(() => ({ error: '자동 로그인에 실패했습니다.' }));
                    setError(payload.error ?? '회원가입은 완료되었지만 자동 로그인에 실패했습니다. 로그인 페이지에서 다시 시도해주세요.');
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
                    setError('회원가입은 완료되었지만 자동 로그인에 실패했습니다. 로그인 페이지에서 다시 시도해주세요.');
                }
            } else {
                const data = await response.json();
                setError(data.error || '회원가입 중 오류가 발생했습니다.');
            }
        } catch {
            setError('회원가입 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
            <div className="max-w-md w-full space-y-8 p-8">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-bold text-white">
                        회원가입
                    </h2>
                    <p className="mt-2 text-sm text-gray-300">
                        아티스트 펀딩 협업 플랫폼에 참여하세요
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-300">
                                이름
                            </label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                required
                                value={formData.name}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="이름을 입력하세요"
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                                이메일
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="이메일을 입력하세요"
                            />
                        </div>

                        <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-purple-100">
                            <p className="font-medium">역할은 가입 후 전용 신청 플로우에서 전환해요</p>
                            <p className="mt-1 text-xs text-purple-200/80">
                                신규 가입은 참여자 역할로 시작되며, 파트너 또는 크리에이터로 활동하려면 전용 신청 절차를 통해 승인 요청을 보내주세요. 신청이 승인되면 계정 역할이 자동으로 업데이트됩니다.
                            </p>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                                비밀번호
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                value={formData.password}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="비밀번호를 입력하세요 (6자 이상)"
                            />
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">
                                비밀번호 확인
                            </label>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                required
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="비밀번호를 다시 입력하세요"
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
                            {isLoading ? '회원가입 중...' : '회원가입'}
                        </button>
                    </div>

                    <div className="text-center">
                        <p className="text-sm text-gray-300">
                            이미 계정이 있으신가요?{' '}
                            <Link
                                href="/auth/signin"
                                className="font-medium text-purple-400 hover:text-purple-300"
                            >
                                로그인하기
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
