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
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">🏥</span>
                <span className="text-lg font-bold text-blue-600">
                  기저질환
                  <span className="text-base font-normal text-gray-400 ml-2">
                    {profile?.conditions?.length ?? 0}개
                  </span>
                </span>
              </div>
              {profile?.conditions && profile.conditions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.conditions.map(c => (
                    <span key={c.id} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      {c.condition_type}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">등록된 기저질환이 없어요</p>
              )}
            </div>

            {/* 복용 중인 약 */}
            <div className="bg-green-50 rounded-2xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">💊</span>
                <span className="text-lg font-bold text-green-600">
                  복용 중인 약
                  <span className="text-base font-normal text-gray-400 ml-2">
                    {profile?.medications?.length ?? 0}종
                  </span>
                </span>
              </div>
              {profile?.medications && profile.medications.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.medications.map(m => (
                    <span key={m.id} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                      {m.medication_name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">등록된 약이 없어요</p>
              )}
            </div>

            {/* 알레르기 */}
            <div className="bg-red-50 rounded-2xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">⚠️</span>
                <span className="text-lg font-bold text-red-500">
                  알레르기
                  <span className="text-base font-normal text-gray-400 ml-2">
                    {profile?.allergies?.length ?? 0}개
                  </span>
                </span>
              </div>
              {profile?.allergies && profile.allergies.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.allergies.map(a => (
                    <span key={a.id} className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-sm font-medium">
                      {a.allergen_name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">등록된 알레르기가 없어요</p>
              )}
            </div>

          </div>
        )}

        {/* 분석 이력 */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">분석 이력</h3>

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
                  className="bg-gray-50 hover:bg-blue-50 border border-gray-100 hover:border-blue-200 rounded-xl p-4 cursor-pointer transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base font-semibold text-gray-700">
                          {h.diagnosis || '진단명 없음'}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-600">
                          완료
                        </span>
                      </div>
                      <p className="text-sm text-gray-400">
                        {h.hospital_name && `${h.hospital_name} · `}
                        {h.patient_name && `${h.patient_name} · `}
                        {new Date(h.created_at).toLocaleDateString('ko-KR')}
                      </p>
                      {h.summary && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-1">{h.summary}</p>
                      )}
                    </div>
                    <span className="text-gray-300 text-xl ml-3">›</span>
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
