import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export default function TopNav() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  return (
    <header className="h-20 bg-white border-b flex items-center px-8 flex-shrink-0 z-40">

      {/* 로고 */}
      <span
        className="text-3xl font-bold text-blue-600 cursor-pointer shrink-0 w-56"
        onClick={() => navigate('/')}
      >
        ChronicCare
      </span>

      {/* 중앙 공간 */}
      <div className="flex-1" />

      {/* 오른쪽 */}
      <div className="flex items-center gap-1">
        {/* 유저 아바타 + 이름 */}
        <div className="flex items-center gap-2 px-3 mr-2">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center
                          text-blue-600 font-bold text-base shrink-0">
            {user?.name?.[0] ?? 'U'}
          </div>
          <span className="text-lg font-semibold text-gray-700">
            {user?.name ?? '사용자'}
          </span>
        </div>

        {/* 구분선 */}
        <div className="w-px h-6 bg-gray-200 mr-1" />

        <NavBtn onClick={() => navigate('/mypage')}>
          마이페이지  {/* 이모티콘 제거 */}
        </NavBtn>

        <NavBtn onClick={() => navigate('/health-profile')}>
          건강 프로필  {/* 이모티콘 제거 */}
        </NavBtn>

        {/* 구분선 */}
        <div className="w-px h-6 bg-gray-200 mx-1" />

        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-lg font-medium
                     text-red-500 hover:bg-red-50 transition-all"
        >
          로그아웃  {/* 이모티콘 제거 */}
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
      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-lg font-medium
                 text-gray-600 hover:bg-gray-100 transition-all"
    >
      {children}
    </button>
  );
}
