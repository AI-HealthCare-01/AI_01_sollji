import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export default function TopNav() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  return (
    <header className="h-16 bg-white border-b flex items-center px-8 flex-shrink-0 z-40">

      {/* 로고 */}
      <span
        className="text-xl font-bold text-blue-600 cursor-pointer shrink-0 w-52"
        onClick={() => navigate('/')}
      >
        ChronicCare
      </span>

      {/* 중앙 공간 */}
      <div className="flex-1" />

      {/* 오른쪽 — 버튼 3개 나열 */}
      <div className="flex items-center gap-1">
        {/* 유저 아바타 + 이름 */}
        <div className="flex items-center gap-2 px-3 mr-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center
                          text-blue-600 font-bold text-sm shrink-0">
            {user?.name?.[0] ?? 'U'}
          </div>
          <span className="text-sm font-semibold text-gray-700">
            {user?.name ?? '사용자'}
          </span>
        </div>

        {/* 구분선 */}
        <div className="w-px h-5 bg-gray-200 mr-1" />

        <NavBtn onClick={() => navigate('/mypage')}>
          👤 마이페이지
        </NavBtn>

        <NavBtn onClick={() => navigate('/health-profile')}>
          🏥 건강 프로필
        </NavBtn>

        {/* 구분선 */}
        <div className="w-px h-5 bg-gray-200 mx-1" />

        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium
                     text-red-500 hover:bg-red-50 transition-all"
        >
          🚪 로그아웃
        </button>
      </div>

    </header>
  );
}

function NavBtn({ onClick, children }: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium
                 text-gray-600 hover:bg-gray-100 transition-all"
    >
      {children}
    </button>
  );
}
