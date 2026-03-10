import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useState, useRef, useEffect } from 'react';

export default function TopNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { path: '/dashboard', label: '대시보드', icon: '📊' },
    { path: '/prescription', label: '처방전 분석', icon: '💊' },
    { path: '/rehabilitation', label: '재활 운동', icon: '🏃' },
    { path: '/chat', label: '챗봇', icon: '🤖' },
  ];

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <header className="h-14 bg-white border-b flex items-center px-6 gap-6 flex-shrink-0 z-40">

      {/* 로고 */}
      <span
        className="text-lg font-bold text-blue-600 cursor-pointer shrink-0 w-44"
        onClick={() => navigate('/dashboard')}
      >
        ChronicCare
      </span>

      {/* 중앙 네비 */}
      <nav className="flex items-center gap-1 flex-1">
        {navItems.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* 오른쪽 — 프로필 */}
      <div className="relative shrink-0" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(prev => !prev)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-all"
        >
          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
            {user?.name?.[0] ?? 'U'}
          </div>
          <span className="text-sm font-medium text-gray-700">{user?.name ?? '사용자'}</span>
          <span className="text-gray-400 text-xs">▾</span>
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 top-10 w-44 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-50">
            <button
              onClick={() => { navigate('/profile-setup'); setDropdownOpen(false); }}
              className="w-full text-left px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
            >
              ⚙️ 프로필 설정
            </button>
            <div className="border-t my-1" />
            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50"
            >
              🚪 로그아웃
            </button>
          </div>
        )}
      </div>

    </header>
  );
}
