import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', passwordConfirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.passwordConfirm) {
      setError('비밀번호가 일치하지 않아요.');
      return;
    }
    if (form.password.length < 6) {
      setError('비밀번호는 6자 이상이어야 해요.');
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/api/v1/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password,
      });
      // 가입 후 바로 프로필 설정으로
      navigate('/login', { state: { registered: true } });
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })
        ?.response?.data?.detail;
      setError(detail ?? '회원가입에 실패했어요. 다시 시도해주세요.');
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
          onClick={() => navigate('/login')}
          className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
        >
          이미 계정이 있으신가요? <span className="text-blue-600 font-semibold">로그인</span>
        </button>
      </nav>

      <div className="flex flex-1">

        {/* 왼쪽 — 브랜드 패널 */}
        <div className="hidden lg:flex flex-col justify-center px-16 bg-gradient-to-br from-blue-700 to-blue-800 text-white w-[480px] shrink-0">
          <div className="mb-8">
            <span className="bg-white/20 text-white text-sm font-medium px-3 py-1.5 rounded-full">
               무료로 시작하세요!
            </span>
          </div>
          <h2 className="text-4xl font-extrabold leading-tight mb-4">
            30초 만에<br />건강 관리 시작
          </h2>
          <p className="text-blue-100 text-lg leading-relaxed mb-10">
            간단한 정보만 입력하면<br />맞춤형 건강 관리가 시작돼요
          </p>
          <div className="space-y-4">
            {[
              { step: '01', text: '이름, 이메일, 비밀번호 입력' },
              { step: '02', text: '기저질환 · 복용약 · 알레르기 등록' },
              { step: '03', text: '처방전 업로드 후 AI 분석 시작' },
            ].map(item => (
              <div key={item.step} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold shrink-0">
                  {item.step}
                </div>
                <span className="text-blue-100">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 오른쪽 — 회원가입 폼 */}
        <div className="flex-1 flex items-center justify-center px-8 py-12 bg-gray-50">
          <div className="w-full max-w-md">

            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">회원가입</h1>
              <p className="text-gray-500">무료로 시작하고 언제든지 탈퇴할 수 있어요</p>
            </div>

            {/* 카카오 가입 버튼 */}
            <button
              onClick={() => alert('카카오 로그인은 준비 중이에요 😊\n이메일로 가입해주세요.')}
              className="w-full flex items-center justify-center gap-3 bg-[#FEE500] text-[#3C1E1E] font-semibold py-3.5 rounded-xl hover:bg-[#F5DC00] transition-all mb-4 text-base shadow-sm"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 3C6.477 3 2 6.477 2 10.8c0 2.7 1.6 5.1 4 6.6l-1 3.7 4.3-2.8c.9.2 1.8.3 2.7.3 5.523 0 10-3.477 10-7.8S17.523 3 12 3z" fill="#3C1E1E"/>
              </svg>
              카카오로 시작하기
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-sm text-gray-400">또는 이메일로 가입</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">이름</label>
                <input
                  name="name"
                  type="text"
                  placeholder="홍길동"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">이메일</label>
                <input
                  name="email"
                  type="email"
                  placeholder="example@email.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">비밀번호</label>
                <input
                  name="password"
                  type="password"
                  placeholder="6자 이상 입력하세요"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">비밀번호 확인</label>
                <input
                  name="passwordConfirm"
                  type="password"
                  placeholder="비밀번호를 다시 입력하세요"
                  value={form.passwordConfirm}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-base"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all text-base shadow-sm"
              >
                {loading ? '가입 중...' : '무료로 시작하기'}
              </button>
            </form>

            <p className="text-center text-xs text-gray-400 mt-4 leading-relaxed">
              가입하면{' '}
              <span className="underline cursor-pointer">이용약관</span>
              {' '}및{' '}
              <span className="underline cursor-pointer">개인정보처리방침</span>
              에 동의하는 것으로 간주돼요.
            </p>

            <p className="text-center text-sm text-gray-400 mt-4">
              이미 계정이 있으신가요?{' '}
              <span
                onClick={() => navigate('/login')}
                className="text-blue-600 font-semibold cursor-pointer hover:underline"
              >
                로그인
              </span>
            </p>

          </div>
        </div>
      </div>
    </div>
  );
}
