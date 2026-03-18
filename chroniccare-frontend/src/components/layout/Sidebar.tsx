import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  const navItems = [
    { path: '/dashboard', label: '대시보드' },
    { path: '/prescription', label: '처방전 분석' },
    { path: '/rehabilitation', label: '재활 운동' },
    { path: '/chat', label: '챗봇' },
  ];

  return (
    <aside className="w-64 bg-white border-r flex flex-col flex-shrink-0">

      {/* 유저 정보 */}
      <div className="px-5 py-6 border-b">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center
                          text-blue-600 font-bold text-lg shrink-0">
            {user?.name?.[0] ?? 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-lg font-semibold text-gray-700 truncate">
              {user?.name ?? '사용자'}
            </p>
            <p className="text-sm text-gray-400 truncate">{user?.email ?? ''}</p>
          </div>
        </div>
      </div>

      {/* 네비 */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl text-base
                          font-medium transition-all ${  
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              }`}
            >

              <span className="text-xl">{item.label}</span>
            </button>
          );
        })}
      </nav>

    </aside>
  );
}
