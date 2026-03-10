import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import AppLayout from '../components/layout/AppLayout';

interface FullProfile {
  user: { id: number; email: string; name: string };
  conditions: { id: number; condition_type: string }[];
  medications: { id: number; medication_name: string }[];
  allergies: { id: number; allergen_name: string }[];
  health_profile: object | null;
}

interface GuideHistory {
  guide_result_id: number;
  status: string;
  created_at: string;
  patient_name: string;
  diagnosis: string;
  hospital_name: string;
  summary: string;
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [histories, setHistories] = useState<GuideHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/api/v1/profile/me')
      .then(res => setProfile(res.data))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));

    apiClient.get('/api/v1/analysis/history')
      .then(res => setHistories(Array.isArray(res.data) ? res.data : []))
      .catch(() => setHistories([]))
      .finally(() => setHistoryLoading(false));
  }, []);

  const completedHistories = histories
    .filter(h => h.status === 'completed')
    .slice(0, 5);

  // ✅ 추가: 분석 이력 삭제
  const handleDeleteHistory = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation(); // 카드 클릭(navigate) 방지
    if (!confirm('이 분석 이력을 삭제할까요?')) return;
    try {
      await apiClient.delete(`/api/v1/analysis/${id}`);
      setHistories(prev => prev.filter(h => h.guide_result_id !== id));
    } catch (err) {
      console.error('삭제 실패:', err);
      alert('삭제에 실패했어요. 다시 시도해주세요.');
    }
  };

  return (
    <AppLayout>
      <div className="p-8">

        {/* 헤더 */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">
              안녕하세요, {profile?.user?.name ?? user?.name ?? '사용자'}님 👋
            </h2>
            <p className="text-gray-500 mt-1">오늘도 건강한 하루 되세요</p>
          </div>
          <button
            onClick={() => navigate('/prescription')}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-base font-medium transition-all"
          >
            + 새 처방전 분석
          </button>
        </div>

        {/* 건강 요약 카드 */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 mb-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl shadow-sm p-6 animate-pulse">
                <div className="h-5 bg-gray-200 rounded mb-3 w-1/3" />
                <div className="h-4 bg-gray-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 mb-8">

            {/* 기저질환 */}
            <div className="bg-blue-50 rounded-2xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🏥</span>
                <span className="text-xl font-bold text-blue-600"> {/* ✅ text-lg → text-xl */}
                  기저질환
                  <span className="text-base font-normal text-gray-400 ml-2">
                    {profile?.conditions?.length ?? 0}개
                  </span>
                </span>
              </div>
              {profile?.conditions && profile.conditions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.conditions.map(c => (
                    <span key={c.id}
                      className="px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-base font-medium"> {/* ✅ text-sm → text-base, px-3 → px-4 */}
                      {c.condition_type}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-base text-gray-400">등록된 기저질환이 없어요</p>
              )}
            </div>

            {/* 복용 중인 약 */}
            <div className="bg-green-50 rounded-2xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">💊</span>
                <span className="text-xl font-bold text-green-600"> {/* ✅ text-lg → text-xl */}
                  복용 중인 약
                  <span className="text-base font-normal text-gray-400 ml-2">
                    {profile?.medications?.length ?? 0}종
                  </span>
                </span>
              </div>
              {profile?.medications && profile.medications.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.medications.map(m => (
                    <span key={m.id}
                      className="px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-base font-medium"> {/* ✅ text-sm → text-base */}
                      {m.medication_name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-base text-gray-400">등록된 약이 없어요</p>
              )}
            </div>

            {/* 알레르기 */}
            <div className="bg-red-50 rounded-2xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">⚠️</span>
                <span className="text-xl font-bold text-red-500"> {/* ✅ text-lg → text-xl */}
                  알레르기
                  <span className="text-base font-normal text-gray-400 ml-2">
                    {profile?.allergies?.length ?? 0}개
                  </span>
                </span>
              </div>
              {profile?.allergies && profile.allergies.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.allergies.map(a => (
                    <span key={a.id}
                      className="px-4 py-1.5 bg-red-100 text-red-600 rounded-full text-base font-medium"> {/* ✅ text-sm → text-base */}
                      {a.allergen_name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-base text-gray-400">등록된 알레르기가 없어요</p>
              )}
            </div>

          </div>
        )}

        {/* 분석 이력 */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="text-2xl font-bold text-gray-700 mb-5">분석 이력</h3> {/* ✅ text-xl → text-2xl */}

          {historyLoading && (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="animate-pulse bg-gray-50 rounded-xl p-4">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-2/3" />
                </div>
              ))}
            </div>
          )}

          {!historyLoading && completedHistories.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">📋</p>
              <p className="text-base">아직 완료된 분석 이력이 없어요</p>
              <p className="text-sm mt-1">처방전을 업로드해서 첫 분석을 시작해보세요!</p>
            </div>
          )}

          {!historyLoading && completedHistories.length > 0 && (
            <div className="space-y-3">
              {completedHistories.map(h => (
                <div
                  key={h.guide_result_id}
                  onClick={() => navigate(`/result/${h.guide_result_id}`)}
                  className="bg-gray-50 hover:bg-blue-50 border border-gray-100 hover:border-blue-200 rounded-xl p-5 cursor-pointer transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">

                      {/* 진단명 + 완료 뱃지 */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg font-bold text-gray-800">
                          {h.diagnosis || '진단명 없음'}
                        </span>
                        <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-green-100 text-green-600 shrink-0">
                          완료
                        </span>
                      </div>

                      {/* 병원 · 환자 · 날짜 */}
                      <p className="text-sm font-medium text-gray-500 mb-1.5">
                        {h.hospital_name && `${h.hospital_name} · `}
                        {h.patient_name && `${h.patient_name} · `}
                        {new Date(h.created_at).toLocaleDateString('ko-KR')}
                      </p>

                      {/* 요약 */}
                      {h.summary && (
                        <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
                          {h.summary}
                        </p>
                      )}
                    </div>

                    {/* ✅ 우측: 삭제 버튼 + 화살표 */}
                    <div className="flex flex-col items-end justify-between gap-6 shrink-0">
                      <button
                        onClick={(e) => handleDeleteHistory(e, h.guide_result_id)}
                        className="text-xs text-red-400 hover:text-red-600 font-medium
                                   hover:bg-red-50 px-2 py-1 rounded-lg transition-all"
                      >
                        삭제
                      </button>
                      <span className="text-gray-300 text-xl">›</span>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </AppLayout>
  );
}
