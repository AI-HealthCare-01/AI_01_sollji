import { useEffect, useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import apiClient from '../api/client';
import { useAuthStore } from '../store/authStore';

const ADMIN_EMAIL = 'sollji97@gmail.com';

interface AdminSummary {
  total_users: number;
  users_with_profiles: number;
  total_guides: number;
  completed_guides: number;
  active_rehab_plans: number;
  total_chat_sessions: number;
  total_chat_messages: number;
  admin_email: string;
  generated_at: string;
}

interface AdminUserRow {
  id: number;
  email: string;
  name: string | null;
  created_at: string | null;
  has_health_profile: boolean;
  guide_count: number;
  completed_guide_count: number;
  active_rehab_plan_count: number;
  chat_session_count: number;
  last_analysis_at: string | null;
}

interface RecentGuide {
  guide_result_id: number;
  user_id: number;
  user_email: string;
  patient_name: string | null;
  diagnosis: string | null;
  status: string;
  created_at: string | null;
}

interface AdminOverviewResponse {
  summary: AdminSummary;
  users: AdminUserRow[];
  recent_guides: RecentGuide[];
}

function formatDate(value: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString('ko-KR');
}

export default function AdminOverview() {
  const { user } = useAuthStore();
  const [data, setData] = useState<AdminOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient.get('/api/v1/admin/overview')
      .then((res) => setData(res.data))
      .catch((err) => {
        if (err.response?.status === 403) {
          setError('관리자 계정만 접근할 수 있어요.');
          return;
        }
        setError('운영 현황을 불러오지 못했어요.');
      })
      .finally(() => setLoading(false));
  }, []);

  const isAdminEmail = user?.email === ADMIN_EMAIL;

  return (
    <AppLayout>
      <div className="p-8 space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">운영 현황</h2>
          <p className="text-gray-500 mt-2">
            테스트 계정, 환자 데이터, 분석/재활/챗 사용 현황을 읽기 전용으로 확인합니다.
          </p>
        </div>

        {!isAdminEmail && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
            현재 로그인한 계정은 관리자 전용 메뉴 대상으로 보이지 않도록 설계되어 있습니다.
          </div>
        )}

        {loading && (
          <div className="rounded-2xl bg-white p-6 shadow-sm text-gray-500">
            운영 현황을 불러오는 중입니다...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-600">
            {error}
          </div>
        )}

        {!loading && data && (
          <>
            <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {[
                ['총 사용자', data.summary.total_users],
                ['프로필 등록 사용자', data.summary.users_with_profiles],
                ['총 분석 수', data.summary.total_guides],
                ['완료된 분석 수', data.summary.completed_guides],
                ['활성 재활 플랜', data.summary.active_rehab_plans],
                ['총 챗 세션', data.summary.total_chat_sessions],
                ['총 챗 메시지', data.summary.total_chat_messages],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-2xl bg-white p-5 shadow-sm">
                  <p className="text-sm text-gray-400">{label}</p>
                  <p className="mt-2 text-3xl font-bold text-gray-800">{value}</p>
                </div>
              ))}
            </section>

            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">사용자별 현황</h3>
                <p className="text-sm text-gray-400">기준 시각: {formatDate(data.summary.generated_at)}</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="text-left text-gray-400 border-b">
                    <tr>
                      <th className="py-3 pr-4">이메일</th>
                      <th className="py-3 pr-4">이름</th>
                      <th className="py-3 pr-4">프로필</th>
                      <th className="py-3 pr-4">분석</th>
                      <th className="py-3 pr-4">완료 분석</th>
                      <th className="py-3 pr-4">재활</th>
                      <th className="py-3 pr-4">챗 세션</th>
                      <th className="py-3 pr-4">마지막 분석</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.users.map((row) => (
                      <tr key={row.id} className="border-b last:border-b-0">
                        <td className="py-3 pr-4 font-medium text-gray-700">{row.email}</td>
                        <td className="py-3 pr-4 text-gray-600">{row.name || '-'}</td>
                        <td className="py-3 pr-4 text-gray-600">{row.has_health_profile ? '있음' : '없음'}</td>
                        <td className="py-3 pr-4 text-gray-600">{row.guide_count}</td>
                        <td className="py-3 pr-4 text-gray-600">{row.completed_guide_count}</td>
                        <td className="py-3 pr-4 text-gray-600">{row.active_rehab_plan_count}</td>
                        <td className="py-3 pr-4 text-gray-600">{row.chat_session_count}</td>
                        <td className="py-3 pr-4 text-gray-600">{formatDate(row.last_analysis_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="text-xl font-bold text-gray-800 mb-4">최근 분석 10건</h3>
              <div className="space-y-3">
                {data.recent_guides.map((guide) => (
                  <div key={guide.guide_result_id} className="rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-800">
                          {guide.diagnosis || '진단명 없음'} / {guide.patient_name || '환자명 없음'}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          사용자: {guide.user_email} / 상태: {guide.status}
                        </p>
                      </div>
                      <p className="text-sm text-gray-400">{formatDate(guide.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </AppLayout>
  );
}
