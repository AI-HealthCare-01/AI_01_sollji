import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();

  const features = [
    {
      icon: '💊',
      title: '처방전 AI 분석',
      desc: '처방전 사진을 찍어 업로드하면 AI가 약물 정보, 복용법, 주의사항을 자동으로 분석해드려요.',
    },
    {
      icon: '🤖',
      title: 'AI 건강 상담',
      desc: '처방전 기반으로 궁금한 점을 챗봇에게 물어보세요. 약 부작용, 식이요법, 생활습관까지 상담 가능해요.',
    },
    {
      icon: '🏃',
      title: '맞춤 재활 운동',
      desc: '진단 결과에 맞는 재활 운동 플랜을 AI가 자동으로 생성하고, 진행률을 관리해드려요.',
    },
    {
      icon: '📋',
      title: '건강 기록 관리',
      desc: '기저질환, 복용 중인 약, 알레르기 정보를 한 곳에 모아 분석 이력과 함께 관리하세요.',
    },
  ];

  const steps = [
    {
      step: '01',
      icon: '✍️',
      title: '회원가입',
      desc: '기저질환, 복용 약, 알레르기 정보를\n간단하게 입력해요.',
    },
    {
      step: '02',
      icon: '📸',
      title: '처방전 업로드',
      desc: '처방전 사진을 찍거나\n파일을 드래그해서 올려요.',
    },
    {
      step: '03',
      icon: '✨',
      title: 'AI 분석 확인',
      desc: '약물 정보, 생활 가이드,\n재활 플랜을 한 번에 받아요.',
    },
  ];

  const conditions = [
    { icon: '🫀', label: '고혈압' },
    { icon: '🩸', label: '당뇨' },
    { icon: '🦴', label: '골다공증' },
    { icon: '🫁', label: '고지혈증' },
    { icon: '🦵', label: '관절염' },
    { icon: '🧠', label: '기타 만성질환' },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-800">

      {/* 네비게이션 */}
      <nav className="sticky top-0 z-50 bg-white border-b shadow-sm flex items-center justify-between px-10 py-4">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate('/')}
        >
          <span className="text-2xl font-bold text-blue-600">ChronicCare</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/login')}
            className="px-5 py-2 text-blue-600 font-medium rounded-xl hover:bg-blue-50 transition-all"
          >
            로그인
          </button>
          <button
            onClick={() => navigate('/register')}
            className="px-5 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-all"
          >
            무료 시작하기
          </button>
        </div>
      </nav>

      {/* 히어로 섹션 */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-blue-50 py-16 px-8 text-center">
        <div className="max-w-3xl mx-auto">
          <span className="inline-block bg-blue-100 text-blue-600 text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
            🏥 만성질환자를 위한 AI 건강 관리
          </span>
          <h2 className="text-5xl font-extrabold text-gray-900 leading-tight mb-5">
            처방전 한 장으로<br />
            <span className="text-blue-600">건강을 관리하세요</span>
          </h2>
          <p className="text-xl text-gray-500 mb-10 leading-relaxed">
            처방전 OCR 분석부터 AI 상담, 맞춤 재활 운동까지<br />
            ChronicCare가 만성질환 관리를 도와드려요.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate('/register')}
              className="bg-blue-600 text-white px-8 py-4 rounded-2xl text-lg font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
            >
              무료로 시작하기 →
            </button>
            <button
              onClick={() => navigate('/login')}
              className="border-2 border-gray-200 text-gray-600 px-8 py-4 rounded-2xl text-lg font-semibold hover:bg-gray-50 transition-all"
            >
              로그인
            </button>
          </div>
          <p className="text-sm text-gray-400 mt-5">회원가입 무료 · 언제든지 탈퇴 가능</p>
        </div>
      </section>

      {/* 지원 질환 태그 */}
      <section className="py-10 px-8 border-b bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-sm text-gray-400 font-medium mb-4">이런 만성질환을 가진 분들에게 도움이 돼요</p>
          <div className="flex flex-wrap justify-center gap-3">
            {conditions.map(c => (
              <span
                key={c.label}
                className="flex items-center gap-1.5 bg-blue-50 text-blue-700 text-sm font-medium px-4 py-2 rounded-full"
              >
                {c.icon} {c.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 핵심 기능 4개 */}
      <section className="py-12 px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-3xl font-bold text-center text-gray-800 mb-3">
            ChronicCare가 하는 일
          </h3>
          <p className="text-center text-gray-400 mb-12">
            복잡한 의료 정보를 쉽고 빠르게 이해할 수 있도록 도와드려요
          </p>
          <div className="grid grid-cols-2 gap-5">
            {features.map(f => (
              <div
                key={f.title}
                className="bg-white rounded-2xl p-7 shadow-sm hover:shadow-md transition-all border border-gray-100"
              >
                <div className="text-4xl mb-4">{f.icon}</div>
                <h4 className="text-lg font-bold text-gray-800 mb-2">{f.title}</h4>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3단계 안내 */}
      <section className="py-20 px-8 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <h3 className="text-3xl font-bold text-gray-800 mb-3">3단계로 시작해요</h3>
          <p className="text-gray-400 mb-14">복잡한 설정 없이 바로 시작할 수 있어요</p>
          <div className="grid grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <div key={s.step} className="relative text-center">
                {/* 연결선 */}
                {i < steps.length - 1 && (
                  <div className="absolute top-8 left-[calc(50%+32px)] w-[calc(100%-16px)] h-0.5 bg-blue-100 hidden md:block" />
                )}
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl mx-auto mb-4 shadow-lg shadow-blue-200">
                  {s.icon}
                </div>
                <div className="text-xs text-blue-400 font-bold mb-1">{s.step}</div>
                <h4 className="text-lg font-bold text-gray-800 mb-2">{s.title}</h4>
                <p className="text-gray-500 text-sm whitespace-pre-line leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate('/register')}
            className="mt-14 bg-blue-600 text-white px-10 py-4 rounded-2xl text-lg font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
          >
            지금 바로 시작하기 →
          </button>
        </div>
      </section>

      {/* CTA 배너 */}
      <section className="bg-blue-600 py-16 px-8 text-center text-white">
        <h3 className="text-3xl font-bold mb-3">건강 관리, 더 이상 혼자 하지 마세요</h3>
        <p className="text-blue-100 mb-8 text-lg">
          ChronicCare와 함께라면 처방전 한 장으로 모든 게 시작돼요
        </p>
        <button
          onClick={() => navigate('/register')}
          className="bg-white text-blue-600 px-8 py-4 rounded-2xl text-lg font-semibold hover:bg-blue-50 transition-all shadow-md"
        >
          무료로 시작하기 →
        </button>
      </section>

      {/* 푸터 */}
      <footer className="bg-gray-900 text-white py-10 px-8">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-xl font-bold text-blue-400 mb-1">ChronicCare</p>
            <p className="text-gray-400 text-sm">처방전 관리와 AI 상담을 한 번에</p>
          </div>
          <div className="flex gap-6 text-gray-400 text-sm">
            <span className="cursor-pointer hover:text-white transition-colors">회사 소개</span>
            <span className="cursor-pointer hover:text-white transition-colors">이용약관</span>
            <span className="cursor-pointer hover:text-white transition-colors">개인정보처리방침</span>
          </div>
        </div>
        <div className="max-w-4xl mx-auto mt-6 pt-6 border-t border-gray-700 text-center text-gray-500 text-sm">
          © 2026 ChronicCare. All rights reserved.
        </div>
      </footer>

    </div>
  );
}
