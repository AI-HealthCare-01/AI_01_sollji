import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import apiClient from '../api/client';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiClient.post('/api/v1/auth/login', { email, password });
      const { access_token, user_id, name, role } = res.data;
      localStorage.setItem('token', access_token);
      setUser({ id: user_id, email, name, role: role ?? 'patient' }, access_token);
      navigate('/dashboard');
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })
        ?.response?.data?.detail;
      setError(detail ?? '이메일 또는 비밀번호를 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* 네비 */}
      <nav className="flex items-center justify-between px-10 py-4 border-b">
        <span
          className="text-2xl font-bold text-blue-600 cursor-pointer"
          onClick={() => navigate('/')}
        >
          ChronicCare
        </span>
        <button
          onClick={() => navigate('/register')}
          className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
        >
          계정이 없으신가요? <span className="text-blue-600 font-semibold">무료 가입</span>
        </button>
      </nav>

      {/* 본문 */}
      <div className="flex flex-1">

        {/* 왼쪽 — 브랜드 패널 */}
        <div className="hidden lg:flex flex-col justify-center px-16 bg-gradient-to-br from-blue-600 to-blue-700 text-white w-[480px] shrink-0">
          <div className="mb-8">
            <span className="bg-white/20 text-white text-sm font-medium px-3 py-1.5 rounded-full">
              🏥 만성질환 관리 플랫폼
            </span>
          </div>
          <h2 className="text-4xl font-extrabold leading-tight mb-4">
            처방전 한 장으로<br />건강을 관리하세요
          </h2>
          <p className="text-blue-100 text-lg leading-relaxed mb-10">
            처방전 OCR 분석, AI 상담,<br />맞춤 재활 운동을 한 번에
          </p>
          <div className="space-y-3">
            {[
              { icon: '💊', text: '처방전 자동 분석' },
              { icon: '🤖', text: 'AI 건강 상담' },
              { icon: '🏃', text: '맞춤 재활 운동 플랜' },
              { icon: '📋', text: '건강 기록 통합 관리' },
            ].map(item => (
              <div key={item.text} className="flex items-center gap-3">
                <span className="text-xl">{item.icon}</span>
                <span className="text-blue-100">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 오른쪽 — 로그인 폼 */}
        <div className="flex-1 flex items-center justify-center px-8 py-12 bg-gray-50">
          <div className="w-full max-w-md">

            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">로그인</h1>
              <p className="text-gray-500">ChronicCare에 오신 것을 환영해요</p>
            </div>

            {/* 카카오 로그인 버튼 */}
            <button
              onClick={() => alert('카카오 로그인은 준비 중이에요 😊\n이메일로 로그인해주세요.')}
              className="w-full flex items-center justify-center gap-3 bg-[#FEE500] text-[#3C1E1E] font-semibold py-3.5 rounded-xl hover:bg-[#F5DC00] transition-all mb-4 text-base shadow-sm"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 3C6.477 3 2 6.477 2 10.8c0 2.7 1.6 5.1 4 6.6l-1 3.7 4.3-2.8c.9.2 1.8.3 2.7.3 5.523 0 10-3.477 10-7.8S17.523 3 12 3z" fill="#3C1E1E"/>
              </svg>
              카카오로 시작하기
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-sm text-gray-400">또는 이메일로 로그인</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  이메일
                </label>
                <input
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  비밀번호
                </label>
                <input
                  type="password"
                  placeholder="비밀번호를 입력하세요"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-base"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all text-base shadow-sm"
              >
                {loading ? '로그인 중...' : '이메일로 로그인'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-400 mt-6">
              아직 계정이 없으신가요?{' '}
              <span
                onClick={() => navigate('/register')}
                className="text-blue-600 font-semibold cursor-pointer hover:underline"
              >
                무료로 시작하기
              </span>
            </p>

          </div>
        </div>
      </div>
    </div>
  );
}
